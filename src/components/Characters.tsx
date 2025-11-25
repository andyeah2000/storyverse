import React, { useState, useMemo } from 'react';
import { useStory } from '../context/StoryContext';
import { Source, CharacterDetails } from '../types';
import { 
  User, 
  Users, 
  Heart, 
  Swords, 
  Shield, 
  Target,
  Sparkles,
  Loader2,
  Plus,
  Search,
  ChevronRight,
  X,
  Edit3,
  Trash2,
  Link2,
  Crown,
  Zap,
  Star,
  Eye,
  BookOpen,
  ArrowRight,
  Wand2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiClient } from '../services/geminiService';

// Character stat types for RPG-style display
interface CharacterStats {
  strength: number;
  intelligence: number;
  charisma: number;
  wisdom: number;
  dexterity: number;
  constitution: number;
}

interface Relationship {
  targetId: string;
  targetName: string;
  type: 'ally' | 'enemy' | 'family' | 'romantic' | 'mentor' | 'rival' | 'neutral';
  description: string;
}

const RELATIONSHIP_TYPES = {
  ally: { icon: Shield, color: 'text-blue-500 bg-blue-500/10', label: 'Ally' },
  enemy: { icon: Swords, color: 'text-red-500 bg-red-500/10', label: 'Enemy' },
  family: { icon: Users, color: 'text-purple-500 bg-purple-500/10', label: 'Family' },
  romantic: { icon: Heart, color: 'text-pink-500 bg-pink-500/10', label: 'Romantic' },
  mentor: { icon: BookOpen, color: 'text-amber-500 bg-amber-500/10', label: 'Mentor' },
  rival: { icon: Target, color: 'text-orange-500 bg-orange-500/10', label: 'Rival' },
  neutral: { icon: User, color: 'text-stone-500 bg-stone-500/10', label: 'Neutral' },
};

const ROLE_BADGES = {
  protagonist: { color: 'bg-emerald-500', label: 'Protagonist' },
  antagonist: { color: 'bg-red-500', label: 'Antagonist' },
  supporting: { color: 'bg-blue-500', label: 'Supporting' },
  minor: { color: 'bg-stone-500', label: 'Minor' },
};

