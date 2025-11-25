import React, { useState } from 'react';
import { useStory } from '../context/StoryContext';
import { Plus, ArrowDown, Flag, Trash2, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getGeminiClient } from '../services/geminiService';

const StoryMap: React.FC = () => {
  const { storyMap, addStoryNode, updateStoryNode, deleteStoryNode, theme, sources } = useStory();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingNodeId, setGeneratingNodeId] = useState<string | null>(null);

  const addCause = (childId: string) => {
    addStoryNode({
      title: 'New Event',
      description: 'What leads to this?',
      type: 'cause',
      parentId: childId
    });
  };

  const buildChain = (nodeId: string): typeof storyMap => {
    const node = storyMap.find(n => n.id === nodeId);
    if (!node) return [];
    
    const causes = storyMap.filter(n => n.parentId === nodeId);
    
    if (causes.length > 0 && causes[0]) {
      return [...buildChain(causes[0].id), node];
    }
    return [node];
  };

  const rootNode = storyMap.find(n => n.type === 'outcome' && !n.parentId) || storyMap.find(n => n.id === 'root');
  const chain = rootNode ? buildChain(rootNode.id) : [];

  // AI: Suggest cause for a node
  const suggestCause = async (nodeId: string) => {
    const node = storyMap.find(n => n.id === nodeId);
    if (!node) return;
    
    setGeneratingNodeId(nodeId);
    try {
      const client = getGeminiClient();
      const chainContext = chain.map(n => `${n.title}: ${n.description}`).join('\n→ ');
      const characters = sources.filter(s => s.type === 'character').map(c => c.title).join(', ');
      
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Story chain so far (from beginning to end):
${chainContext}

Characters: ${characters || 'Not specified'}

The event "${node.title}" (${node.description}) needs a CAUSE - what event led to this?

Generate a compelling preceding event. Return in this format:
TITLE: [short title]
DESCRIPTION: [1-2 sentences explaining what happens]` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const titleMatch = text.match(/TITLE:\s*(.+)/i);
      const descMatch = text.match(/DESCRIPTION:\s*(.+)/i);
      
      if (titleMatch?.[1] && descMatch?.[1]) {
        addStoryNode({
          title: titleMatch[1].trim(),
          description: descMatch[1].trim(),
          type: 'cause',
          parentId: nodeId
        });
      }
    } catch (e) {
      console.error('Suggest cause failed:', e);
    } finally {
      setGeneratingNodeId(null);
    }
  };

  // AI: Generate complete chain
  const generateChain = async () => {
    if (!rootNode) return;
    
    setIsGenerating(true);
    try {
      const client = getGeminiClient();
      const characters = sources.filter(s => s.type === 'character');
      const locations = sources.filter(s => s.type === 'location');
      
      const context = `
ENDING: ${rootNode.title} - ${rootNode.description}
${characters.length > 0 ? `CHARACTERS: ${characters.map(c => c.title).join(', ')}` : ''}
${locations.length > 0 ? `LOCATIONS: ${locations.map(l => l.title).join(', ')}` : ''}
      `.trim();

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `${context}

Generate 5-7 events that lead to this ending, working BACKWARDS from the ending.
Each event should logically cause the next.

Format each event like this:
1. TITLE: [title] | DESCRIPTION: [what happens]
2. TITLE: [title] | DESCRIPTION: [what happens]
...

Start from just before the ending and work back to the beginning.` }]
        }]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const lines = text.split('\n').filter(l => l.includes('TITLE:'));
      
      let parentId = rootNode.id;
      for (const line of lines) {
        const titleMatch = line.match(/TITLE:\s*([^|]+)/i);
        const descMatch = line.match(/DESCRIPTION:\s*(.+)/i);
        
        if (titleMatch?.[1]) {
          addStoryNode({
            title: titleMatch[1].trim(),
            description: descMatch?.[1]?.trim() || '',
            type: 'cause',
            parentId
          });
          // The new node becomes the parent for the next
          const newNode = storyMap[storyMap.length - 1];
          if (newNode) parentId = newNode.id;
        }
      }
    } catch (e) {
      console.error('Generate chain failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col rounded-2xl shadow-subtle border overflow-hidden",
      theme === 'dark'
        ? 'bg-stone-900 border-stone-800'
        : 'bg-white border-stone-200/60'
    )}>
      
      {/* Header */}
      <div className={cn(
        "h-14 px-6 flex items-center justify-between border-b shrink-0",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
      )}>
        <div>
          <h2 className={cn(
            "text-base font-semibold",
            theme === 'dark' ? 'text-white' : 'text-stone-900'
          )}>Inverse Story Builder</h2>
          <p className={cn(
            "text-xs",
            theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
          )}>Work backwards from the ending to the beginning</p>
        </div>
        
        {/* AI Generate Chain */}
        {rootNode && (
          <button
            onClick={generateChain}
            disabled={isGenerating}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-2 transition-all",
              theme === 'dark'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 disabled:opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 disabled:opacity-50'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={12} />
                AI Generate Chain
              </>
            )}
          </button>
        )}
      </div>
       
      {/* Canvas */}
      <div className={cn(
        "flex-1 overflow-auto p-8 relative",
        theme === 'dark' ? 'bg-stone-950' : 'bg-stone-50'
      )}>
        {/* Subtle grid */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none",
            theme === 'dark' ? 'opacity-[0.02]' : 'opacity-[0.03]'
          )}
          style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="flex flex-col items-center gap-0 min-h-full justify-end py-12 w-full max-w-2xl mx-auto">
           
          {/* Start marker */}
          <div className="flex flex-col items-center mb-6 opacity-40">
            <Flag className={cn(
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )} size={18} strokeWidth={1.5} />
            <span className={cn(
              "text-[11px] font-medium uppercase tracking-wider mt-2",
              theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
            )}>Beginning</span>
          </div>

          {/* Connection line */}
          <div className={cn(
            "h-10 border-l-2 border-dashed",
            theme === 'dark' ? 'border-stone-700' : 'border-stone-300'
          )} />

          {chain.map((node, index) => (
            <React.Fragment key={node.id}>
              
              {/* Connector */}
              {index > 0 && (
                <div className={cn(
                  "h-10 w-px relative my-1",
                  theme === 'dark' ? 'bg-stone-700' : 'bg-stone-200'
                )}>
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded-full border",
                    theme === 'dark'
                      ? 'bg-stone-900 border-stone-700'
                      : 'bg-white border-stone-200'
                  )}>
                    <ArrowDown className={cn(
                      theme === 'dark' ? 'text-stone-600' : 'text-stone-300'
                    )} size={10} strokeWidth={2} />
                  </div>
                </div>
              )}

              <div className="relative group w-full flex justify-center">
                {/* Add cause buttons */}
                {index === 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    <button 
                      onClick={() => addCause(node.id)}
                      className={cn(
                        "border shadow-subtle px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 active:scale-95",
                        theme === 'dark'
                          ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-900 hover:text-white hover:border-stone-900'
                      )}
                    >
                      <Plus size={12} strokeWidth={2} /> Add
                    </button>
                    <button 
                      onClick={() => suggestCause(node.id)}
                      disabled={generatingNodeId === node.id}
                      className={cn(
                        "border shadow-subtle px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-200 active:scale-95",
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500 hover:opacity-90'
                          : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-purple-400 hover:opacity-90'
                      )}
                    >
                      {generatingNodeId === node.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Wand2 size={12} />
                      )}
                      AI Suggest
                    </button>
                  </div>
                )}

                {/* Node card */}
                <div className={cn(
                  "w-full rounded-xl p-5 border transition-all duration-200 relative",
                  node.type === 'outcome' 
                    ? theme === 'dark'
                      ? 'border-white bg-stone-800 shadow-elevated'
                      : 'border-stone-900 bg-white shadow-elevated'
                    : theme === 'dark'
                      ? 'border-stone-700 bg-stone-800 hover:border-stone-600 group-hover:shadow-elevated'
                      : 'border-stone-200 bg-white hover:border-stone-300 group-hover:shadow-subtle'
                )}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md",
                        node.type === 'outcome' 
                          ? theme === 'dark'
                            ? 'bg-white text-stone-900'
                            : 'bg-stone-900 text-white'
                          : theme === 'dark'
                            ? 'bg-stone-700 text-stone-400'
                            : 'bg-stone-100 text-stone-500'
                      )}>
                        {node.type === 'outcome' ? 'Ending' : `Step ${chain.length - index}`}
                      </span>
                      {node.type !== 'outcome' && (
                        <span className={cn(
                          "text-[10px] font-mono",
                          theme === 'dark' ? 'text-stone-600' : 'text-stone-400'
                        )}>→</span>
                      )}
                    </div>
                    {node.type !== 'outcome' && (
                      <button 
                        onClick={() => deleteStoryNode(node.id)}
                        className={cn(
                          "p-1 rounded transition-colors opacity-0 group-hover:opacity-100",
                          theme === 'dark'
                            ? 'text-stone-600 hover:text-stone-300'
                            : 'text-stone-300 hover:text-stone-600'
                        )}
                      >
                        <Trash2 size={13} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                   
                  <div className="space-y-2">
                    <input 
                      value={node.title}
                      onChange={(e) => updateStoryNode(node.id, { title: e.target.value })}
                      className={cn(
                        "w-full font-semibold text-lg outline-none bg-transparent",
                        theme === 'dark'
                          ? 'text-white placeholder:text-stone-600'
                          : 'text-stone-900 placeholder:text-stone-300'
                      )}
                      placeholder="Event title..."
                    />
                    <textarea 
                      value={node.description}
                      onChange={(e) => updateStoryNode(node.id, { description: e.target.value })}
                      className={cn(
                        "w-full text-sm outline-none resize-none bg-transparent leading-relaxed",
                        theme === 'dark'
                          ? 'text-stone-300 placeholder:text-stone-600'
                          : 'text-stone-600 placeholder:text-stone-300'
                      )}
                      rows={2}
                      placeholder="What happens..."
                    />
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
           
          {/* End marker */}
          <div className="mt-4">
            <div className={cn(
              "w-2 h-2 rounded-full mx-auto",
              theme === 'dark' ? 'bg-white' : 'bg-stone-900'
            )} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryMap;
