// Supabase Edge Function: Gemini API Proxy
// Securely proxies requests to Google Gemini API without exposing API keys to frontend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeminiRequest {
  endpoint: 'generate' | 'chat' | 'audio' | 'analyze';
  payload: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Gemini API key from environment (never from request)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: GeminiRequest = await req.json();
    const { endpoint, payload } = body;

    if (!endpoint || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to appropriate Gemini API endpoint
    let geminiUrl = '';
    let geminiMethod = 'POST';
    let geminiBody: unknown = null;

    switch (endpoint) {
      case 'generate': {
        // Content generation
        const { model = 'gemini-2.5-flash', contents, config } = payload;
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        geminiBody = {
          contents,
          ...(config && { config }),
        };
        break;
      }

      case 'chat': {
        // Chat session
        const { model = 'gemini-2.5-flash', message, history, systemInstruction } = payload;
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        
        // Convert chat history to Gemini format
        const contents = [
          ...(history || []).map((h: { role: string; parts: Array<{ text: string }> }) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: h.parts,
          })),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ];

        geminiBody = {
          contents,
          ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        };
        break;
      }

      case 'audio': {
        // Audio generation (TTS)
        const { model = 'gemini-2.5-flash-preview-tts', script, speechConfig } = payload;
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        geminiBody = {
          contents: [{ parts: [{ text: script }] }],
          config: {
            responseModalities: ['AUDIO'],
            ...(speechConfig && { speechConfig }),
          },
        };
        break;
      }

      case 'analyze': {
        // Script analysis
        const { model = 'gemini-2.5-flash', prompt, responseSchema } = payload;
        geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        geminiBody = {
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
            ...(responseSchema && { responseSchema }),
          },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Forward request to Gemini API
    const geminiResponse = await fetch(geminiUrl, {
      method: geminiMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Gemini API request failed', details: errorText }),
        { status: geminiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();

    // Return response to frontend
    return new Response(
      JSON.stringify(geminiData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

