import { ScriptElement, LineInfo, ScriptStats, CharacterStats, SceneData } from '../types';
import { PATTERNS, TRANSITIONS, LINES_PER_PAGE, ELEMENT_STYLES } from '../constants';

// ============================================
// LINE ANALYSIS
// ============================================

/**
 * Get information about the current line at cursor position
 */
export function getLineInfo(content: string, cursorPosition: number): LineInfo {
  const lines = content.split('\n');
  let charCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i]?.length ?? 0;
    if (charCount + lineLength >= cursorPosition) {
      const lineText = lines[i] ?? '';
      return {
        lineIndex: i,
        lineText,
        lineStart: charCount,
        lineEnd: charCount + lineLength,
        column: cursorPosition - charCount,
        element: detectElementType(lineText)
      };
    }
    charCount += lineLength + 1;
  }
  
  return { 
    lineIndex: 0, 
    lineText: '', 
    lineStart: 0, 
    lineEnd: 0, 
    column: 0 
  };
}

/**
 * Detect the element type of a line
 */
export function detectElementType(line: string): ScriptElement | undefined {
  const trimmed = line.trim();
  const upper = trimmed.toUpperCase();
  
  // Empty line
  if (!trimmed) return undefined;
  
  // Scene heading
  if (PATTERNS.SCENE_HEADING.test(trimmed)) {
    return 'scene';
  }
  
  // Shot
  if (PATTERNS.SHOT.test(trimmed)) {
    return 'shot';
  }
  
  // Transition
  if (PATTERNS.TRANSITION.test(upper) || TRANSITIONS.some(t => upper === t)) {
    return 'transition';
  }
  
  // Parenthetical
  if (PATTERNS.PARENTHETICAL.test(trimmed)) {
    return 'parenthetical';
  }
  
  // Character name (ALL CAPS, short enough, not a transition)
  if (PATTERNS.CHARACTER_NAME.test(trimmed) && 
      trimmed.length < 40 && 
      trimmed.length > 1 &&
      !TRANSITIONS.some(t => upper.includes(t.replace(':', '')))) {
    return 'character';
  }
  
  // Default to action
  return 'action';
}

// ============================================
// CONTENT PARSING
// ============================================

/**
 * Parse script content and extract scenes
 */
export function parseScenes(content: string, lockedScenes: Set<number> = new Set(), omittedScenes: Set<number> = new Set()): SceneData[] {
  const scenes: SceneData[] = [];
  const lines = content.split('\n');
  let charIndex = 0;
  let sceneNum = 1;
  
  lines.forEach((line, lineNum) => {
    const trimmed = (line ?? '').trim();
    
    if (PATTERNS.SCENE_HEADING.test(trimmed)) {
      // Extract existing scene number if present
      const match = trimmed.match(/^(\d+[A-Z]?)\.?\s+/);
      const existingNum = match ? match[1] : undefined;
      
      scenes.push({
        id: `scene-${lineNum}`,
        index: charIndex,
        text: trimmed.replace(/^\d+[A-Z]?\.?\s+/, ''), // Remove scene number from display
        lineNumber: lineNum + 1,
        sceneNumber: existingNum || String(sceneNum++),
        locked: lockedScenes.has(lineNum),
        omitted: omittedScenes.has(lineNum),
      });
    }
    
    charIndex += (line?.length ?? 0) + 1;
  });
  
  return scenes;
}

/**
 * Parse script content and extract character statistics
 */
export function parseCharacters(content: string): CharacterStats[] {
  const charMap = new Map<string, CharacterStats>();
  const lines = content.split('\n');
  
  lines.forEach((line, lineNum) => {
    const trimmed = (line ?? '').trim();
    const match = trimmed.match(PATTERNS.CHARACTER_NAME);
    
    if (match && match[1]) {
      const name = match[1].trim();
      
      // Skip if it's a transition
      if (TRANSITIONS.some(t => name === t.replace(':', ''))) return;
      if (name.length > 40 || name.length < 2) return;
      
      if (!charMap.has(name)) {
        charMap.set(name, {
          name,
          dialogueCount: 0,
          wordCount: 0,
          firstAppearance: lineNum + 1,
          lastAppearance: lineNum + 1,
          scenes: []
        });
      }
      
      const stats = charMap.get(name)!;
      stats.dialogueCount++;
      stats.lastAppearance = lineNum + 1;
      
      // Count words in following dialogue
      let i = lineNum + 1;
      while (i < lines.length) {
        const nextLine = (lines[i] ?? '').trim();
        if (!nextLine) break;
        if (PATTERNS.CHARACTER_NAME.test(nextLine)) break;
        if (PATTERNS.SCENE_HEADING.test(nextLine)) break;
        
        // Skip parentheticals but count dialogue
        if (!PATTERNS.PARENTHETICAL.test(nextLine)) {
          stats.wordCount += nextLine.split(/\s+/).filter(Boolean).length;
        }
        i++;
      }
    }
  });
  
  return Array.from(charMap.values()).sort((a, b) => b.dialogueCount - a.dialogueCount);
}

// ============================================
// STATISTICS
// ============================================

/**
 * Calculate script statistics
 */
