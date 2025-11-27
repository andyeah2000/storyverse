import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStory } from '../../context/StoryContext';
import { generateDialogue, continueWriting, rewriteText } from '../../services/geminiService';
import { exportToPDF, exportToFountain, exportToFDX } from '../../services/exportService';
import { cn } from '../../lib/utils';

// Components
import { Toolbar, Navigator, EditorArea, StatusBar, ExportModal } from './components';

// Types & Constants
import { 
  ScriptElement, 
  NavigatorTab, 
  RevisionColor, 
  ScriptNote, 
  AutoCompleteType,
  TitlePageData
} from './types';
import { ELEMENT_STYLES, TRANSITIONS, SCENE_PREFIXES } from './constants';

// Utils
import { 
  getLineInfo, 
  parseScenes, 
  parseCharacters, 
  calculateStats,
  getTabCycleElement,
  getNextElement,
  getCharacterSuggestions,
  getSceneSuggestions,
  getTransitionSuggestions
} from './utils/formatting';

// ============================================
// MAIN COMPONENT
// ============================================

const ScriptEditor: React.FC = () => {
  const { 
    sources, 
    activeSourceId,
    setActiveSourceId,
    updateSource, 
    addSource, 
    theme, 
    settings
  } = useStory();
  
  // Find the active script source - either the selected one or the first script
  const activeScriptSource = activeSourceId 
    ? sources.find(s => s.id === activeSourceId && s.type === 'script')
    : sources.find(s => s.type === 'script');
  
  const isDark = theme === 'dark';
  
  // If no active source and there are scripts, select the first one
  useEffect(() => {
    if (!activeSourceId && sources.some(s => s.type === 'script')) {
      const firstScript = sources.find(s => s.type === 'script');
      if (firstScript) {
        setActiveSourceId(firstScript.id);
      }
    }
  }, [activeSourceId, sources, setActiveSourceId]);

  // ============================================
  // CORE STATE
  // ============================================

  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [currentElement, setCurrentElement] = useState<ScriptElement>('action');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // NAVIGATOR STATE
  // ============================================

  const [showNavigator, setShowNavigator] = useState(true);
  const [navigatorTab, setNavigatorTab] = useState<NavigatorTab>('scenes');

  // ============================================
  // UI STATE
  // ============================================

  const [focusMode, setFocusMode] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // ============================================
  // REVISION STATE
  // ============================================

  const [revisionMode, setRevisionMode] = useState(false);
  const [currentRevisionColor, setCurrentRevisionColor] = useState<RevisionColor>('blue');
  const [revisionMarks, setRevisionMarks] = useState<Map<number, RevisionColor>>(new Map());

  // ============================================
  // SCENE STATE
  // ============================================

  const [lockedScenes] = useState<Set<number>>(new Set());
  const [omittedScenes] = useState<Set<number>>(new Set());

  // ============================================
  // NOTES & BOOKMARKS
  // ============================================

  const [notes, setNotes] = useState<ScriptNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());

  // ============================================
  // AI STATE
  // ============================================

  const [isAIWorking, setIsAIWorking] = useState(false);
  const [aiAction, setAIAction] = useState<string | null>(null);

  // ============================================
  // TABLE READ STATE
  // ============================================

  const [isTableReading, setIsTableReading] = useState(false);

  // ============================================
  // AUTO-COMPLETE STATE
  // ============================================

  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);
  const [autoCompleteIndex, setAutoCompleteIndex] = useState(0);
  const [autoCompleteType, setAutoCompleteType] = useState<AutoCompleteType>('character');

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const currentLineInfo = useMemo(() => 
    getLineInfo(content, cursorPosition), 
    [content, cursorPosition]
  );

  const scenes = useMemo(() => 
    parseScenes(content, lockedScenes, omittedScenes), 
    [content, lockedScenes, omittedScenes]
  );

  const characterStats = useMemo(() => 
    parseCharacters(content), 
    [content]
  );

  const characters = useMemo(() => 
    characterStats.map(c => c.name), 
    [characterStats]
  );

  const stats = useMemo(() => 
    calculateStats(content), 
    [content]
  );

  const selectedText = content.substring(selectionStart, selectionEnd);

  // ============================================
  // LOAD CONTENT
  // ============================================

  useEffect(() => {
    if (activeScriptSource) {
      setContent(activeScriptSource.content);
      setIsDirty(false);
    }
  }, [activeScriptSource?.id]);

  // ============================================
  // AUTO-COMPLETE EFFECT
  // ============================================

  useEffect(() => {
    const line = currentLineInfo.lineText || '';
    const lineUpper = line.trim().toUpperCase();

    // Character suggestions
    if (lineUpper.length >= 2 && lineUpper === line.trim() && !/\s$/.test(line)) {
      const suggestions = getCharacterSuggestions(lineUpper, characters);
      if (suggestions.length > 0) {
        setAutoCompleteOptions(suggestions);
        setAutoCompleteType('character');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }

    // Scene heading suggestions
    if (lineUpper.startsWith('INT') || lineUpper.startsWith('EXT') || lineUpper.startsWith('I/E')) {
      const suggestions = getSceneSuggestions(lineUpper);
      if (suggestions.length > 0 && !SCENE_PREFIXES.some(p => lineUpper.startsWith(p))) {
        setAutoCompleteOptions(suggestions);
        setAutoCompleteType('scene');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }

    // Transition suggestions
    if (lineUpper.includes('CUT') || lineUpper.includes('FADE') || lineUpper.includes('DISSOLVE')) {
      const suggestions = getTransitionSuggestions(lineUpper);
      if (suggestions.length > 0) {
        setAutoCompleteOptions(suggestions);
        setAutoCompleteType('transition');
        setShowAutoComplete(true);
        setAutoCompleteIndex(0);
        return;
      }
    }

    setShowAutoComplete(false);
  }, [currentLineInfo.lineText, characters]);

  // ============================================
  // ELEMENT DETECTION
  // ============================================

  useEffect(() => {
    if (currentLineInfo.element) {
      setCurrentElement(currentLineInfo.element);
    }
  }, [currentLineInfo.element]);

  // ============================================
  // CONTENT HANDLERS
  // ============================================

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const handleCursorChange = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  const handleSelectionChange = useCallback((start: number, end: number) => {
    setSelectionStart(start);
    setSelectionEnd(end);
  }, []);

  // ============================================
  // AUTO-COMPLETE
  // ============================================

  const applyAutoComplete = useCallback((option: string) => {
    const lines = content.split('\n');
    lines[currentLineInfo.lineIndex] = option;
    const newContent = lines.join('\n');
    setContent(newContent);
    setShowAutoComplete(false);
    setIsDirty(true);
  }, [content, currentLineInfo.lineIndex]);

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
        const option = autoCompleteOptions[autoCompleteIndex];
        if (option) applyAutoComplete(option);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutoComplete(false);
        return;
      }
    }

    // Tab cycling
    if (e.key === 'Tab') {
      e.preventDefault();
      const lineText = currentLineInfo.lineText || '';
      const nextElement = getTabCycleElement(currentElement, lineText);
      setCurrentElement(nextElement);

      if (lineText.trim()) {
        const newContent = content.substring(0, cursorPosition) + '\n' + content.substring(cursorPosition);
        setContent(newContent);
        setIsDirty(true);
      }
      return;
    }

    // Enter - smart element switching
    if (e.key === 'Enter') {
      const lineText = currentLineInfo.lineText || '';
      const nextElement = getNextElement(currentElement, lineText);
      setTimeout(() => setCurrentElement(nextElement), 0);

      // Mark revision
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
      setIsDirty(true);
      setCurrentElement('parenthetical');
      setTimeout(() => {
        const textarea = document.getElementById('script-editor-textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.setSelectionRange(pos + 1, pos + 1);
        }
      }, 0);
      return;
    }
  }, [
    showAutoComplete, 
    autoCompleteOptions, 
    autoCompleteIndex, 
    applyAutoComplete,
    currentLineInfo, 
    currentElement, 
    content, 
    cursorPosition, 
    revisionMode, 
    currentRevisionColor
  ]);

  // ============================================
  // SAVE
  // ============================================

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (activeScriptSource) {
        await updateSource(activeScriptSource.id, { content });
      } else if (content.trim()) {
        await addSource({
          title: "Untitled Script",
          content: content,
          type: "script",
          tags: [],
        });
      }
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [activeScriptSource, content, updateSource, addSource]);

  // Auto-save
  useEffect(() => {
    if (!settings.autoSave || !isDirty) return;
    const timer = setTimeout(handleSave, settings.autoSaveInterval * 1000);
    return () => clearTimeout(timer);
  }, [content, isDirty, settings.autoSave, settings.autoSaveInterval, handleSave]);

  // ============================================
  // NOTES
  // ============================================

  const addNote = useCallback(() => {
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
  }, [newNoteText, currentLineInfo.lineIndex]);

  const toggleNoteResolved = useCallback((id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, resolved: !n.resolved } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  // ============================================
  // BOOKMARKS
  // ============================================

  const toggleBookmark = useCallback(() => {
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
  }, [currentLineInfo.lineIndex]);

  // ============================================
  // NAVIGATION
  // ============================================

  const scrollToLine = useCallback((lineNumber: number) => {
    const textarea = document.getElementById('script-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const lines = content.split('\n');
    let charIndex = 0;
    for (let i = 0; i < lineNumber - 1 && i < lines.length; i++) {
      charIndex += (lines[i]?.length ?? 0) + 1;
    }

    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);
    setCursorPosition(charIndex);
  }, [content]);

  // ============================================
  // AI FUNCTIONS
  // ============================================

  const handleAIContinue = useCallback(async () => {
    setIsAIWorking(true);
    setAIAction('writing');
    try {
      const result = await continueWriting(content, sources);
      if (result) {
        setContent(prev => prev + '\n\n' + result);
        setIsDirty(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  }, [content, sources]);

  const handleAIRewrite = useCallback(async () => {
    if (!selectedText) return;
    setIsAIWorking(true);
    setAIAction('rewriting');
    try {
      const result = await rewriteText(selectedText, 'screenplay');
      if (result) {
        const newContent = content.substring(0, selectionStart) + result + content.substring(selectionEnd);
        setContent(newContent);
        setIsDirty(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  }, [selectedText, content, selectionStart, selectionEnd]);

  const handleAIDialogue = useCallback(async () => {
    setIsAIWorking(true);
    setAIAction('generating');
    try {
      const character = characters[0] || 'CHARACTER';
      const result = await generateDialogue(character, 'a dramatic scene', sources);
      if (result) {
        const dialogueBlock = `\n\n${character}\n${result}\n`;
        setContent(prev => {
          const pos = cursorPosition;
          return prev.substring(0, pos) + dialogueBlock + prev.substring(pos);
        });
        setIsDirty(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIWorking(false);
      setAIAction(null);
    }
  }, [characters, sources, cursorPosition]);

  // ============================================
  // EXPORT
  // ============================================

  const handleExportPDF = useCallback((titlePage?: TitlePageData) => {
    let exportContent = content;
    
    if (titlePage) {
      const titlePageContent = `


                    ${titlePage.title.toUpperCase()}


                    ${titlePage.credit}

                    ${titlePage.author}

${titlePage.source ? `                    ${titlePage.source}\n` : ''}

                    ${titlePage.draftDate}

${titlePage.contact ? `\n\n${titlePage.contact}` : ''}


`;
      exportContent = titlePageContent + '\n\n' + content;
    }
    
    exportToPDF(exportContent, { 
      title: titlePage?.title || 'Untitled Screenplay', 
      author: titlePage?.author || '' 
    });
  }, [content]);

  const handleExportFountain = useCallback(() => {
    exportToFountain(content, activeScriptSource?.title || 'Untitled');
  }, [content, activeScriptSource?.title]);

  const handleExportFDX = useCallback(() => {
    exportToFDX(content, activeScriptSource?.title || 'Untitled');
  }, [content, activeScriptSource?.title]);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'f':
            e.preventDefault();
            setShowFindReplace(prev => !prev);
            break;
          case 'b':
            e.preventDefault();
            toggleBookmark();
            break;
          case 'm':
            e.preventDefault();
            setShowNoteInput(prev => !prev);
            break;
          case 'e':
            e.preventDefault();
            setShowExportModal(true);
            break;
          case '\\':
            e.preventDefault();
            setShowNavigator(prev => !prev);
            break;
          case '1': e.preventDefault(); setCurrentElement('scene'); break;
          case '2': e.preventDefault(); setCurrentElement('action'); break;
          case '3': e.preventDefault(); setCurrentElement('character'); break;
          case '4': e.preventDefault(); setCurrentElement('dialogue'); break;
          case '5': e.preventDefault(); setCurrentElement('parenthetical'); break;
          case '6': e.preventDefault(); setCurrentElement('transition'); break;
          case '7': e.preventDefault(); setCurrentElement('shot'); break;
        }
      }
      if (e.key === 'Escape') {
        setShowFindReplace(false);
        setShowNoteInput(false);
        setShowExportModal(false);
        setFocusMode(false);
        setShowAutoComplete(false);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleSave, toggleBookmark]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={cn(
      "flex h-full gap-3",
      focusMode && "fixed inset-0 z-50 p-4 bg-stone-950"
    )}>
      {/* Navigator */}
      {showNavigator && !focusMode && (
        <Navigator
          isDark={isDark}
          activeTab={navigatorTab}
          scenes={scenes}
          characterStats={characterStats}
          notes={notes}
          bookmarks={bookmarks}
          content={content}
          onTabChange={setNavigatorTab}
          onSceneClick={scrollToLine}
          onCharacterClick={(name) => {
            // Find first occurrence of character
            const lines = content.split('\n');
            const lineIdx = lines.findIndex(l => l.trim().toUpperCase().startsWith(name));
            if (lineIdx >= 0) scrollToLine(lineIdx + 1);
          }}
          onNoteClick={scrollToLine}
          onBookmarkClick={scrollToLine}
          onAddNote={() => setShowNoteInput(true)}
          onToggleNoteResolved={toggleNoteResolved}
          onDeleteNote={deleteNote}
        />
      )}

      {/* Main Editor */}
      <div className={cn(
        "flex-1 flex flex-col h-full rounded-xl border overflow-hidden",
        isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      )}>
        {/* Toolbar */}
        <Toolbar
          isDark={isDark}
          currentElement={currentElement}
          stats={stats}
          showNavigator={showNavigator}
          revisionMode={revisionMode}
          currentRevisionColor={currentRevisionColor}
          isTableReading={isTableReading}
          isAIWorking={isAIWorking}
          focusMode={focusMode}
          hasSelection={selectedText.length > 0}
          onToggleNavigator={() => setShowNavigator(!showNavigator)}
          onElementChange={setCurrentElement}
          onToggleRevision={() => setRevisionMode(!revisionMode)}
          onRevisionColorChange={(color) => {
            setCurrentRevisionColor(color);
            setRevisionMode(true);
          }}
          onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
          onToggleNoteInput={() => setShowNoteInput(!showNoteInput)}
          onToggleTableRead={() => setIsTableReading(!isTableReading)}
          onAIContinue={handleAIContinue}
          onAIRewrite={handleAIRewrite}
          onAIDialogue={handleAIDialogue}
          onToggleFocus={() => setFocusMode(!focusMode)}
          onExport={() => setShowExportModal(true)}
        />

        {/* Note Input Bar */}
        {showNoteInput && (
          <div className={cn(
            "h-12 flex items-center gap-3 px-4 border-b shrink-0",
            isDark ? 'bg-amber-500/10 border-stone-800' : 'bg-amber-50 border-stone-200'
          )}>
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={`Add note at line ${currentLineInfo.lineIndex + 1}...`}
              className={cn(
                "flex-1 h-9 px-4 rounded-lg text-sm outline-none",
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
                "h-9 px-5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40",
                "bg-amber-500 text-white hover:bg-amber-400"
              )}
            >
              Add
            </button>
          </div>
        )}

        {/* Editor Area */}
        <EditorArea
          isDark={isDark}
          content={content}
          cursorPosition={cursorPosition}
          currentElement={currentElement}
          currentLineInfo={currentLineInfo}
          fontSize={settings.fontSize}
          notes={notes}
          bookmarks={bookmarks}
          revisionMarks={revisionMarks}
          showAutoComplete={showAutoComplete}
          autoCompleteOptions={autoCompleteOptions}
          autoCompleteIndex={autoCompleteIndex}
          autoCompleteType={autoCompleteType}
          onContentChange={handleContentChange}
          onCursorChange={handleCursorChange}
          onSelectionChange={handleSelectionChange}
          onKeyDown={handleKeyDown}
          onAutoCompleteSelect={applyAutoComplete}
        />

        {/* Status Bar */}
        <StatusBar
          isDark={isDark}
          currentElement={currentElement}
          currentLineInfo={currentLineInfo}
          stats={stats}
          revisionMode={revisionMode}
          currentRevisionColor={currentRevisionColor}
          isAIWorking={isAIWorking}
          aiAction={aiAction}
          isDirty={isDirty}
          isSaving={isSaving}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isDark={isDark}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportPDF={handleExportPDF}
        onExportFountain={handleExportFountain}
        onExportFDX={handleExportFDX}
        initialTitle={activeScriptSource?.title}
        initialAuthor=""
      />
    </div>
  );
};

export default ScriptEditor;

