import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStory } from '../context/StoryContext';
import { AnalysisData } from '../types';
import { analyzeScriptTension, generateDialogue, continueWriting, rewriteText } from '../services/geminiService';
import { exportToPDF, exportToFountain, exportToFDX, exportStoryBiblePDF } from '../services/exportService';
import { 
  BarChart2, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  TrendingUp, 
  Film, 
  Hash,
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
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

type ScriptElement = 'scene' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';

interface ElementStyle {
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  className: string;
  prefix?: string;
}

const ELEMENT_STYLES: Record<ScriptElement, ElementStyle> = {
  scene: {
    label: 'Scene Heading',
    icon: <Film size={14} />,
    shortcut: '⌘1',
    className: 'uppercase font-bold',
    prefix: 'INT. '
  },
  action: {
    label: 'Action',
    icon: <Type size={14} />,
    shortcut: '⌘2',
    className: ''
  },
  character: {
    label: 'Character',
    icon: <User size={14} />,
    shortcut: '⌘3',
    className: 'uppercase text-center ml-[35%]'
  },
  dialogue: {
    label: 'Dialogue',
    icon: <MessageSquare size={14} />,
    shortcut: '⌘4',
    className: 'ml-[15%] mr-[25%]'
  },
  parenthetical: {
    label: 'Parenthetical',
    icon: <ArrowRight size={14} />,
    shortcut: '⌘5',
    className: 'ml-[25%] mr-[35%] italic'
  },
  transition: {
    label: 'Transition',
    icon: <ArrowRight size={14} />,
    shortcut: '⌘6',
    className: 'uppercase text-right'
  }
};

const TRANSITIONS = ['CUT TO:', 'DISSOLVE TO:', 'FADE IN:', 'FADE OUT.', 'FADE TO BLACK.', 'SMASH CUT TO:', 'MATCH CUT TO:'];

const ScriptEditor: React.FC = () => {
  const { 
    sources, 
    updateSource, 
    addSource, 
    theme, 
    settings
  } = useStory();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const activeScriptSource = sources.find(s => s.type === 'script');
  
  // Core state
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentElement, setCurrentElement] = useState<ScriptElement>('action');
  
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
  
  // AI state
  const [isAIWorking, setIsAIWorking] = useState(false);
  const [aiAction, setAIAction] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  
  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState<string>('');
  
  // Selection state
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const selectedText = content.substring(selectionStart, selectionEnd);

  const isDark = theme === 'dark';

  // Load content
  useEffect(() => {
    if (activeScriptSource) {
      setContent(activeScriptSource.content);
    }
  }, [activeScriptSource?.id]);

  // Stats
  const stats = useMemo(() => {
    const text = content.trim();
    if (!text) return { words: 0, chars: 0, pages: 0, readTime: 0 };
    const words = text.split(/\s+/).length;
    const chars = text.length;
    const pages = Math.ceil(words / 250);
    const readTime = Math.ceil(pages); // 1 page = ~1 min screen time
    return { words, chars, pages, readTime };
  }, [content]);

  // Scene detection - supports optional scene numbers like "1 EXT." or "1. EXT."
  const scenes = useMemo(() => {
    const regex = /^(?:\d+\.?\s+)?(?:INT\.|EXT\.|INT\/EXT|I\/E\.|INT |EXT |I\/E ).+$/gim;
    const matches: { index: number; text: string; lineNumber: number }[] = [];
    const lines = content.split('\n');
    let charIndex = 0;
    
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();
      if (regex.test(trimmed)) {
        matches.push({
          index: charIndex,
          text: trimmed,
          lineNumber: lineNum + 1
        });
      }
      charIndex += line.length + 1;
      regex.lastIndex = 0;
    });
    
    return matches;
  }, [content]);

  // Character detection
  const characters = useMemo(() => {
    const regex = /^([A-Z][A-Z\s]+)(?:\s*\(.*\))?$/gm;
    const charSet = new Set<string>();
    let m;
    while ((m = regex.exec(content)) !== null) {
      const name = m[1]?.trim();
      if (name && !TRANSITIONS.includes(name) && name.length < 30) {
        charSet.add(name);
      }
    }
    return Array.from(charSet).sort();
  }, [content]);

  const isStale = useMemo(() => content !== lastAnalyzedContent && lastAnalyzedContent !== '', [content, lastAnalyzedContent]);

  // Auto-detect current element based on cursor position
  useEffect(() => {
    const contentLines = content.substring(0, cursorPosition).split('\n');
    const currentLine = contentLines[contentLines.length - 1] || '';
    
    if (/^(INT\.|EXT\.|INT\/EXT|I\/E\.)/.test(currentLine.toUpperCase())) {
      setCurrentElement('scene');
    } else if (/^[A-Z][A-Z\s]+$/.test(currentLine.trim()) && currentLine.trim().length < 30) {
      setCurrentElement('character');
    } else if (/^\(.*\)$/.test(currentLine.trim())) {
      setCurrentElement('parenthetical');
    } else if (TRANSITIONS.some(t => currentLine.toUpperCase().includes(t))) {
      setCurrentElement('transition');
    }
  }, [cursorPosition, content]);

  // Handle save
  const handleSave = useCallback(() => {
    if (activeScriptSource) {
      updateSource(activeScriptSource.id, { content });
    } else if (content.trim()) {
      addSource({
        title: "Untitled Script",
        content: content,
        type: "script",
        tags: [],
      });
    }
  }, [activeScriptSource, content, updateSource, addSource]);

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

  // Insert element prefix
  const insertElement = (element: ScriptElement) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const currentLineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLineEnd = content.indexOf('\n', start);
    const actualEnd = currentLineEnd === -1 ? content.length : currentLineEnd;
    
    let prefix = '';
    switch (element) {
      case 'scene':
        prefix = 'INT. ';
        break;
      case 'character':
        // Move cursor with proper formatting
        break;
      case 'transition':
        prefix = 'CUT TO:';
        break;
    }
    
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

  // Find & Replace
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

  // Scroll to scene
  const scrollToScene = (index: number) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(index, index);
      const textBefore = textarea.value.substring(0, index);
      const lineCount = textBefore.split(/\r\n|\r|\n/).length;
      const lineHeight = 28;
      textarea.scrollTop = Math.max(0, (lineCount - 2) * lineHeight);
    }
  };

  // Run analysis
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

  // AI Functions
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

  const handleAICustom = async () => {
    if (!aiPrompt.trim()) return;
    setIsAIWorking(true);
    setAIAction('custom');
    try {
      const result = await continueWriting(
        `${content}\n\n[AI INSTRUCTION: ${aiPrompt}]\n`,
        sources
      );
      if (result) {
        const textarea = textareaRef.current;
        if (textarea) {
          const pos = textarea.selectionStart;
          setContent(content.substring(0, pos) + '\n' + result + content.substring(pos));
        }
      }
      setAIPrompt('');
      setShowAIPanel(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            setShowFindReplace(!showFindReplace);
            break;
          case '1':
            e.preventDefault();
            insertElement('scene');
            break;
          case '2':
            e.preventDefault();
            insertElement('action');
            break;
          case '3':
            e.preventDefault();
            insertElement('character');
            break;
          case '4':
            e.preventDefault();
            insertElement('dialogue');
            break;
          case '5':
            e.preventDefault();
            insertElement('parenthetical');
            break;
          case '6':
            e.preventDefault();
            insertElement('transition');
            break;
        }
      }
      if (e.key === 'Escape') {
        setShowFindReplace(false);
        setShowElementMenu(false);
        setShowAIMenu(false);
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFindReplace]);

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getFontFamily = () => 'font-mono'; // Screenplays always use mono

  return (
    <div className={cn("flex h-full gap-3", focusMode && "fixed inset-0 z-50 p-4 bg-stone-950")}>
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
          {/* Left: Element Selector & Formatting */}
          <div className="flex items-center gap-1">
            {/* Element Type Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowElementMenu(!showElementMenu)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                  isDark 
                    ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                )}
              >
                {ELEMENT_STYLES[currentElement].icon}
                {ELEMENT_STYLES[currentElement].label}
                <ChevronDown size={12} />
              </button>
              
              {showElementMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowElementMenu(false)} />
                  <div className={cn(
                    "absolute top-full left-0 mt-1 w-52 rounded-xl shadow-lg z-50 border overflow-hidden",
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
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
                        <span className="flex items-center gap-2">
                          {style.icon}
                          {style.label}
                        </span>
                        <span className={cn(
                          "text-xs font-mono",
                          isDark ? 'text-stone-500' : 'text-stone-400'
                        )}>{style.shortcut}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className={cn("w-px h-5 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

            {/* Quick Insert Buttons */}
            <button
              onClick={() => insertElement('scene')}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Scene Heading (⌘1)"
            >
              <Film size={14} />
            </button>
            <button
              onClick={() => insertElement('character')}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Character (⌘3)"
            >
              <User size={14} />
            </button>
            <button
              onClick={() => insertElement('transition')}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
              )}
              title="Transition (⌘6)"
            >
              <ArrowRight size={14} />
            </button>

            <div className={cn("w-px h-5 mx-1", isDark ? 'bg-stone-700' : 'bg-stone-200')} />

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
          </div>

          {/* Center: Stats */}
          <div className={cn(
            "flex items-center gap-6 text-xs",
            isDark ? 'text-stone-400' : 'text-stone-500'
          )}>
            {settings.showWordCount && (
              <>
                <span className="font-mono">
                  <span className="opacity-60">Scenes</span>{' '}
                  <span className={isDark ? 'text-white' : 'text-stone-900'}>{scenes.length}</span>
                </span>
                <span className="font-mono">
                  <span className="opacity-60">Words</span>{' '}
                  <span className={isDark ? 'text-white' : 'text-stone-900'}>{stats.words}</span>
                </span>
              </>
            )}
            {settings.showPageCount && (
              <>
                <span className="font-mono">
                  <span className="opacity-60">Pages</span>{' '}
                  <span className={isDark ? 'text-white' : 'text-stone-900'}>~{stats.pages}</span>
                </span>
                <span className="font-mono">
                  <span className="opacity-60">~{stats.readTime} min</span>
                </span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
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
                <ChevronDown size={12} />
              </button>
              
              {showAIMenu && !isAIWorking && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAIMenu(false)} />
                  <div className={cn(
                    "absolute top-full right-0 mt-1 w-56 rounded-xl shadow-lg z-50 border overflow-hidden",
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
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
                    <div className={cn("h-px mx-2", isDark ? 'bg-stone-800' : 'bg-stone-100')} />
                    <button
                      onClick={() => { setShowAIPanel(true); setShowAIMenu(false); }}
                      className={cn(
                        "w-full px-3 py-2.5 text-sm flex items-center gap-3 transition-colors",
                        isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                      )}
                    >
                      <Sparkles size={14} />
                      Custom Prompt...
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

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className={cn(
              "w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200",
              isDark ? 'bg-stone-900' : 'bg-white'
            )}>
              {/* Header */}
              <div className={cn(
                "h-14 px-6 flex items-center justify-between border-b",
                isDark ? 'border-stone-800' : 'border-stone-100'
              )}>
                <h3 className={cn(
                  "font-semibold",
                  isDark ? 'text-white' : 'text-stone-900'
                )}>Export Screenplay</h3>
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

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className={cn(
                    "block text-xs font-medium mb-2",
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}>Title</label>
                  <input
                    type="text"
                    value={exportTitle}
                    onChange={(e) => setExportTitle(e.target.value)}
                    className={cn(
                      "w-full h-10 px-4 rounded-lg text-sm outline-none border transition-all",
                      isDark 
                        ? 'bg-stone-800 border-stone-700 text-white focus:ring-2 focus:ring-white/10'
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:ring-2 focus:ring-stone-900/10'
                    )}
                  />
                </div>
                <div>
                  <label className={cn(
                    "block text-xs font-medium mb-2",
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}>Author</label>
                  <input
                    type="text"
                    value={exportAuthor}
                    onChange={(e) => setExportAuthor(e.target.value)}
                    placeholder="Optional"
                    className={cn(
                      "w-full h-10 px-4 rounded-lg text-sm outline-none border transition-all",
                      isDark 
                        ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-600 focus:ring-2 focus:ring-white/10'
                        : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10'
                    )}
                  />
                </div>

                {/* Export Formats */}
                <div className="pt-2">
                  <label className={cn(
                    "block text-xs font-medium mb-3",
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}>Export Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* PDF */}
                    <button
                      onClick={() => {
                        exportToPDF(content, { title: exportTitle, author: exportAuthor });
                        setShowExportModal(false);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                        isDark 
                          ? 'bg-stone-800 border-stone-700 hover:border-stone-600'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                      )}>
                        <FileText size={20} />
                      </div>
                      <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>
                        PDF
                      </div>
                      <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>
                        Industry standard format
                      </div>
                    </button>

                    {/* Fountain */}
                    <button
                      onClick={() => {
                        exportToFountain(content, exportTitle);
                        setShowExportModal(false);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                        isDark 
                          ? 'bg-stone-800 border-stone-700 hover:border-stone-600'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      )}>
                        <Download size={20} />
                      </div>
                      <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>
                        Fountain
                      </div>
                      <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>
                        Plain text screenplay
                      </div>
                    </button>

                    {/* Final Draft */}
                    <button
                      onClick={() => {
                        exportToFDX(content, exportTitle);
                        setShowExportModal(false);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                        isDark 
                          ? 'bg-stone-800 border-stone-700 hover:border-stone-600'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                      )}>
                        <Film size={20} />
                      </div>
                      <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>
                        Final Draft
                      </div>
                      <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>
                        .fdx format
                      </div>
                    </button>

                    {/* Story Bible */}
                    <button
                      onClick={() => {
                        const beatSheet = JSON.parse(localStorage.getItem('storyverse-beatsheet') || '{}');
                        const outline = JSON.parse(localStorage.getItem('storyverse-outline') || '[]');
                        const notes = JSON.parse(localStorage.getItem('storyverse-notes') || '[]');
                        exportStoryBiblePDF(sources, beatSheet, outline, notes, exportTitle);
                        setShowExportModal(false);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98]",
                        isDark 
                          ? 'bg-stone-800 border-stone-700 hover:border-stone-600'
                          : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                        isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        <BookOpen size={20} />
                      </div>
                      <div className={cn("font-medium text-sm", isDark ? 'text-white' : 'text-stone-900')}>
                        Story Bible
                      </div>
                      <div className={cn("text-xs mt-0.5", isDark ? 'text-stone-500' : 'text-stone-400')}>
                        All sources as PDF
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* AI Custom Prompt Panel */}
        {showAIPanel && (
          <div className={cn(
            "h-14 flex items-center gap-2 px-4 border-b shrink-0",
            isDark ? 'bg-stone-800/50 border-stone-800' : 'bg-stone-50 border-stone-100'
          )}>
            <Sparkles size={14} className={isDark ? 'text-stone-400' : 'text-stone-500'} />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="Describe what you want the AI to write..."
              className={cn(
                "flex-1 h-9 px-3 rounded-lg text-sm outline-none",
                isDark 
                  ? 'bg-stone-900 text-white placeholder:text-stone-600' 
                  : 'bg-white text-stone-900 placeholder:text-stone-400'
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleAICustom()}
              autoFocus
            />
            <button
              onClick={handleAICustom}
              disabled={isAIWorking || !aiPrompt.trim()}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50",
                isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
              )}
            >
              {isAIWorking ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              Generate
            </button>
            <button
              onClick={() => setShowAIPanel(false)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                isDark ? 'hover:bg-stone-700 text-stone-400' : 'hover:bg-stone-200 text-stone-500'
              )}
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        {/* Editor - Clean Single-Page Layout with synchronized scrolling */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Scrollable Container for both line numbers and editor */}
          <div 
            className="flex-1 flex overflow-auto"
            onScroll={(e) => {
              // Sync line numbers scroll with container
              if (lineNumbersRef.current) {
                lineNumbersRef.current.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
              }
            }}
          >
            {/* Line Numbers - Fixed position, moves via transform */}
            <div 
              className={cn(
                "w-12 shrink-0 select-none border-r sticky left-0 z-10",
                isDark ? 'bg-stone-900 text-stone-500 border-stone-800' : 'bg-stone-50 text-stone-400 border-stone-200'
              )}
            >
              <div ref={lineNumbersRef} className="pt-3">
                {content.split('\n').map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "text-[11px] font-mono leading-6 h-6 flex items-center justify-end pr-3",
                      // Page break indicator every 55 lines
                      (i + 1) % 55 === 0 && (isDark ? 'bg-stone-800/50' : 'bg-stone-200/50')
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className={cn(
              "flex-1 min-w-0",
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
                className={cn(
                  "w-full min-h-full py-3 px-4 resize-none outline-none leading-6",
                  getFontSize(),
                  getFontFamily(),
                  isDark 
                    ? 'bg-stone-900 text-stone-100 placeholder:text-stone-500 caret-white' 
                    : 'bg-white text-stone-800 placeholder:text-stone-400 caret-stone-900'
                )}
                style={{ minHeight: `${Math.max(content.split('\n').length + 10, 30) * 24}px` }}
                placeholder="FADE IN:

EXT. LOCATION - DAY

Description of the scene...

                    CHARACTER
          Dialogue goes here."
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className={cn(
          "h-7 flex items-center justify-between px-3 border-t shrink-0 text-[11px]",
          isDark ? 'border-stone-800 text-stone-500' : 'border-stone-100 text-stone-400'
        )}>
          <div className="flex items-center gap-4">
            <span>Line {content.substring(0, cursorPosition).split('\n').length}</span>
            <span>•</span>
            <span>{activeScriptSource ? activeScriptSource.title : "Untitled"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{characters.length} Characters</span>
            {isAIWorking && (
              <span className="flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                AI {aiAction}...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      {!focusMode && (
        <div className="w-64 flex flex-col gap-2 h-full overflow-hidden">
          
          {/* Analyze Button */}
          <div className={cn(
            "p-3 rounded-xl border shrink-0",
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
          )}>
            <h3 className={cn(
              "text-[11px] font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wide",
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}>
              <Activity size={12} strokeWidth={2} />
              Script Analysis
            </h3>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !content.trim()}
              className={cn(
                "w-full h-9 rounded-lg text-xs font-medium disabled:opacity-40 flex items-center justify-center gap-2 transition-all duration-200",
                isStale 
                  ? isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  : isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
              )}
            >
              {isAnalyzing ? (
                <RefreshCw size={13} className="animate-spin" strokeWidth={2} />
              ) : (
                <BarChart2 size={13} strokeWidth={2} />
              )}
              {isAnalyzing ? "Analyzing..." : isStale ? "Update" : "Analyze"}
            </button>
          </div>

          {/* Tension Graph */}
          <div className={cn(
            "p-3 rounded-xl border shrink-0",
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
          )}>
            <div className="flex justify-between items-center mb-2">
              <span className={cn(
                "text-[11px] font-semibold uppercase flex items-center gap-1.5",
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}>
                <TrendingUp size={12} strokeWidth={2} />
                Tension Arc
              </span>
              {analysis && !isStale && (
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                )}>
                  {analysis.pacingScore}/100
                </span>
              )}
            </div>
            
            {!analysis && !isAnalyzing ? (
              <div className={cn(
                "h-16 flex flex-col items-center justify-center gap-2",
                isDark ? 'text-stone-600' : 'text-stone-300'
              )}>
                <BarChart2 size={18} strokeWidth={1.5} />
                <p className={cn(
                  "text-[10px] text-center",
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}>
                  Run analysis to generate<br/>the tension graph
                </p>
              </div>
            ) : (
              <div className="h-16 w-full flex items-end justify-between gap-1 relative">
                {(analysis ? analysis.tensionArc : [10, 20, 15, 30, 40, 35, 50, 60, 45, 20]).map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div 
                      className={cn(
                        "w-full rounded-t transition-all duration-500 ease-out",
                        isStale || !analysis 
                          ? isDark ? 'bg-stone-700' : 'bg-stone-200'
                          : isDark ? 'bg-white group-hover:bg-stone-300' : 'bg-stone-900 group-hover:bg-stone-700'
                      )}
                      style={{ height: `${val}%` }}
                    />
                  </div>
                ))}
                {isAnalyzing && (
                  <div className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    isDark ? 'bg-stone-900/80' : 'bg-white/80'
                  )}>
                    <RefreshCw size={20} className={cn(
                      "animate-spin",
                      isDark ? 'text-stone-400' : 'text-stone-400'
                    )} strokeWidth={2} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Suggestions */}
          {analysis && !isStale && (
            <div className={cn(
              "p-3 rounded-xl border shrink-0",
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
            )}>
              <span className={cn(
                "text-[11px] font-semibold uppercase block mb-2",
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}>Notes</span>
              <ul className="space-y-1.5">
                {analysis.suggestions.slice(0, 2).map((s, i) => (
                  <li key={i} className={cn(
                    "text-[11px] flex gap-2 items-start leading-relaxed",
                    isDark ? 'text-stone-300' : 'text-stone-600'
                  )}>
                    <CheckCircle size={12} className={cn(
                      "shrink-0 mt-0.5",
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )} strokeWidth={2} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Characters */}
          {characters.length > 0 && (
            <div className={cn(
              "p-3 rounded-xl border shrink-0",
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
            )}>
              <h3 className={cn(
                "text-[11px] font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wide",
                isDark ? 'text-stone-400' : 'text-stone-500'
              )}>
                <User size={12} strokeWidth={2} />
                Characters ({characters.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {characters.slice(0, 8).map((char, i) => (
                  <span key={i} className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    isDark ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                  )}>
                    {char}
                  </span>
                ))}
                {characters.length > 8 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    +{characters.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Scenes List */}
          <div className={cn(
            "p-3 rounded-xl border flex-1 flex flex-col min-h-0 overflow-hidden",
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
          )}>
            <h3 className={cn(
              "text-[11px] font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wide shrink-0",
              isDark ? 'text-stone-400' : 'text-stone-500'
            )}>
              <Film size={12} strokeWidth={2} />
              Scenes ({scenes.length})
            </h3>
            <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-0.5">
              {scenes.length === 0 ? (
                <div className={cn(
                  "h-full flex flex-col items-center justify-center text-center py-4",
                  isDark ? 'text-stone-600' : 'text-stone-300'
                )}>
                  <Hash size={16} className="mb-1.5" strokeWidth={1.5} />
                  <p className={cn(
                    "text-[10px]",
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    Use standard headings<br/>(INT. / EXT.)
                  </p>
                </div>
              ) : (
                scenes.map((scene, i) => (
                  <button 
                    key={i}
                    onClick={() => scrollToScene(scene.index)}
                    className={cn(
                      "w-full text-left group flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-150",
                      isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-50'
                    )}
                  >
                    <span className={cn(
                      "text-[10px] font-mono min-w-[1.2em] transition-colors",
                      isDark ? 'text-stone-600 group-hover:text-stone-400' : 'text-stone-300 group-hover:text-stone-500'
                    )}>
                      {i + 1}
                    </span>
                    <span className={cn(
                      "text-[11px] font-medium truncate font-mono transition-colors",
                      isDark ? 'text-stone-400 group-hover:text-white' : 'text-stone-600 group-hover:text-stone-900'
                    )}>
                      {scene.text}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
