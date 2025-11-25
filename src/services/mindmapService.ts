import { GoogleGenAI, Type } from "@google/genai";
import { Source } from "../types";

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

const getGeminiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API-Key fehlt! Bitte in Settings > General eingeben.");
  }
  return new GoogleGenAI({ apiKey });
};

// MindMap Node structure for AI
export interface AIMindMapNode {
  id: string;
  type: 'character' | 'location' | 'faction' | 'concept' | 'event' | 'relationship';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  connections: string[]; // IDs of connected nodes
}

export interface AIMindMapResult {
  nodes: AIMindMapNode[];
  centralTheme: string;
  suggestedConnections: { from: string; to: string; reason: string }[];
  insights: string[];
}

/**
 * Generates a complete mind map from sources using AI
 */
export const generateMindMap = async (
  sources: Source[],
  projectName: string,
  existingNodeTitles: string[] = []
): Promise<AIMindMapResult> => {
  const ai = getGeminiClient();

  // Build rich context from all sources with extended data
  const sourceContext = sources.map(s => {
    let content = s.content;
    
    // Include character sheet if available
    if (s.type === 'character' && s.characterSheet) {
      const cs = s.characterSheet;
      content += `\n\nCHARACTER SHEET:
Name: ${cs.name || 'Unknown'}
Role: ${cs.role || 'Unknown'}
Age: ${cs.age || 'Unknown'}
Appearance: ${cs.appearance || 'Not specified'}
Personality: ${cs.personality || 'Not specified'}
Background: ${cs.backstory || 'Not specified'}
Motivation: ${cs.motivation || 'Unknown'}
Relationships: ${cs.relationships || 'None specified'}
Arc: ${cs.arc || 'Not defined'}
Quirks: ${cs.quirks || 'None'}`;
    }
    
    // Include character details if available
    if (s.type === 'character' && s.characterDetails) {
      const cd = s.characterDetails;
      content += `\n\nCHARACTER DETAILS:
Role: ${cd.role || 'Unknown'}
Age: ${cd.age || 'Unknown'}
Motivation: ${cd.motivation || 'Unknown'}
Flaw: ${cd.flaw || 'Unknown'}
Arc: ${cd.arc || 'Unknown'}
Relationships: ${cd.relationships || 'None'}
Backstory: ${cd.backstory || 'Unknown'}`;
    }

    // Include location details
    if (s.type === 'location' && s.locationDetails) {
      const ld = s.locationDetails;
      content += `\n\nLOCATION DETAILS:
Region: ${ld.region || 'Unknown'}
Climate: ${ld.climate || 'Unknown'}
Population: ${ld.population || 'Unknown'}
Significance: ${ld.significance || 'Unknown'}
History: ${ld.history || 'Unknown'}
Connected Locations: ${ld.connectedTo?.join(', ') || 'None'}`;
    }

    // Include faction details
    if (s.type === 'faction' && s.factionDetails) {
      const fd = s.factionDetails;
      content += `\n\nFACTION DETAILS:
Type: ${fd.type || 'Unknown'}
Leader: ${fd.leader || 'Unknown'}
Members: ${fd.members?.join(', ') || 'Unknown'}
Goals: ${fd.goals || 'Unknown'}
Allies: ${fd.allies?.join(', ') || 'None'}
Enemies: ${fd.enemies?.join(', ') || 'None'}
History: ${fd.history || 'Unknown'}`;
    }

    // Include tags for additional context
    if (s.tags && s.tags.length > 0) {
      content += `\n\nTAGS: ${s.tags.join(', ')}`;
    }

    return `[${s.type.toUpperCase()}] ${s.title}:\n${content}`;
  }).join("\n\n---\n\n");

  const existingContext = existingNodeTitles.length > 0
    ? `\n\nALREADY EXISTING NODES (don't duplicate these):\n${existingNodeTitles.join(', ')}`
    : '';

  const prompt = `You are a Story Universe Architect. Analyze the provided story material and create a comprehensive mind map of the universe.

PROJECT: "${projectName}"

MATERIAL:
${sourceContext.slice(0, 60000)}
${existingContext}

Create a detailed mind map with the following requirements:

1. EXTRACT ALL ELEMENTS:
   - Characters (protagonists, antagonists, supporting)
   - Locations (cities, planets, realms, buildings)
   - Factions (organizations, groups, families, species)
   - Concepts (magic systems, rules, technologies, themes)
   - Events (past events, plot points, prophecies)
   - Relationships (alliances, conflicts, romances)

2. GENERATE NEW INSIGHTS:
   - Identify implicit connections
   - Suggest potential plot holes
   - Propose interesting unexplored areas
   - Create relationship nodes for complex dynamics

3. IMPORTANCE LEVELS:
   - "high" = Core story elements, protagonists, main locations
   - "medium" = Supporting elements, secondary characters
   - "low" = Background details, minor references

4. CONNECTIONS:
   - Each node should list IDs of related nodes
   - Connections should be meaningful (not just mentioned together)

Return a JSON object matching this structure:
{
  "nodes": [
    {
      "id": "char_1",
      "type": "character",
      "title": "Character Name",
      "description": "Brief description",
      "importance": "high",
      "connections": ["loc_1", "fac_1"]
    }
  ],
  "centralTheme": "The overarching theme of the story",
  "suggestedConnections": [
    {
      "from": "char_1",
      "to": "char_2", 
      "reason": "Why these should be connected"
    }
  ],
  "insights": [
    "Insight about the story universe",
    "Potential plot suggestion"
  ]
}

Create at least 10-20 nodes if the material allows. Be creative but stay true to the source material.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  importance: { type: Type.STRING },
                  connections: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            centralTheme: { type: Type.STRING },
            suggestedConnections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response received from AI');
    }

    const result = JSON.parse(text) as AIMindMapResult;
    return result;
  } catch (e) {
    console.error("MindMap generation error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to generate mind map');
  }
};

/**
 * Expands a specific node with more details
 */
export const expandNode = async (
  node: { title: string; type: string; description: string },
  sources: Source[]
): Promise<AIMindMapNode[]> => {
  const ai = getGeminiClient();

  const sourceContext = sources
    .filter(s => s.content.toLowerCase().includes(node.title.toLowerCase()))
    .map(s => `[${s.type.toUpperCase()}] ${s.title}: ${s.content}`)
    .join("\n\n");

  const prompt = `Given this story element and relevant context, generate 3-5 related sub-elements.

ELEMENT:
Type: ${node.type}
Title: ${node.title}
Description: ${node.description}

RELEVANT CONTEXT:
${sourceContext.slice(0, 20000) || 'No specific context found'}

Generate related nodes that expand on this element. For a character, this might be their allies, enemies, or key possessions. For a location, sub-locations or events that happened there.

Return a JSON array of nodes:
[
  {
    "id": "unique_id",
    "type": "character|location|faction|concept|event|relationship",
    "title": "Name",
    "description": "Brief description",
    "importance": "high|medium|low",
    "connections": []
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              importance: { type: Type.STRING },
              connections: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response received from AI');
    }

    return JSON.parse(text) as AIMindMapNode[];
  } catch (e) {
    console.error("Node expansion error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to expand node');
  }
};

/**
 * Suggests connections between existing nodes
 */
export const suggestConnections = async (
  nodes: { id: string; title: string; type: string }[],
  sources: Source[]
): Promise<{ from: string; to: string; reason: string }[]> => {
  const ai = getGeminiClient();

  const nodeList = nodes.map(n => `${n.id}: ${n.title} (${n.type})`).join('\n');
  const sourceContext = sources.map(s => `${s.title}: ${s.content.slice(0, 500)}`).join('\n\n');

  const prompt = `Analyze these story elements and suggest meaningful connections between them.

NODES:
${nodeList}

SOURCE CONTEXT:
${sourceContext.slice(0, 30000)}

Find connections based on:
- Characters who interact
- Characters and their locations
- Factions and their members
- Events and participants
- Concepts that affect elements
- Hidden or implicit relationships

Return a JSON array of connections:
[
  {
    "from": "node_id_1",
    "to": "node_id_2",
    "reason": "Brief explanation of the connection"
  }
]

Only suggest connections that make sense based on the material. Maximum 10 connections.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('No response received from AI');
    }

    return JSON.parse(text);
  } catch (e) {
    console.error("Connection suggestion error:", e);
    throw new Error(e instanceof Error ? e.message : 'Failed to suggest connections');
  }
};

