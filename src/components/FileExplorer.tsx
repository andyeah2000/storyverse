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
  Upload,
  Trash2,
  Edit3,
  Copy,
  X,
  RefreshCw
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
    theme,
    currentProject
  } = useStory();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['story-bible', 'workspace'])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingFile, setEditingFile] = useState<Source | null>(null);

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
  const handleFileOpen = useCallback((nodeId: string, nodeData?: any) => {
    // Check if it's a workspace route item
    if (routeMap[nodeId]) {
      navigate(routeMap[nodeId]);
      return;
    }

    // Check if it's a note
    if (nodeId.startsWith('note-')) {
      navigate('/app/notes');
      return;
    }

    // Check if it's a source file - open in editor
    if (nodeId.startsWith('source-')) {
      const sourceId = nodeId.replace('source-', '');
      const source = sources.find(s => s.id === sourceId);
      if (source) {
        if (source.type === 'script') {
          // Navigate to editor for scripts
          navigate('/app');
        } else {
          // For other sources, show in a preview/edit mode
          setEditingFile(source);
        }
      }
    }
  }, [navigate, sources, routeMap]);

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
        icon: <BookOpen size={14} />,
        count: sources.length,
        children: [
          {
            id: 'characters',
            name: 'Characters',
            type: 'folder',
            icon: <User size={14} />,
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
            icon: <MapPin size={14} />,
            count: locations.length,
            color: 'text-green-500',
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
            icon: <Crown size={14} />,
            count: factions.length,
            color: 'text-purple-500',
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
            icon: <BookOpen size={14} />,
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
            icon: <Lightbulb size={14} />,
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
            icon: <Sword size={14} />,
            count: events.length,
            color: 'text-red-500',
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
        icon: <FileText size={14} />,
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
        icon: <Folder size={14} />,
        children: [
          {
            id: 'beat-sheet',
            name: 'Beat Sheet',
            type: 'file',
            icon: <Layers size={14} />,
            data: { type: 'beatSheet', content: beatSheet },
            count: filledBeats
          },
          {
            id: 'outline',
            name: 'Outline',
            type: 'file',
            icon: <Layers size={14} />,
            data: { type: 'outline', content: outline },
            count: outline.length
          },
          {
            id: 'story-map',
            name: 'Story Map',
            type: 'file',
            icon: <Map size={14} />,
            data: { type: 'storyMap', content: storyMap },
            count: storyMap.length
          },
          {
            id: 'notes-folder',
            name: 'Notes',
            type: 'folder',
            icon: <StickyNote size={14} />,
            count: notes.length,
            children: notes.map(n => ({
              id: `note-${n.id}`,
              name: n.title || 'Untitled Note',
              type: 'file' as const,
              icon: <StickyNote size={12} />,
              data: n
            }))
          },
          {
            id: 'mood-board',
            name: 'Mood Board',
            type: 'file',
            icon: <ImageIcon size={14} />,
            data: { type: 'moodBoard', content: moodBoard },
            count: moodBoard?.length || 0
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

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && !text.includes('\0')) {
          addSource({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content: text,
            type: 'script',
            tags: []
          });
        }
      };
      reader.readAsText(file);
    });
  }, [addSource]);

  const handleCreateItem = (parentId: string, type: Source['type']) => {
    if (!newItemName.trim()) return;
    
    addSource({
      title: newItemName.trim(),
      content: '',
      type,
      tags: []
    });
    
    setIsCreating(null);
    setNewItemName('');
    setExpandedFolders(prev => new Set([...prev, parentId]));
  };

  return (
    <div 
      className={cn(
        "w-72 border-r flex flex-col h-full shrink-0 transition-all duration-300 select-none",
        theme === 'dark' 
          ? 'bg-stone-900 border-stone-800' 
          : 'bg-white border-stone-200/60',
        isDragging && (theme === 'dark' ? 'ring-2 ring-inset ring-blue-500/50' : 'ring-2 ring-inset ring-blue-400/50')
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
      onDrop={handleDrop}
      onClick={() => setContextMenu(null)}
    >
      {/* Header */}
      <div className={cn(
        "h-12 px-4 flex items-center justify-between border-b shrink-0",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-200/60'
      )}>
        <div className="flex items-center gap-2">
          <Folder size={14} className="text-stone-400" />
          <span className={cn(
            "text-sm font-semibold tracking-tight",
            theme === 'dark' ? 'text-white' : 'text-stone-900'
          )}>
            {currentProject?.name || 'Explorer'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-colors",
              theme === 'dark' ? 'hover:bg-stone-800 text-stone-500' : 'hover:bg-stone-100 text-stone-400'
            )}
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
          <button 
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center transition-colors",
              theme === 'dark' ? 'hover:bg-stone-800 text-stone-500' : 'hover:bg-stone-100 text-stone-400'
            )}
            title="Collapse All"
            onClick={() => setExpandedFolders(new Set())}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className={cn(
              "w-full h-7 pl-7 pr-3 rounded text-xs outline-none transition-all",
              theme === 'dark'
                ? 'bg-stone-800 border-stone-700 text-white placeholder:text-stone-500 focus:ring-1 focus:ring-white/20'
                : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900/10',
              'border'
            )}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 pb-3">
        {filteredStructure.map(node => (
          <TreeNode 
            key={node.id}
            node={node}
            depth={0}
            theme={theme}
            expandedFolders={expandedFolders}
            selectedId={selectedId}
            isCreating={isCreating}
            newItemName={newItemName}
            onToggle={toggleFolder}
            onSelect={setSelectedId}
            onDoubleClick={handleFileOpen}
            onContextMenu={handleContextMenu}
            onStartCreate={setIsCreating}
            onCreateItem={handleCreateItem}
            onNewItemNameChange={setNewItemName}
            onCancelCreate={() => { setIsCreating(null); setNewItemName(''); }}
          />
        ))}
      </div>

      {/* File Preview/Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className={cn(
            "w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col",
            theme === 'dark' ? 'bg-stone-900' : 'bg-white'
          )}>
            <div className={cn(
              "h-14 px-6 flex items-center justify-between border-b shrink-0",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
            )}>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium capitalize",
                  theme === 'dark' ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                )}>
                  {editingFile.type}
                </span>
                <h3 className={cn(
                  "font-semibold",
                  theme === 'dark' ? 'text-white' : 'text-stone-900'
                )}>
                  {editingFile.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingFile(null)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  theme === 'dark' ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                )}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className={cn(
                  "w-full h-full min-h-[300px] p-4 rounded-xl text-sm outline-none resize-none border",
                  theme === 'dark'
                    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500'
                    : 'bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400'
                )}
                placeholder="Enter content..."
              />
            </div>
            <div className={cn(
              "h-14 px-6 flex items-center justify-end gap-3 border-t shrink-0",
              theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
            )}>
              <button
                onClick={() => setEditingFile(null)}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                  theme === 'dark' ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
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
                  "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
                  theme === 'dark' ? 'bg-white text-stone-900 hover:bg-stone-100' : 'bg-stone-900 text-white hover:bg-stone-800'
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={cn(
        "p-2 border-t flex gap-1",
        theme === 'dark' ? 'border-stone-800' : 'border-stone-200/60'
      )}>
        <QuickAddButton 
          icon={<User size={12} />} 
          label="Character" 
          theme={theme}
          onClick={() => { setIsCreating('characters'); setExpandedFolders(prev => new Set([...prev, 'story-bible', 'characters'])); }}
        />
        <QuickAddButton 
          icon={<MapPin size={12} />} 
          label="Location" 
          theme={theme}
          onClick={() => { setIsCreating('locations'); setExpandedFolders(prev => new Set([...prev, 'story-bible', 'locations'])); }}
        />
        <QuickAddButton 
          icon={<FileText size={12} />} 
          label="Script" 
          theme={theme}
          onClick={() => { setIsCreating('scripts'); setExpandedFolders(prev => new Set([...prev, 'scripts'])); }}
        />
        <QuickAddButton 
          icon={<BookOpen size={12} />} 
          label="Lore" 
          theme={theme}
          onClick={() => { setIsCreating('lore'); setExpandedFolders(prev => new Set([...prev, 'story-bible', 'lore'])); }}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          theme={theme}
          onClose={() => setContextMenu(null)}
          onDelete={() => {
            const id = contextMenu.nodeId.replace('source-', '');
            deleteSource(id);
            setContextMenu(null);
          }}
        />
      )}

      {/* Drop Overlay */}
      {isDragging && (
        <div className={cn(
          "absolute inset-4 z-50 flex flex-col items-center justify-center border-2 border-dashed rounded-xl pointer-events-none",
          theme === 'dark' 
            ? 'bg-stone-800/90 border-blue-500' 
            : 'bg-white/90 border-blue-400'
        )}>
          <Upload size={24} className="text-blue-500 mb-2" />
          <p className={cn(
            "text-sm font-medium",
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          )}>Drop files to import</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// TREE NODE
// ============================================

interface TreeNodeProps {
  node: FolderNode;
  depth: number;
  theme: 'light' | 'dark';
  expandedFolders: Set<string>;
  selectedId: string | null;
  isCreating: string | null;
  newItemName: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string, data?: any) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onStartCreate: (folderId: string) => void;
  onCreateItem: (parentId: string, type: Source['type']) => void;
  onNewItemNameChange: (name: string) => void;
  onCancelCreate: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  theme,
  expandedFolders,
  selectedId,
  isCreating,
  newItemName,
  onToggle,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onStartCreate,
  onCreateItem,
  onNewItemNameChange,
  onCancelCreate
}) => {
  const isExpanded = expandedFolders.has(node.id);
  const isSelected = selectedId === node.id;
  const isFolder = node.type === 'folder';
  const hasChildren = node.children && node.children.length > 0;

  // Check if this is a navigable workspace item
  const isWorkspaceItem = ['beat-sheet', 'outline', 'story-map', 'notes-folder', 'mood-board'].includes(node.id);

  const getTypeFromFolderId = (id: string): Source['type'] => {
    switch (id) {
      case 'characters': return 'character';
      case 'locations': return 'location';
      case 'factions': return 'faction';
      case 'lore': return 'lore';
      case 'concepts': return 'concept';
      case 'events': return 'event';
      case 'scripts': return 'script';
      default: return 'lore';
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center h-7 px-2 rounded cursor-pointer group transition-colors",
          isSelected
            ? theme === 'dark' ? 'bg-stone-700' : 'bg-stone-200'
            : theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100',
          // Highlight navigable items
          isWorkspaceItem && !isSelected && (theme === 'dark' ? 'hover:bg-stone-700/50' : 'hover:bg-stone-150')
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder && !isWorkspaceItem) onToggle(node.id);
          onSelect(node.id);
        }}
        onDoubleClick={() => {
          // Double-click opens files or navigates to views
          if (!isFolder || isWorkspaceItem) {
            onDoubleClick(node.id, node.data);
          }
        }}
        onContextMenu={(e) => node.data && onContextMenu(e, node.id)}
      >
        {/* Expand/Collapse Arrow */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {isFolder && hasChildren && (
            <span className={cn(
              "transition-transform",
              isExpanded && "rotate-90"
            )}>
              <ChevronRight size={10} className="text-stone-400" />
            </span>
          )}
        </span>

        {/* Icon */}
        <span className={cn(
          "w-4 h-4 flex items-center justify-center shrink-0 mr-1.5",
          node.color || (theme === 'dark' ? 'text-stone-400' : 'text-stone-500')
        )}>
          {isFolder 
            ? (isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />)
            : node.icon || <File size={14} />
          }
        </span>

        {/* Name */}
        <span className={cn(
          "flex-1 text-xs truncate",
          theme === 'dark' ? 'text-stone-300' : 'text-stone-700'
        )}>
          {node.name}
        </span>

        {/* Count Badge */}
        {node.count !== undefined && node.count > 0 && (
          <span className={cn(
            "text-[10px] px-1.5 rounded",
            theme === 'dark' ? 'bg-stone-700 text-stone-400' : 'bg-stone-200 text-stone-500'
          )}>
            {node.count}
          </span>
        )}

        {/* Folder Actions */}
        {isFolder && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartCreate(node.id); }}
            className={cn(
              "w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity ml-1",
              theme === 'dark' ? 'hover:bg-stone-600 text-stone-400' : 'hover:bg-stone-300 text-stone-500'
            )}
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {/* New Item Input */}
      {isCreating === node.id && (
        <div 
          className="flex items-center h-7 px-2"
          style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
        >
          <span className="w-4 h-4 shrink-0" />
          <File size={12} className="text-stone-400 mr-1.5 shrink-0" />
          <input
            type="text"
            value={newItemName}
            onChange={(e) => onNewItemNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCreateItem(node.id, getTypeFromFolderId(node.id));
              if (e.key === 'Escape') onCancelCreate();
            }}
            onBlur={onCancelCreate}
            autoFocus
            placeholder="New item..."
            className={cn(
              "flex-1 h-5 px-1 text-xs outline-none rounded",
              theme === 'dark'
                ? 'bg-stone-700 text-white placeholder:text-stone-500'
                : 'bg-stone-100 text-stone-900 placeholder:text-stone-400'
            )}
          />
        </div>
      )}

      {/* Children */}
      {isFolder && isExpanded && node.children?.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          theme={theme}
          expandedFolders={expandedFolders}
          selectedId={selectedId}
          isCreating={isCreating}
          newItemName={newItemName}
          onToggle={onToggle}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
          onStartCreate={onStartCreate}
          onCreateItem={onCreateItem}
          onNewItemNameChange={onNewItemNameChange}
          onCancelCreate={onCancelCreate}
        />
      ))}
    </div>
  );
};

