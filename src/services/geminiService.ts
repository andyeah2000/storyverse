import { GoogleGenAI } from "@google/genai";
import { Source, AnalysisData } from "../types";
import { supabase, isSupabaseConfigured, logUsageEvent, fetchSubscription, getUsageCount, spendCredits } from "../lib/supabase";

const getLocalApiKey = (): string | null => {
  try {
    const settings = localStorage.getItem('storyverse_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.apiKey || null;
    }
  } catch (error) {
    console.error('Failed to read local API key:', error);
  }
  return null;
};

const FREE_AI_LIMIT = 30;

const ensureAiQuota = async () => {
  if (!isSupabaseConfigured()) return;
  try {
    const { subscription } = await fetchSubscription();
    if (subscription.plan === 'pro') {
      return;
    }
    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const usage = await getUsageCount('ai_request', windowStart);
    if (usage < FREE_AI_LIMIT) {
      return;
    }
    if (subscription.credit_balance > 0) {
      await spendCredits(1);
      return;
    }
    throw new Error('Du hast dein AI-Kontingent ausgeschöpft. Upgrade oder fülle Credits auf.');
  } catch (error) {
    if (error instanceof Error && /AI-Kontingent/.test(error.message)) {
      throw error;
    }
    if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
      throw new Error('Keine Credits mehr verfügbar. Bitte Credits aufladen.');
    }
    console.warn('Quota check failed', error);
  }
};

// Get authenticated request headers for edge function
const getAuthHeaders = async (): Promise<Headers> => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
  }
  
  return headers;
};

// Call Gemini proxy edge function
const callGeminiDirect = async (endpoint: string, payload: Record<string, unknown>) => {
  await ensureAiQuota();
  const apiKey = getLocalApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Add one in Settings or configure Supabase.');
  }

  const ai = new GoogleGenAI({ apiKey });

  switch (endpoint) {
    case 'generate': {
      return ai.models.generateContent({
        model: (payload.model as string) ?? 'gemini-2.5-flash',
        contents: payload.contents as Array<Record<string, unknown>>,
        config: payload.config as Record<string, unknown> | undefined,
      });
    }
    case 'chat': {
      const history = (payload.history as Array<{ role: string; parts: Array<{ text: string }> }>) ?? [];
      const message = (payload.message as string) ?? '';
      const contents = [
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: h.parts,
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];
      return ai.models.generateContent({
        model: (payload.model as string) ?? 'gemini-2.5-flash',
        contents,
        ...(payload.systemInstruction
          ? { systemInstruction: { parts: [{ text: payload.systemInstruction as string }] } }
          : {}),
      });
    }
    case 'audio': {
      return ai.models.generateContent({
        model: (payload.model as string) ?? 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: payload.script as string }] }],
        config: {
          responseModalities: ['AUDIO'],
          ...(payload.speechConfig ? { speechConfig: payload.speechConfig } : {}),
        },
      });
    }
    case 'analyze': {
      return ai.models.generateContent({
        model: (payload.model as string) ?? 'gemini-2.5-flash',
        contents: [{ parts: [{ text: payload.prompt as string }] }],
        config: {
          responseMimeType: 'application/json',
          ...(payload.responseSchema ? { responseSchema: payload.responseSchema } : {}),
        },
      });
    }
    default:
      throw new Error(`Unsupported endpoint: ${endpoint}`);
  }
};

export const callGeminiProxy = async (endpoint: string, payload: Record<string, unknown>): Promise<Response> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl || !isSupabaseConfigured()) {
    const data = await callGeminiDirect(endpoint, payload);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await ensureAiQuota();
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${supabaseUrl}/functions/v1/gemini-proxy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ endpoint, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || 'Gemini API request failed');
  }

  logUsageEvent('ai_request').catch(() => {});

  return response;
};

type GeminiGenerateRequest = {
  model?: string;
  contents: Array<Record<string, unknown>>;
  config?: Record<string, unknown>;
};