const Characters: React.FC = () => {
  const { sources, addSource, updateSource, deleteSource, theme } = useStory();
  
  const [selectedCharacter, setSelectedCharacter] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [showRelationshipModal, setShowRelationshipModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const isDark = theme === 'dark';

  // Get all characters
  const characters = useMemo(() => 
    sources.filter(s => s.type === 'character'),
    [sources]
  );

  // Filter by search
  const filteredCharacters = useMemo(() => {
    if (!searchQuery) return characters;
    const q = searchQuery.toLowerCase();
    return characters.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.characterDetails?.role?.toLowerCase().includes(q)
    );
  }, [characters, searchQuery]);

  // Parse relationships from character content
  const parseRelationships = (character: Source): Relationship[] => {
    const relationships: Relationship[] = [];
    const content = character.characterDetails?.relationships || character.content;
    
    // Find mentions of other characters
    characters.forEach(other => {
      if (other.id === character.id) return;
      if (content.toLowerCase().includes(other.title.toLowerCase())) {
        // Try to determine relationship type from context
        const lowerContent = content.toLowerCase();
        const name = other.title.toLowerCase();
        
        let type: Relationship['type'] = 'neutral';
        if (lowerContent.includes(`${name}`) && (lowerContent.includes('enemy') || lowerContent.includes('foe') || lowerContent.includes('rival'))) {
          type = 'enemy';
        } else if (lowerContent.includes('love') || lowerContent.includes('romantic') || lowerContent.includes('partner')) {
          type = 'romantic';
        } else if (lowerContent.includes('family') || lowerContent.includes('brother') || lowerContent.includes('sister') || lowerContent.includes('parent')) {
          type = 'family';
        } else if (lowerContent.includes('mentor') || lowerContent.includes('teacher') || lowerContent.includes('master')) {
          type = 'mentor';
        } else if (lowerContent.includes('ally') || lowerContent.includes('friend') || lowerContent.includes('companion')) {
          type = 'ally';
        }
        
        relationships.push({
          targetId: other.id,
          targetName: other.title,
          type,
          description: `Mentioned in ${character.title}'s profile`
        });
      }
    });
    
    return relationships;
  };

  // Generate character stats from content using AI
  const generateStats = async (character: Source): Promise<CharacterStats> => {
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Based on this character description, generate RPG-style stats (1-20 scale):

Character: ${character.title}
Description: ${character.content}
${character.characterDetails ? `
Role: ${character.characterDetails.role}
Motivation: ${character.characterDetails.motivation}
Backstory: ${character.characterDetails.backstory}
` : ''}

Return ONLY a JSON object with these exact keys and number values (1-20):
{"strength": X, "intelligence": X, "charisma": X, "wisdom": X, "dexterity": X, "constitution": X}` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e) {
      console.error('Stats generation failed:', e);
    }
    
    // Default stats
    return { strength: 10, intelligence: 10, charisma: 10, wisdom: 10, dexterity: 10, constitution: 10 };
  };

  // AI Generate full character profile
  const generateCharacterProfile = async (name: string) => {
    setIsGenerating(true);
    try {
      const client = getGeminiClient();
      const existingChars = characters.map(c => c.title).join(', ');
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Create a detailed character profile for "${name}" for a screenplay/story.
${existingChars ? `Existing characters in this story: ${existingChars}` : ''}

Generate a complete profile in this JSON format:
{
  "name": "${name}",
  "role": "protagonist|antagonist|supporting|minor",
  "age": "age or age range",
  "appearance": "physical description (2-3 sentences)",
  "personality": "personality traits and behavior (2-3 sentences)",
  "backstory": "character history (3-4 sentences)",
  "motivation": "what drives them (1-2 sentences)",
  "flaw": "their main weakness or flaw",
  "arc": "how they change through the story",
  "relationships": "connections to other characters",
  "quirks": "unique habits or traits"
}

Be creative and specific. Make them memorable.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      
      if (match) {
        const profile = JSON.parse(match[0]);
        
        addSource({
          title: profile.name || name,
          content: `${profile.appearance}\n\n${profile.personality}\n\n${profile.backstory}`,
          type: 'character',
          tags: [profile.role],
          characterDetails: {
            age: profile.age,
            role: profile.role as CharacterDetails['role'],
            motivation: profile.motivation,
            flaw: profile.flaw,
            arc: profile.arc,
            relationships: profile.relationships,
            backstory: profile.backstory,
          }
        });
      }
    } catch (e) {
      console.error('Profile generation failed:', e);
    } finally {
      setIsGenerating(false);
      setIsCreating(false);
    }
  };

  // AI Generate specific field
  const generateField = async (field: string) => {
    if (!selectedCharacter) return;
    setGeneratingField(field);
    
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `For this character:
Name: ${selectedCharacter.title}
Current Info: ${selectedCharacter.content}
${selectedCharacter.characterDetails?.backstory ? `Backstory: ${selectedCharacter.characterDetails.backstory}` : ''}

Generate a compelling "${field}" for this character. Be specific, creative, and consistent with their existing profile.
Return only the ${field} content, nothing else.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      
      if (text) {
        const updates: Partial<CharacterDetails> = {};
        switch (field) {
          case 'motivation':
            updates.motivation = text;
            break;
          case 'flaw':
            updates.flaw = text;
            break;
          case 'arc':
            updates.arc = text;
            break;
          case 'backstory':
            updates.backstory = text;
            break;
          case 'relationships':
            updates.relationships = text;
            break;
        }
        
        updateSource(selectedCharacter.id, {
          characterDetails: {
            ...selectedCharacter.characterDetails,
            ...updates
          }
        });
        
        // Update selected character locally
        setSelectedCharacter({
          ...selectedCharacter,
          characterDetails: {
            ...selectedCharacter.characterDetails,
            ...updates
          }
        });
      }
    } catch (e) {
      console.error('Field generation failed:', e);
    } finally {
      setGeneratingField(null);
    }
  };

  // Create new character
  const [newCharName, setNewCharName] = useState('');

  return (
    <div className={cn(
      "h-full flex rounded-2xl shadow-subtle border overflow-hidden",
      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
    )}>
      
      {/* Left Sidebar - Character List */}
      <div className={cn(
        "w-72 border-r flex flex-col shrink-0",
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        {/* Header */}
        <div className={cn(
          "h-14 px-4 flex items-center justify-between border-b shrink-0",
          isDark ? 'border-stone-800' : 'border-stone-100'
        )}>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-stone-400" />
            <span className={cn(
              "font-semibold",
              isDark ? 'text-white' : 'text-stone-900'
            )}>Characters</span>
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
            )}>
              {characters.length}
            </span>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
              isDark ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
            )}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className={cn(
                "w-full h-9 pl-9 pr-3 rounded-lg text-sm outline-none transition-all border",
                isDark
                  ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-1 focus:ring-white/20'
                  : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900/10'
              )}
            />
          </div>
        </div>

        {/* Character List */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {filteredCharacters.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-12 text-center",
              isDark ? 'text-stone-600' : 'text-stone-400'
            )}>
              <User size={32} strokeWidth={1.5} className="mb-3" />
              <p className="text-sm font-medium">No characters yet</p>
              <p className="text-xs mt-1 opacity-70">Create your first character</p>
            </div>
          ) : (
            filteredCharacters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={cn(
                  "w-full p-3 rounded-xl text-left transition-all group",
                  selectedCharacter?.id === char.id
                    ? isDark ? 'bg-stone-700' : 'bg-stone-200'
                    : isDark ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold",
                    char.characterDetails?.role === 'protagonist'
                      ? 'bg-emerald-500/20 text-emerald-500'
                      : char.characterDetails?.role === 'antagonist'
                        ? 'bg-red-500/20 text-red-500'
                        : isDark ? 'bg-stone-700 text-stone-400' : 'bg-stone-200 text-stone-500'
                  )}>
                    {char.characterDetails?.imageUrl ? (
                      <img 
                        src={char.characterDetails.imageUrl} 
                        alt={char.title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      char.title.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      isDark ? 'text-white' : 'text-stone-900'
                    )}>
                      {char.title}
                    </h3>
                    {char.characterDetails?.role && (
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wide",
                        char.characterDetails.role === 'protagonist' ? 'text-emerald-500' :
                        char.characterDetails.role === 'antagonist' ? 'text-red-500' :
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      )}>
                        {char.characterDetails.role}
                      </span>
                    )}
                  </div>
                  
                  <ChevronRight size={14} className={cn(
                    "shrink-0 mt-1 transition-transform",
                    selectedCharacter?.id === char.id && 'rotate-90',
                    isDark ? 'text-stone-600' : 'text-stone-300'
                  )} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Add */}
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
            AI Create Character
          </button>
        </div>
      </div>

      {/* Main Content - Character Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedCharacter ? (
          <>
            {/* Character Header */}
            <div className={cn(
              "h-16 px-6 flex items-center justify-between border-b shrink-0",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  selectedCharacter.characterDetails?.role === 'protagonist'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : selectedCharacter.characterDetails?.role === 'antagonist'
                      ? 'bg-red-500/20 text-red-500'
                      : isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                )}>
                  {selectedCharacter.characterDetails?.imageUrl ? (
                    <img 
                      src={selectedCharacter.characterDetails.imageUrl}
                      alt={selectedCharacter.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    selectedCharacter.title.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className={cn(
                    "text-xl font-bold",
                    isDark ? 'text-white' : 'text-stone-900'
                  )}>
                    {selectedCharacter.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedCharacter.characterDetails?.role && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium text-white",
                        ROLE_BADGES[selectedCharacter.characterDetails.role]?.color || 'bg-stone-500'
                      )}>
                        {ROLE_BADGES[selectedCharacter.characterDetails.role]?.label}
                      </span>
                    )}
                    {selectedCharacter.characterDetails?.age && (
                      <span className={cn(
                        "text-xs",
                        isDark ? 'text-stone-500' : 'text-stone-400'
                      )}>
                        {selectedCharacter.characterDetails.age}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
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
                    deleteSource(selectedCharacter.id);
                    setSelectedCharacter(null);
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

            {/* Character Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Description */}
                <section className={cn(
                  "p-5 rounded-xl border",
                  isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'
                )}>
                  <h2 className={cn(
                    "text-sm font-semibold uppercase tracking-wide mb-3 flex items-center gap-2",
                    isDark ? 'text-stone-400' : 'text-stone-500'
                  )}>
                    <Eye size={14} />
                    Description
                  </h2>
                  {editMode ? (
                    <textarea
                      value={selectedCharacter.content}
                      onChange={(e) => {
                        updateSource(selectedCharacter.id, { content: e.target.value });
                        setSelectedCharacter({ ...selectedCharacter, content: e.target.value });
                      }}
                      className={cn(
                        "w-full min-h-[120px] p-3 rounded-lg text-sm outline-none resize-none border",
                        isDark
                          ? 'bg-stone-900 border-stone-700 text-stone-200'
                          : 'bg-white border-stone-200 text-stone-700'
                      )}
                    />
                  ) : (
                    <p className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap",
                      isDark ? 'text-stone-300' : 'text-stone-600'
                    )}>
                      {selectedCharacter.content || 'No description yet.'}
                    </p>
                  )}
                </section>

                {/* Character Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Motivation */}
                  <DetailCard
                    title="Motivation"
                    icon={<Target size={14} />}
                    content={selectedCharacter.characterDetails?.motivation}
                    isDark={isDark}
                    editMode={editMode}
                    isGenerating={generatingField === 'motivation'}
                    onGenerate={() => generateField('motivation')}
                    onChange={(val) => {
                      updateSource(selectedCharacter.id, {
                        characterDetails: { ...selectedCharacter.characterDetails, motivation: val }
                      });
                      setSelectedCharacter({
                        ...selectedCharacter,
                        characterDetails: { ...selectedCharacter.characterDetails, motivation: val }
                      });
                    }}
                  />
                  
                  {/* Flaw */}
                  <DetailCard
                    title="Flaw"
                    icon={<Zap size={14} />}
                    content={selectedCharacter.characterDetails?.flaw}
                    isDark={isDark}
                    editMode={editMode}
                    isGenerating={generatingField === 'flaw'}
                    onGenerate={() => generateField('flaw')}
                    onChange={(val) => {
                      updateSource(selectedCharacter.id, {
                        characterDetails: { ...selectedCharacter.characterDetails, flaw: val }
                      });
                      setSelectedCharacter({
                        ...selectedCharacter,
                        characterDetails: { ...selectedCharacter.characterDetails, flaw: val }
                      });
                    }}
                  />
                  
                  {/* Arc */}
                  <DetailCard
                    title="Character Arc"
                    icon={<ArrowRight size={14} />}
                    content={selectedCharacter.characterDetails?.arc}
                    isDark={isDark}
                    editMode={editMode}
                    isGenerating={generatingField === 'arc'}
                    onGenerate={() => generateField('arc')}
                    onChange={(val) => {
                      updateSource(selectedCharacter.id, {
                        characterDetails: { ...selectedCharacter.characterDetails, arc: val }
                      });
                      setSelectedCharacter({
                        ...selectedCharacter,
                        characterDetails: { ...selectedCharacter.characterDetails, arc: val }
                      });
                    }}
                  />
                  
                  {/* Backstory */}
                  <DetailCard
                    title="Backstory"
                    icon={<BookOpen size={14} />}
                    content={selectedCharacter.characterDetails?.backstory}
                    isDark={isDark}
                    editMode={editMode}
                    isGenerating={generatingField === 'backstory'}
                    onGenerate={() => generateField('backstory')}
                    onChange={(val) => {
                      updateSource(selectedCharacter.id, {
                        characterDetails: { ...selectedCharacter.characterDetails, backstory: val }
                      });
                      setSelectedCharacter({
                        ...selectedCharacter,
                        characterDetails: { ...selectedCharacter.characterDetails, backstory: val }
                      });
                    }}
                  />
                </div>

                {/* Relationships */}
                <section className={cn(
                  "p-5 rounded-xl border",
                  isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={cn(
                      "text-sm font-semibold uppercase tracking-wide flex items-center gap-2",
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    )}>
                      <Link2 size={14} />
                      Relationships
                    </h2>
                    <button
                      onClick={() => generateField('relationships')}
                      disabled={generatingField === 'relationships'}
                      className={cn(
                        "h-7 px-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                        isDark
                          ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      )}
                    >
                      {generatingField === 'relationships' ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      AI Generate
                    </button>
                  </div>
                  
                  {/* Detected Relationships */}
                  <div className="space-y-2">
                    {parseRelationships(selectedCharacter).length > 0 ? (
                      parseRelationships(selectedCharacter).map((rel, i) => {
                        const config = RELATIONSHIP_TYPES[rel.type];
                        const Icon = config.icon;
                        return (
                          <div
                            key={i}
                            onClick={() => {
                              const target = characters.find(c => c.id === rel.targetId);
                              if (target) setSelectedCharacter(target);
                            }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                              isDark ? 'hover:bg-stone-700' : 'hover:bg-stone-100'
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              config.color
                            )}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1">
                              <span className={cn(
                                "text-sm font-medium",
                                isDark ? 'text-white' : 'text-stone-900'
                              )}>
                                {rel.targetName}
                              </span>
                              <span className={cn(
                                "text-xs block",
                                isDark ? 'text-stone-500' : 'text-stone-400'
                              )}>
                                {config.label}
                              </span>
                            </div>
                            <ChevronRight size={14} className={cn(
                              isDark ? 'text-stone-600' : 'text-stone-300'
                            )} />
                          </div>
                        );
                      })
                    ) : (
                      <p className={cn(
                        "text-sm text-center py-6",
                        isDark ? 'text-stone-600' : 'text-stone-400'
                      )}>
                        No relationships detected. Mention other character names in the description or use AI to generate.
                      </p>
                    )}
                  </div>
                  
                  {/* Manual Relationships Text */}
                  {selectedCharacter.characterDetails?.relationships && (
                    <div className={cn(
                      "mt-4 pt-4 border-t",
                      isDark ? 'border-stone-700' : 'border-stone-200'
                    )}>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        isDark ? 'text-stone-400' : 'text-stone-500'
                      )}>
                        {selectedCharacter.characterDetails.relationships}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </>
        ) : (
          /* No Character Selected */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mb-4",
              isDark ? 'bg-stone-800' : 'bg-stone-100'
            )}>
              <Users size={32} className={isDark ? 'text-stone-600' : 'text-stone-400'} />
            </div>
            <h2 className={cn(
              "text-xl font-semibold mb-2",
              isDark ? 'text-white' : 'text-stone-900'
            )}>
              Select a Character
            </h2>
            <p className={cn(
              "text-sm text-center max-w-sm mb-6",
              isDark ? 'text-stone-500' : 'text-stone-400'
            )}>
              Choose a character from the list or create a new one to see their full profile.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className={cn(
                "h-10 px-4 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors",
                isDark
                  ? 'bg-white text-stone-900 hover:bg-stone-100'
                  : 'bg-stone-900 text-white hover:bg-stone-800'
              )}
            >
              <Sparkles size={16} />
              Create Character with AI
            </button>
          </div>
        )}
      </div>

      {/* Create Character Modal */}
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
              )}>Create Character</h3>
              <button
                onClick={() => { setIsCreating(false); setNewCharName(''); }}
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
                )}>Character Name</label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="Enter character name..."
                  autoFocus
                  className={cn(
                    "w-full h-11 px-4 rounded-xl text-sm outline-none border transition-all",
                    isDark
                      ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-600 focus:ring-2 focus:ring-white/10'
                      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCharName.trim()) {
                      generateCharacterProfile(newCharName.trim());
                    }
                  }}
                />
              </div>
              
              <p className={cn(
                "text-xs",
                isDark ? 'text-stone-500' : 'text-stone-400'
              )}>
                AI will generate a complete character profile including appearance, personality, backstory, motivation, and more.
              </p>
            </div>
            
            <div className={cn(
              "h-16 px-6 flex items-center justify-end gap-3 border-t",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <button
                onClick={() => { setIsCreating(false); setNewCharName(''); }}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                  isDark ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => newCharName.trim() && generateCharacterProfile(newCharName.trim())}
                disabled={!newCharName.trim() || isGenerating}
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

// Detail Card Component
interface DetailCardProps {
  title: string;
  icon: React.ReactNode;
  content?: string;
  isDark: boolean;
  editMode: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onChange: (value: string) => void;
}

const DetailCard: React.FC<DetailCardProps> = ({
  title,
  icon,
  content,
  isDark,
  editMode,
  isGenerating,
  onGenerate,
  onChange
}) => (
  <div className={cn(
    "p-4 rounded-xl border",
    isDark ? 'bg-stone-800/50 border-stone-700' : 'bg-stone-50 border-stone-200'
  )}>
    <div className="flex items-center justify-between mb-2">
      <h3 className={cn(
        "text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5",
        isDark ? 'text-stone-400' : 'text-stone-500'
      )}>
        {icon}
        {title}
      </h3>
      {!editMode && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            "p-1 rounded transition-colors",
            isDark ? 'hover:bg-stone-700 text-stone-500' : 'hover:bg-stone-200 text-stone-400'
          )}
        >
          {isGenerating ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Wand2 size={12} />
          )}
        </button>
      )}
    </div>
    {editMode ? (
      <textarea
        value={content || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${title.toLowerCase()}...`}
        className={cn(
          "w-full min-h-[80px] p-2 rounded-lg text-sm outline-none resize-none border",
          isDark
            ? 'bg-stone-900 border-stone-700 text-stone-200 placeholder:text-stone-600'
            : 'bg-white border-stone-200 text-stone-700 placeholder:text-stone-400'
        )}
      />
    ) : (
      <p className={cn(
        "text-sm leading-relaxed",
        content 
          ? isDark ? 'text-stone-300' : 'text-stone-600'
          : isDark ? 'text-stone-600 italic' : 'text-stone-400 italic'
      )}>
        {content || `No ${title.toLowerCase()} defined. Click the wand to generate.`}
      </p>
    )}
  </div>
);

export default Characters;