export function calculateStats(content: string): ScriptStats {
  const text = content.trim();
  
  if (!text) {
    return {
      words: 0,
      chars: 0,
      pages: 0,
      readTime: 0,
      dialoguePercent: 0,
      sceneCount: 0,
      characterCount: 0
    };
  }
  
  const lines = text.split('\n');
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const pages = Math.ceil(lines.length / LINES_PER_PAGE);
  const readTime = Math.ceil(pages); // 1 page = ~1 min screen time
  
  // Count dialogue lines vs total
  let dialogueLines = 0;
  let inDialogue = false;
  
  lines.forEach(line => {
    const trimmed = (line ?? '').trim();
    const element = detectElementType(trimmed);
    
    if (element === 'character') {
      inDialogue = true;
    } else if (element === 'scene' || element === 'action' || element === 'transition') {
      inDialogue = false;
    } else if (inDialogue && element !== 'parenthetical' && trimmed) {
      dialogueLines++;
    }
  });
  
  const totalContentLines = lines.filter(l => (l ?? '').trim()).length;
  const dialoguePercent = totalContentLines > 0 
    ? Math.round((dialogueLines / totalContentLines) * 100) 
    : 0;
  
  const scenes = parseScenes(content);
  const characters = parseCharacters(content);
  
  return {
    words,
    chars,
    pages,
    readTime,
    dialoguePercent,
    sceneCount: scenes.length,
    characterCount: characters.length
  };
}

// ============================================
// TEXT FORMATTING
// ============================================

/**
 * Format text for a specific element type
 */
export function formatForElement(text: string, element: ScriptElement): string {
  const style = ELEMENT_STYLES[element];
  let formatted = text;
  
  if (style.uppercase) {
    formatted = formatted.toUpperCase();
  }
  
  return formatted;
}

/**
 * Get next element after Enter key based on context
 */
export function getNextElement(currentElement: ScriptElement, currentLine: string): ScriptElement {
  const trimmed = currentLine.trim();
  
  // Empty line - stay on action
  if (!trimmed) return 'action';
  
  // After character name, go to dialogue
  if (currentElement === 'character' && PATTERNS.CHARACTER_NAME.test(trimmed)) {
    return 'dialogue';
  }
  
  // After dialogue, go back to character (for next speaker)
  if (currentElement === 'dialogue' && trimmed) {
    return 'character';
  }
  
  // Use default next element
  return ELEMENT_STYLES[currentElement].nextElement || 'action';
}

/**
 * Get element to cycle to on Tab
 */
export function getTabCycleElement(currentElement: ScriptElement, currentLine: string): ScriptElement {
  const trimmed = currentLine.trim();
  
  if (trimmed === '') {
    // Empty line: cycle through common elements
    const cycle: ScriptElement[] = ['action', 'character', 'scene', 'transition'];
    const currentIdx = cycle.indexOf(currentElement);
    return cycle[(currentIdx + 1) % cycle.length] ?? 'action';
  }
  
  // Non-empty: use next element
  return ELEMENT_STYLES[currentElement].nextElement || 'action';
}

// ============================================
// AUTO-COMPLETE HELPERS
// ============================================

/**
 * Get auto-complete suggestions for characters
 */
export function getCharacterSuggestions(input: string, existingCharacters: string[]): string[] {
  const upper = input.toUpperCase();
  return existingCharacters
    .filter(c => c.startsWith(upper) && c !== upper)
    .slice(0, 8);
}

/**
 * Get auto-complete suggestions for scene headings
 */
export function getSceneSuggestions(input: string): string[] {
  const upper = input.toUpperCase();
  const prefixes = ['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. '];
  return prefixes.filter(p => p.startsWith(upper) || upper.startsWith(p.trim()));
}

/**
 * Get auto-complete suggestions for transitions
 */
export function getTransitionSuggestions(input: string): string[] {
  const upper = input.toUpperCase();
  return TRANSITIONS.filter(t => 
    t.startsWith(upper) || 
    upper.includes(t.split(' ')[0] ?? '')
  ).slice(0, 8);
}

// ============================================
// PAGE BREAK UTILITIES
// ============================================

/**
 * Calculate which page a line is on
 */
export function getPageNumber(lineIndex: number): number {
  return Math.floor(lineIndex / LINES_PER_PAGE) + 1;
}

/**
 * Check if a line is at a page break
 */
export function isPageBreak(lineIndex: number): boolean {
  return (lineIndex + 1) % LINES_PER_PAGE === 0;
}

/**
 * Find (MORE) and (CONT'D) insertion points
 */
export function findContinuedDialogue(content: string): { moreLines: number[]; contdLines: number[] } {
  const lines = content.split('\n');
  const moreLines: number[] = [];
  const contdLines: number[] = [];
  
  let inDialogue = false;
  let currentCharacter = '';
  let dialogueStartLine = 0;
  
  lines.forEach((line, i) => {
    const trimmed = (line ?? '').trim();
    const element = detectElementType(trimmed);
    
    if (element === 'character') {
      const match = trimmed.match(PATTERNS.CHARACTER_NAME);
      if (match) {
        // Check if this is a continuation of previous character
        if (inDialogue && match[1] === currentCharacter) {
          contdLines.push(i);
        }
        currentCharacter = match[1] ?? '';
        dialogueStartLine = i;
        inDialogue = true;
      }
    } else if (element === 'dialogue' || element === 'parenthetical') {
      // Check if dialogue crosses page break
      if (isPageBreak(i) && inDialogue && i > dialogueStartLine + 1) {
        moreLines.push(i - 1);
        contdLines.push(i);
      }
    } else if (element === 'scene' || element === 'action' || element === 'transition') {
      inDialogue = false;
      currentCharacter = '';
    }
  });
  
  return { moreLines, contdLines };
}

