import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStory } from './StoryContext';
import { 
  AgentMessage, 
  ToolResult,
  AGENT_TOOLS_DECLARATION,
  AGENT_SYSTEM_INSTRUCTION
} from '../types/agent';
import { GoogleGenAI, Modality } from '@google/genai';

// ============================================
// TYPES
// ============================================

interface AgentState {
  isActive: boolean;
  isConnecting: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentAction: string | null;
  lastToolCall: string | null;
  transcript: AgentMessage[];
  error: string | null;
  connectionAttempts: number;
  audioLevel: number;
}

interface AgentContextValue {
  state: AgentState;
  startAgent: () => Promise<void>;
  stopAgent: () => void;
  isAvailable: boolean;
}

const AgentContextInstance = createContext<AgentContextValue | undefined>(undefined);

// ============================================
// AUDIO
// ============================================

const AUDIO_SAMPLE_RATE_INPUT = 16000;
const AUDIO_SAMPLE_RATE_OUTPUT = 24000;

function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const val = float32Array[i];
    if (val !== undefined) {
      const s = Math.max(-1, Math.min(1, val));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

class AudioQueueManager {
  private ctx: AudioContext;
  private nextStartTime: number = 0;
  private sources: AudioBufferSourceNode[] = [];

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.nextStartTime = ctx.currentTime;
  }

  async playChunk(base64Audio: string): Promise<void> {
    const arrayBuffer = base64ToArrayBuffer(base64Audio);
    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);
    
    for (let i = 0; i < int16Array.length; i++) {
      const val = int16Array[i];
      float32Array[i] = val !== undefined ? val / 32768 : 0;
    }
    
    const audioBuffer = this.ctx.createBuffer(1, float32Array.length, AUDIO_SAMPLE_RATE_OUTPUT);
    audioBuffer.copyToChannel(float32Array, 0);
    
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.ctx.destination);
    
    const startTime = Math.max(this.nextStartTime, this.ctx.currentTime + 0.01);
    source.start(startTime);
    this.nextStartTime = startTime + audioBuffer.duration;
    
    this.sources.push(source);
    source.onended = () => {
      const idx = this.sources.indexOf(source);
      if (idx > -1) this.sources.splice(idx, 1);
    };
  }

  stop(): void {
    this.sources.forEach(s => { try { s.stop(); } catch {} });
    this.sources = [];
    this.nextStartTime = this.ctx.currentTime;
  }

  isPlaying(): boolean {
    return this.sources.length > 0;
  }
}

// ============================================
// TOOL EXECUTOR - VOLLSTÄNDIG
// ============================================

// ============================================
// HELPER FUNCTIONS
// ============================================

const fuzzyMatch = (search: string, target: string): boolean => {
  const s = search.toLowerCase().trim();
  const t = target.toLowerCase();
  return t.includes(s) || s.includes(t) || 
         t.split(' ').some(word => word.startsWith(s)) ||
         levenshtein(s, t) < Math.max(s.length, t.length) * 0.4;
};

const levenshtein = (a: string, b: string): number => {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) {
    if (matrix[0]) matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const row = matrix[i];
      const prevRow = matrix[i - 1];
      if (row && prevRow) {
        row[j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? (prevRow[j - 1] ?? 0)
          : Math.min((prevRow[j - 1] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prevRow[j] ?? 0) + 1);
      }
    }
  }
  return matrix[b.length]?.[a.length] ?? 0;
};

const findBestMatch = <T extends { title: string }>(items: T[], search: string): T | undefined => {
  const exact = items.find(i => i.title.toLowerCase() === search.toLowerCase());
  if (exact) return exact;
  const partial = items.find(i => fuzzyMatch(search, i.title));
  return partial;
};

// ============================================
// TOOL EXECUTOR - ROBUST & COMPREHENSIVE
// ============================================