const proxyGenerateContent = async (request: GeminiGenerateRequest) => {
  const response = await callGeminiProxy('generate', request);
  return response.json();
};

export const getGeminiClient = () => ({
  models: {
    generateContent: proxyGenerateContent,
  },
});

// --- Analysis Service ---

export const analyzeScriptTension = async (scriptContent: string): Promise<AnalysisData> => {
  const prompt = `Analyze the dramatic tension and pacing of the following screenplay segment.
  
  Return a JSON object with:
  1. "tensionArc": An array of exactly 10 integers (0-100) representing the tension level progression from start to end.
  2. "pacingScore": An integer (0-100) where 0 is slow/boring and 100 is fast/chaotic. Ideal is ~60-70.
  3. "sentiment": A string describing the overall mood (e.g., "Dark", "Hopeful").
  4. "suggestions": An array of 3 brief strings with specific advice to improve the flow.

  SCRIPT:
  ${scriptContent.slice(0, 30000)}
  `;

  try {
    const response = await callGeminiProxy('analyze', {
      prompt,
      responseSchema: {
        type: 'object',
        properties: {
          tensionArc: { type: 'array', items: { type: 'integer' } },
          pacingScore: { type: 'integer' },
          sentiment: { type: 'string' },
          suggestions: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    const data = await response.json();
    
    // Extract text from Gemini response format
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('No response text received');
    }
    
    const parsed = JSON.parse(text);
    return parsed as AnalysisData;
  } catch (e) {
    console.error("Failed to analyze script:", e);
    return {
      tensionArc: [20, 30, 40, 50, 60, 50, 40, 60, 80, 50],
      pacingScore: 50,
      sentiment: "Neutral",
      suggestions: ["Could not analyze script. Please check your API key configuration."]
    };
  }
};

// --- Chat Service ---

export const generateAnswer = async (history: {role: string, parts: {text: string}[]}[], sources: Source[]): Promise<string> => {
  const context = sources.map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.content}`).join("\n\n");
  
  const systemInstruction = `You are an expert Screenwriter and Universe Architect (StoryVerse AI).
  You have access to the user's "Story Bible" (Sources).
  
  Your goal is to help the user write a coherent, engaging screenplay.
  - Check for plot holes based on the provided Lore/Characters.
  - Suggest dialogue improvements.
  - Maintain the tone of the universe.
  
  STORY BIBLE:
  ${context}
  `;

  try {
    // Construct history properly
    const chatHistory = history.slice(0, -1).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: h.parts.map(p => ({ text: p.text }))
    }));

    const lastHistoryItem = history[history.length - 1];
    const lastMsg = lastHistoryItem?.parts?.[0]?.text || '';

    const response = await callGeminiProxy('chat', {
      model: 'gemini-2.5-flash',
      message: lastMsg,
      history: chatHistory,
      systemInstruction
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response received from AI');
    }
    
    return text;
  } catch (e) {
    console.error("Chat error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate response');
  }
};

// --- Table Read Service ---

export const generatePodcastScript = async (sources: Source[]): Promise<string> => {
  const context = sources.map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.content}`).join("\n\n");
  
  const prompt = `Convert the provided material into a "Table Read" script format. 
  If the source is a screenplay, keep the dialogue. 
  If it's notes, create a scene where characters from the notes discuss the events.
  
  Format strictly as:
  Narrator: [Scene Description]
  Character Name: [Dialogue]
  ...
  
  Keep it under 600 words. Focus on the most dramatic parts.
  
  MATERIAL:
  ${context.slice(0, 30000)}
  `;

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response received from AI');
    }

    return text;
  } catch (e) {
    console.error("Podcast script error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate podcast script');
  }
};

