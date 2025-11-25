import React, { useState, useMemo, useCallback } from 'react';
import { useStory } from '../context/StoryContext';
import { Source } from '../types';
import { 
  BookOpen, 
  Search, 
  User, 
  MapPin, 
  Crown, 
  Sword, 
  Lightbulb, 
  FileText,
  Link2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Edit3,
  Trash2,
  X,
  Hash,
  Sparkles,
  Loader2,
  Wand2,
  ExternalLink,
  Globe,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiClient } from '../services/geminiService';

// Category configuration
const CATEGORIES = {
  character: { 
    icon: User, 
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    label: 'Characters',
    singular: 'Character'
  },
  location: { 
    icon: MapPin, 
    color: 'text-green-500 bg-green-500/10 border-green-500/20',
    label: 'Locations',
    singular: 'Location'
  },
  faction: { 
    icon: Crown, 
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    label: 'Factions',
    singular: 'Faction'
  },
  lore: { 
    icon: BookOpen, 
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    label: 'Lore',
    singular: 'Lore'
  },
  event: { 
    icon: Sword, 
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    label: 'Events',
    singular: 'Event'
  },
  concept: { 
    icon: Lightbulb, 
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    label: 'Concepts',
    singular: 'Concept'
  },
  script: { 
    icon: FileText, 
    color: 'text-stone-500 bg-stone-500/10 border-stone-500/20',
    label: 'Scripts',
    singular: 'Script'
  },
};

type CategoryType = keyof typeof CATEGORIES;

interface WikiLink {
  id: string;
  title: string;
  type: CategoryType;
  excerpt: string;
}