// ============================================
// QUICK ADD BUTTON
// ============================================

interface QuickAddButtonProps {
  icon: React.ReactNode;
  label: string;
  theme: 'light' | 'dark';
  onClick: () => void;
}

const QuickAddButton: React.FC<QuickAddButtonProps> = ({ icon, label, theme, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 h-7 rounded flex items-center justify-center gap-1 text-[10px] font-medium transition-colors",
      theme === 'dark'
        ? 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-300'
        : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
    )}
    title={`Add ${label}`}
  >
    {icon}
  </button>
);

// ============================================
// CONTEXT MENU
// ============================================

interface ContextMenuProps {
  x: number;
  y: number;
  theme: 'light' | 'dark';
  onClose: () => void;
  onDelete: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, theme, onClose, onDelete }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div 
      className={cn(
        "fixed z-50 w-44 rounded-lg shadow-lg border overflow-hidden py-1",
        theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
      )}
      style={{ left: x, top: y }}
    >
      <ContextMenuItem icon={<Edit3 size={12} />} label="Rename" theme={theme} onClick={onClose} />
      <ContextMenuItem icon={<Copy size={12} />} label="Duplicate" theme={theme} onClick={onClose} />
      <div className={cn(
        "h-px mx-2 my-1",
        theme === 'dark' ? 'bg-stone-700' : 'bg-stone-100'
      )} />
      <ContextMenuItem 
        icon={<Trash2 size={12} />} 
        label="Delete" 
        theme={theme} 
        danger 
        onClick={onDelete} 
      />
    </div>
  </>
);

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  theme: 'light' | 'dark';
  danger?: boolean;
  onClick: () => void;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, theme, danger, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full px-3 py-1.5 text-xs flex items-center gap-2 transition-colors",
      danger
        ? 'text-red-500 hover:bg-red-500/10'
        : theme === 'dark'
          ? 'text-stone-300 hover:bg-stone-700'
          : 'text-stone-700 hover:bg-stone-100'
    )}
  >
    {icon}
    {label}
  </button>
);

export default FileExplorer;

