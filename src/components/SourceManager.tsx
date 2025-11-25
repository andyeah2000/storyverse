import React, { useState, useCallback } from 'react';
import { useStory } from '../context/StoryContext';
import { Source, CharacterDetails } from '../types';
import { 
  Plus, 
  Trash2, 
  X, 
  Upload, 
  BookOpen, 
  MapPin, 
  User, 
  FileText, 
  Search,
  Tag,
  ChevronDown,
  ChevronRight,
  Edit3,
  Crown,
  Lightbulb,
  Sword,
  Sparkles,
  Loader2,
  ArrowUpRight,
  Link2,
  ScanText
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiClient } from '../services/geminiService';

const SourceManager: React.FC = () => {
  const { 
    sources, 
    addSource, 
    updateSource, 
    deleteSource, 
    searchQuery, 
    setSearchQuery,
    searchResults,
    theme
  } = useStory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<Source['type']>('lore');
  const [newTags, setNewTags] = useState('');
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails>({});
  const [isDragging, setIsDragging] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // AI: Generate Character
  const generateCharacter = async () => {
    setIsGenerating(true);
    setGeneratingType('character');
    try {
      const client = getGeminiClient();
      const existingChars = sources.filter(s => s.type === 'character').map(c => c.title);
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Generate a unique, compelling character for a screenplay.
${existingChars.length > 0 ? `\nExisting characters (make this one different): ${existingChars.join(', ')}` : ''}

Return in this exact format:
NAME: [Full Name]
AGE: [Age or age range]
ROLE: [protagonist/antagonist/supporting/minor]
DESCRIPTION: [2-3 sentences about appearance and personality]
MOTIVATION: [What drives them]
FLAW: [Their fatal flaw or weakness]
ARC: [How they will change]
BACKSTORY: [2-3 sentences of background]

Be creative and specific. Create a memorable, three-dimensional character.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const name = text.match(/NAME:\s*(.+)/i)?.[1]?.trim() || 'New Character';
      const age = text.match(/AGE:\s*(.+)/i)?.[1]?.trim();
      const role = text.match(/ROLE:\s*(.+)/i)?.[1]?.trim().toLowerCase() as CharacterDetails['role'];
      const description = text.match(/DESCRIPTION:\s*(.+)/i)?.[1]?.trim() || '';
      const motivation = text.match(/MOTIVATION:\s*(.+)/i)?.[1]?.trim();
      const flaw = text.match(/FLAW:\s*(.+)/i)?.[1]?.trim();
      const arc = text.match(/ARC:\s*(.+)/i)?.[1]?.trim();
      const backstory = text.match(/BACKSTORY:\s*(.+)/i)?.[1]?.trim() || '';

      addSource({
        title: name,
        content: description + '\n\n' + backstory,
        type: 'character',
        tags: ['ai-generated'],
        characterDetails: { age, role, motivation, flaw, arc }
      });
    } catch (e) {
      console.error('Generate character failed:', e);
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  // AI: Generate Location
  const generateLocation = async () => {
    setIsGenerating(true);
    setGeneratingType('location');
    try {
      const client = getGeminiClient();
      const existingLocs = sources.filter(s => s.type === 'location').map(l => l.title);
      const chars = sources.filter(s => s.type === 'character').map(c => c.title);
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Generate a unique, atmospheric location for a screenplay.
${existingLocs.length > 0 ? `\nExisting locations: ${existingLocs.join(', ')}` : ''}
${chars.length > 0 ? `\nCharacters who might visit: ${chars.join(', ')}` : ''}

Return in this exact format:
NAME: [Location Name]
TYPE: [interior/exterior]
DESCRIPTION: [3-4 sentences describing the place vividly]
ATMOSPHERE: [The mood and feeling]
HISTORY: [Brief backstory of the place]
DETAILS: [Specific visual details a cinematographer would notice]

Be cinematic and specific. Create a memorable, visually interesting location.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const name = text.match(/NAME:\s*(.+)/i)?.[1]?.trim() || 'New Location';
      const type = text.match(/TYPE:\s*(.+)/i)?.[1]?.trim() || '';
      const description = text.match(/DESCRIPTION:\s*(.+)/i)?.[1]?.trim() || '';
      const atmosphere = text.match(/ATMOSPHERE:\s*(.+)/i)?.[1]?.trim() || '';
      const history = text.match(/HISTORY:\s*(.+)/i)?.[1]?.trim() || '';
      const details = text.match(/DETAILS:\s*(.+)/i)?.[1]?.trim() || '';

      addSource({
        title: name,
        content: `${type.toUpperCase()}\n\n${description}\n\nAtmosphere: ${atmosphere}\n\nHistory: ${history}\n\nVisual Details: ${details}`,
        type: 'location',
        tags: ['ai-generated']
      });
    } catch (e) {
      console.error('Generate location failed:', e);
    } finally {
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  // AI: Extract from Script
  const extractFromScript = async () => {
    const script = sources.find(s => s.type === 'script');
    if (!script) return;
    
    setIsExtracting(true);
    try {
      const client = getGeminiClient();
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Analyze this screenplay and extract all characters and locations.

SCRIPT:
${script.content.slice(0, 10000)}

Return in this exact JSON format:
{
  "characters": [
    { "name": "NAME", "description": "brief description from script context" }
  ],
  "locations": [
    { "name": "LOCATION NAME", "description": "brief description" }
  ]
}

Only include characters and locations that actually appear in the script. Be concise.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        const existingTitles = sources.map(s => s.title.toLowerCase());
        
        // Add characters
        for (const char of data.characters || []) {
          if (!existingTitles.includes(char.name.toLowerCase())) {
            addSource({
              title: char.name,
              content: char.description || 'Extracted from script',
              type: 'character',
              tags: ['extracted']
            });
          }
        }
        
        // Add locations
        for (const loc of data.locations || []) {
          if (!existingTitles.includes(loc.name.toLowerCase())) {
            addSource({
              title: loc.name,
              content: loc.description || 'Extracted from script',
              type: 'location',
              tags: ['extracted']
            });
          }
        }
      }
    } catch (e) {
      console.error('Extract from script failed:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewType('lore');
    setNewTags('');
    setCharacterDetails({});
    setEditingSource(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && !text.includes('\0')) {
          addSource({
            title: file.name,
            content: text,
            type: 'script',
            tags: [],
          });
        }
      };
      reader.readAsText(file);
    });
  }, [addSource]);

  const handleAddSource = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);
    
    if (editingSource) {
      updateSource(editingSource.id, {
        title: newTitle,
        content: newContent,
        type: newType,
        tags,
        characterDetails: newType === 'character' ? characterDetails : undefined,
      });
    } else {
      addSource({
        title: newTitle,
        content: newContent,
        type: newType,
        tags,
        characterDetails: newType === 'character' ? characterDetails : undefined,
      });
    }
    
    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setNewTitle(source.title);
    setNewContent(source.content);
    setNewType(source.type);
    setNewTags(source.tags?.join(', ') || '');
    setCharacterDetails(source.characterDetails || {});
    setIsModalOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'character': return <User size={14} strokeWidth={1.75} />;
      case 'location': return <MapPin size={14} strokeWidth={1.75} />;
      case 'script': return <FileText size={14} strokeWidth={1.75} />;
      case 'faction': return <Crown size={14} strokeWidth={1.75} />;
      case 'concept': return <Lightbulb size={14} strokeWidth={1.75} />;
      case 'event': return <Sword size={14} strokeWidth={1.75} />;
      default: return <BookOpen size={14} strokeWidth={1.75} />;
    }
  };

  // Group sources by type
  const groupedSources = searchResults.reduce((acc, source) => {
    if (!acc[source.type]) acc[source.type] = [];
    acc[source.type]!.push(source);
    return acc;
  }, {} as Record<string, Source[]>);

  const typeOrder: Source['type'][] = ['character', 'location', 'faction', 'lore', 'concept', 'event', 'script'];

  return (
    <div 
      className={cn(
        "w-72 border-r flex flex-col h-full shrink-0 relative transition-all duration-300",
        theme === 'dark' 
          ? 'bg-stone-900 border-stone-800' 
          : 'bg-white border-stone-200/60',
        isDragging && (theme === 'dark' ? 'bg-stone-800' : 'bg-stone-50')
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className={cn(
          "absolute inset-4 z-50 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl pointer-events-none",
          theme === 'dark' 
            ? 'bg-stone-800 border-stone-600' 
            : 'bg-stone-50 border-stone-300'
        )}>
          <Upload size={32} className="text-stone-400 mb-3" strokeWidth={1.5} />
          <p className={cn(
            "text-sm font-medium",
            theme === 'dark' ? 'text-stone-300' : 'text-stone-600'
          )}>Drop to add</p>
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "h-12 px-4 flex items-center border-b shrink-0",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-200/60'
      )}>
        <h2 className={cn(
          "text-sm font-semibold tracking-tight",
          theme === 'dark' ? 'text-white' : 'text-stone-900'
        )}>
          Story Bible
        </h2>
        <span className={cn(
          "ml-2 text-xs px-1.5 py-0.5 rounded-md",
          theme === 'dark' ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
        )}>
          {sources.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={cn(
              "w-full h-8 pl-8 pr-3 rounded-lg text-xs outline-none transition-all",
              theme === 'dark'
                ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-2 focus:ring-white/10'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10',
              'border focus:border-transparent'
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {sources.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
              theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'
            )}>
              <BookOpen size={20} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <p className={cn(
              "text-sm font-medium mb-1",
              theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
            )}>No entries yet</p>
            <p className={cn(
              "text-xs",
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>Drop files or click Add below</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className={cn(
              "text-sm",
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>No matching results</p>
          </div>
        ) : (
          <div className="space-y-4">
            {typeOrder.map(type => {
              const typeSources = groupedSources[type];
              if (!typeSources?.length) return null;

              return (
                <div key={type}>
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider mb-1",
                    theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    {getIcon(type)}
                    {type}s ({typeSources.length})
                  </div>
                  <div className="space-y-1">
                    {typeSources.map(source => (
                      <SourceCard 
                        key={source.id} 
                        source={source}
                        theme={theme}
                        isExpanded={expandedId === source.id}
                        onToggle={() => setExpandedId(expandedId === source.id ? null : source.id)}
                        onEdit={() => handleEdit(source)}
                        onDelete={() => deleteSource(source.id)}
                        onUpdate={(updates) => updateSource(source.id, updates)}
                        allSources={sources}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with AI Actions */}
      <div className={cn(
        "p-3 border-t space-y-2",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-200/60'
      )}>
        {/* AI Generate Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={generateCharacter}
            disabled={isGenerating}
            className={cn(
              "h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
              theme === 'dark'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50'
            )}
          >
            {generatingType === 'character' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <User size={12} />
            )}
            AI Character
          </button>
          <button 
            onClick={generateLocation}
            disabled={isGenerating}
            className={cn(
              "h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all",
              theme === 'dark'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 disabled:opacity-50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 disabled:opacity-50'
            )}
          >
            {generatingType === 'location' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <MapPin size={12} />
            )}
            AI Location
          </button>
        </div>

        {/* Extract from Script */}
        {sources.some(s => s.type === 'script') && (
          <button 
            onClick={extractFromScript}
            disabled={isExtracting}
            className={cn(
              "w-full h-8 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all border",
              theme === 'dark'
                ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 disabled:opacity-50'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50'
            )}
          >
            {isExtracting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ScanText size={12} />
            )}
            Extract from Script
          </button>
        )}

        {/* Add Entry Button */}
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className={cn(
            "w-full h-9 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-subtle",
            theme === 'dark'
              ? 'bg-white text-stone-900 hover:bg-stone-100'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          )}
        >
          <Plus size={16} strokeWidth={2} />
          Add Entry
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={cn(
            "rounded-2xl w-full max-w-lg shadow-floating flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200",
            theme === 'dark' ? 'bg-stone-900' : 'bg-white'
          )}>
            
            {/* Modal Header */}
            <div className={cn(
              "h-14 px-6 flex justify-between items-center border-b shrink-0",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
            )}>
              <h3 className={cn(
                "text-base font-semibold",
                theme === 'dark' ? 'text-white' : 'text-stone-900'
              )}>
                {editingSource ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }} 
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
                  theme === 'dark' 
                    ? 'text-stone-400 hover:text-stone-300 hover:bg-stone-800' 
                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
                )}
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              
              {/* Type selector */}
              <div className="grid grid-cols-4 gap-2">
                {(['character', 'location', 'lore', 'script', 'faction', 'concept', 'event'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={cn(
                      "h-10 text-xs font-medium capitalize rounded-xl border transition-all duration-200",
                      newType === t 
                        ? theme === 'dark'
                          ? 'bg-white text-stone-900 border-white'
                          : 'bg-stone-900 text-white border-stone-900'
                        : theme === 'dark'
                          ? 'bg-stone-800 text-stone-300 border-stone-700 hover:border-stone-600'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-2",
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                )}>Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter title..."
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all",
                    theme === 'dark'
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-2 focus:ring-white/10 focus:border-stone-600'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400'
                  )}
                />
              </div>

              {/* Tags */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-2 flex items-center gap-1.5",
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                )}>
                  <Tag size={12} />
                  Tags (comma separated)
                </label>
                <input 
                  type="text" 
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="hero, main, act-1..."
                  className={cn(
                    "w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all",
                    theme === 'dark'
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-2 focus:ring-white/10 focus:border-stone-600'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400'
                  )}
                />
              </div>
              
              {/* Content */}
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-2",
                  theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
                )}>Content</label>
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter content..."
                  className={cn(
                    "w-full h-32 px-4 py-3 rounded-xl border text-sm outline-none resize-none leading-relaxed transition-all font-mono",
                    theme === 'dark'
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-2 focus:ring-white/10 focus:border-stone-600'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400'
                  )}
                />
              </div>

              {/* Character Details */}
              {newType === 'character' && (
                <div className={cn(
                  "p-4 rounded-xl border space-y-4",
                  theme === 'dark' ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'
                )}>
                  <h4 className={cn(
                    "text-xs font-semibold uppercase tracking-wide flex items-center gap-2",
                    theme === 'dark' ? 'text-stone-300' : 'text-stone-700'
                  )}>
                    <User size={12} />
                    Character Details
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={cn(
                        "block text-[10px] font-medium mb-1",
                        theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                      )}>Age</label>
                      <input
                        type="text"
                        value={characterDetails.age || ''}
                        onChange={(e) => setCharacterDetails(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="30s"
                        className={cn(
                          "w-full h-9 px-3 rounded-lg border text-xs outline-none",
                          theme === 'dark'
                            ? 'bg-stone-700 border-stone-600 text-white'
                            : 'bg-white border-stone-200 text-stone-900'
                        )}
                      />
                    </div>
                    <div>
                      <label className={cn(
                        "block text-[10px] font-medium mb-1",
                        theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                      )}>Role</label>
                      <select
                        value={characterDetails.role || ''}
                        onChange={(e) => setCharacterDetails(prev => ({ 
                          ...prev, 
                          role: e.target.value as CharacterDetails['role'] 
                        }))}
                        className={cn(
                          "w-full h-9 px-3 rounded-lg border text-xs outline-none",
                          theme === 'dark'
                            ? 'bg-stone-700 border-stone-600 text-white'
                            : 'bg-white border-stone-200 text-stone-900'
                        )}
                      >
                        <option value="">Select...</option>
                        <option value="protagonist">Protagonist</option>
                        <option value="antagonist">Antagonist</option>
                        <option value="supporting">Supporting</option>
                        <option value="minor">Minor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-[10px] font-medium mb-1",
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                    )}>Motivation</label>
                    <input
                      type="text"
                      value={characterDetails.motivation || ''}
                      onChange={(e) => setCharacterDetails(prev => ({ ...prev, motivation: e.target.value }))}
                      placeholder="What drives this character?"
                      className={cn(
                        "w-full h-9 px-3 rounded-lg border text-xs outline-none",
                        theme === 'dark'
                          ? 'bg-stone-700 border-stone-600 text-white'
                          : 'bg-white border-stone-200 text-stone-900'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block text-[10px] font-medium mb-1",
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                    )}>Fatal Flaw</label>
                    <input
                      type="text"
                      value={characterDetails.flaw || ''}
                      onChange={(e) => setCharacterDetails(prev => ({ ...prev, flaw: e.target.value }))}
                      placeholder="What holds them back?"
                      className={cn(
                        "w-full h-9 px-3 rounded-lg border text-xs outline-none",
                        theme === 'dark'
                          ? 'bg-stone-700 border-stone-600 text-white'
                          : 'bg-white border-stone-200 text-stone-900'
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn(
                      "block text-[10px] font-medium mb-1",
                      theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                    )}>Character Arc</label>
                    <textarea
                      value={characterDetails.arc || ''}
                      onChange={(e) => setCharacterDetails(prev => ({ ...prev, arc: e.target.value }))}
                      placeholder="How do they change?"
                      rows={2}
                      className={cn(
                        "w-full px-3 py-2 rounded-lg border text-xs outline-none resize-none",
                        theme === 'dark'
                          ? 'bg-stone-700 border-stone-600 text-white'
                          : 'bg-white border-stone-200 text-stone-900'
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className={cn(
              "h-16 px-6 flex justify-end items-center gap-3 border-t shrink-0",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
            )}>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className={cn(
                  "h-10 px-5 font-medium rounded-xl text-sm transition-colors",
                  theme === 'dark'
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSource}
                disabled={!newTitle || !newContent} 
                className={cn(
                  "h-10 px-6 font-medium rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle",
                  theme === 'dark'
                    ? 'bg-white text-stone-900 hover:bg-stone-100'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                {editingSource ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SourceCardProps {
  source: Source;
  theme: 'light' | 'dark';
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Source>) => void;
  allSources: Source[];
}

const SourceCard: React.FC<SourceCardProps> = ({ 
  source, 
  theme, 
  isExpanded,
  onToggle,
  onEdit, 
  onDelete,
  onUpdate,
  allSources
}) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  // AI: Expand this source
  const handleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanding(true);
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Expand this ${source.type} entry with more detail, depth, and creative ideas.

CURRENT CONTENT:
Title: ${source.title}
${source.content}

Write an expanded version that is 2-3x more detailed. Add specific details, nuances, and depth.
Keep the same tone and style. Only output the expanded content.` }]
        }]
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) onUpdate({ content: text });
    } catch (e) {
      console.error('Expand failed:', e);
    } finally {
      setIsExpanding(false);
    }
  };

  // AI: Suggest connections
  const handleSuggestConnections = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSuggesting(true);
    try {
      const client = getGeminiClient();
      const otherSources = allSources
        .filter(s => s.id !== source.id)
        .map(s => `${s.type}: ${s.title}`)
        .slice(0, 20);

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Suggest story connections between this ${source.type} and other elements.

THIS ENTRY:
${source.title}: ${source.content.slice(0, 300)}

OTHER STORY ELEMENTS:
${otherSources.join('\n')}

Suggest 3-5 interesting narrative connections or relationships. Be specific and creative.
Format as bullet points.` }]
        }]
      });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) setSuggestions(text);
    } catch (e) {
      console.error('Suggest connections failed:', e);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className={cn(
      "group rounded-xl transition-all",
      theme === 'dark'
        ? 'hover:bg-stone-800'
        : 'hover:bg-stone-50'
    )}>
      <div 
        className="flex items-start gap-2 p-2 cursor-pointer"
        onClick={onToggle}
      >
        <button className="mt-1 text-stone-400">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-sm truncate",
            theme === 'dark' ? 'text-white' : 'text-stone-900'
          )}>
            {source.title}
          </h3>
          {!isExpanded && (
            <p className={cn(
              "text-xs truncate mt-0.5 font-mono",
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>
              {source.content.slice(0, 50)}...
            </p>
          )}
          {source.tags && source.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {source.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-md",
                    theme === 'dark' 
                      ? 'bg-stone-700 text-stone-400' 
                      : 'bg-stone-100 text-stone-500'
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* AI Expand */}
          <button 
            onClick={handleExpand}
            disabled={isExpanding}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-stone-500 hover:text-purple-400 hover:bg-stone-700' 
                : 'text-stone-400 hover:text-purple-500 hover:bg-stone-100'
            )}
            title="AI Expand"
          >
            {isExpanding ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
          </button>
          {/* AI Connections */}
          <button 
            onClick={handleSuggestConnections}
            disabled={isSuggesting}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-stone-500 hover:text-blue-400 hover:bg-stone-700' 
                : 'text-stone-400 hover:text-blue-500 hover:bg-stone-100'
            )}
            title="AI Connections"
          >
            {isSuggesting ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-700' 
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'
            )}
          >
            <Edit3 size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              theme === 'dark' 
                ? 'text-stone-500 hover:text-red-400 hover:bg-stone-700' 
                : 'text-stone-400 hover:text-red-500 hover:bg-stone-100'
            )}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className={cn(
          "px-6 pb-3 pt-1 text-xs leading-relaxed font-mono",
          theme === 'dark' ? 'text-stone-400' : 'text-stone-600'
        )}>
          {source.content}
          
{/* Character details */}
              {source.type === 'character' && source.characterDetails && (
                <div className={cn(
                  "mt-3 pt-3 border-t space-y-2",
                  theme === 'dark' ? 'border-stone-700' : 'border-stone-200'
                )}>
                  {source.characterDetails.role && (
                    <div><span className="opacity-50">Role:</span> {source.characterDetails.role}</div>
                  )}
                  {source.characterDetails.motivation && (
                    <div><span className="opacity-50">Motivation:</span> {source.characterDetails.motivation}</div>
                  )}
                  {source.characterDetails.flaw && (
                    <div><span className="opacity-50">Flaw:</span> {source.characterDetails.flaw}</div>
                  )}
                  {source.characterDetails.arc && (
                    <div><span className="opacity-50">Arc:</span> {source.characterDetails.arc}</div>
                  )}
                </div>
              )}

              {/* AI Suggestions */}
              {suggestions && (
                <div className={cn(
                  "mt-3 pt-3 border-t",
                  theme === 'dark' ? 'border-stone-700' : 'border-stone-200'
                )}>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-purple-500 mb-2">
                    <Sparkles size={10} />
                    AI Connections
                  </div>
                  <div className="whitespace-pre-wrap text-xs">{suggestions}</div>
                  <button 
                    onClick={() => setSuggestions(null)}
                    className={cn(
                      "mt-2 text-[10px] px-2 py-1 rounded",
                      theme === 'dark' ? 'bg-stone-700 text-stone-400' : 'bg-stone-100 text-stone-500'
                    )}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

export default SourceManager;