const Wiki: React.FC = () => {
  const { sources, addSource, updateSource, deleteSource, theme } = useStory();
  
  const [selectedArticle, setSelectedArticle] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [history, setHistory] = useState<Source[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editMode, setEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', type: 'lore' as CategoryType });

  const isDark = theme === 'dark';

  // Filter sources (exclude scripts from wiki by default)
  const wikiSources = useMemo(() => 
    sources.filter(s => s.type !== 'script'),
    [sources]
  );

  // Group by category
  const categorizedSources = useMemo(() => {
    const groups: Record<CategoryType, Source[]> = {
      character: [],
      location: [],
      faction: [],
      lore: [],
      event: [],
      concept: [],
      script: [],
    };
    
    wikiSources.forEach(source => {
      if (groups[source.type]) {
        groups[source.type].push(source);
      }
    });
    
    return groups;
  }, [wikiSources]);

  // Search filter
  const filteredSources = useMemo(() => {
    let result = wikiSources;
    
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.type === selectedCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return result.sort((a, b) => a.title.localeCompare(b.title));
  }, [wikiSources, selectedCategory, searchQuery]);

  // Find all links (mentions of other articles) in content
  const findLinks = useCallback((content: string): WikiLink[] => {
    const links: WikiLink[] = [];
    
    wikiSources.forEach(source => {
      // Check if this source's title appears in the content
      const regex = new RegExp(`\\b${source.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(content)) {
        links.push({
          id: source.id,
          title: source.title,
          type: source.type as CategoryType,
          excerpt: source.content.slice(0, 100) + '...'
        });
      }
    });
    
    return links;
  }, [wikiSources]);

  // Find backlinks (articles that mention this one)
  const findBacklinks = useCallback((article: Source): WikiLink[] => {
    return wikiSources
      .filter(s => s.id !== article.id)
      .filter(s => {
        const regex = new RegExp(`\\b${article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        return regex.test(s.content);
      })
      .map(s => ({
        id: s.id,
        title: s.title,
        type: s.type as CategoryType,
        excerpt: s.content.slice(0, 100) + '...'
      }));
  }, [wikiSources]);

  // Navigation
  const navigateToArticle = (article: Source) => {
    if (selectedArticle) {
      // Add current to history if navigating to different article
      if (selectedArticle.id !== article.id) {
        const newHistory = [...history.slice(0, historyIndex + 1), selectedArticle];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    setSelectedArticle(article);
    setEditMode(false);
  };

  const goBack = () => {
    if (historyIndex >= 0) {
      const article = history[historyIndex];
      if (article) setSelectedArticle(article);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const article = history[historyIndex + 1];
      if (article) setSelectedArticle(article);
    }
  };

  // Render content with clickable links
  const renderContentWithLinks = (content: string) => {
    let result = content;
    const links = findLinks(content);
    
    // Sort by title length (longest first) to avoid partial replacements
    links.sort((a, b) => b.title.length - a.title.length);
    
    // Create a map of placeholders
    const placeholders: Map<string, { link: WikiLink; placeholder: string }> = new Map();
    
    links.forEach((link, i) => {
      const placeholder = `__WIKI_LINK_${i}__`;
      const regex = new RegExp(`\\b(${link.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      result = result.replace(regex, placeholder);
      placeholders.set(placeholder, { link, placeholder });
    });
    
    // Split and reconstruct with React elements
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    
    placeholders.forEach(({ link, placeholder }) => {
      const index = result.indexOf(placeholder);
      if (index !== -1) {
        if (index > lastIndex) {
          parts.push(result.slice(lastIndex, index));
        }
        parts.push(
          <button
            key={link.id}
            onClick={() => {
              const article = wikiSources.find(s => s.id === link.id);
              if (article) navigateToArticle(article);
            }}
            className={cn(
              "text-blue-500 hover:text-blue-600 hover:underline font-medium inline",
              isDark && 'text-blue-400 hover:text-blue-300'
            )}
          >
            {link.title}
          </button>
        );
        lastIndex = index + placeholder.length;
      }
    });
    
    if (lastIndex < result.length) {
      parts.push(result.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : content;
  };

  // AI Generate Article
  const generateArticle = async () => {
    if (!newArticle.title.trim()) return;
    
    setIsGenerating(true);
    try {
      const client = getGeminiClient();
      
      // Get context from existing articles
      const context = wikiSources.slice(0, 10).map(s => 
        `${s.title} (${s.type}): ${s.content.slice(0, 100)}`
      ).join('\n');

      const categoryConfig = CATEGORIES[newArticle.type];
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `You are writing an encyclopedia entry for a fictional universe.

EXISTING ENTRIES (for context and connections):
${context || 'None yet'}

Create a detailed wiki article for: "${newArticle.title}" (Type: ${categoryConfig.singular})

Write in an encyclopedic, neutral tone like Wikipedia. Include:
- A comprehensive description (3-4 paragraphs)
- Key facts and details specific to this ${categoryConfig.singular.toLowerCase()}
- References to other entries where relevant (use their exact names so they can be linked)
- Historical context if applicable

Format the response as plain text paragraphs. Be creative and detailed. Make it feel like part of a living, breathing fictional universe.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      if (text) {
        addSource({
          title: newArticle.title.trim(),
          content: text,
          type: newArticle.type,
          tags: []
        });
        
        setNewArticle({ title: '', type: 'lore' });
        setIsCreating(false);
      }
    } catch (e) {
      console.error('Article generation failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Expand Article
  const expandArticle = async () => {
    if (!selectedArticle) return;
    
    setIsGenerating(true);
    try {
      const client = getGeminiClient();
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Expand this wiki article with more details:

CURRENT ARTICLE:
Title: ${selectedArticle.title}
Type: ${selectedArticle.type}
Content:
${selectedArticle.content}

Add 2-3 more paragraphs with:
- Additional background information
- More specific details
- Connections to potential other elements in the story
- Interesting trivia or lesser-known facts

Keep the encyclopedic tone. Return ONLY the expanded content (including the original), nothing else.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      if (text) {
        updateSource(selectedArticle.id, { content: text });
        setSelectedArticle({ ...selectedArticle, content: text });
      }
    } catch (e) {
      console.error('Expand failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn(
      "h-full flex rounded-2xl shadow-subtle border overflow-hidden",
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
    )}>
      
      {/* Left Sidebar - Categories & Index */}
      <div className={cn(
        "w-72 border-r flex flex-col shrink-0",
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        {/* Header */}
        <div className={cn(
          "h-14 px-4 flex items-center gap-3 border-b shrink-0",
          isDark ? 'border-stone-800' : 'border-stone-100'
        )}>
          <Globe size={18} className="text-stone-400" />
          <span className={cn(
            "font-semibold",
            isDark ? 'text-white' : 'text-stone-900'
          )}>Universe Wiki</span>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wiki..."
              className={cn(
                "w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none transition-all border",
                isDark
                  ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-1 focus:ring-white/20'
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900/10'
              )}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-2 py-1 rounded text-xs font-medium transition-colors",
                selectedCategory === 'all'
                  ? isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                  : isDark ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              )}
            >
              All ({wikiSources.length})
            </button>
            {(Object.entries(CATEGORIES) as [CategoryType, typeof CATEGORIES[CategoryType]][])
              .filter(([key]) => key !== 'script')
              .map(([key, config]) => {
                const count = categorizedSources[key].length;
                if (count === 0) return null;
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors",
                      selectedCategory === key
                        ? config.color
                        : isDark ? 'bg-stone-800 text-stone-400 hover:bg-stone-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    )}
                  >
                    <Icon size={10} />
                    {count}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Article Index */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {filteredSources.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-12 text-center",
              isDark ? 'text-stone-600' : 'text-stone-400'
            )}>
              <BookOpen size={32} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium">No articles found</p>
              <p className="text-xs mt-1 opacity-70">
                {searchQuery ? 'Try a different search' : 'Create your first article'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredSources.map(article => {
                const config = CATEGORIES[article.type as CategoryType];
                const Icon = config?.icon || BookOpen;
                return (
                  <button
                    key={article.id}
                    onClick={() => navigateToArticle(article)}
                    className={cn(
                      "w-full p-2 rounded-lg text-left transition-all group flex items-center gap-2",
                      selectedArticle?.id === article.id
                        ? isDark ? 'bg-stone-700' : 'bg-stone-200'
                        : isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded flex items-center justify-center shrink-0",
                      config?.color || 'bg-stone-500/10 text-stone-500'
                    )}>
                      <Icon size={12} />
                    </div>
                    <span className={cn(
                      "text-sm truncate flex-1",
                      isDark ? 'text-stone-300' : 'text-stone-700'
                    )}>
                      {article.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Button */}
        <div className={cn(
          "p-3 border-t",
          isDark ? 'border-stone-800' : 'border-stone-100'
        )}>
          <button
            onClick={() => setIsCreating(true)}
            className={cn(
              "w-full h-9 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
              isDark
                ? 'bg-white text-stone-900 hover:bg-stone-100'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            )}
          >
            <Sparkles size={14} />
            Create Article
          </button>
        </div>
      </div>

      {/* Main Content - Article View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedArticle ? (
          <>
            {/* Article Header with Navigation */}
            <div className={cn(
              "h-14 px-6 flex items-center justify-between border-b shrink-0",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <div className="flex items-center gap-3">
                {/* Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={goBack}
                    disabled={historyIndex < 0}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30",
                      isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                    )}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    onClick={goForward}
                    disabled={historyIndex >= history.length - 1}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30",
                      isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                    )}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
                
                {/* Breadcrumb */}
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium border",
                    CATEGORIES[selectedArticle.type as CategoryType]?.color || 'bg-stone-500/10 text-stone-500'
                  )}>
                    {CATEGORIES[selectedArticle.type as CategoryType]?.singular || selectedArticle.type}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}>
                    /
                  </span>
                  <span className={cn(
                    "text-sm font-semibold",
                    isDark ? 'text-white' : 'text-stone-900'
                  )}>
                    {selectedArticle.title}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Expand with AI */}
                <button
                  onClick={expandArticle}
                  disabled={isGenerating}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                    isDark
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50'
                  )}
                >
                  {isGenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  Expand with AI
                </button>
                
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors",
                    editMode
                      ? isDark ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                      : isDark ? 'bg-stone-800 text-stone-300 hover:bg-stone-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  <Edit3 size={12} />
                  {editMode ? 'Done' : 'Edit'}
                </button>
                
                <button
                  onClick={() => {
                    deleteSource(selectedArticle.id);
                    setSelectedArticle(null);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-red-500",
                    isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                  )}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto p-8">
                {/* Title */}
                <h1 className={cn(
                  "text-3xl font-bold mb-2",
                  isDark ? 'text-white' : 'text-stone-900'
                )}>
                  {selectedArticle.title}
                </h1>
                
                {/* Meta */}
                <div className={cn(
                  "flex items-center gap-4 mb-6 pb-6 border-b text-xs",
                  isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-400'
                )}>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Updated {new Date(selectedArticle.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Link2 size={12} />
                    {findLinks(selectedArticle.content).length} links
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers size={12} />
                    {findBacklinks(selectedArticle).length} backlinks
                  </span>
                </div>

                {/* Content */}
                {editMode ? (
                  <textarea
                    value={selectedArticle.content}
                    onChange={(e) => {
                      updateSource(selectedArticle.id, { content: e.target.value });
                      setSelectedArticle({ ...selectedArticle, content: e.target.value });
                    }}
                    className={cn(
                      "w-full min-h-[400px] p-4 rounded-xl text-sm leading-relaxed outline-none resize-none border",
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-stone-200'
                        : 'bg-stone-50 border-stone-200 text-stone-700'
                    )}
                  />
                ) : (
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    isDark ? 'prose-invert' : ''
                  )}>
                    <p className={cn(
                      "text-base leading-relaxed whitespace-pre-wrap",
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}>
                      {renderContentWithLinks(selectedArticle.content)}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className={cn(
                    "mt-8 pt-6 border-t",
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  )}>
                    <h3 className={cn(
                      "text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2",
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}>
                      <Hash size={12} />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.tags.map((tag, i) => (
                        <span
                          key={i}
                          className={cn(
                            "px-2 py-1 rounded text-xs",
                            isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links in this article */}
                {findLinks(selectedArticle.content).length > 0 && (
                  <div className={cn(
                    "mt-8 pt-6 border-t",
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  )}>
                    <h3 className={cn(
                      "text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2",
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}>
                      <Link2 size={12} />
                      Mentioned in this article
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {findLinks(selectedArticle.content).map(link => {
                        const config = CATEGORIES[link.type];
                        const Icon = config?.icon || BookOpen;
                        return (
                          <button
                            key={link.id}
                            onClick={() => {
                              const article = wikiSources.find(s => s.id === link.id);
                              if (article) navigateToArticle(article);
                            }}
                            className={cn(
                              "p-3 rounded-lg text-left transition-colors flex items-start gap-3",
                              isDark ? 'bg-stone-800/50 hover:bg-stone-800' : 'bg-stone-50 hover:bg-stone-100'
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              config?.color || 'bg-stone-500/10 text-stone-500'
                            )}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className={cn(
                                "text-sm font-medium block truncate",
                                isDark ? 'text-white' : 'text-stone-900'
                              )}>
                                {link.title}
                              </span>
                              <span className={cn(
                                "text-xs",
                                isDark ? 'text-stone-500' : 'text-stone-400'
                              )}>
                                {config?.singular}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Backlinks */}
                {findBacklinks(selectedArticle).length > 0 && (
                  <div className={cn(
                    "mt-8 pt-6 border-t",
                    isDark ? 'border-stone-800' : 'border-stone-200'
                  )}>
                    <h3 className={cn(
                      "text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2",
                      isDark ? 'text-stone-500' : 'text-stone-400'
                    )}>
                      <ExternalLink size={12} />
                      Articles that mention this
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {findBacklinks(selectedArticle).map(link => {
                        const config = CATEGORIES[link.type];
                        const Icon = config?.icon || BookOpen;
                        return (
                          <button
                            key={link.id}
                            onClick={() => {
                              const article = wikiSources.find(s => s.id === link.id);
                              if (article) navigateToArticle(article);
                            }}
                            className={cn(
                              "p-3 rounded-lg text-left transition-colors flex items-start gap-3",
                              isDark ? 'bg-stone-800/50 hover:bg-stone-800' : 'bg-stone-50 hover:bg-stone-100'
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              config?.color || 'bg-stone-500/10 text-stone-500'
                            )}>
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <span className={cn(
                                "text-sm font-medium block truncate",
                                isDark ? 'text-white' : 'text-stone-900'
                              )}>
                                {link.title}
                              </span>
                              <span className={cn(
                                "text-xs",
                                isDark ? 'text-stone-500' : 'text-stone-400'
                              )}>
                                {config?.singular}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* No Article Selected - Show Overview */
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {/* Hero */}
              <div className="text-center mb-12">
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4",
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                )}>
                  <Globe size={36} className={isDark ? 'text-stone-400' : 'text-stone-500'} />
                </div>
                <h1 className={cn(
                  "text-2xl font-bold mb-2",
                  isDark ? 'text-white' : 'text-stone-900'
                )}>
                  Universe Wiki
                </h1>
                <p className={cn(
                  "text-sm max-w-md mx-auto",
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )}>
                  Your encyclopedia for the story world. All characters, locations, factions, and lore — interconnected and searchable.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-12">
                <div className={cn(
                  "p-4 rounded-xl text-center",
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                )}>
                  <span className={cn(
                    "text-3xl font-bold block",
                    isDark ? 'text-white' : 'text-stone-900'
                  )}>
                    {wikiSources.length}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    Total Articles
                  </span>
                </div>
                <div className={cn(
                  "p-4 rounded-xl text-center",
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                )}>
                  <span className={cn(
                    "text-3xl font-bold block",
                    isDark ? 'text-white' : 'text-stone-900'
                  )}>
                    {categorizedSources.character.length}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    Characters
                  </span>
                </div>
                <div className={cn(
                  "p-4 rounded-xl text-center",
                  isDark ? 'bg-stone-800' : 'bg-stone-100'
                )}>
                  <span className={cn(
                    "text-3xl font-bold block",
                    isDark ? 'text-white' : 'text-stone-900'
                  )}>
                    {categorizedSources.location.length}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isDark ? 'text-stone-500' : 'text-stone-400'
                  )}>
                    Locations
                  </span>
                </div>
              </div>

              {/* Recent / Featured */}
              <div>
                <h2 className={cn(
                  "text-sm font-semibold uppercase tracking-wide mb-4 flex items-center gap-2",
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}>
                  <Clock size={14} />
                  Recent Articles
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {wikiSources
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 6)
                    .map(article => {
                      const config = CATEGORIES[article.type as CategoryType];
                      const Icon = config?.icon || BookOpen;
                      return (
                        <button
                          key={article.id}
                          onClick={() => navigateToArticle(article)}
                          className={cn(
                            "p-4 rounded-xl text-left transition-colors flex items-start gap-3 border",
                            isDark 
                              ? 'bg-stone-800/50 border-stone-800 hover:bg-stone-800 hover:border-stone-700' 
                              : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            config?.color || 'bg-stone-500/10 text-stone-500'
                          )}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={cn(
                              "text-sm font-medium block truncate",
                              isDark ? 'text-white' : 'text-stone-900'
                            )}>
                              {article.title}
                            </span>
                            <span className={cn(
                              "text-xs line-clamp-2 mt-1",
                              isDark ? 'text-stone-500' : 'text-stone-400'
                            )}>
                              {article.content.slice(0, 80)}...
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Article Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={cn(
            "w-full max-w-md rounded-2xl shadow-2xl overflow-hidden",
            isDark ? 'bg-stone-900' : 'bg-white'
          )}>
            <div className={cn(
              "h-14 px-6 flex items-center justify-between border-b",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <h3 className={cn(
                "font-semibold",
                isDark ? 'text-white' : 'text-stone-900'
              )}>Create Wiki Article</h3>
              <button
                onClick={() => { setIsCreating(false); setNewArticle({ title: '', type: 'lore' }); }}
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
                <label className={cn(
                  "block text-xs font-medium mb-2",
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}>Article Title</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                  placeholder="e.g., The Kingdom of Eldoria"
                  autoFocus
                  className={cn(
                    "w-full h-11 px-4 rounded-xl text-sm outline-none border transition-all",
                    isDark
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-600 focus:ring-2 focus:ring-white/10'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10'
                  )}
                />
              </div>
              
              <div>
                <label className={cn(
                  "block text-xs font-medium mb-2",
                  isDark ? 'text-stone-400' : 'text-stone-500'
                )}>Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(CATEGORIES) as [CategoryType, typeof CATEGORIES[CategoryType]][])
                    .filter(([key]) => key !== 'script')
                    .map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewArticle({ ...newArticle, type: key })}
                          className={cn(
                            "p-3 rounded-xl flex flex-col items-center gap-2 transition-all border",
                            newArticle.type === key
                              ? config.color + ' border-current'
                              : isDark 
                                ? 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                                : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                          )}
                        >
                          <Icon size={18} />
                          <span className="text-[10px] font-medium">{config.singular}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
              
              <p className={cn(
                "text-xs",
                isDark ? 'text-stone-500' : 'text-stone-400'
              )}>
                AI will generate a comprehensive wiki article with connections to your existing universe.
              </p>
            </div>
            
            <div className={cn(
              "h-16 px-6 flex items-center justify-end gap-3 border-t",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <button
                onClick={() => { setIsCreating(false); setNewArticle({ title: '', type: 'lore' }); }}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                  isDark ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Cancel
              </button>
              <button
                onClick={generateArticle}
                disabled={!newArticle.title.trim() || isGenerating}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50",
                  isDark
                    ? 'bg-white text-stone-900 hover:bg-stone-100'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wiki;