const createToolExecutor = (storyContext: ReturnType<typeof useStory>, navigate: (path: string) => void) => {
  const executeTools = async (toolName: string, params: Record<string, unknown>): Promise<ToolResult> => {
    const {
      sources, beatSheet, outline, notes, storyMap, currentProject,
      addSource, updateSource, deleteSource, updateBeatSheet,
      addOutlineNode, addNote, updateNote, deleteNote, addStoryNode
    } = storyContext;

    console.log(`[Tool] Executing: ${toolName}`, params);

    try {
      switch (toolName) {
        // ════════════════════════════════════════════════════════════
        // STORY BIBLE
        // ════════════════════════════════════════════════════════════
        case 'list_all_sources': {
          const type = (params.type as string) || 'all';
          const limit = (params.limit as number) || 100;
          let filtered = type === 'all' ? sources : sources.filter(s => s.type === type);
          filtered = filtered.slice(0, limit);
          
          if (filtered.length === 0) {
            return { success: true, message: `Keine Einträge vom Typ "${type}" gefunden.`, data: [] };
          }
          
          const list = filtered.map(s => {
            const preview = s.content.slice(0, 60).replace(/\n/g, ' ');
            return `• ${s.title} [${s.type}]: ${preview}...`;
          }).join('\n');
          
          return { 
            success: true, 
            message: `${filtered.length} Einträge gefunden:\n\n${list}`,
            data: filtered.map(s => ({ id: s.id, title: s.title, type: s.type }))
          };
        }

        case 'read_source': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const source = findBestMatch(sources, title);
          if (source) {
            return { 
              success: true, 
              message: `📄 ${source.title} (${source.type}):\n\n${source.content}`,
              data: source 
            };
          }
          
          // Suggest similar titles
          const similar = sources.filter(s => s.title.toLowerCase().includes(title.toLowerCase().slice(0, 3)));
          const suggestion = similar.length > 0 
            ? `\n\nÄhnliche: ${similar.slice(0, 3).map(s => s.title).join(', ')}` 
            : '';
          return { success: false, message: `"${title}" nicht gefunden.${suggestion}`, error: 'NOT_FOUND' };
        }

        case 'read_multiple_sources': {
          const titles = params.titles as string[];
          if (!titles?.length) return { success: false, message: 'Keine Titel angegeben.', error: 'MISSING_PARAM' };
          
          const results = titles.map(title => {
            const source = findBestMatch(sources, title);
            return source 
              ? `📄 ${source.title}:\n${source.content}\n` 
              : `❌ "${title}" nicht gefunden`;
          });
          
          return { success: true, message: results.join('\n---\n'), data: results };
        }

        case 'create_source': {
          const title = params.title as string;
          const content = params.content as string;
          const type = params.type as string;
          
          if (!title || !content || !type) {
            return { success: false, message: 'Titel, Inhalt und Typ sind erforderlich.', error: 'MISSING_PARAM' };
          }
          
          // Check for duplicate
          const existing = sources.find(s => s.title.toLowerCase() === title.toLowerCase());
          if (existing) {
            return { success: false, message: `"${title}" existiert bereits.`, error: 'DUPLICATE' };
          }
          
          addSource({
            title,
            content,
            type: type as any,
            tags: (params.tags as string[]) || []
          });
          return { success: true, message: `✅ "${title}" (${type}) wurde erstellt.` };
        }

        case 'create_multiple_sources': {
          const sourcesData = params.sources as Array<{ title: string; content: string; type: string; tags?: string[] }>;
          if (!sourcesData?.length) return { success: false, message: 'Keine Einträge angegeben.', error: 'MISSING_PARAM' };
          
          const created: string[] = [];
          const failed: string[] = [];
          
          for (const s of sourcesData) {
            try {
              const existing = sources.find(ex => ex.title.toLowerCase() === s.title.toLowerCase());
              if (existing) {
                failed.push(`${s.title} (existiert bereits)`);
                continue;
              }
              addSource({ title: s.title, content: s.content, type: s.type as any, tags: s.tags || [] });
              created.push(s.title);
            } catch (e) {
              failed.push(`${s.title} (Fehler)`);
            }
          }
          
          return { 
            success: created.length > 0, 
            message: `✅ Erstellt: ${created.length}\n${created.join(', ')}${failed.length ? `\n\n❌ Fehlgeschlagen: ${failed.join(', ')}` : ''}`,
            data: { created, failed }
          };
        }

        case 'update_source': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const source = findBestMatch(sources, title);
          if (!source) return { success: false, message: `"${title}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          const updates: Record<string, unknown> = {};
          if (params.newTitle) updates.title = params.newTitle;
          if (params.newContent) updates.content = params.newContent;
          if (params.appendContent) updates.content = source.content + '\n\n' + params.appendContent;
          if (params.prependContent) updates.content = params.prependContent + '\n\n' + source.content;
          if (params.addTags) updates.tags = [...(source.tags || []), ...(params.addTags as string[])];
          
          if (Object.keys(updates).length === 0) {
            return { success: false, message: 'Keine Änderungen angegeben.', error: 'MISSING_PARAM' };
          }
          
          updateSource(source.id, updates);
          return { success: true, message: `✅ "${source.title}" wurde aktualisiert.` };
        }

        case 'delete_source': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const source = findBestMatch(sources, title);
          if (!source) return { success: false, message: `"${title}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          deleteSource(source.id);
          return { success: true, message: `🗑️ "${source.title}" wurde gelöscht.` };
        }

        // ════════════════════════════════════════════════════════════
        // SCRIPT
        // ════════════════════════════════════════════════════════════
        case 'read_script': {
          const script = sources.find(s => s.type === 'script');
          if (!script) return { success: false, message: '📜 Kein Script vorhanden. Erstelle eins mit write_script.', error: 'NOT_FOUND' };
          
          const lines = script.content.split('\n');
          const fromLine = Math.max(0, ((params.fromLine as number) || 1) - 1);
          const toLine = Math.min(lines.length, (params.toLine as number) || lines.length);
          const searchText = params.searchText as string;
          const searchScene = params.searchScene as string;
          
          if (searchScene) {
            const sceneIdx = lines.findIndex(l => l.toUpperCase().includes(searchScene.toUpperCase()));
            if (sceneIdx === -1) return { success: false, message: `Szene "${searchScene}" nicht gefunden.`, error: 'NOT_FOUND' };
            
            let endIdx = lines.findIndex((l, i) => i > sceneIdx && /^(INT\.|EXT\.|I\/E\.)/.test(l.trim()));
            if (endIdx === -1) endIdx = lines.length;
            
            const sceneLines = lines.slice(sceneIdx, endIdx);
            return { success: true, message: `🎬 Szene:\n\n${sceneLines.join('\n')}`, data: { sceneLines } };
          }
          
          if (searchText) {
            const found = lines.map((l, i) => ({ line: l, num: i + 1 }))
              .filter(({ line }) => line.toLowerCase().includes(searchText.toLowerCase()));
            if (found.length === 0) return { success: false, message: `"${searchText}" nicht im Script gefunden.`, error: 'NOT_FOUND' };
            return { 
              success: true, 
              message: `🔍 ${found.length} Treffer:\n\n${found.map(f => `[${f.num}] ${f.line}`).join('\n')}`,
              data: found
            };
          }
          
          const selectedLines = lines.slice(fromLine, toLine);
          return { 
            success: true, 
            message: `📜 "${script.title}" (Zeilen ${fromLine + 1}-${toLine} von ${lines.length}):\n\n${selectedLines.join('\n')}`,
            data: { title: script.title, content: selectedLines.join('\n'), totalLines: lines.length }
          };
        }

        case 'get_script_stats': {
          const script = sources.find(s => s.type === 'script');
          if (!script) return { success: false, message: 'Kein Script vorhanden.', error: 'NOT_FOUND' };
          
          const lines = script.content.split('\n');
          const scenes = lines.filter(l => /^(INT\.|EXT\.|I\/E\.)/.test(l.trim())).length;
          const characters = new Set(lines.filter(l => /^[A-ZÄÖÜ]{2,}(\s+\([^)]+\))?$/.test(l.trim())).map(l => (l.trim().split('(')[0] ?? '').trim()));
          const words = script.content.split(/\s+/).length;
          const pages = Math.ceil(lines.length / 55); // ~55 lines per page
          
          return { 
            success: true, 
            message: `📊 Script-Statistiken:\n• Zeilen: ${lines.length}\n• Wörter: ${words}\n• Szenen: ${scenes}\n• Charaktere: ${characters.size} (${[...characters].slice(0, 5).join(', ')}${characters.size > 5 ? '...' : ''})\n• Geschätzte Seiten: ${pages}`,
            data: { lines: lines.length, words, scenes, characters: [...characters], pages }
          };
        }

        case 'write_script': {
          const content = params.content as string;
          if (!content) return { success: false, message: 'Kein Inhalt angegeben.', error: 'MISSING_PARAM' };
          
          const existing = sources.find(s => s.type === 'script');
          if (existing) {
            updateSource(existing.id, { content });
            return { success: true, message: `✅ Script "${existing.title}" wurde aktualisiert (${content.split('\n').length} Zeilen).` };
          }
          addSource({ 
            title: (params.title as string) || 'Neues Script', 
            content, 
            type: 'script', 
            tags: [] 
          });
          return { success: true, message: `✅ Neues Script wurde erstellt (${content.split('\n').length} Zeilen).` };
        }

        case 'append_to_script': {
          const content = params.content as string;
          if (!content) return { success: false, message: 'Kein Inhalt angegeben.', error: 'MISSING_PARAM' };
          
          const script = sources.find(s => s.type === 'script');
          if (!script) {
            addSource({ title: 'Neues Script', content, type: 'script', tags: [] });
            return { success: true, message: '✅ Neues Script mit dem Inhalt erstellt.' };
          }
          updateSource(script.id, { content: script.content + '\n\n' + content });
          return { success: true, message: '✅ Text wurde zum Script hinzugefügt.' };
        }

        case 'insert_in_script': {
          const script = sources.find(s => s.type === 'script');
          if (!script) return { success: false, message: 'Kein Script vorhanden.', error: 'NOT_FOUND' };
          
          let newContent = script.content;
          const lines = script.content.split('\n');
          
          if (params.replaceText && params.newText) {
            const replaceCount = (newContent.match(new RegExp(params.replaceText as string, 'g')) || []).length;
            newContent = newContent.replace(new RegExp(params.replaceText as string, 'g'), params.newText as string);
            updateSource(script.id, { content: newContent });
            return { success: true, message: `✅ ${replaceCount} Vorkommen ersetzt.` };
          } 
          
          if (params.afterScene) {
            const sceneIdx = lines.findIndex(l => l.toUpperCase().includes((params.afterScene as string).toUpperCase()));
            if (sceneIdx === -1) return { success: false, message: `Szene "${params.afterScene}" nicht gefunden.`, error: 'NOT_FOUND' };
            let nextSceneIdx = lines.findIndex((l, i) => i > sceneIdx && /^(INT\.|EXT\.|I\/E\.)/.test(l.trim()));
            if (nextSceneIdx === -1) nextSceneIdx = lines.length;
            lines.splice(nextSceneIdx, 0, params.content as string);
            newContent = lines.join('\n');
          } else if (params.atLine !== undefined) {
            const lineNum = Math.max(0, (params.atLine as number) - 1);
            lines.splice(lineNum, 0, params.content as string);
            newContent = lines.join('\n');
          } else {
            return { success: false, message: 'atLine oder afterScene erforderlich.', error: 'MISSING_PARAM' };
          }
          
          updateSource(script.id, { content: newContent });
          return { success: true, message: '✅ Text wurde eingefügt.' };
        }

        case 'add_scene': {
          const heading = params.heading as string;
          if (!heading) return { success: false, message: 'Szenen-Heading erforderlich.', error: 'MISSING_PARAM' };
          
          const action = params.action as string;
          const dialogue = params.dialogue as Array<{ character: string; line: string; parenthetical?: string }>;
          const transition = params.transition as string;
          
          let sceneContent = `\n\n${heading.toUpperCase()}\n\n`;
          if (action) sceneContent += `${action}\n\n`;
          if (dialogue?.length) {
            for (const d of dialogue) {
              sceneContent += `\t\t\t${d.character.toUpperCase()}\n`;
              if (d.parenthetical) sceneContent += `\t\t(${d.parenthetical})\n`;
              sceneContent += `\t${d.line}\n\n`;
            }
          }
          if (transition) sceneContent += `\t\t\t\t\t${transition.toUpperCase()}\n`;
          
          const script = sources.find(s => s.type === 'script');
          if (script) {
            updateSource(script.id, { content: script.content + sceneContent });
            return { success: true, message: `🎬 Szene "${heading}" wurde hinzugefügt.` };
          }
          addSource({ title: 'Neues Script', content: sceneContent.trim(), type: 'script', tags: [] });
          return { success: true, message: `🎬 Script mit Szene "${heading}" wurde erstellt.` };
        }

        case 'add_multiple_scenes': {
          const scenes = params.scenes as Array<{ heading: string; action?: string; dialogue?: Array<{ character: string; line: string; parenthetical?: string }> }>;
          if (!scenes?.length) return { success: false, message: 'Keine Szenen angegeben.', error: 'MISSING_PARAM' };
          
          let allContent = '';
          for (const scene of scenes) {
            allContent += `\n\n${scene.heading.toUpperCase()}\n\n`;
            if (scene.action) allContent += `${scene.action}\n\n`;
            if (scene.dialogue?.length) {
              for (const d of scene.dialogue) {
                allContent += `\t\t\t${d.character.toUpperCase()}\n`;
                if (d.parenthetical) allContent += `\t\t(${d.parenthetical})\n`;
                allContent += `\t${d.line}\n\n`;
              }
            }
          }
          
          const script = sources.find(s => s.type === 'script');
          if (script) {
            updateSource(script.id, { content: script.content + allContent });
          } else {
            addSource({ title: 'Neues Script', content: allContent.trim(), type: 'script', tags: [] });
          }
          return { success: true, message: `🎬 ${scenes.length} Szenen wurden hinzugefügt.` };
        }

        // ════════════════════════════════════════════════════════════
        // BEAT SHEET
        // ════════════════════════════════════════════════════════════
        case 'read_beat_sheet': {
          const beatNames: Record<string, string> = {
            openingImage: '1. Opening Image',
            themeStated: '2. Theme Stated',
            setup: '3. Setup',
            catalyst: '4. Catalyst',
            debate: '5. Debate',
            breakIntoTwo: '6. Break Into Two',
            bStory: '7. B Story',
            funAndGames: '8. Fun and Games',
            midpoint: '9. Midpoint',
            badGuysCloseIn: '10. Bad Guys Close In',
            allIsLost: '11. All Is Lost',
            darkNightOfSoul: '12. Dark Night of the Soul',
            breakIntoThree: '13. Break Into Three',
            finale: '14. Finale',
            finalImage: '15. Final Image'
          };
          
          const filled = Object.entries(beatSheet).filter(([_, v]) => v).length;
          const total = Object.keys(beatNames).length;
          
          const beats = Object.entries(beatNames)
            .map(([key, name]) => {
              const val = beatSheet[key as keyof typeof beatSheet];
              return val ? `✅ ${name}:\n   ${val}` : `⬜ ${name}: (leer)`;
            })
            .join('\n\n');
          
          return { 
            success: true, 
            message: `📋 Beat Sheet (${filled}/${total} ausgefüllt):\n\n${beats}`, 
            data: { beatSheet, filled, total } 
          };
        }

        case 'update_beat': {
          const beat = params.beat as string;
          const content = params.content as string;
          if (!beat || !content) return { success: false, message: 'Beat und Inhalt erforderlich.', error: 'MISSING_PARAM' };
          
          updateBeatSheet({ [beat]: content });
          return { success: true, message: `✅ Beat "${beat}" wurde aktualisiert.` };
        }

        case 'update_multiple_beats': {
          const beats = params.beats as Array<{ beat: string; content: string }>;
          if (!beats?.length) return { success: false, message: 'Keine Beats angegeben.', error: 'MISSING_PARAM' };
          
          const updates: Record<string, string> = {};
          for (const b of beats) {
            if (b.beat && b.content) updates[b.beat] = b.content;
          }
          
          updateBeatSheet(updates);
          return { success: true, message: `✅ ${Object.keys(updates).length} Beats wurden aktualisiert.` };
        }

        // ════════════════════════════════════════════════════════════
        // OUTLINE
        // ════════════════════════════════════════════════════════════
        case 'read_outline': {
          const formatOutline = (items: typeof outline, depth = 0): string => {
            if (!items?.length) return '';
            return items.map(item => {
              const indent = '  '.repeat(depth);
              const icon = item.type === 'act' ? '🎭' : item.type === 'sequence' ? '📑' : item.type === 'scene' ? '🎬' : '💡';
              let str = `${indent}${icon} ${item.title}`;
              if (item.content) str += `: ${item.content.slice(0, 80)}${item.content.length > 80 ? '...' : ''}`;
              if (item.children?.length) {
                str += '\n' + formatOutline(item.children, depth + 1);
              }
              return str;
            }).join('\n');
          };
          
          const content = formatOutline(outline);
          return { 
            success: true, 
            message: content ? `📝 Outline:\n\n${content}` : '📝 Outline ist leer. Füge Elemente mit add_outline_item hinzu.',
            data: outline 
          };
        }

        case 'add_outline_item': {
          const title = params.title as string;
          const type = params.type as string;
          if (!title || !type) return { success: false, message: 'Titel und Typ erforderlich.', error: 'MISSING_PARAM' };
          
          const parentTitle = params.parentTitle as string;
          let parentId: string | undefined;
          
          if (parentTitle) {
            const findParent = (items: typeof outline): string | undefined => {
              for (const item of items) {
                if (item.title.toLowerCase().includes(parentTitle.toLowerCase())) return item.id;
                if (item.children) {
                  const found = findParent(item.children);
                  if (found) return found;
                }
              }
              return undefined;
            };
            parentId = findParent(outline);
          }
          
          addOutlineNode({
            title: params.title as string,
            content: (params.content as string) || '',
            type: params.type as 'act' | 'sequence' | 'scene' | 'beat'
          }, parentId);
          return { success: true, message: `"${params.title}" wurde zur Outline hinzugefügt.` };
        }

        case 'add_multiple_outline_items': {
          const items = params.items as Array<{ title: string; content?: string; type: string; parentTitle?: string }>;
          if (!items?.length) return { success: false, message: 'Keine Items angegeben.', error: 'MISSING_PARAM' };
          
          let added = 0;
          for (const item of items) {
            let parentId: string | undefined;
            if (item.parentTitle) {
              const findParent = (nodes: typeof outline): string | undefined => {
                for (const node of nodes) {
                  if (fuzzyMatch(item.parentTitle!, node.title)) return node.id;
                  if (node.children) {
                    const found = findParent(node.children);
                    if (found) return found;
                  }
                }
                return undefined;
              };
              parentId = findParent(outline);
            }
            addOutlineNode({ title: item.title, content: item.content || '', type: item.type as any }, parentId);
            added++;
          }
          return { success: true, message: `✅ ${added} Outline-Elemente hinzugefügt.` };
        }

        // ════════════════════════════════════════════════════════════
        // NOTES
        // ════════════════════════════════════════════════════════════
        case 'read_notes': {
          if (notes.length === 0) {
            return { success: true, message: '📝 Keine Notizen vorhanden.', data: [] };
          }
          const notesList = notes.map(n => {
            const color = n.color === 'yellow' ? '🟡' : n.color === 'green' ? '🟢' : n.color === 'blue' ? '🔵' : n.color === 'red' ? '🔴' : '⚪';
            return `${color} ${n.title || 'Ohne Titel'}:\n   ${n.content.slice(0, 100)}${n.content.length > 100 ? '...' : ''}`;
          }).join('\n\n');
          return { success: true, message: `📝 ${notes.length} Notizen:\n\n${notesList}`, data: notes };
        }

        case 'read_note': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const note = notes.find(n => fuzzyMatch(title, n.title || ''));
          if (!note) return { success: false, message: `Notiz "${title}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          return { success: true, message: `📝 ${note.title || 'Ohne Titel'}:\n\n${note.content}`, data: note };
        }

        case 'create_note': {
          const content = params.content as string;
          if (!content) return { success: false, message: 'Kein Inhalt angegeben.', error: 'MISSING_PARAM' };
          
          const validColors = ['default', 'yellow', 'green', 'blue', 'red'] as const;
          const color = validColors.includes(params.color as any) ? params.color as typeof validColors[number] : 'default';
          addNote({ title: (params.title as string) || '', content, color });
          return { success: true, message: `✅ Notiz "${params.title || 'Neu'}" wurde erstellt.` };
        }

        case 'create_multiple_notes': {
          const notesData = params.notes as Array<{ title?: string; content: string; color?: string }>;
          if (!notesData?.length) return { success: false, message: 'Keine Notizen angegeben.', error: 'MISSING_PARAM' };
          
          const validColors = ['default', 'yellow', 'green', 'blue', 'red'] as const;
          for (const n of notesData) {
            const color = validColors.includes(n.color as any) ? n.color as typeof validColors[number] : 'default';
            addNote({ title: n.title || '', content: n.content, color });
          }
          return { success: true, message: `✅ ${notesData.length} Notizen wurden erstellt.` };
        }

        case 'update_note': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const note = notes.find(n => fuzzyMatch(title, n.title || ''));
          if (!note) return { success: false, message: `Notiz "${title}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          const updates: Record<string, unknown> = {};
          if (params.newTitle) updates.title = params.newTitle;
          if (params.newContent) updates.content = params.newContent;
          if (params.appendContent) updates.content = note.content + '\n\n' + params.appendContent;
          if (params.newColor) updates.color = params.newColor;
          
          updateNote(note.id, updates);
          return { success: true, message: `✅ Notiz "${note.title}" wurde aktualisiert.` };
        }

        case 'delete_note': {
          const title = params.title as string;
          if (!title) return { success: false, message: 'Kein Titel angegeben.', error: 'MISSING_PARAM' };
          
          const note = notes.find(n => fuzzyMatch(title, n.title || ''));
          if (!note) return { success: false, message: `Notiz "${title}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          deleteNote(note.id);
          return { success: true, message: `🗑️ Notiz "${note.title}" wurde gelöscht.` };
        }

        // ════════════════════════════════════════════════════════════
        // STORY MAP
        // ════════════════════════════════════════════════════════════
        case 'read_story_map': {
          if (storyMap.length === 0) {
            return { success: true, message: '🗺️ Story Map ist leer. Füge Ereignisse mit add_story_event hinzu.', data: [] };
          }
          const events = storyMap.map((e, i) => `${i + 1}. ${e.title}\n   ${e.description}`).join('\n\n');
          return { success: true, message: `🗺️ Story Map (${storyMap.length} Ereignisse):\n\n${events}`, data: storyMap };
        }

        case 'add_story_event': {
          const title = params.title as string;
          const description = params.description as string;
          if (!title || !description) return { success: false, message: 'Titel und Beschreibung erforderlich.', error: 'MISSING_PARAM' };
          
          let parentId: string | undefined;
          if (params.causesEventTitle) {
            const parent = storyMap.find(e => fuzzyMatch(params.causesEventTitle as string, e.title));
            parentId = parent?.id;
          }
          addStoryNode({ title, description, type: 'cause', parentId });
          return { success: true, message: `✅ Ereignis "${title}" wurde hinzugefügt.` };
        }

        case 'add_multiple_events': {
          const events = params.events as Array<{ title: string; description: string; causesEventTitle?: string }>;
          if (!events?.length) return { success: false, message: 'Keine Ereignisse angegeben.', error: 'MISSING_PARAM' };
          
          for (const e of events) {
            let parentId: string | undefined;
            if (e.causesEventTitle) {
              const parent = storyMap.find(ev => fuzzyMatch(e.causesEventTitle!, ev.title));
              parentId = parent?.id;
            }
            addStoryNode({ title: e.title, description: e.description, type: 'cause', parentId });
          }
          return { success: true, message: `✅ ${events.length} Ereignisse wurden hinzugefügt.` };
        }

        // ════════════════════════════════════════════════════════════
        // NAVIGATION
        // ════════════════════════════════════════════════════════════
        case 'navigate_to': {
          const routes: Record<string, string> = {
            'editor': '/app', 'beats': '/app/beats', 'outline': '/app/outline',
            'map': '/app/map', 'mindmap': '/app/mindmap', 'co-writer': '/app/co-writer',
            'table-read': '/app/table-read', 'notes': '/app/notes', 'mood-board': '/app/mood-board',
            'settings': '/app/settings', 'characters': '/app/characters', 'wiki': '/app/wiki'
          };
          const page = params.page as string;
          if (!page) return { success: false, message: 'Keine Seite angegeben.', error: 'MISSING_PARAM' };
          
          const path = routes[page.toLowerCase()];
          if (path) {
            navigate(path);
            return { success: true, message: `🧭 Navigiert zu ${page}.` };
          }
          return { success: false, message: `Unbekannte Seite: "${page}". Verfügbar: ${Object.keys(routes).join(', ')}`, error: 'INVALID' };
        }

        // ════════════════════════════════════════════════════════════
        // CHARACTERS (Extended)
        // ════════════════════════════════════════════════════════════
        case 'create_character': {
          const name = params.name as string;
          if (!name) return { success: false, message: 'Kein Name angegeben.', error: 'MISSING_PARAM' };
          
          const existing = sources.find(s => s.type === 'character' && s.title.toLowerCase() === name.toLowerCase());
          if (existing) return { success: false, message: `Charakter "${name}" existiert bereits.`, error: 'DUPLICATE' };
          
          const content = [
            params.role && `Rolle: ${params.role}`,
            params.age && `Alter: ${params.age}`,
            params.personality && `Persönlichkeit: ${params.personality}`,
            params.appearance && `Aussehen: ${params.appearance}`,
            params.backstory && `Hintergrund: ${params.backstory}`,
            params.motivation && `Motivation: ${params.motivation}`,
            params.arc && `Entwicklung: ${params.arc}`
          ].filter(Boolean).join('\n\n');
          
          addSource({
            title: name,
            content: content || 'Neuer Charakter',
            type: 'character',
            tags: (params.tags as string[]) || [],
            characterSheet: {
              name,
              role: (params.role as string) || '',
              age: (params.age as string) || '',
              appearance: (params.appearance as string) || '',
              personality: (params.personality as string) || '',
              backstory: (params.backstory as string) || '',
              motivation: (params.motivation as string) || '',
              relationships: (params.relationships as string) || '',
              arc: (params.arc as string) || '',
              quirks: (params.quirks as string) || ''
            }
          });
          navigate('/app/characters');
          return { success: true, message: `👤 Charakter "${name}" wurde erstellt.` };
        }

        case 'update_character': {
          const name = params.name as string;
          if (!name) return { success: false, message: 'Kein Name angegeben.', error: 'MISSING_PARAM' };
          
          const character = sources.find(s => s.type === 'character' && fuzzyMatch(name, s.title));
          if (!character) return { success: false, message: `Charakter "${name}" nicht gefunden.`, error: 'NOT_FOUND' };
          
          const updates: Record<string, unknown> = {};
          if (params.newName) updates.title = params.newName;
          if (params.role || params.personality || params.backstory) {
            const existingSheet = character.characterSheet || {};
            const newSheet: Record<string, string> = { ...existingSheet };
            if (params.role) newSheet.role = params.role as string;
            if (params.age) newSheet.age = params.age as string;
            if (params.personality) newSheet.personality = params.personality as string;
            if (params.appearance) newSheet.appearance = params.appearance as string;
            if (params.backstory) newSheet.backstory = params.backstory as string;
            if (params.motivation) newSheet.motivation = params.motivation as string;
            if (params.arc) newSheet.arc = params.arc as string;
            if (params.quirks) newSheet.quirks = params.quirks as string;
            if (params.relationships) newSheet.relationships = params.relationships as string;
            updates.characterSheet = newSheet;
            
            // Update content with new info
            updates.content = Object.entries(newSheet)
              .filter(([k, v]) => v && k !== 'name')
              .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
              .join('\n\n');
          }
          
          updateSource(character.id, updates);
          return { success: true, message: `👤 Charakter "${character.title}" wurde aktualisiert.` };
        }

        // ════════════════════════════════════════════════════════════
        // WIKI / LOCATIONS / LORE (Extended)
        // ════════════════════════════════════════════════════════════
        case 'create_location': {
          const name = params.name as string;
          if (!name) return { success: false, message: 'Kein Name angegeben.', error: 'MISSING_PARAM' };
          
          const existing = sources.find(s => s.type === 'location' && s.title.toLowerCase() === name.toLowerCase());
          if (existing) return { success: false, message: `Ort "${name}" existiert bereits.`, error: 'DUPLICATE' };
          
          addSource({
            title: name,
            content: (params.description as string) || 'Neuer Ort',
            type: 'location',
            tags: (params.tags as string[]) || [],
            locationDetails: {
              climate: (params.climate as string) || '',
              history: (params.history as string) || '',
              significance: (params.significance as string) || ''
            }
          });
          navigate('/app/wiki');
          return { success: true, message: `📍 Ort "${name}" wurde erstellt.` };
        }

        case 'create_lore': {
          const name = params.name as string;
          if (!name) return { success: false, message: 'Kein Name angegeben.', error: 'MISSING_PARAM' };
          
          addSource({
            title: name,
            content: (params.description as string) || 'Neues Lore-Element',
            type: 'lore',
            tags: (params.tags as string[]) || []
          });
          navigate('/app/wiki');
          return { success: true, message: `📜 Lore "${name}" wurde erstellt.` };
        }

        case 'create_faction': {
          const name = params.name as string;
          if (!name) return { success: false, message: 'Kein Name angegeben.', error: 'MISSING_PARAM' };
          
          addSource({
            title: name,
            content: (params.description as string) || 'Neue Fraktion',
            type: 'faction',
            tags: (params.tags as string[]) || [],
            factionDetails: {
              goals: (params.ideology as string) || '',
              leader: (params.leadership as string) || '',
              allies: params.allies ? [(params.allies as string)] : [],
              enemies: params.enemies ? [(params.enemies as string)] : []
            }
          });
          navigate('/app/wiki');
          return { success: true, message: `⚔️ Fraktion "${name}" wurde erstellt.` };
        }

        // ════════════════════════════════════════════════════════════
        // PROJECT & SEARCH
        // ════════════════════════════════════════════════════════════
        case 'get_project_info': {
          const scriptSource = sources.find(s => s.type === 'script');
          const scriptLines = scriptSource ? scriptSource.content.split('\n').length : 0;
          const filledBeats = Object.values(beatSheet).filter(Boolean).length;
          
          return { 
            success: true, 
            message: `📊 Projektübersicht:\n\n` +
                     `🏷️ Projekt: ${currentProject?.name || 'Unbenannt'}\n` +
                     `📚 Story Bible: ${sources.length} Einträge\n` +
                     `   • Charaktere: ${sources.filter(s => s.type === 'character').length}\n` +
                     `   • Orte: ${sources.filter(s => s.type === 'location').length}\n` +
                     `   • Lore: ${sources.filter(s => s.type === 'lore').length}\n` +
                     `📜 Script: ${scriptLines} Zeilen\n` +
                     `📋 Beat Sheet: ${filledBeats}/15 ausgefüllt\n` +
                     `📝 Outline: ${outline.length} Elemente\n` +
                     `📌 Notizen: ${notes.length}\n` +
                     `🗺️ Story Map: ${storyMap.length} Ereignisse`,
            data: { 
              name: currentProject?.name, 
              sources: sources.length, 
              notes: notes.length,
              scriptLines,
              filledBeats,
              outlineItems: outline.length,
              storyMapEvents: storyMap.length
            }
          };
        }

        case 'get_all_characters': {
          const characters = sources.filter(s => s.type === 'character');
          if (characters.length === 0) {
            return { success: true, message: '👤 Keine Charaktere vorhanden.', data: [] };
          }
          const list = characters.map(c => {
            const preview = c.content.slice(0, 100).replace(/\n/g, ' ');
            return `👤 ${c.title}:\n   ${preview}...`;
          }).join('\n\n');
          return { success: true, message: `👤 ${characters.length} Charaktere:\n\n${list}`, data: characters };
        }

        case 'get_all_locations': {
          const locations = sources.filter(s => s.type === 'location');
          if (locations.length === 0) {
            return { success: true, message: '📍 Keine Orte vorhanden.', data: [] };
          }
          const list = locations.map(l => {
            const preview = l.content.slice(0, 100).replace(/\n/g, ' ');
            return `📍 ${l.title}:\n   ${preview}...`;
          }).join('\n\n');
          return { success: true, message: `📍 ${locations.length} Orte:\n\n${list}`, data: locations };
        }

        case 'search_everything': {
          const query = (params.query as string)?.toLowerCase();
          if (!query) return { success: false, message: 'Kein Suchbegriff angegeben.', error: 'MISSING_PARAM' };
          
          const searchType = (params.type as string) || 'all';
          const results: string[] = [];
          
          // Search sources
          if (searchType === 'all' || searchType === 'sources') {
            sources.forEach(s => {
              if (s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query)) {
                const context = s.content.toLowerCase().indexOf(query);
                const snippet = context >= 0 
                  ? '..."' + s.content.slice(Math.max(0, context - 20), context + query.length + 40) + '..."'
                  : '';
                results.push(`📄 [${s.type}] ${s.title} ${snippet}`);
              }
            });
          }
          
          // Search notes
          if (searchType === 'all' || searchType === 'notes') {
            notes.forEach(n => {
              if ((n.title || '').toLowerCase().includes(query) || n.content.toLowerCase().includes(query)) {
                results.push(`📌 [Notiz] ${n.title || 'Ohne Titel'}`);
              }
            });
          }
          
          // Search outline
          if (searchType === 'all' || searchType === 'outline') {
            const searchOutline = (items: typeof outline, path = ''): void => {
              items.forEach(item => {
                if (item.title.toLowerCase().includes(query) || (item.content || '').toLowerCase().includes(query)) {
                  results.push(`📝 [Outline] ${path}${item.title}`);
                }
                if (item.children) searchOutline(item.children, path + item.title + ' > ');
              });
            };
            searchOutline(outline);
          }
          
          // Search beat sheet
          if (searchType === 'all' || searchType === 'beats') {
            Object.entries(beatSheet).forEach(([key, val]) => {
              if (val?.toLowerCase().includes(query)) {
                results.push(`📋 [Beat] ${key}`);
              }
            });
          }
          
          return { 
            success: true, 
            message: results.length > 0 
              ? `🔍 ${results.length} Treffer für "${params.query}":\n\n${results.join('\n')}`
              : `🔍 Keine Ergebnisse für "${params.query}"`,
            data: results
          };
        }

        default:
          console.warn(`[Tool] Unknown tool: ${toolName}`);
          return { success: true, message: `Tool "${toolName}" nicht implementiert.`, data: params };
      }
    } catch (error) {
      console.error(`[Tool] ${toolName} failed:`, error);
      return { success: false, message: `❌ Fehler bei ${toolName}: ${error}`, error: String(error) };
    }
  };
  return executeTools;
};

// ============================================
// AGENT PROVIDER
// ============================================

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storyContext = useStory();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [state, setState] = useState<AgentState>({
    isActive: false,
    isConnecting: false,
    isListening: false,
    isSpeaking: false,
    currentAction: null,
    lastToolCall: null,
    transcript: [],
    error: null,
    connectionAttempts: 0,
    audioLevel: 0
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueueManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isRunningRef = useRef(false);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const executeToolRef = useRef(createToolExecutor(storyContext, navigate));
  useEffect(() => {
    executeToolRef.current = createToolExecutor(storyContext, navigate);
  }, [storyContext, navigate]);

  const isAvailable = Boolean(storyContext.settings.apiKey);

  const addMessage = useCallback((message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      transcript: [...prev.transcript.slice(-30), {
        ...message,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      }]
    }));
  }, []);

  const cleanup = useCallback(() => {
    console.log('[Agent] Cleanup');
    isRunningRef.current = false;
    
    // Clear keep-alive
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    
    audioQueueRef.current?.stop();
    audioQueueRef.current = null;
    
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (inputCtxRef.current?.state !== 'closed') {
      try { inputCtxRef.current?.close(); } catch {}
    }
    inputCtxRef.current = null;
    if (audioContextRef.current?.state !== 'closed') {
      try { audioContextRef.current?.close(); } catch {}
    }
    audioContextRef.current = null;
    
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch {}
      sessionRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      isConnecting: false,
      isListening: false,
      isSpeaking: false,
      currentAction: null,
      audioLevel: 0
    }));
  }, []);

  const stopAgent = useCallback(() => {
    cleanup();
    addMessage({ role: 'system', content: 'Gestoppt' });
  }, [cleanup, addMessage]);

  const startAgent = useCallback(async () => {
    if (state.isActive || state.isConnecting) return;
    if (!storyContext.settings.apiKey) {
      setState(prev => ({ ...prev, error: 'API Key benötigt' }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null, transcript: [] }));
    addMessage({ role: 'system', content: 'Verbinde...' });

    try {
      // Output audio context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: AUDIO_SAMPLE_RATE_OUTPUT });
      audioContextRef.current = audioCtx;
      audioQueueRef.current = new AudioQueueManager(audioCtx);

      // Input audio context
      const inputCtx = new AudioCtx({ sampleRate: AUDIO_SAMPLE_RATE_INPUT });
      inputCtxRef.current = inputCtx;

      // Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: AUDIO_SAMPLE_RATE_INPUT }
      });
      streamRef.current = stream;

      // Story context for system prompt
      const storyText = storyContext.sources
        .slice(0, 15)
        .map(s => `[${s.type}] ${s.title}: ${s.content.slice(0, 300)}`)
        .join('\n\n');

      const systemPrompt = `${AGENT_SYSTEM_INSTRUCTION}

STORY CONTEXT:
${storyText || 'Leere Story Bible.'}

AKTUELLE SEITE: ${location.pathname}`;

      // Connect to Gemini Live
      const ai = new GoogleGenAI({ apiKey: storyContext.settings.apiKey });
      
      console.log('[Agent] Connecting...');
      
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: 'Aoede'
              } 
            }
          },
          tools: [{ functionDeclarations: AGENT_TOOLS_DECLARATION as any }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            console.log('[Agent] Connected!');
            isRunningRef.current = true;
            setState(prev => ({ 
              ...prev, 
              isActive: true, 
              isConnecting: false, 
              isListening: true 
            }));
            addMessage({ role: 'system', content: 'Verbunden. Sprich jetzt!' });

            // Start audio input
            if (inputCtxRef.current && streamRef.current) {
              const source = inputCtxRef.current.createMediaStreamSource(streamRef.current);
              const processor = inputCtxRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                if (!isRunningRef.current || !sessionRef.current) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = floatTo16BitPCM(inputData);
                const base64 = arrayBufferToBase64(pcmData);
                
                try {
                  sessionRef.current?.sendRealtimeInput({
                    media: { mimeType: 'audio/pcm;rate=16000', data: base64 }
                  });
                } catch (err) {
                  console.error('[Agent] Send error:', err);
                }
              };

              source.connect(processor);
              processor.connect(inputCtxRef.current.destination);
            }
            
            // Start keep-alive to prevent timeout during long speech
            lastActivityRef.current = Date.now();
            keepAliveRef.current = setInterval(() => {
              if (!sessionRef.current || !isRunningRef.current) return;
              const timeSinceActivity = Date.now() - lastActivityRef.current;
              // Send empty audio chunk every 15s to keep connection alive
              if (timeSinceActivity > 15000) {
                console.log('[Agent] Keep-alive ping');
                try {
                  // Send silent audio to keep connection active
                  const silentBuffer = new ArrayBuffer(1024);
                  const silentBase64 = arrayBufferToBase64(silentBuffer);
                  sessionRef.current?.sendRealtimeInput({
                    media: { mimeType: 'audio/pcm;rate=16000', data: silentBase64 }
                  });
                  lastActivityRef.current = Date.now();
                } catch (e) {
                  console.error('[Agent] Keep-alive error:', e);
                }
              }
            }, 10000);
          },

          onmessage: async (msg) => {
            if (!isRunningRef.current) return;
            lastActivityRef.current = Date.now(); // Update activity on every message

            // Transcriptions
            const inputText = msg.serverContent?.inputTranscription?.text?.trim();
            if (inputText) addMessage({ role: 'user', content: inputText });
            
            const outputText = msg.serverContent?.outputTranscription?.text?.trim();
            if (outputText) addMessage({ role: 'agent', content: outputText });

            // Tool calls - PARALLEL EXECUTION
            if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
              const calls = msg.toolCall.functionCalls;
              const toolNames = calls.map(c => c.name).join(', ');
              console.log('[Agent] Executing tools in parallel:', toolNames);
              setState(prev => ({ ...prev, currentAction: `${calls.length} Tools...` }));
              
              // Execute all tools in parallel
              const results = await Promise.all(
                calls.map(async (call) => {
                  const toolName = call.name || 'unknown';
                  const toolArgs = (call.args || {}) as Record<string, unknown>;
                  const toolId = call.id || crypto.randomUUID();
                  
                  console.log('[Agent] Tool:', toolName, toolArgs);
                  const result = await executeToolRef.current(toolName, toolArgs);
                  
                  addMessage({ 
                    role: 'tool', 
                    content: result.message, 
                    toolCall: { name: toolName, params: toolArgs, result } 
                  });
                  
                  return { 
                    id: toolId, 
                    name: toolName, 
                    response: { success: result.success, message: result.message, data: result.data }
                  };
                })
              );
              
              // Send all tool responses at once
              if (sessionRef.current && results.length > 0) {
                sessionRef.current.sendToolResponse({
                  functionResponses: results
                });
              }
              
              setState(prev => ({ ...prev, currentAction: null }));
            }

            // Audio output
            const audioPart = msg.serverContent?.modelTurn?.parts?.[0];
            if (audioPart?.inlineData?.data && audioQueueRef.current) {
              setState(prev => ({ ...prev, isSpeaking: true }));
              try {
                await audioQueueRef.current.playChunk(audioPart.inlineData.data);
              } catch (e) {
                console.error('[Agent] Audio error:', e);
              }
            }

            if (msg.serverContent?.turnComplete) {
              setTimeout(() => {
                if (!audioQueueRef.current?.isPlaying()) {
                  setState(prev => ({ ...prev, isSpeaking: false }));
                }
              }, 500);
            }
            
            if (msg.serverContent?.interrupted) {
              audioQueueRef.current?.stop();
              setState(prev => ({ ...prev, isSpeaking: false }));
            }
          },

          onclose: (event) => {
            console.log('[Agent] Closed:', event);
            if (isRunningRef.current) {
              addMessage({ role: 'system', content: 'Verbindung getrennt' });
              cleanup();
            }
          },

          onerror: (err) => {
            console.error('[Agent] Error:', err);
            setState(prev => ({ ...prev, error: 'Verbindungsfehler' }));
            cleanup();
          }
        }
      });

      sessionRef.current = session;

    } catch (error) {
      console.error('[Agent] Start failed:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen' 
      }));
      cleanup();
    }
  }, [state.isActive, state.isConnecting, storyContext, location, addMessage, cleanup]);

  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  return (
    <AgentContextInstance.Provider value={{ state, startAgent, stopAgent, isAvailable }}>
      {children}
    </AgentContextInstance.Provider>
  );
};

export const useAgent = () => {
  const ctx = useContext(AgentContextInstance);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
};
