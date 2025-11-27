import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { Source } from '../types';
import { 
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  FileText,
  User,
  MapPin,
  BookOpen,
  Crown,
  Lightbulb,
  Sword,
  StickyNote,
  Layers,
  Map,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

// ============================================
// TYPES
// ============================================

interface FolderNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  icon?: React.ReactNode;
  children?: FolderNode[];
  data?: Source | { type: string; content: any } | { id: string; title?: string; content: string };
  count?: number;
  color?: string;
}

// ============================================
// FILE EXPLORER COMPONENT
// ============================================

const FileExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { 
    sources, 
    notes,
    outline,
    beatSheet,
    storyMap,
    moodBoard,
    addSource,
    deleteSource,
    updateSource,
    setActiveSourceId,
    theme,
    currentProject
  } = useStory();

  const isDark = theme === 'dark';

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['story-bible', 'scripts', 'workspace'])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingFile, setEditingFile] = useState<Source | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // Route mapping for workspace items
  const routeMap: Record<string, string> = {
    'beat-sheet': '/app/beats',
    'outline': '/app/outline', 
    'story-map': '/app/map',
    'notes-folder': '/app/notes',
    'mood-board': '/app/mood-board',
    'characters': '/app/characters',
    'story-bible': '/app/wiki',
  };

  // Handle file/view open on double-click
  const handleFileOpen = useCallback((nodeId: string) => {
    if (routeMap[nodeId]) {
      navigate(routeMap[nodeId]);
      return;
    }

    if (nodeId.startsWith('note-')) {
      navigate('/app/notes');
      return;
    }

    if (nodeId.startsWith('source-')) {
      const sourceId = nodeId.replace('source-', '');
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        if (source.type === 'script') {
          setActiveSourceId(sourceId);
          setSelectedId(nodeId);
          navigate('/app');
        } else {
          setEditingFile(source);
        }
      }
    }
  }, [navigate, sources, routeMap, setActiveSourceId]);

  // Build folder structure
  const folderStructure = useMemo((): FolderNode[] => {
    const characters = sources.filter(s => s.type === 'character');
    const locations = sources.filter(s => s.type === 'location');
    const lore = sources.filter(s => s.type === 'lore');
    const scripts = sources.filter(s => s.type === 'script');
    const factions = sources.filter(s => s.type === 'faction');
    const concepts = sources.filter(s => s.type === 'concept');
    const events = sources.filter(s => s.type === 'event');

    const filledBeats = Object.values(beatSheet).filter(Boolean).length;

    return [
      {
        id: 'story-bible',
        name: 'Story Bible',
        type: 'folder',
        icon: <BookOpen size={13} />,
        count: characters.length + locations.length + lore.length + factions.length + concepts.length + events.length,
        children: [
          {
            id: 'characters',
            name: 'Characters',
            type: 'folder',
            icon: <User size={13} />,
            count: characters.length,
            color: 'text-blue-500',
            children: characters.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <User size={12} />,
              data: s
            }))
          },
          {
            id: 'locations',
            name: 'Locations',
            type: 'folder',
            icon: <MapPin size={13} />,
            count: locations.length,
            color: 'text-emerald-500',
            children: locations.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <MapPin size={12} />,
              data: s
            }))
          },
          {
            id: 'factions',
            name: 'Factions',
            type: 'folder',
            icon: <Crown size={13} />,
            count: factions.length,
            color: 'text-violet-500',
            children: factions.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <Crown size={12} />,
              data: s
            }))
          },
          {
            id: 'lore',
            name: 'Lore',
            type: 'folder',
            icon: <BookOpen size={13} />,
            count: lore.length,
            color: 'text-amber-500',
            children: lore.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <BookOpen size={12} />,
              data: s
            }))
          },
          {
            id: 'concepts',
            name: 'Concepts',
            type: 'folder',
            icon: <Lightbulb size={13} />,
            count: concepts.length,
            color: 'text-yellow-500',
            children: concepts.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <Lightbulb size={12} />,
              data: s
            }))
          },
          {
            id: 'events',
            name: 'Events',
            type: 'folder',
            icon: <Sword size={13} />,
            count: events.length,
            color: 'text-rose-500',
            children: events.map(s => ({
              id: `source-${s.id}`,
              name: s.title,
              type: 'file' as const,
              icon: <Sword size={12} />,
              data: s
            }))
          }
        ]
      },
      {
        id: 'scripts',
        name: 'Scripts',
        type: 'folder',
        icon: <FileText size={13} />,
        count: scripts.length,
        children: scripts.map(s => ({
          id: `source-${s.id}`,
          name: s.title,
          type: 'file' as const,
          icon: <FileText size={12} />,
          data: s
        }))
      },
      {
        id: 'workspace',
        name: 'Workspace',
        type: 'folder',
        icon: <Folder size={13} />,
        children: [
          {
            id: 'beat-sheet',
            name: 'Beat Sheet',
            type: 'file',
            icon: <Layers size={13} />,
            data: { type: 'beatSheet', content: beatSheet },
            count: filledBeats || undefined
          },
          {
            id: 'outline',
            name: 'Outline',
            type: 'file',
            icon: <Layers size={13} />,
            data: { type: 'outline', content: outline },
            count: outline.length || undefined
          },
          {
            id: 'story-map',
            name: 'Story Map',
            type: 'file',
            icon: <Map size={13} />,
            data: { type: 'storyMap', content: storyMap },
            count: storyMap.length || undefined
          },
          {
            id: 'notes-folder',
            name: 'Notes',
            type: 'file',
            icon: <StickyNote size={13} />,
            data: { type: 'notes', content: notes },
            count: notes.length || undefined
          },
          {
            id: 'mood-board',
            name: 'Mood Board',
            type: 'file',
            icon: <ImageIcon size={13} />,
            data: { type: 'moodBoard', content: moodBoard },
            count: moodBoard?.length || undefined
          }
        ]
      }
    ];
  }, [sources, notes, outline, beatSheet, storyMap, moodBoard]);

  // Filter by search
  const filterNodes = useCallback((nodes: FolderNode[], query: string): FolderNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc: FolderNode[], node) => {
      if (node.name.toLowerCase().includes(query.toLowerCase())) {
        acc.push(node);
      } else if (node.children) {
        const filtered = filterNodes(node.children, query);
        if (filtered.length > 0) {
          acc.push({ ...node, children: filtered });
        }
      }
      return acc;
    }, []);
  }, []);

  const filteredStructure = useMemo(() => 
    filterNodes(folderStructure, searchQuery),
    [folderStructure, searchQuery, filterNodes]
  );

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getTypeFromFolderId = (id: string): Source['type'] => {
    const map: Record<string, Source['type']> = {
      'characters': 'character',
      'locations': 'location',
      'factions': 'faction',
      'lore': 'lore',
      'concepts': 'concept',
      'events': 'event',
      'scripts': 'script'
    };
    return map[id] || 'lore';
  };

  const handleCreateItem = (parentId: string) => {
    if (!newItemName.trim()) return;
    
    addSource({
      title: newItemName.trim(),
      content: '',
      type: getTypeFromFolderId(parentId),
      tags: []
    });
    
    setIsCreating(null);
    setNewItemName('');
    setExpandedFolders(prev => new Set([...prev, parentId]));
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleDeleteItem = () => {
    if (!contextMenu) return;
    const id = contextMenu.nodeId.replace('source-', '');
    deleteSource(id);
    setContextMenu(null);
  };

  // ============================================
  // RENDER TREE NODE
  // ============================================

  const renderNode = (node: FolderNode, depth: number) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedId === node.id;
    const isFolder = node.type === 'folder';
    const hasChildren = node.children && node.children.length > 0;
    const isWorkspaceItem = ['beat-sheet', 'outline', 'story-map', 'notes-folder', 'mood-board'].includes(node.id);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center h-7 rounded-md cursor-pointer group transition-colors",
            isSelected
              ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500/10 text-blue-600'
              : isDark ? 'hover:bg-white/5 text-stone-400' : 'hover:bg-black/5 text-stone-600'
          )}
          style={{ paddingLeft: `${depth * 12 + 6}px`, paddingRight: '6px' }}
          onClick={() => {
            if (isFolder && !isWorkspaceItem) onToggle(node.id);
            setSelectedId(node.id);
          }}
          onDoubleClick={() => {
            if (!isFolder || isWorkspaceItem) {
              handleFileOpen(node.id);
            }
          }}
          onContextMenu={(e) => node.data && handleContextMenu(e, node.id)}
        >
          {/* Arrow */}
          <span className="w-4 h-4 flex items-center justify-center shrink-0">
            {isFolder && hasChildren && (
              <ChevronRight 
                size={10} 
                className={cn(
                  "transition-transform duration-150",
                  isExpanded && "rotate-90",
                  isDark ? 'text-stone-500' : 'text-stone-400'
                )} 
              />
            )}
          </span>

          {/* Icon */}
          <span className={cn(
            "w-4 h-4 flex items-center justify-center shrink-0",
            node.color || (isDark ? 'text-stone-500' : 'text-stone-400')
          )}>
            {isFolder 
              ? (isExpanded ? <FolderOpen size={13} /> : <Folder size={13} />)
              : node.icon || <File size={13} />
            }
          </span>

          {/* Name */}
          <span className={cn(
            "flex-1 text-[11px] font-medium ml-1.5 truncate",
            isSelected 
              ? isDark ? 'text-blue-300' : 'text-blue-700'
              : isDark ? 'text-stone-300' : 'text-stone-700'
          )}>
            {node.name}
          </span>

          {/* Count */}
          {node.count !== undefined && node.count > 0 && (
            <span className={cn(
              "text-[9px] font-medium min-w-[16px] h-4 px-1 rounded flex items-center justify-center",
              isDark ? 'bg-white/10 text-stone-500' : 'bg-black/5 text-stone-400'
            )}>
              {node.count}
            </span>
          )}

          {/* Add Button */}
          {isFolder && !isWorkspaceItem && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsCreating(node.id); setExpandedFolders(prev => new Set([...prev, node.id])); }}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-0.5",
                isDark ? 'hover:bg-white/10 text-stone-500' : 'hover:bg-black/10 text-stone-400'
              )}
            >
              <Plus size={10} />
            </button>
          )}
        </div>

        {/* Create Input */}
        {isCreating === node.id && (
          <div 
            className="flex items-center h-7"
            style={{ paddingLeft: `${(depth + 1) * 12 + 6}px`, paddingRight: '6px' }}
          >
            <span className="w-4 h-4 shrink-0" />
            <File size={12} className={isDark ? 'text-stone-500' : 'text-stone-400'} />
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem(node.id);
                if (e.key === 'Escape') { setIsCreating(null); setNewItemName(''); }
              }}
              onBlur={() => { setIsCreating(null); setNewItemName(''); }}
              autoFocus
              placeholder="Name..."
              className={cn(
                "flex-1 h-5 px-1.5 ml-1.5 text-[11px] outline-none rounded",
                isDark
                  ? 'bg-white/10 text-white placeholder:text-stone-600'
                  : 'bg-black/5 text-stone-900 placeholder:text-stone-400'
              )}
            />
          </div>
        )}

        {/* Children */}
        {isFolder && isExpanded && node.children?.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const onToggle = toggleFolder;

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div 
      className={cn(
        "w-60 min-w-60 max-w-60 border-r flex flex-col h-full select-none",
        isDark 
          ? 'bg-stone-900 border-stone-800' 
          : 'bg-stone-50/50 border-stone-200'
      )}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className={cn(
        "h-10 px-3 flex items-center gap-2 border-b shrink-0",
        isDark ? 'border-stone-800' : 'border-stone-200'
      )}>
        <span className={cn(
          "text-[11px] font-semibold uppercase tracking-wider",
          isDark ? 'text-stone-500' : 'text-stone-400'
        )}>
          {currentProject?.name || 'Project'}
        </span>
      </div>

      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search size={11} className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2",
            isDark ? 'text-stone-600' : 'text-stone-400'
          )} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className={cn(
              "w-full h-7 pl-6 pr-2 rounded-md text-[11px] outline-none transition-colors",
              isDark
                ? 'bg-white/5 text-white placeholder:text-stone-600 focus:bg-white/10'
                : 'bg-black/5 text-stone-900 placeholder:text-stone-400 focus:bg-black/10'
            )}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded flex items-center justify-center",
                isDark ? 'hover:bg-white/10 text-stone-500' : 'hover:bg-black/10 text-stone-400'
              )}
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {filteredStructure.map(node => renderNode(node, 0))}
      </div>

      {/* File Preview Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className={cn(
            "w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]",
            isDark ? 'bg-stone-900' : 'bg-white'
          )}>
            <div className={cn(
              "h-12 px-4 flex items-center justify-between border-b shrink-0",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                  isDark ? 'bg-white/10 text-stone-400' : 'bg-black/5 text-stone-500'
                )}>
                  {editingFile.type}
                </span>
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? 'text-white' : 'text-stone-900'
                )}>
                  {editingFile.title}
                </span>
              </div>
              <button
                onClick={() => setEditingFile(null)}
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                  isDark ? 'hover:bg-white/10 text-stone-400' : 'hover:bg-black/5 text-stone-500'
                )}
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className={cn(
                  "w-full h-full min-h-[240px] p-3 rounded-lg text-sm outline-none resize-none",
                  isDark
                    ? 'bg-white/5 text-stone-100 placeholder:text-stone-600'
                    : 'bg-stone-50 text-stone-900 placeholder:text-stone-400'
                )}
                placeholder="Content..."
              />
            </div>
            <div className={cn(
              "h-12 px-4 flex items-center justify-end gap-2 border-t shrink-0",
              isDark ? 'border-stone-800' : 'border-stone-100'
            )}>
              <button
                onClick={() => setEditingFile(null)}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-medium transition-colors",
                  isDark ? 'text-stone-400 hover:bg-white/5' : 'text-stone-600 hover:bg-black/5'
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateSource(editingFile.id, { content: editingFile.content });
                  setEditingFile(null);
                }}
                className={cn(
                  "h-8 px-3 rounded-md text-xs font-medium transition-colors",
                  isDark ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div 
            className={cn(
              "fixed z-50 w-36 rounded-lg shadow-xl border overflow-hidden py-1",
              isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
            )}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleDeleteItem}
              className={cn(
                "w-full px-3 py-1.5 text-xs flex items-center gap-2 transition-colors text-red-500 hover:bg-red-500/10"
              )}
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileExplorer;
