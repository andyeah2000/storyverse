// ============================================
// NANO BANANA PRO - AI IMAGE SERVICE
// Uses Gemini 2.0 Flash Native Image Generation (via Supabase edge proxy)
// ============================================

import { callGeminiProxy } from './geminiService';

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'photorealistic' | 'cinematic' | 'artistic' | 'anime' | 'sketch' | 'vintage';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  quality?: 'standard' | 'hd';
}

export interface ImageEditOptions {
  imageBase64: string;
  prompt: string;
  editType: 'enhance' | 'style-transfer' | 'expand' | 'remove-bg' | 'relight';
}

// Style prompts for different visual aesthetics
const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: 'ultra realistic, photorealistic, 8k, detailed, sharp focus, professional photography',
  cinematic: 'cinematic lighting, movie still, anamorphic lens, film grain, dramatic shadows, Hollywood quality',
  artistic: 'artistic, painterly, expressive brushstrokes, fine art masterpiece, gallery worthy',
  anime: 'anime style, cel shaded, vibrant colors, manga inspired, Studio Ghibli quality',
  sketch: 'pencil sketch, hand drawn, detailed linework, graphite on paper, artistic',
  vintage: 'vintage photograph, sepia tones, film grain, nostalgic, retro 1970s aesthetic',
};

/**
 * Extract image from Gemini response
 */
function extractImageFromResponse(response: unknown): string | null {
  try {
    const res = response as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: {
              mimeType?: string;
              data?: string;
            };
          }>;
        };
      }>;
    };

    const candidates = res.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in response');
      return null;
    }

    const parts = candidates[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      console.error('No parts in response');
      return null;
    }

    // Find the image part
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/') && part.inlineData?.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    console.error('No image data found in response parts');
    return null;
  } catch (e) {
    console.error('Error extracting image:', e);
    return null;
  }
}

/**
 * Generate an image using Gemini 2.0 Flash (Nano Banana Pro)
 */
export async function generateImage(options: ImageGenerationOptions): Promise<string> {
  // Build enhanced prompt with style
  const stylePrompt = options.style ? STYLE_PROMPTS[options.style] : STYLE_PROMPTS.cinematic;
  const fullPrompt = `Generate an image: ${options.prompt}. Style: ${stylePrompt}. Aspect ratio: ${options.aspectRatio || '16:9'}. High quality, detailed.`;

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    const data = await response.json();
    const imageUrl = extractImageFromResponse(data);
    
    if (!imageUrl) {
      // Check if there's text explaining why
      const textPart = (response as any)?.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
      if (textPart?.text) {
        throw new Error(`Image generation failed: ${textPart.text.slice(0, 100)}`);
      }
      throw new Error('No image generated. Try a different prompt or check your API access.');
    }

    return imageUrl;
    
  } catch (error: unknown) {
    console.error('Image generation error:', error);
    const err = error as { message?: string; status?: number };
    
    if (err.message?.includes('SAFETY') || err.message?.includes('blocked')) {
      throw new Error('Image blocked for safety reasons. Please try a different prompt.');
    }
    
    if (err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    if (err.message?.includes('API key') || err.status === 401 || err.status === 403) {
      throw new Error('Invalid API key. Please check your Gemini API key in Settings.');
    }

    throw new Error(err.message || 'Failed to generate image. Please try again.');
  }
}

/**
 * Edit an existing image using Gemini Vision + Image Generation
 */
export async function editImage(options: ImageEditOptions): Promise<string> {
  const editInstructions: Record<string, string> = {
    'enhance': 'Enhance this image: improve quality, sharpness, colors, and overall visual appeal',
    'style-transfer': `Transform this image to: ${options.prompt}`,
    'expand': `Expand and extend this image: ${options.prompt}`,
    'remove-bg': 'Remove the background, keep only the main subject on a clean background',
    'relight': `Change the lighting to: ${options.prompt}`,
  };

  try {
    const response = await callGeminiProxy('generate', {
      model: 'gemini-2.0-flash-exp',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: options.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
            }
          },
          {
            text: `${editInstructions[options.editType]}. Generate a new edited version of this image.`
          }
        ]
      }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    const data = await response.json();
    const imageUrl = extractImageFromResponse(data);
    
    if (!imageUrl) {
      throw new Error('Edit failed - no image generated');
    }

    return imageUrl;
    
  } catch (error: unknown) {
    console.error('Image edit error:', error);
    const err = error as { message?: string };
    throw new Error(err.message || 'Failed to edit image');
  }
}

/**
 * Generate image variations
 */
export async function generateVariations(imageBase64: string, count: number = 4): Promise<string[]> {
  const variations: string[] = [];

  const variationPrompts = [
    'Create a variation with more dramatic lighting and deeper shadows',
    'Create a variation with warmer, golden hour colors',
    'Create a variation with cooler, blue tones and mystical atmosphere',
    'Create a variation with higher contrast and more vibrant colors',
  ];

  for (let i = 0; i < Math.min(count, variationPrompts.length); i++) {
    try {
      const response = await callGeminiProxy('generate', {
        model: 'gemini-2.0-flash-exp',
        contents: [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              }
            },
            {
              text: `${variationPrompts[i]}. Generate the new image variation.`
            }
          ]
        }],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      const data = await response.json();
      const imageUrl = extractImageFromResponse(data);
      if (imageUrl) {
        variations.push(imageUrl);
      }
    } catch (e) {
      console.error(`Variation ${i + 1} failed:`, e);
    }
  }

  return variations;
}
