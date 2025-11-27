import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStory } from '../context/StoryContext';
import { generateDialogue, continueWriting, rewriteText } from '../services/geminiService';
import { exportToPDF, exportToFountain, exportToFDX } from '../services/exportService';
import { 
  CheckCircle, 
  Film, 
  Download,
  Type,
  User,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Wand2,
  PenLine,
  Search,
  Replace,
  X,
  ChevronDown,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  BookOpen,
  Lock,
  StickyNote,
  List,
  Play,
  Pause,
  Eye,
  Bookmark,
  Users,
  FileEdit,
  AlignLeft,
  AlignCenter,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================
// TYPES
// ============================================

type ScriptElement = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot' | 'general';
type ViewMode = 'script' | 'index-cards' | 'outline' | 'split';
type RevisionColor = 'white' | 'blue' | 'pink' | 'yellow' | 'green' | 'goldenrod' | 'buff' | 'salmon' | 'cherry';

interface ScriptNote {
  id: string;
  lineNumber: number;
  text: string;
  resolved: boolean;
  createdAt: number;
}

interface SceneData {
  index: number;
  text: string;
  lineNumber: number;
  sceneNumber?: string;
  locked: boolean;
  omitted: boolean;
  color?: string;
}

interface CharacterStats {
  name: string;
  dialogueCount: number;
  wordCount: number;
  firstAppearance: number;
}

interface ElementStyle {
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  className: string;
  prefix?: string;
  marginLeft?: string;
  marginRight?: string;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
  nextElement?: ScriptElement;
}

// ============================================
// CONSTANTS
// ============================================

const ELEMENT_STYLES: Record<ScriptElement, ElementStyle> = {
  scene: {
    label: 'Scene Heading',
    icon: <Film size={14} />,
    shortcut: '⌘1',
    className: 'uppercase font-bold tracking-wide',
    prefix: 'INT. ',
    uppercase: true,
    nextElement: 'action'
  },
  action: {
    label: 'Action',
    icon: <Type size={14} />,
    shortcut: '⌘2',
    className: '',
    nextElement: 'action'
  },
  character: {
    label: 'Character',
    icon: <User size={14} />,
    shortcut: '⌘3',
    className: 'uppercase',
    marginLeft: '37%',
    uppercase: true,
    nextElement: 'dialogue'
  },
  dialogue: {
    label: 'Dialogue',
    icon: <MessageSquare size={14} />,
    shortcut: '⌘4',
    className: '',
    marginLeft: '17%',
    marginRight: '25%',
    nextElement: 'character'
  },
  parenthetical: {
    label: 'Parenthetical',
    icon: <AlignCenter size={14} />,
    shortcut: '⌘5',
    className: 'italic',
    marginLeft: '27%',
    marginRight: '35%',
    nextElement: 'dialogue'
  },
  transition: {
    label: 'Transition',
    icon: <ArrowRight size={14} />,
    shortcut: '⌘6',
    className: 'uppercase',
    align: 'right',
    uppercase: true,
    nextElement: 'scene'
  },
  shot: {
    label: 'Shot',
    icon: <Eye size={14} />,
    shortcut: '⌘7',
    className: 'uppercase',
    uppercase: true,
    nextElement: 'action'
  },
  general: {
    label: 'General',
    icon: <AlignLeft size={14} />,
    shortcut: '⌘8',
    className: '',
    nextElement: 'general'
  }
};

const TRANSITIONS = ['CUT TO:', 'DISSOLVE TO:', 'FADE IN:', 'FADE OUT.', 'FADE TO BLACK.', 'SMASH CUT TO:', 'MATCH CUT TO:', 'JUMP CUT TO:', 'TIME CUT:', 'IRIS IN:', 'IRIS OUT:'];
const SCENE_PREFIXES = ['INT. ', 'EXT. ', 'INT./EXT. ', 'I/E. ', 'INT ', 'EXT '];

const REVISION_COLORS: Record<RevisionColor, { bg: string; text: string; label: string }> = {
  white: { bg: 'bg-white', text: 'text-stone-900', label: 'White (Original)' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'Blue (1st Revision)' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-900', label: 'Pink (2nd Revision)' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'Yellow (3rd Revision)' },
  green: { bg: 'bg-green-100', text: 'text-green-900', label: 'Green (4th Revision)' },
  goldenrod: { bg: 'bg-amber-100', text: 'text-amber-900', label: 'Goldenrod (5th Revision)' },
  buff: { bg: 'bg-orange-100', text: 'text-orange-900', label: 'Buff (6th Revision)' },
  salmon: { bg: 'bg-red-100', text: 'text-red-900', label: 'Salmon (7th Revision)' },
  cherry: { bg: 'bg-rose-200', text: 'text-rose-900', label: 'Cherry (8th Revision)' },
};

// ============================================
// MAIN COMPONENT
// ============================================

const ScriptEditor: React.FC = () => {
  const { 
    sources, 
    updateSource, 
    addSource, 
    theme, 
    settings
  } = useStory();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const activeScriptSource = sources.find(s => s.type === 'script');
  
  // Core state
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentElement, setCurrentElement] = useState<ScriptElement>('action');
  
  // View mode
  const [showNavigator, setShowNavigator] = useState(true);
  const [navigatorTab, setNavigatorTab] = useState<'scenes' | 'characters' | 'notes' | 'bookmarks'>('scenes');
  
  // UI state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [showElementMenu, setShowElementMenu] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTitle, setExportTitle] = useState('Untitled Screenplay');
  const [exportAuthor, setExportAuthor] = useState('');
  
  // Revision mode
  const [revisionMode, setRevisionMode] = useState(false);
  const [currentRevisionColor, setCurrentRevisionColor] = useState<RevisionColor>('blue');
  const [showRevisionMenu, setShowRevisionMenu] = useState(false);
  const [revisionMarks, setRevisionMarks] = useState<Map<number, RevisionColor>>(new Map());
  
  // Scene management
  const [lockedScenes, setLockedScenes] = useState<Set<number>>(new Set());
  const [omittedScenes, setOmittedScenes] = useState<Set<number>>(new Set());
  const [sceneNumbers] = useState<Map<number, string>>(new Map());
  const [autoSceneNumbers] = useState(true);
  
  // Notes
  const [notes, setNotes] = useState<ScriptNote[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  
  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  
  // AI state
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [, setAIAction] = useState<string | null>(null);
  
  // Selection state
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const selectedText = content.substring(selectionStart, selectionEnd);
  
  // Auto-complete state
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [autoCompleteType, setAutoCompleteType] = useState<'character' | 'scene' | 'transition'>('character');
  
  // Table Read state
  const [isTableReading, setIsTableReading] = useState(false);

  const isDark = theme === 'dark';

  // ============================================
  // LOAD CONTENT
  // ============================================
  
  useEffect(() => {
    if (activeScriptSource) {
      setContent(activeScriptSource.content);
    }
  }, [activeScriptSource?.id]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  // Stats
  const stats = useMemo(() => {
    const text = content.trim();
    if (!text) return { words: 0, chars: 0, pages: 0, readTime: 0, dialoguePercent: 0 };
    
    const words = text.split(/\s+/).length;
    const chars = text.length;
    const lines = text.split('\n').length;
    // Standard: 56 lines per page in screenplay format
    const pages = Math.ceil(lines / 56);
    const readTime = Math.ceil(pages); // 1 page = ~1 min screen time
    
    // Calculate dialogue percentage
    const dialogueLines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.match(/^(INT\.|EXT\.|INT\/EXT|I\/E\.)/) && 
             !trimmed.match(/^[A-Z][A-Z\s]+$/) &&
             !TRANSITIONS.some(t => trimmed.includes(t));
    }).length;
    const dialoguePercent = lines > 0 ? Math.round((dialogueLines / lines) * 100) : 0;
    
    return { words, chars, pages, readTime, dialoguePercent };
  }, [content]);

  // Scene detection with numbers
  const scenes = useMemo((): SceneData[] => {
    const regex = /^(?:(\d+[A-Z]?)\.?\s+)?(?:INT\.|EXT\.|INT\/EXT|I\/E\.|INT |EXT |I\/E ).+$/gim;
    const matches: SceneData[] = [];
    const lines = content.split('\n');
    let charIndex = 0;
    let autoNum = 1;
    
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();
      regex.lastIndex = 0;
      const match = regex.exec(trimmed);
      if (match || /^(?:INT\.|EXT\.|INT\/EXT|I\/E\.)/.test(trimmed.toUpperCase())) {
        const sceneNum = sceneNumbers.get(lineNum) || (autoSceneNumbers ? String(autoNum++) : undefined);
        matches.push({
          index: charIndex,
          text: trimmed,
          lineNumber: lineNum + 1,
          sceneNumber: sceneNum,
          locked: lockedScenes.has(lineNum),
          omitted: omittedScenes.has(lineNum)
        });
      }
      charIndex += line.length + 1;
    });
    
    return matches;
  }, [content, lockedScenes, omittedScenes, sceneNumbers, autoSceneNumbers]);

  // Character detection with stats
  const characterStats = useMemo((): CharacterStats[] => {
    const charMap = new Map<string, CharacterStats>();
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();
      // Character name pattern: ALL CAPS, optionally with (V.O.), (O.S.), etc.
      const charMatch = trimmed.match(/^([A-Z][A-Z\s.']+)(?:\s*\(.*\))?$/);
      if (charMatch && charMatch[1]) {
        const name = charMatch[1].trim();
        if (!TRANSITIONS.includes(name) && name.length < 30 && name.length > 1) {
          if (!charMap.has(name)) {
            charMap.set(name, {
              name,
              dialogueCount: 0,
              wordCount: 0,
              firstAppearance: lineNum + 1
            });
          }
          const charStats = charMap.get(name);
          if (charStats) {
            charStats.dialogueCount++;
            
            // Count words in following dialogue
            let i = lineNum + 1;
            while (i < lines.length) {
              const nextLine = lines[i]?.trim() || '';
              if (!nextLine || nextLine.match(/^[A-Z][A-Z\s.']+(?:\s*\(.*\))?$/)) break;
              if (!nextLine.startsWith('(') || !nextLine.endsWith(')')) {
                charStats.wordCount += nextLine.split(/\s+/).length;
              }
              i++;
            }
          }
        }
      }
    });
    
    return Array.from(charMap.values()).sort((a, b) => b.dialogueCount - a.dialogueCount);
  }, [content]);

  const characters = useMemo(() => characterStats.map(c => c.name), [characterStats]);

  // Get current line info
  const currentLineInfo = useMemo((): { lineIndex: number; lineText: string; lineStart: number; lineEnd: number; column: number } => {
    const lines = content.split('\n');
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i]?.length ?? 0;
      if (charCount + lineLength >= cursorPosition) {
        return {
          lineIndex: i,
          lineText: lines[i] ?? '',
          lineStart: charCount,
          lineEnd: charCount + lineLength,
          column: cursorPosition - charCount
        };
      }
      charCount += lineLength + 1;
    }
    return { lineIndex: 0, lineText: '', lineStart: 0, lineEnd: 0, column: 0 };
  }, [content, cursorPosition]);

  // ============================================
  // ELEMENT DETECTION
  // ============================================

  useEffect(() => {
    const lineText = currentLineInfo.lineText || '';
    const line = lineText.trim().toUpperCase();
    
    if (/^(INT\.|EXT\.|INT\/EXT|I\/E\.)/.test(line)) {
      setCurrentElement('scene');
    } else if (/^[A-Z][A-Z\s.']+$/.test(line) && line.length < 30 && line.length > 1) {
      setCurrentElement('character');
    } else if (/^\(.*\)$/.test(lineText.trim())) {
      setCurrentElement('parenthetical');
    } else if (TRANSITIONS.some(t => line.includes(t))) {
      setCurrentElement('transition');
    } else if (line.startsWith('ANGLE ON') || line.startsWith('CLOSE ON') || line.startsWith('POV') || line.startsWith('INSERT')) {
      setCurrentElement('shot');
    }
  }, [currentLineInfo]);

  // ============================================
  // AUTO-COMPLETE
  // ============================================

  useEffect(() => {
    const line = currentLineInfo.lineText;
    const lineUpper = line.toUpperCase().trim();
    
    // Check for character auto-complete (after empty line or at start)
    if (lineUpper.length >= 2 && lineUpper === lineUpper.toUpperCase() && !/\s/.test(lineUpper.slice(-1))) {
      const matches = characters.filter(c => c.startsWith(lineUpper));
      if (matches.length > 0 && matches[0] !== lineUpper) {
        setAutoCompleteOptions(matches);
        setAutoCompleteType('character');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }
    
    // Check for scene heading auto-complete
    if (lineUpper.startsWith('INT') || lineUpper.startsWith('EXT') || lineUpper.startsWith('I/E')) {
      const suggestions = SCENE_PREFIXES.filter(p => p.startsWith(lineUpper) || lineUpper.startsWith(p.trim()));
      if (suggestions.length > 0 && !SCENE_PREFIXES.some(p => lineUpper.startsWith(p))) {
        setAutoCompleteOptions(suggestions);
        setAutoCompleteType('scene');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }
    
    // Check for transition auto-complete
    if (lineUpper.endsWith(':') || lineUpper.includes('CUT') || lineUpper.includes('FADE') || lineUpper.includes('DISSOLVE')) {
      const matches = TRANSITIONS.filter(t => t.startsWith(lineUpper) || lineUpper.includes(t.split(' ')[0]));
      if (matches.length > 0) {
        setAutoCompleteOptions(matches);
        setAutoCompleteType('transition');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }
    
    setShowAutoComplete(false);
  }, [currentLineInfo.lineText, characters]);

  const applyAutoComplete = (option: string) => {
    const lines = content.split('\n');
    lines[currentLineInfo.lineIndex] = option + (autoCompleteType === 'scene' ? '' : '');
    const newContent = lines.join('\n');
    setContent(newContent);
    setShowAutoComplete(false);
    
    // Move cursor to end of line
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = currentLineInfo.lineStart + option.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // ============================================
  // SMART TAB HANDLING (Final Draft style)
  // ============================================

  const handleTab = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    const line = currentLineInfo.lineText.trim();
    
    // Determine next element based on context
    let nextElement: ScriptElement = 'action';
    
    if (line === '') {
      // Empty line: cycle through common elements
      const cycle: ScriptElement[] = ['action', 'character', 'scene', 'transition'];
      const currentIdx = cycle.indexOf(currentElement);
      nextElement = cycle[(currentIdx + 1) % cycle.length];
    } else {
      // Non-empty line: use the defined next element
      nextElement = ELEMENT_STYLES[currentElement].nextElement || 'action';
    }
    
    setCurrentElement(nextElement);
    
    // Insert a new line if needed
    if (line !== '') {
      const newContent = content.substring(0, cursorPosition) + '\n' + content.substring(cursorPosition);
      setContent(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
        }
      }, 0);
    }
  }, [currentLineInfo, currentElement, content, cursorPosition]);

  // ============================================
  // KEY HANDLERS
  // ============================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto-complete navigation
    if (showAutoComplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutoCompleteIndex(i => Math.min(i + 1, autoCompleteOptions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutoCompleteIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyAutoComplete(autoCompleteOptions[autoCompleteIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutoComplete(false);
        return;
      }
    }
    
    // Tab for element cycling
    if (e.key === 'Tab') {
      handleTab(e);
      return;
    }
    
    // Enter handling for smart formatting
    if (e.key === 'Enter') {
      const line = currentLineInfo.lineText.trim();
      
      // After character name, prepare for dialogue
      if (currentElement === 'character' && line.match(/^[A-Z][A-Z\s.']+$/)) {
        setCurrentElement('dialogue');
      }
      // After dialogue, prepare for next character or action
      else if (currentElement === 'dialogue' && line) {
        setCurrentElement('character');
      }
      // After parenthetical, back to dialogue
      else if (currentElement === 'parenthetical') {
        setCurrentElement('dialogue');
      }
      // After scene heading, action
      else if (currentElement === 'scene') {
        setCurrentElement('action');
      }
      // After transition, scene heading
      else if (currentElement === 'transition') {
        setCurrentElement('scene');
      }
      
      // Handle revision marks
      if (revisionMode) {
        setRevisionMarks(prev => {
          const newMarks = new Map(prev);
          newMarks.set(currentLineInfo.lineIndex + 1, currentRevisionColor);
          return newMarks;
        });
      }
    }
    
    // Parenthetical shortcut
    if (e.key === '(' && currentElement === 'dialogue') {
      e.preventDefault();
      const pos = cursorPosition;
      const newContent = content.substring(0, pos) + '()' + content.substring(pos);
      setContent(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(pos + 1, pos + 1);
        }
      }, 0);
      setCurrentElement('parenthetical');
      return;
    }
  }, [showAutoComplete, autoCompleteOptions, autoCompleteIndex, handleTab, currentLineInfo, currentElement, cursorPosition, content, revisionMode, currentRevisionColor]);

  // ============================================
  // SAVE HANDLING
  // ============================================

  const handleSave = useCallback(() => {
    if (activeScriptSource) {
      updateSource(activeScriptSource.id, { content });
    } else if (content.trim()) {
      addSource({
        title: exportTitle || "Untitled Script",
        content: content,
        type: "script",
        tags: [],
      });
    }
  }, [activeScriptSource, content, updateSource, addSource, exportTitle]);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave) return;
    const timer = setTimeout(() => {
      if (activeScriptSource && activeScriptSource.content !== content) {
        handleSave();
      } else if (!activeScriptSource && content.trim()) {
        handleSave();
      }
    }, settings.autoSaveInterval * 1000);
    return () => clearTimeout(timer);
  }, [content, activeScriptSource, settings.autoSave, settings.autoSaveInterval, handleSave]);

  // ============================================
  // ELEMENT INSERTION
  // ============================================

  const insertElement = (element: ScriptElement) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const currentLineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLineEnd = content.indexOf('\n', start);
    const actualEnd = currentLineEnd === -1 ? content.length : currentLineEnd;
    
    let prefix = ELEMENT_STYLES[element].prefix || '';
    
    if (prefix) {
      const newContent = content.substring(0, currentLineStart) + prefix + content.substring(actualEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(currentLineStart + prefix.length, currentLineStart + prefix.length);
      }, 0);
    }
    
    setCurrentElement(element);
    setShowElementMenu(false);
  };

  // ============================================
  // SCENE MANAGEMENT
  // ============================================

  const toggleSceneLock = (lineNumber: number) => {
    setLockedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  };

  const toggleSceneOmit = (lineNumber: number) => {
    setOmittedScenes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  };

  // ============================================
  // NOTES
  // ============================================

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const note: ScriptNote = {
      id: crypto.randomUUID(),
      lineNumber: currentLineInfo.lineIndex + 1,
      text: newNoteText,
      resolved: false,
      createdAt: Date.now()
    };
    setNotes(prev => [...prev, note]);
    setNewNoteText('');
    setShowNoteInput(false);
  };

  const toggleNoteResolved = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // ============================================
  // BOOKMARKS
  // ============================================

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const newSet = new Set(prev);
      const line = currentLineInfo.lineIndex;
      if (newSet.has(line)) {
        newSet.delete(line);
      } else {
        newSet.add(line);
      }
      return newSet;
    });
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const scrollToLine = (lineNumber: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const lines = content.split('\n');
    let charIndex = 0;
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      charIndex += lines[i].length + 1;
    }
    
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);
    
    // Calculate scroll position
    const lineHeight = 24;
    const scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    if (editorContainerRef.current) {
      editorContainerRef.current.scrollTop = scrollTop;
    }
  };

  // ============================================
  // FIND & REPLACE
  // ============================================

  const handleFind = () => {
    if (!findText) return;
    const index = content.toLowerCase().indexOf(findText.toLowerCase(), cursorPosition);
    if (index !== -1) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(index, index + findText.length);
        setCursorPosition(index + findText.length);
      }
    }
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    setContent(content.replace(regex, replaceText));
  };

  // ============================================
  // ANALYSIS
  // ============================================

  const runAnalysis = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeScriptTension(content);
      setAnalysis(result);
      setLastAnalyzedContent(content);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================
  // AI FUNCTIONS
  // ============================================

  const handleAIContinue = async () => {
    setIsAIWorking(true);
    setAIAction('continue');
    try {
      const result = await continueWriting(content, sources);
      if (result) {
        setContent(content + '\n\n' + result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  };

  const handleAIRewrite = async () => {
    if (!selectedText) return;
    setIsAIWorking(true);
    setAIAction('rewrite');
    try {
      const result = await rewriteText(selectedText, 'screenplay');
      if (result) {
        const newContent = content.substring(0, selectionStart) + result + content.substring(selectionEnd);
        setContent(newContent);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  };

  const handleAIDialogue = async () => {
    setIsAIWorking(true);
    setAIAction('dialogue');
    try {
      const character = characters[0] || 'CHARACTER';
      const result = await generateDialogue(character, 'a tense confrontation scene', sources);
      if (result) {
        const dialogueBlock = `\n\n${character}\n${result}\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const pos = textarea.selectionStart;
          setContent(content.substring(0, pos) + dialogueBlock + content.substring(pos));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  };

  // ============================================
  // TABLE READ
  // ============================================

  const startTableRead = () => {
    setIsTableReading(true);
    setTableReadLine(0);
    // TODO: Implement text-to-speech with character voices
  };

  const stopTableRead = () => {
    setIsTableReading(false);
    setTableReadLine(0);
  };

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setShowFindReplace(!showFindReplace);
            break;
          case 'b':
            e.preventDefault();
            toggleBookmark();
            break;
          case '1': e.preventDefault(); insertElement('scene'); break;
          case '2': e.preventDefault(); insertElement('action'); break;
          case '3': e.preventDefault(); insertElement('character'); break;
          case '4': e.preventDefault(); insertElement('dialogue'); break;
          case '5': e.preventDefault(); insertElement('parenthetical'); break;
          case '6': e.preventDefault(); insertElement('transition'); break;
          case '7': e.preventDefault(); insertElement('shot'); break;
        }
      }
      if (e.key === 'Escape') {
        setShowFindReplace(false);
        setShowElementMenu(false);
        setShowAIMenu(false);
        setFocusMode(false);
        setShowAutoComplete(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showFindReplace]);

  // ============================================
  // STYLING
  // ============================================

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-[12px]';
      case 'large': return 'text-[15px]';
      default: return 'text-[13px]';
    }
  };

  const getLineStyle = (lineIndex: number): React.CSSProperties => {
    const style = ELEMENT_STYLES[currentElement];
    const line = content.split('\n')[lineIndex] || '';
    const trimmed = line.trim().toUpperCase();
    
    // Detect element type for this specific line
    let marginLeft = '0';
    let marginRight = '0';
    let textAlign: 'left' | 'center' | 'right' = 'left';
    
    if (/^(INT\.|EXT\.|INT\/EXT|I\/E\.)/.test(trimmed)) {
      // Scene heading
    } else if (/^[A-Z][A-Z\s.']+(?:\s*\(.*\))?$/.test(trimmed) && !TRANSITIONS.includes(trimmed)) {
      marginLeft = '37%';
    } else if (TRANSITIONS.some(t => trimmed.includes(t))) {
      textAlign = 'right';
    }
    
    return { marginLeft, marginRight, textAlign };
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn("flex h-full gap-3", focusMode && "fixed inset-0 z-50 p-4 bg-stone-950")}>
      {/* Navigator Panel */}
      {showNavigator && !focusMode && (
        <div className={cn(
          "w-56 flex flex-col h-full rounded-xl border overflow-hidden shrink-0",
          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
        )}>
          {/* Navigator Tabs */}
          <div className={cn(
            "h-10 flex items-center border-b shrink-0",
            isDark ? 'border-stone-800' : 'border-stone-100'
          )}>
            {(['scenes', 'characters', 'notes', 'bookmarks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setNavigatorTab(tab)}
                className={cn(
                  "flex-1 h-full flex items-center justify-center transition-colors",
                  navigatorTab === tab
                    ? isDark ? 'text-white bg-stone-800' : 'text-stone-900 bg-stone-100'
                    : isDark ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'
                )}
              >
                {tab === 'scenes' && <Film size={14} />}
                {tab === 'characters' && <Users size={14} />}
                {tab === 'notes' && <StickyNote size={14} />}
                {tab === 'bookmarks' && <Bookmark size={14} />}
              </button>
            ))}
          </div>
          
          {/* Navigator Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Scenes Tab */}
            {navigatorTab === 'scenes' && (
              <div className="space-y-0.5">
                {scenes.length === 0 ? (
                  <div className={cn("text-center py-8", isDark ? 'text-stone-600' : 'text-stone-400')}>
                    <Film size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No scenes yet</p>
                    <p className="text-[10px] mt-1 opacity-60">Start with INT. or EXT.</p>
                  </div>
                ) : (
                  scenes.map((scene, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToLine(scene.lineNumber)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg transition-all group",
                        scene.omitted && 'opacity-40',
                        isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-mono min-w-[1.5rem]",
                          isDark ? 'text-stone-600' : 'text-stone-400'
                        )}>
                          {scene.sceneNumber || i + 1}
                        </span>
                        {scene.locked && <Lock size={10} className="text-amber-500" />}
                        <span className={cn(
                          "text-[11px] font-medium truncate flex-1",
                          scene.omitted && 'line-through',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}>
                          {scene.text.replace(/^\d+\.?\s*/, '')}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            
            {/* Characters Tab */}
            {navigatorTab === 'characters' && (
              <div className="space-y-1">
                {characterStats.length === 0 ? (
                  <div className={cn("text-center py-8", isDark ? 'text-stone-600' : 'text-stone-400')}>
                    <Users size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No characters yet</p>
                  </div>
                ) : (
                  characterStats.map((char, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded-lg",
                        isDark ? 'bg-stone-800/50' : 'bg-stone-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-medium",
                          isDark ? 'text-white' : 'text-stone-900'
                        )}>
                          {char.name}
                        </span>
                        <span className={cn(
                          "text-[10px] font-mono",
                          isDark ? 'text-stone-500' : 'text-stone-400'
                        )}>
                          {char.dialogueCount} lines
                        </span>
                      </div>
                      <div className={cn(
                        "text-[10px] mt-1",
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      )}>
                        {char.wordCount} words • First: L{char.firstAppearance}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Notes Tab */}
            {navigatorTab === 'notes' && (
              <div className="space-y-1">
                <button
                  onClick={() => setShowNoteInput(true)}
                  className={cn(
                    "w-full p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                    isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  )}
                >
                  <Plus size={12} />
                  Add Note
                </button>
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={cn(
                      "p-2 rounded-lg group",
                      note.resolved ? 'opacity-50' : '',
                      isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleNoteResolved(note.id)}>
                        {note.resolved ? (
                          <CheckCircle size={12} className="text-green-500 mt-0.5" />
                        ) : (
                          <StickyNote size={12} className="text-amber-500 mt-0.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[11px]",
                          note.resolved && 'line-through',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}>
                          {note.text}
                        </p>
                        <button
                          onClick={() => scrollToLine(note.lineNumber)}
                          className={cn(
                            "text-[10px] mt-1",
                            isDark ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'
                          )}
                        >
                          Line {note.lineNumber}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Bookmarks Tab */}
            {navigatorTab === 'bookmarks' && (
              <div className="space-y-0.5">
                {bookmarks.size === 0 ? (
                  <div className={cn("text-center py-8", isDark ? 'text-stone-600' : 'text-stone-400')}>
                    <Bookmark size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No bookmarks</p>
                    <p className="text-[10px] mt-1 opacity-60">Press ⌘B to bookmark</p>
                  </div>
                ) : (
                  Array.from(bookmarks).sort((a, b) => a - b).map(lineNum => {
                    const lines = content.split('\n');
                    const lineText = lines[lineNum] || '';
                    return (
                      <button
                        key={lineNum}
                        onClick={() => scrollToLine(lineNum + 1)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg transition-all flex items-center gap-2",
                          isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                        )}
                      >
                        <Bookmark size={12} className="text-blue-500 shrink-0" />
                        <span className={cn(
                          "text-[11px] truncate",
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}>
                          {lineText.trim() || `Line ${lineNum + 1}`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className={cn(
        "flex-1 flex flex-col h-full rounded-xl border overflow-hidden",
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
      )}>
        
        {/* Toolbar */}
        <div className={cn(
          "h-11 flex items-center justify-between px-3 border-b shrink-0 gap-2",
          isDark ? 'border-stone-800' : 'border-stone-100'
        )}>
          {/* Left: Element Selector & Actions */}
          <div className="flex items-center gap-1">
            {/* Navigator Toggle */}
            <button
              onClick={() => setShowNavigator(!showNavigator)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                showNavigator
                  ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
                  : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Toggle Navigator"
            >
              <List size={14} />
            </button>
            
            <div className={cn("w-px h-5 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

            {/* Element Type Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowElementMenu(!showElementMenu)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors min-w-[120px]",
                  isDark 
                    ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                {ELEMENT_STYLES[currentElement].icon}
                {ELEMENT_STYLES[currentElement].label}
                <ChevronDown size={12} className="ml-auto" />
              </button>
              
              {showElementMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowElementMenu(false)} />
                  <div className={cn(
                    "absolute top-full left-0 mt-1 w-56 rounded-xl shadow-xl z-50 border overflow-hidden",
                    isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                  )}>
                    {(Object.entries(ELEMENT_STYLES) as [ScriptElement, ElementStyle][]).map(([key, style]) => (
                      <button
                        key={key}
                        onClick={() => insertElement(key)}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm flex items-center justify-between transition-colors",
                          isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700',
                          currentElement === key && (isDark ? 'bg-stone-800' : 'bg-stone-100')
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          {style.icon}
                          {style.label}
                        </span>
                        <span className={cn(
                          "text-[10px] font-mono",
                          isDark ? 'text-stone-600' : 'text-stone-400'
                        )}>{style.shortcut}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={cn("w-px h-5 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

            {/* Revision Mode */}
            <div className="relative">
              <button
                onClick={() => setShowRevisionMenu(!showRevisionMenu)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                  revisionMode
                    ? `${REVISION_COLORS[currentRevisionColor].bg} ${REVISION_COLORS[currentRevisionColor].text}`
                    : isDark 
                      ? 'hover:bg-stone-800 text-stone-400' 
                      : 'hover:bg-stone-100 text-stone-500'
                )}
                title="Revision Mode"
              >
                <FileEdit size={14} />
                {revisionMode && <span className="hidden sm:inline">Revision</span>}
              </button>
              
              {showRevisionMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRevisionMenu(false)} />
                  <div className={cn(
                    "absolute top-full left-0 mt-1 w-52 rounded-xl shadow-xl z-50 border overflow-hidden",
                    isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                  )}>
                    <div className={cn(
                      "px-3 py-2 border-b",
                      isDark ? 'border-stone-800' : 'border-stone-100'
                    )}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={revisionMode}
                          onChange={(e) => setRevisionMode(e.target.checked)}
                          className="rounded"
                        />
                        <span className={cn(
                          "text-xs font-medium",
                          isDark ? 'text-white' : 'text-stone-900'
                        )}>Revision Mode</span>
                      </label>
                    </div>
                    <div className="p-1">
                      {(Object.entries(REVISION_COLORS) as [RevisionColor, typeof REVISION_COLORS[RevisionColor]][]).map(([color, config]) => (
                        <button
                          key={color}
                          onClick={() => {
                            setCurrentRevisionColor(color);
                            setRevisionMode(true);
                            setShowRevisionMenu(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors",
                            isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50',
                            currentRevisionColor === color && revisionMode && 'ring-2 ring-blue-500'
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded", config.bg, "border border-black/10")} />
                          <span className={isDark ? 'text-stone-300' : 'text-stone-700'}>{config.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Find/Replace */}
            <button
              onClick={() => setShowFindReplace(!showFindReplace)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                showFindReplace 
                  ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
                  : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Find & Replace (⌘F)"
            >
              <Search size={14} />
            </button>

            {/* Add Note */}
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Add Note"
            >
              <StickyNote size={14} />
            </button>
          </div>

          {/* Center: Stats */}
          <div className={cn(
            "hidden lg:flex items-center gap-4 text-[11px] font-mono",
            isDark ? 'text-stone-500' : 'text-stone-400'
          )}>
            <span>
              <span className="opacity-60">Scenes</span>{' '}
              <span className={isDark ? 'text-white' : 'text-stone-900'}>{scenes.length}</span>
            </span>
            <span>
              <span className="opacity-60">Pages</span>{' '}
              <span className={isDark ? 'text-white' : 'text-stone-900'}>{stats.pages}</span>
            </span>
            <span>
              <span className="opacity-60">~{stats.readTime}min</span>
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Table Read */}
            <button
              onClick={isTableReading ? stopTableRead : startTableRead}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                isTableReading
                  ? 'bg-green-500 text-white'
                  : isDark 
                    ? 'hover:bg-stone-800 text-stone-400' 
                    : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Table Read"
            >
              {isTableReading ? <Pause size={14} /> : <Play size={14} />}
              <span className="hidden sm:inline">{isTableReading ? 'Stop' : 'Read'}</span>
            </button>

            {/* AI Menu */}
            <div className="relative">
              <button
                onClick={() => setShowAIMenu(!showAIMenu)}
                disabled={isAIWorking}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                  isDark 
                    ? 'bg-white text-stone-900 hover:bg-stone-100' 
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                {isAIWorking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                AI
              </button>
              
              {showAIMenu && !isAIWorking && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
                  <div className={cn(
                    "absolute top-full right-0 mt-1 w-56 rounded-xl shadow-xl z-50 border overflow-hidden",
                    isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'
                  )}>
                    <button
                      onClick={() => { handleAIContinue(); setShowAIMenu(false); }}
                      className={cn(
                        "w-full px-3 py-2.5 text-sm flex items-center gap-3 transition-colors",
                        isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                      )}
                    >
                      <PenLine size={14} />
                      Continue Writing
                    </button>
                    {selectedText && (
                      <button
                        onClick={() => { handleAIRewrite(); setShowAIMenu(false); }}
                        className={cn(
                          "w-full px-3 py-2.5 text-sm flex items-center gap-3 transition-colors",
                          isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                        )}
                      >
                        <Wand2 size={14} />
                        Rewrite Selection
                      </button>
                    )}
                    <button
                      onClick={() => { handleAIDialogue(); setShowAIMenu(false); }}
                      className={cn(
                        "w-full px-3 py-2.5 text-sm flex items-center gap-3 transition-colors",
                        isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                      )}
                    >
                      <MessageSquare size={14} />
                      Generate Dialogue
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={cn("w-px h-5 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

            {/* Focus Mode */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                focusMode
                  ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900'
                  : isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Focus Mode"
            >
              {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Export */}
            <button
              onClick={() => setShowExportModal(true)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Export"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Find/Replace Bar */}
        {showFindReplace && (
          <div className={cn(
            "h-12 flex items-center gap-2 px-4 border-b shrink-0",
            isDark ? 'bg-stone-800/50 border-stone-800' : 'bg-stone-50 border-stone-100'
          )}>
            <Search size={14} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find..."
              className={cn(
                "flex-1 h-8 px-3 rounded-lg text-sm outline-none",
                isDark 
                  ? 'bg-stone-900 text-white placeholder:text-stone-600' 
                  : 'bg-white text-stone-900 placeholder:text-stone-400'
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleFind()}
            />
            <Replace size={14} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace..."
              className={cn(
                "flex-1 h-8 px-3 rounded-lg text-sm outline-none",
                isDark 
                  ? 'bg-stone-900 text-white placeholder:text-stone-600' 
                  : 'bg-white text-stone-900 placeholder:text-stone-400'
              )}
            />
            <button
              onClick={handleFind}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                isDark ? 'bg-stone-700 text-white hover:bg-stone-600' : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
              )}
            >
              Find
            </button>
            <button
              onClick={handleReplaceAll}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                isDark ? 'bg-stone-700 text-white hover:bg-stone-600' : 'bg-stone-200 text-stone-900 hover:bg-stone-300'
              )}
            >
              Replace All
            </button>
            <button
              onClick={() => setShowFindReplace(false)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-700 text-stone-400' : 'hover:bg-stone-200 text-stone-500'
              )}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Note Input */}
        {showNoteInput && (
          <div className={cn(
            "h-12 flex items-center gap-2 px-4 border-b shrink-0",
            isDark ? 'bg-amber-500/10 border-stone-800' : 'bg-amber-50 border-stone-100'
          )}>
            <StickyNote size={14} className="text-amber-500" />
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={`Add note at line ${currentLineInfo.lineIndex + 1}...`}
              className={cn(
                "flex-1 h-8 px-3 rounded-lg text-sm outline-none",
                isDark 
                  ? 'bg-stone-900 text-white placeholder:text-stone-600' 
                  : 'bg-white text-stone-900 placeholder:text-stone-400'
              )}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              autoFocus
            />
            <button
              onClick={addNote}
              disabled={!newNoteText.trim()}
              className={cn(
                "h-8 px-4 rounded-lg text-xs font-medium transition-colors disabled:opacity-40",
                isDark ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-amber-500 text-white hover:bg-amber-400'
              )}
            >
              Add Note
            </button>
            <button
              onClick={() => { setShowNoteInput(false); setNewNoteText(''); }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-700 text-stone-400' : 'hover:bg-stone-200 text-stone-500'
              )}
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        {/* Editor Area */}
        <div 
          ref={editorContainerRef}
          className="flex-1 flex overflow-auto relative"
        >
          {/* Line Numbers */}
          <div 
            className={cn(
              "w-14 shrink-0 select-none border-r sticky left-0 z-10",
              isDark ? 'bg-stone-900 text-stone-600 border-stone-800' : 'bg-stone-50 text-stone-400 border-stone-200'
            )}
          >
            <div className="pt-3">
              {content.split('\n').map((line, i) => {
                const hasNote = notes.some(n => n.lineNumber === i + 1);
                const hasBookmark = bookmarks.has(i);
                const revColor = revisionMarks.get(i);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "text-[11px] font-mono leading-6 h-6 flex items-center justify-end pr-2 gap-1 relative",
                      (i + 1) % 56 === 0 && 'border-b border-dashed',
                      revColor && REVISION_COLORS[revColor].bg,
                      isDark && (i + 1) % 56 === 0 ? 'border-stone-700' : 'border-stone-300'
                    )}
                  >
                    {hasBookmark && (
                      <Bookmark size={8} className="text-blue-500 absolute left-1" fill="currentColor" />
                    )}
                    {hasNote && (
                      <StickyNote size={8} className="text-amber-500" />
                    )}
                    <span>{i + 1}</span>
                    {revColor && (
                      <span className="text-[8px]">*</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div className={cn(
            "flex-1 min-w-0 relative",
            isDark ? 'bg-stone-900' : 'bg-white'
          )}>
            <textarea
              ref={textareaRef}
              id="script-editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={(e) => {
                const target = e.target as HTMLTextAreaElement;
                setCursorPosition(target.selectionStart);
                setSelectionStart(target.selectionStart);
                setSelectionEnd(target.selectionEnd);
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full min-h-full py-3 px-6 resize-none outline-none leading-6 font-mono",
                getFontSize(),
                isDark 
                  ? 'bg-stone-900 text-stone-100 placeholder:text-stone-600 caret-white' 
                  : 'bg-white text-stone-800 placeholder:text-stone-400 caret-stone-900'
              )}
              style={{ 
                minHeight: `${Math.max(content.split('\n').length + 10, 30) * 24}px`,
                tabSize: 4
              }}
              placeholder={`FADE IN:

INT. LOCATION - DAY

Description of the scene...

                    CHARACTER
          Dialogue goes here.

Press TAB to cycle through elements.
Type character names in CAPS for auto-complete.`}
              spellCheck={false}
            />

            {/* Auto-complete Popup */}
            {showAutoComplete && autoCompleteOptions.length > 0 && (
              <div
                className={cn(
                  "absolute z-50 w-64 rounded-xl shadow-xl border overflow-hidden",
                  isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
                )}
                style={{
                  top: `${(currentLineInfo.lineIndex + 1) * 24 + 12}px`,
                  left: '24px'
                }}
              >
                {autoCompleteOptions.slice(0, 8).map((option, i) => (
                  <button
                    key={option}
                    onClick={() => applyAutoComplete(option)}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left transition-colors flex items-center gap-2",
                      i === autoCompleteIndex
                        ? isDark ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-900'
                        : isDark ? 'text-stone-300 hover:bg-stone-700' : 'text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    {autoCompleteType === 'character' && <User size={12} />}
                    {autoCompleteType === 'scene' && <Film size={12} />}
                    {autoCompleteType === 'transition' && <ArrowRight size={12} />}
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className={cn(
          "h-7 flex items-center justify-between px-3 border-t shrink-0 text-[11px]",
          isDark ? 'border-stone-800 text-stone-500' : 'border-stone-100 text-stone-400'
        )}>
          <div className="flex items-center gap-4">
            <span>Line {currentLineInfo.lineIndex + 1}:{currentLineInfo.column}</span>
            <span className="flex items-center gap-1">
              {ELEMENT_STYLES[currentElement].icon}
              {ELEMENT_STYLES[currentElement].label}
            </span>
            {revisionMode && (
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                REVISION_COLORS[currentRevisionColor].bg,
                REVISION_COLORS[currentRevisionColor].text
              )}>
                Revision
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{characters.length} Characters</span>
            <span>{stats.words} Words</span>
            {isAIWorking && (
              <span className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                AI working...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal - simplified for now */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={cn(
            "w-full max-w-md rounded-2xl shadow-2xl",
            isDark ? 'bg-stone-900' : 'bg-white'
          )}>
            <div className={cn(
              "h-14 px-6 flex items-center justify-between border-b",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <h3 className={cn("font-semibold", isDark ? 'text-white' : 'text-stone-900')}>
                Export Screenplay
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                )}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={cn("block text-xs font-medium mb-2", isDark ? 'text-stone-400' : 'text-stone-500')}>
                  Title
                </label>
                <input
                  type="text"
                  value={exportTitle}
                  onChange={(e) => setExportTitle(e.target.value)}
                  className={cn(
                    "w-full h-10 px-4 rounded-lg text-sm outline-none border",
                    isDark 
                      ? 'bg-stone-800 border-stone-700 text-white'
                      : 'bg-stone-50 border-stone-200 text-stone-900'
                  )}
                />
              </div>
              <div>
                <label className={cn("block text-xs font-medium mb-2", isDark ? 'text-stone-400' : 'text-stone-500')}>
                  Author
                </label>
                <input
                  type="text"
                  value={exportAuthor}
                  onChange={(e) => setExportAuthor(e.target.value)}
                  placeholder="Optional"
                  className={cn(
                    "w-full h-10 px-4 rounded-lg text-sm outline-none border",
                    isDark 
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-600'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { exportToPDF(content, { title: exportTitle, author: exportAuthor }); setShowExportModal(false); }}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    isDark ? 'bg-stone-800 border-stone-700 hover:border-stone-600' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')}>
                    <FileText size={20} />
                  </div>
                  <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>PDF</div>
                  <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>Industry standard</div>
                </button>
                <button
                  onClick={() => { exportToFountain(content, exportTitle); setShowExportModal(false); }}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    isDark ? 'bg-stone-800 border-stone-700 hover:border-stone-600' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600')}>
                    <Download size={20} />
                  </div>
                  <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>Fountain</div>
                  <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>Plain text</div>
                </button>
                <button
                  onClick={() => { exportToFDX(content, exportTitle); setShowExportModal(false); }}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    isDark ? 'bg-stone-800 border-stone-700 hover:border-stone-600' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')}>
                    <Film size={20} />
                  </div>
                  <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>Final Draft</div>
                  <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>.fdx format</div>
                </button>
                <button
                  onClick={() => { setShowExportModal(false); setShowTitlePageModal(true); }}
                  className={cn(
                    "p-4 rounded-xl border transition-all text-left",
                    isDark ? 'bg-stone-800 border-stone-700 hover:border-stone-600' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600')}>
                    <BookOpen size={20} />
                  </div>
                  <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>Title Page</div>
                  <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>Generate cover</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
