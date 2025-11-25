import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Source, AnalysisData } from "../types";

// Get API key from localStorage settings
const getApiKey = (): string => {
  try {
    const settings = localStorage.getItem('storyverse_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.apiKey || '';
    }
  } catch (e) {
    console.error('Failed to read API key from settings:', e);
  }
  return '';
};

export const getGeminiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API-Key fehlt! Bitte in Settings > General eingeben.");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Analysis Service ---

export const analyzeScriptTension = async (scriptContent: string): Promise<AnalysisData> => {
  const ai = getGeminiClient();
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tensionArc: { type: Type.ARRAY, items: { type: Type.INTEGER } },
            pacingScore: { type: Type.INTEGER },
            sentiment: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response text received');
    }
    
    const data = JSON.parse(text);
    return data as AnalysisData;
  } catch (e) {
    console.error("Failed to analyze script:", e);
    return {
      tensionArc: [20, 30, 40, 50, 60, 50, 40, 60, 80, 50],
      pacingScore: 50,
      sentiment: "Neutral",
      suggestions: ["Could not analyze script. Please check your API key."]
    };
  }
};

// --- Chat Service ---

export const generateAnswer = async (history: {role: string, parts: {text: string}[]}[], sources: Source[]): Promise<string> => {
  const ai = getGeminiClient();
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
      role: h.role,
      parts: h.parts
    }));

    const lastHistoryItem = history[history.length - 1];
    const lastMsg = lastHistoryItem?.parts?.[0]?.text || '';

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: chatHistory
    });

    const response = await chatSession.sendMessage({ message: lastMsg });
    
    if (!response.text) {
      throw new Error('No response received from AI');
    }
    
    return response.text;
  } catch (e) {
    console.error("Chat error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate response');
  }
};

// --- Table Read Service ---

export const generatePodcastScript = async (sources: Source[]): Promise<string> => {
  const ai = getGeminiClient();
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error('No response received from AI');
    }

    return response.text;
  } catch (e) {
    console.error("Podcast script error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate podcast script');
  }
};

export const generatePodcastAudio = async (script: string): Promise<string | undefined> => {
  const ai = getGeminiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
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
      },
    });

    // Safe access with null checks
    const candidates = response.candidates;
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
export const isApiKeyConfigured = (): boolean => {
  const apiKey = getApiKey();
  return apiKey.length > 0;
};

// --- Continue Writing Service ---
export const continueWriting = async (currentContent: string, sources: Source[]): Promise<string> => {
  const ai = getGeminiClient();
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error('No response received from AI');
    }

    return response.text.trim();
  } catch (e) {
    console.error("Continue writing error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to continue writing');
  }
};

// --- Rewrite Text Service ---
export const rewriteText = async (text: string, style: string = 'screenplay'): Promise<string> => {
  const ai = getGeminiClient();
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error('No response received from AI');
    }

    return response.text.trim();
  } catch (e) {
    console.error("Rewrite error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to rewrite text');
  }
};

// --- Generate Dialogue Service ---
export const generateDialogue = async (characterName: string, situation: string, sources: Source[]): Promise<string> => {
  const ai = getGeminiClient();
  
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    if (!response.text) {
      throw new Error('No response received from AI');
    }

    // Extract just the dialogue part
    const text = response.text.trim();
    const dialogueMatch = text.match(/^(?:\s*[A-Z][A-Z\s]+\s*)?(.+)$/s);
    return dialogueMatch?.[1]?.trim() || text;
  } catch (e) {
    console.error("Generate dialogue error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate dialogue');
  }
};
