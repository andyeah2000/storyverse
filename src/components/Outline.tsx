import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  FileText,
  Layers,
  Film,
  Zap,
  Loader2,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { OutlineNode } from '../types';
import { getGeminiClient } from '../services/geminiService';

const TYPE_CONFIG = {
  act: { icon: Layers, color: 'text-stone-900 bg-stone-900', label: 'Act' },
  sequence: { icon: FileText, color: 'text-blue-600 bg-blue-100', label: 'Sequence' },
  scene: { icon: Film, color: 'text-emerald-600 bg-emerald-100', label: 'Scene' },
  beat: { icon: Zap, color: 'text-amber-600 bg-amber-100', label: 'Beat' },
};

const OutlineComponent: React.FC = () => {
  const { 
    outline, 
    addOutlineNode, 
    updateOutlineNode, 
    deleteOutlineNode,
    sources,
    beatSheet,
  } = useStory();

  const [selectedType, setSelectedType] = useState<OutlineNode['type']>('act');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddRoot = () => {
    addOutlineNode({
      title: `New ${TYPE_CONFIG[selectedType].label}`,
      type: selectedType,
    });
  };

  // AI Generate Complete Outline
  const generateOutline = async () => {
    setIsGenerating(true);
    try {
      const client = getGeminiClient();
      
      const characters = sources.filter(s => s.type === 'character');
      const locations = sources.filter(s => s.type === 'location');
      const lore = sources.filter(s => s.type === 'lore');
      
      const context = `
STORY CONTEXT:
${characters.length > 0 ? `CHARACTERS:\n${characters.map(c => `- ${c.title}: ${c.content.slice(0, 200)}`).join('\n')}` : ''}
${locations.length > 0 ? `\nLOCATIONS:\n${locations.map(l => `- ${l.title}`).join('\n')}` : ''}
${lore.length > 0 ? `\nWORLD:\n${lore.map(l => `- ${l.title}: ${l.content.slice(0, 100)}`).join('\n')}` : ''}

BEAT SHEET:
${Object.entries(beatSheet).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n') || '(Not filled)'}
      `.trim();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `${context}

Generate a complete 3-Act story outline based on the context. Use this exact JSON format:

[
  {
    "title": "Act 1 - Setup",
    "type": "act",
    "children": [
      {
        "title": "Sequence 1 - Opening",
        "type": "sequence",
        "children": [
          { "title": "Scene 1: [description]", "type": "scene", "children": [] }
        ]
      }
    ]
  }
]

Include 3 acts, each with 2-3 sequences, each sequence with 2-4 scenes. Make it specific to the story.
ONLY output valid JSON, nothing else.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Add nodes recursively
        const addNodes = (nodes: any[], parentId?: string) => {
          for (const node of nodes) {
            const id = addOutlineNode({ title: node.title, type: node.type }, parentId);
            if (node.children?.length && id) {
              addNodes(node.children, id);
            }
          }
        };
        addNodes(parsed);
      }
    } catch (error) {
      console.error('Outline generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalNodes = countNodes(outline);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-subtle border border-stone-200/60 overflow-hidden">
      
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-3">
          <Layers size={18} className="text-stone-400" strokeWidth={1.75} />
          <div>
            <h2 className="text-base font-semibold text-stone-900">Story Outline</h2>
            <p className="text-xs text-stone-500">{totalNodes} elements</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI Generate Button */}
          <button
            onClick={generateOutline}
            disabled={isGenerating}
            className="h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                AI Generate
              </>
            )}
          </button>
          
          <div className="w-px h-6 bg-stone-200" />
          
          <div className="flex bg-stone-100 rounded-lg p-0.5">
            {(Object.keys(TYPE_CONFIG) as OutlineNode['type'][]).map(type => {
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "p-1.5 rounded-md transition-all",
                    selectedType === type 
                      ? 'bg-white shadow-sm' 
                      : 'hover:bg-stone-200/50'
                  )}
                  title={config.label}
                >
                  <Icon size={14} className={cn(
                    selectedType === type 
                      ? 'text-stone-900' 
                      : 'text-stone-400'
                  )} />
                </button>
              );
            })}
          </div>
          <button
            onClick={handleAddRoot}
            className="h-8 px-3 bg-stone-900 text-white rounded-lg font-medium text-xs hover:bg-stone-800 transition-all flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2} />
            Add {TYPE_CONFIG[selectedType].label}
          </button>
        </div>
      </div>

      {/* Outline Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {outline.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Layers size={32} className="text-stone-300 mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-stone-500 mb-1">No outline yet</h3>
            <p className="text-xs text-stone-400 max-w-xs">
              Start by adding Acts, then break them down into Sequences, Scenes, and Beats
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {outline.map(node => (
              <OutlineNodeComponent 
                key={node.id} 
                node={node} 
                depth={0}
                onUpdate={updateOutlineNode}
                onDelete={deleteOutlineNode}
                onAddChild={(parentId, type) => addOutlineNode({ title: `New ${TYPE_CONFIG[type].label}`, type }, parentId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface OutlineNodeProps {
  node: OutlineNode;
  depth: number;
  onUpdate: (id: string, updates: Partial<OutlineNode>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, type: OutlineNode['type']) => void;
}

const OutlineNodeComponent: React.FC<OutlineNodeProps> = ({ 
  node, 
  depth, 
  onUpdate, 
  onDelete, 
  onAddChild 
}) => {
  const [isExpanded, setIsExpanded] = useState(!node.collapsed);
  const [isEditing, setIsEditing] = useState(false);
  
  const config = TYPE_CONFIG[node.type];
  const Icon = config.icon;
  const hasChildren = node.children.length > 0;

  const childTypes: OutlineNode['type'][] = 
    node.type === 'act' ? ['sequence', 'scene'] :
    node.type === 'sequence' ? ['scene', 'beat'] :
    node.type === 'scene' ? ['beat'] : [];

  return (
    <div className="select-none">
      <div 
        className={cn(
          "group flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-stone-50 transition-all",
        )}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-all",
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Type Icon */}
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", config.color)}>
          <Icon size={12} className={node.type === 'act' ? 'text-white' : ''} strokeWidth={2} />
        </div>

        {/* Title */}
        {isEditing ? (
          <input
            autoFocus
            value={node.title}
            onChange={(e) => onUpdate(node.id, { title: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-stone-900"
          />
        ) : (
          <span 
            onClick={() => setIsEditing(true)}
            className="flex-1 text-sm font-medium text-stone-900 cursor-text"
          >
            {node.title}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {childTypes.map(type => (
            <button
              key={type}
              onClick={() => onAddChild(node.id, type)}
              className="p-1 text-stone-400 hover:text-stone-600 rounded hover:bg-stone-100"
              title={`Add ${TYPE_CONFIG[type].label}`}
            >
              <Plus size={12} />
            </button>
          ))}
          <button
            onClick={() => onDelete(node.id)}
            className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-stone-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative">
          {/* Connection line */}
          <div 
            className="absolute left-0 top-0 bottom-4 w-px bg-stone-200"
            style={{ marginLeft: `${depth * 24 + 18}px` }}
          />
          {node.children.map(child => (
            <OutlineNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function countNodes(nodes: OutlineNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children), 0);
}

export default OutlineComponent;