export const generatePodcastAudio = async (script: string): Promise<string | undefined> => {
  try {
    const response = await callGeminiProxy('audio', {
      model: 'gemini-2.5-flash-preview-tts',
      script,
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Narrator',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
            },
            {
              speaker: 'Character 1',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
            },
            {
              speaker: 'Character 2',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } 
            }
          ]
        }
      }
    });

    const data = await response.json();
    
    // Safe access with null checks
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in TTS response');
      return undefined;
    }
    
    const content = candidates[0]?.content;
    if (!content || !content.parts || content.parts.length === 0) {
      console.error('No content parts in TTS response');
      return undefined;
    }
    
    const inlineData = content.parts[0]?.inlineData;
    if (!inlineData || !inlineData.data) {
      console.error('No inline data in TTS response');
      return undefined;
    }
    
    return inlineData.data;
  } catch (e) {
    console.error("Audio generation error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate audio');
  }
};

// --- Check if API key is configured ---
// API key is now handled server-side, so this always returns true if Supabase is configured
export const isApiKeyConfigured = (): boolean => {
  return isSupabaseConfigured();
};

// --- Continue Writing Service ---
export const continueWriting = async (currentContent: string, sources: Source[]): Promise<string> => {
  const context = sources.map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.content}`).join("\n\n");
  
  const prompt = `You are a professional screenwriter. Continue the following screenplay naturally.
  
  Use proper screenplay formatting:
  - Scene headings: INT./EXT. LOCATION - TIME
  - Action lines: Present tense, vivid descriptions
  - Character names: UPPERCASE before dialogue
  - Dialogue: Natural, character-appropriate
  
  Story Bible for context:
  ${context.slice(0, 10000)}
  
  CURRENT SCREENPLAY:
  ${currentContent.slice(-8000)}
  
  Continue the screenplay with 100-200 words, maintaining the tone and advancing the story naturally.
  DO NOT include any explanation, just write the screenplay continuation.`;

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response received from AI');
    }

    return text.trim();
  } catch (e) {
    console.error("Continue writing error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to continue writing');
  }
};

// --- Rewrite Text Service ---
export const rewriteText = async (text: string, style: string = 'screenplay'): Promise<string> => {
  const styleGuides: Record<string, string> = {
    screenplay: 'Rewrite as professional screenplay format with vivid action lines and natural dialogue.',
    dramatic: 'Make it more dramatic and emotionally intense.',
    subtle: 'Make it more subtle and understated.',
    concise: 'Make it more concise and punchy.',
    descriptive: 'Add more vivid sensory details.'
  };
  
  const prompt = `${styleGuides[style] || styleGuides.screenplay}

Original text:
${text}

Rewritten text (keep same general meaning, improve quality):`;

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response received from AI');
    }

    return text.trim();
  } catch (e) {
    console.error("Rewrite error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to rewrite text');
  }
};

// --- Generate Dialogue Service ---
export const generateDialogue = async (characterName: string, situation: string, sources: Source[]): Promise<string> => {
  // Find character info from sources
  const characterSource = sources.find(s => 
    s.type === 'character' && s.title.toUpperCase().includes(characterName.toUpperCase())
  );
  
  const characterInfo = characterSource 
    ? `Character details: ${characterSource.content}` 
    : `Character: ${characterName}`;
  
  const prompt = `Generate authentic dialogue for the following character in a screenplay format.

${characterInfo}

Situation: ${situation}

Write 2-4 lines of dialogue that:
- Sound natural and conversational
- Reveal character personality
- Advance the story
- Are appropriate for the situation

Format as:
                    ${characterName.toUpperCase()}
          [Dialogue goes here]

ONLY output the formatted dialogue, nothing else.`;

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response received from AI');
    }

    // Extract just the dialogue part
    const trimmed = text.trim();
    const dialogueMatch = trimmed.match(/^(?:\s*[A-Z][A-Z\s]+\s*)?(.+)$/s);
    return dialogueMatch?.[1]?.trim() || trimmed;
  } catch (e) {
    console.error("Generate dialogue error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate dialogue');
  }
};
