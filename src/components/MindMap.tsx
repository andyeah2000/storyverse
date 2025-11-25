import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStory } from '../context/StoryContext';
import { 
  Plus, Trash2, User, MapPin, Sparkles, Crown, 
  Sword, Heart, Lightbulb, Link2, ZoomIn, ZoomOut, 
  Maximize2, ChevronDown, Check, Wand2, RotateCcw,
  AlertCircle, Loader2, Eye, ChevronRight, Layers,
  Grid3X3, LayoutGrid
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMindMap, expandNode } from '../services/mindmapService';

// ============================================
// TYPES
// ============================================

type NodeType = 'central' | 'character' | 'location' | 'faction' | 'concept' | 'event' | 'relationship';
type LayoutMode = 'radial' | 'grid' | 'hierarchical';

interface MindMapNode {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  importance?: 'high' | 'medium' | 'low';
  x: number;
  y: number;
  color: string;
  parentId?: string;
  connections: string[];
  sector?: number;
}

// ============================================
// CONSTANTS
// ============================================

const NODE_CONFIG: Record<NodeType, { 
  bg: string; 
  border: string; 
  icon: React.ReactNode; 
  label: string;
  sector: number;
}> = {
  central: { bg: 'bg-stone-900 dark:bg-white', border: 'border-stone-900 dark:border-white', icon: <Sparkles size={16} />, label: 'Central', sector: -1 },
  character: { bg: 'bg-amber-500', border: 'border-amber-500', icon: <User size={12} />, label: 'Character', sector: 0 },
  location: { bg: 'bg-emerald-500', border: 'border-emerald-500', icon: <MapPin size={12} />, label: 'Location', sector: 1 },
  faction: { bg: 'bg-purple-500', border: 'border-purple-500', icon: <Crown size={12} />, label: 'Faction', sector: 2 },
  concept: { bg: 'bg-sky-500', border: 'border-sky-500', icon: <Lightbulb size={12} />, label: 'Concept', sector: 3 },
  event: { bg: 'bg-rose-500', border: 'border-rose-500', icon: <Sword size={12} />, label: 'Event', sector: 4 },
  relationship: { bg: 'bg-pink-500', border: 'border-pink-500', icon: <Heart size={12} />, label: 'Relationship', sector: 5 },
};

const SECTOR_ANGLES = [0, 60, 120, 180, 240, 300]; // 6 sectors for 6 types
const RING_DISTANCES = [180, 320, 460, 600]; // 4 rings based on importance + overflow

// ============================================
// LAYOUT ALGORITHMS
// ============================================

const calculateRadialLayout = (nodes: MindMapNode[], central: MindMapNode): MindMapNode[] => {
  const result: MindMapNode[] = [{ ...central, x: 0, y: 0 }];
  
  // Group nodes by type
  const byType: Record<NodeType, MindMapNode[]> = {
    central: [], character: [], location: [], faction: [], concept: [], event: [], relationship: []
  };
  
  nodes.filter(n => n.type !== 'central').forEach(n => {
    if (byType[n.type]) byType[n.type].push(n);
  });

  // Place each type in its sector
  const types: NodeType[] = ['character', 'location', 'faction', 'concept', 'event', 'relationship'];
  
  types.forEach((type, typeIndex) => {
    const typeNodes = byType[type];
    if (!typeNodes.length) return;

    const sectorAngle = ((SECTOR_ANGLES[typeIndex] || 0) * Math.PI) / 180;
    const sectorSpread = (50 * Math.PI) / 180; // 50 degrees spread per sector

    // Sort by importance
    const sorted = [...typeNodes].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.importance || 'medium'] || 1) - (order[b.importance || 'medium'] || 1);
    });

    // Place nodes in concentric arcs within sector
    sorted.forEach((node, i) => {
      const ring = node.importance === 'high' ? 0 : node.importance === 'medium' ? 1 : 2;
      const nodesInRing = sorted.filter(n => {
        const r = n.importance === 'high' ? 0 : n.importance === 'medium' ? 1 : 2;
        return r === ring;
      });
      const indexInRing = nodesInRing.indexOf(node);
      const totalInRing = nodesInRing.length;
      
      // Calculate position within sector arc
      const angleOffset = totalInRing > 1 
        ? (indexInRing / (totalInRing - 1) - 0.5) * sectorSpread
        : 0;
      
      const angle = sectorAngle + angleOffset;
      const distance = (RING_DISTANCES[ring] || 180) + (Math.floor(i / 6) * 100); // Overflow to outer rings
      
      result.push({
        ...node,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        sector: typeIndex
      });
    });
  });

  return result;
};

const calculateGridLayout = (nodes: MindMapNode[], central: MindMapNode): MindMapNode[] => {
  const result: MindMapNode[] = [{ ...central, x: 0, y: -50 }];
  
  // Group by type
  const byType: Record<NodeType, MindMapNode[]> = {
    central: [], character: [], location: [], faction: [], concept: [], event: [], relationship: []
  };
  
  nodes.filter(n => n.type !== 'central').forEach(n => {
    if (byType[n.type]) byType[n.type].push(n);
  });

  const types: NodeType[] = ['character', 'location', 'faction', 'concept', 'event', 'relationship'];
  const colWidth = 200;
  const rowHeight = 100;
  const startX = -((types.length - 1) * colWidth) / 2;
  
  types.forEach((type, col) => {
    const typeNodes = byType[type];
    // Sort by importance
    const sorted = [...typeNodes].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.importance || 'medium'] || 1) - (order[b.importance || 'medium'] || 1);
    });

    sorted.forEach((node, row) => {
      result.push({
        ...node,
        x: startX + col * colWidth,
        y: 80 + row * rowHeight,
        sector: col
      });
    });
  });

  return result;
};

const calculateHierarchicalLayout = (nodes: MindMapNode[], central: MindMapNode): MindMapNode[] => {
  const result: MindMapNode[] = [{ ...central, x: 0, y: 0 }];
  
  // Group by type
  const byType: Record<NodeType, MindMapNode[]> = {
    central: [], character: [], location: [], faction: [], concept: [], event: [], relationship: []
  };
  
  nodes.filter(n => n.type !== 'central').forEach(n => {
    if (byType[n.type]) byType[n.type].push(n);
  });

  // Arrange types in a tree structure
  // Characters & Relationships on left, Locations & Events on right, Factions & Concepts center
  const leftTypes: NodeType[] = ['character', 'relationship'];
  const rightTypes: NodeType[] = ['location', 'event'];
  const centerTypes: NodeType[] = ['faction', 'concept'];

  const placeColumn = (types: NodeType[], xOffset: number, _spacing: number) => {
    let currentY = 120;
    types.forEach(type => {
      const typeNodes = byType[type];
      const sorted = [...typeNodes].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.importance || 'medium'] || 1) - (order[b.importance || 'medium'] || 1);
      });
      
      sorted.forEach((node, i) => {
        result.push({
          ...node,
          x: xOffset + (i % 2) * 140,
          y: currentY,
          sector: NODE_CONFIG[type].sector
        });
        if (i % 2 === 1 || i === sorted.length - 1) currentY += 90;
      });
      currentY += 40; // Gap between types
    });
  };

  placeColumn(leftTypes, -350, 140);
  placeColumn(centerTypes, -70, 140);
  placeColumn(rightTypes, 210, 140);

  return result;
};

// ============================================
// COMPONENT
// ============================================

const MindMap: React.FC = () => {
  const { theme, sources, currentProject } = useStory();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Node state
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });
  
  // Connection mode
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  
  // Layout mode
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('radial');
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const [centralTheme, setCentralTheme] = useState<string>('');
  
  // Collapsed sectors
  const [collapsedSectors, setCollapsedSectors] = useState<Set<number>>(new Set());
  
  // Storage
  const storageKey = `storyverse_mindmap_${currentProject?.id || 'default'}`;
  
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setNodes(data.nodes || []);
        setAiInsights(data.insights || []);
        setCentralTheme(data.centralTheme || '');
        setLayoutMode(data.layoutMode || 'radial');
      } catch (e) {
        console.error('Failed to load mindmap:', e);
        initDefaultNode();
      }
    } else {
      initDefaultNode();
    }
  }, [storageKey, currentProject?.name]);
  
  const initDefaultNode = () => {
    setNodes([{
      id: 'central',
      type: 'central',
      title: currentProject?.name || 'Story Universe',
      x: 0,
      y: 0,
      color: '',
      connections: []
    }]);
  };
  
  useEffect(() => {
    if (nodes.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        nodes,
        insights: aiInsights,
        centralTheme,
        layoutMode
      }));
    }
  }, [nodes, aiInsights, centralTheme, layoutMode, storageKey]);

  // Recalculate layout when mode changes
  const layoutNodes = useMemo(() => {
    const central = nodes.find(n => n.type === 'central');
    if (!central || nodes.length <= 1) return nodes;
    
    switch (layoutMode) {
      case 'grid':
        return calculateGridLayout(nodes, central);
      case 'hierarchical':
        return calculateHierarchicalLayout(nodes, central);
      default:
        return calculateRadialLayout(nodes, central);
    }
  }, [nodes, layoutMode]);

  // Filter visible nodes based on collapsed sectors
  const visibleNodes = useMemo(() => {
    return layoutNodes.filter(n => 
      n.type === 'central' || 
      n.sector === undefined || 
      !collapsedSectors.has(n.sector)
    );
  }, [layoutNodes, collapsedSectors]);

  // Get sector stats
  const sectorStats = useMemo(() => {
    const stats: Record<number, { type: NodeType; count: number; collapsed: boolean }> = {};
    const types: NodeType[] = ['character', 'location', 'faction', 'concept', 'event', 'relationship'];
    
    types.forEach((type, i) => {
      const count = nodes.filter(n => n.type === type).length;
      stats[i] = { type, count, collapsed: collapsedSectors.has(i) };
    });
    
    return stats;
  }, [nodes, collapsedSectors]);

  const toggleSector = (sector: number) => {
    setCollapsedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sector)) {
        next.delete(sector);
      } else {
        next.add(sector);
      }
      return next;
    });
  };

  // Apply layout to nodes
  const applyLayout = (mode: LayoutMode) => {
    setLayoutMode(mode);
    const central = nodes.find(n => n.type === 'central');
    if (!central) return;
    
    let newLayout: MindMapNode[];
    switch (mode) {
      case 'grid':
        newLayout = calculateGridLayout(nodes, central);
        break;
      case 'hierarchical':
        newLayout = calculateHierarchicalLayout(nodes, central);
        break;
      default:
        newLayout = calculateRadialLayout(nodes, central);
    }
    setNodes(newLayout);
  };

  // AI Generation with proper layout
  const handleGenerateMindMap = async () => {
    if (sources.length === 0) {
      setAiError('Add sources to your Story Bible first!');
      return;
    }
    
    setIsGenerating(true);
    setAiError(null);
    
    try {
      const existingTitles = nodes.filter(n => n.type !== 'central').map(n => n.title);
      
      const result = await generateMindMap(
        sources,
        currentProject?.name || 'Story',
        existingTitles
      );
      
      // Get or create central node
      let central = nodes.find(n => n.type === 'central') || {
        id: 'central',
        type: 'central' as NodeType,
        title: currentProject?.name || 'Story Universe',
        x: 0,
        y: 0,
        color: '',
        connections: []
      };
      
      // Convert AI nodes to MindMapNodes (positions will be calculated by layout)
      const newNodes: MindMapNode[] = result.nodes.map(n => ({
        id: n.id,
        type: n.type as NodeType,
        title: n.title,
        description: n.description,
        importance: n.importance,
        x: 0,
        y: 0,
        color: '',
        connections: [...n.connections, 'central']
      }));
      
      // Merge with existing
      const existingNonCentral = nodes.filter(n => n.type !== 'central');
      const allNodes = [central, ...existingNonCentral, ...newNodes];
      
      // Update central connections
      const allIds = allNodes.filter(n => n.type !== 'central').map(n => n.id);
      central = { ...central, connections: [...new Set(allIds)] };
      
      // Apply layout
      let layouted: MindMapNode[];
      switch (layoutMode) {
        case 'grid':
          layouted = calculateGridLayout([central, ...existingNonCentral, ...newNodes], central);
          break;
        case 'hierarchical':
          layouted = calculateHierarchicalLayout([central, ...existingNonCentral, ...newNodes], central);
          break;
        default:
          layouted = calculateRadialLayout([central, ...existingNonCentral, ...newNodes], central);
      }
      
      setNodes(layouted);
      setAiInsights(result.insights);
      setCentralTheme(result.centralTheme);
      setShowInsights(true);
      
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Expand node
  const handleExpandNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'central') return;
    
    setIsGenerating(true);
    setAiError(null);
    
    try {
      const expandedNodes = await expandNode(
        { title: node.title, type: node.type, description: node.description || '' },
        sources
      );
      
      const newNodes = expandedNodes.map(en => ({
        id: en.id,
        type: en.type as NodeType,
        title: en.title,
        description: en.description,
        importance: en.importance,
        x: 0,
        y: 0,
        color: '',
        connections: [nodeId]
      } as MindMapNode));
      
      // Add and re-layout
      const allNodes = [...nodes, ...newNodes];
      const central = allNodes.find(n => n.type === 'central')!;
      
      let layouted: MindMapNode[];
      switch (layoutMode) {
        case 'grid':
          layouted = calculateGridLayout(allNodes, central);
          break;
        case 'hierarchical':
          layouted = calculateHierarchicalLayout(allNodes, central);
          break;
        default:
          layouted = calculateRadialLayout(allNodes, central);
      }
      
      // Update parent connections
      setNodes(layouted.map(n => 
        n.id === nodeId 
          ? { ...n, connections: [...n.connections, ...newNodes.map(nn => nn.id)] }
          : n
      ));
      
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Expansion failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear and regenerate
  const handleRegenerate = () => {
    setNodes([{
      id: 'central',
      type: 'central',
      title: currentProject?.name || 'Story Universe',
      x: 0,
      y: 0,
      color: '',
      connections: []
    }]);
    setAiInsights([]);
    setCentralTheme('');
    setCollapsedSectors(new Set());
    setTimeout(() => handleGenerateMindMap(), 100);
  };

  // Manual node operations
  const addNode = (type: NodeType, parentId?: string) => {
    const parent = parentId ? nodes.find(n => n.id === parentId) : nodes.find(n => n.type === 'central');
    
    const newNode: MindMapNode = {
      id: crypto.randomUUID(),
      type,
      title: `New ${NODE_CONFIG[type].label}`,
      importance: 'medium',
      x: 0,
      y: 0,
      color: '',
      parentId: parent?.id,
      connections: parent ? [parent.id] : []
    };
    
    const allNodes = [...nodes, newNode];
    if (parent) {
      const idx = allNodes.findIndex(n => n.id === parent.id);
      if (idx >= 0 && allNodes[idx]) {
        const existing = allNodes[idx]!;
        allNodes[idx] = { ...existing, connections: [...existing.connections, newNode.id] };
      }
    }
    
    // Re-layout
    const central = allNodes.find(n => n.type === 'central')!;
    let layouted: MindMapNode[];
    switch (layoutMode) {
      case 'grid':
        layouted = calculateGridLayout(allNodes, central);
        break;
      case 'hierarchical':
        layouted = calculateHierarchicalLayout(allNodes, central);
        break;
      default:
        layouted = calculateRadialLayout(allNodes, central);
    }
    
    setNodes(layouted);
    setSelectedNode(newNode.id);
    setEditingNode(newNode.id);
    setEditTitle(newNode.title);
  };

  const deleteNode = (id: string) => {
    if (id === 'central') return;
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => ({ ...n, connections: n.connections.filter(c => c !== id) }));
    setNodes(updated);
    setSelectedNode(null);
  };

  const updateNode = (id: string, updates: Partial<MindMapNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const saveEdit = () => {
    if (editingNode && editTitle.trim()) {
      updateNode(editingNode, { title: editTitle.trim() });
    }
    setEditingNode(null);
    setEditTitle('');
  };

  const toggleConnection = (nodeId: string) => {
    if (!connectingFrom) {
      setConnectingFrom(nodeId);
    } else if (connectingFrom !== nodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === connectingFrom) {
          const has = n.connections.includes(nodeId);
          return { ...n, connections: has ? n.connections.filter(c => c !== nodeId) : [...n.connections, nodeId] };
        }
        if (n.id === nodeId) {
          const has = n.connections.includes(connectingFrom);
          return { ...n, connections: has ? n.connections.filter(c => c !== connectingFrom) : [...n.connections, connectingFrom] };
        }
        return n;
      }));
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
    }
  };

  // Canvas interactions
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNode(null);
      if (connectingFrom) setConnectingFrom(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
    if (draggingNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
        const y = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;
        updateNode(draggingNode, { x: x - nodeOffset.x, y: y - nodeOffset.y });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggingNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = visibleNodes.find(n => n.id === nodeId);
    if (node) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom;
        const y = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom;
        setNodeOffset({ x: x - node.x, y: y - node.y });
        setDraggingNode(nodeId);
      }
    }
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.65);
  };

  const nodeCount = nodes.filter(n => n.type !== 'central').length;

  return (
    <div className={cn(
      "h-full flex rounded-2xl shadow-subtle border overflow-hidden",
      theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200/60'
    )}>
      
      {/* Left Sidebar - Sector Controls */}
      <div className={cn(
        "w-48 border-r flex flex-col shrink-0",
        theme === 'dark' ? 'border-stone-800 bg-stone-900/50' : 'border-stone-100 bg-stone-50/50'
      )}>
        <div className={cn(
          "px-3 py-3 border-b",
          theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
        )}>
          <h3 className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
          )}>Categories</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {Object.entries(sectorStats).map(([sector, { type, count, collapsed }]) => (
            <button
              key={sector}
              onClick={() => toggleSector(Number(sector))}
              className={cn(
                "w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all",
                collapsed
                  ? theme === 'dark' ? 'bg-stone-800/50 opacity-50' : 'bg-stone-100/50 opacity-50'
                  : theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shrink-0",
                NODE_CONFIG[type].bg
              )}>
                {NODE_CONFIG[type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium truncate",
                  theme === 'dark' ? 'text-stone-300' : 'text-stone-700'
                )}>
                  {NODE_CONFIG[type].label}
                </p>
                <p className={cn(
                  "text-[10px]",
                  theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                )}>
                  {count} {count === 1 ? 'node' : 'nodes'}
                </p>
              </div>
              <ChevronRight size={12} className={cn(
                "shrink-0 transition-transform",
                !collapsed && "rotate-90",
                theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
              )} />
            </button>
          ))}
        </div>

        {/* Layout Selector */}
        <div className={cn(
          "p-2 border-t space-y-1",
          theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
        )}>
          <p className={cn(
            "text-[10px] font-medium uppercase tracking-wider px-2 mb-2",
            theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
          )}>Layout</p>
          {[
            { mode: 'radial' as LayoutMode, icon: <Layers size={12} />, label: 'Radial' },
            { mode: 'grid' as LayoutMode, icon: <Grid3X3 size={12} />, label: 'Grid' },
            { mode: 'hierarchical' as LayoutMode, icon: <LayoutGrid size={12} />, label: 'Tree' },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => applyLayout(mode)}
              className={cn(
                "w-full px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors",
                layoutMode === mode
                  ? theme === 'dark' ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
                  : theme === 'dark' ? 'text-stone-400 hover:bg-stone-800' : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className={cn(
          "px-4 py-2 flex items-center justify-between border-b shrink-0",
          theme === 'dark' ? 'border-stone-800' : 'border-stone-100'
        )}>
          <div className="flex items-center gap-3">
            <h2 className={cn(
              "text-sm font-semibold",
              theme === 'dark' ? 'text-white' : 'text-stone-900'
            )}>Universe Mind Map</h2>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full",
              theme === 'dark' ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
            )}>
              {nodeCount} nodes
            </span>
            {centralTheme && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full max-w-[200px] truncate",
                theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              )}>
                {centralTheme}
              </span>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGenerateMindMap}
              disabled={isGenerating || sources.length === 0}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all",
                sources.length === 0
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed dark:bg-stone-800 dark:text-stone-600'
                  : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-purple-500/20'
              )}
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
              AI Generate
            </button>

            {nodeCount > 0 && (
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  theme === 'dark' ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'
                )}
                title="Clear & Regenerate"
              >
                <RotateCcw size={12} />
              </button>
            )}

            <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />

            <div className="relative group">
              <button className={cn(
                "h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors",
                theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-100 text-stone-600'
              )}>
                <Plus size={12} />
                Add
                <ChevronDown size={10} />
              </button>
              <div className={cn(
                "absolute right-0 top-full mt-1 w-40 rounded-xl shadow-lg z-50 overflow-hidden border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all",
                theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              )}>
                {(['character', 'location', 'faction', 'concept', 'event', 'relationship'] as NodeType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => addNode(type, selectedNode || undefined)}
                    className={cn(
                      "w-full px-3 py-2 text-xs text-left flex items-center gap-2 transition-colors",
                      theme === 'dark' ? 'text-stone-300 hover:bg-stone-800' : 'text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white", NODE_CONFIG[type].bg)}>
                      {NODE_CONFIG[type].icon}
                    </span>
                    {NODE_CONFIG[type].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />

            <div className={cn(
              "flex items-center gap-0.5 rounded-lg p-0.5",
              theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'
            )}>
              <button
                onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
                className={cn(
                  "w-6 h-6 rounded flex items-center justify-center transition-colors",
                  theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
                )}
              >
                <ZoomOut size={12} />
              </button>
              <span className={cn(
                "text-[10px] font-mono w-10 text-center",
                theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
              )}>{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
                className={cn(
                  "w-6 h-6 rounded flex items-center justify-center transition-colors",
                  theme === 'dark' ? 'hover:bg-stone-700' : 'hover:bg-stone-200'
                )}
              >
                <ZoomIn size={12} />
              </button>
            </div>

            <button
              onClick={resetView}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-100'
              )}
              title="Reset View"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>

        {/* Error */}
        {aiError && (
          <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-red-500 text-xs">
            <AlertCircle size={12} />
            {aiError}
            <button onClick={() => setAiError(null)} className="ml-auto hover:underline">Dismiss</button>
          </div>
        )}

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className={cn(
            "flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing",
            theme === 'dark' ? 'bg-stone-950' : 'bg-stone-50'
          )}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid */}
          <div 
            className={cn("absolute inset-0 pointer-events-none canvas-bg", theme === 'dark' ? 'opacity-[0.02]' : 'opacity-[0.04]')}
            style={{ 
              backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          />

          {/* Sector Guides (Radial mode) */}
          {layoutMode === 'radial' && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              <g style={{ transform: `translate(${pan.x + (canvasRef.current?.clientWidth || 0) / 2}px, ${pan.y + (canvasRef.current?.clientHeight || 0) / 2}px) scale(${zoom})` }}>
                {/* Rings */}
                {RING_DISTANCES.map((r, i) => (
                  <circle
                    key={i}
                    cx={0}
                    cy={0}
                    r={r}
                    fill="none"
                    stroke={theme === 'dark' ? '#27272a' : '#e7e5e4'}
                    strokeWidth={1 / zoom}
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Sector lines */}
                {SECTOR_ANGLES.map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <line
                      key={i}
                      x1={0}
                      y1={0}
                      x2={Math.cos(rad) * 700}
                      y2={Math.sin(rad) * 700}
                      stroke={theme === 'dark' ? '#27272a' : '#e7e5e4'}
                      strokeWidth={1 / zoom}
                      strokeDasharray="4 4"
                    />
                  );
                })}
              </g>
            </svg>
          )}

          {/* Connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            <g style={{ transform: `translate(${pan.x + (canvasRef.current?.clientWidth || 0) / 2}px, ${pan.y + (canvasRef.current?.clientHeight || 0) / 2}px) scale(${zoom})` }}>
              {visibleNodes.flatMap(node => 
                node.connections.map(targetId => {
                  const target = visibleNodes.find(n => n.id === targetId);
                  if (!target || node.id > targetId) return null;
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={theme === 'dark' ? '#44403c' : '#d6d3d1'}
                      strokeWidth={1 / zoom}
                      opacity={0.5}
                    />
                  );
                })
              )}
            </g>
          </svg>

          {/* Nodes */}
          <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
            <div className="absolute" style={{ left: '50%', top: '50%', transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              {visibleNodes.map(node => {
                const config = NODE_CONFIG[node.type];
                const isSelected = selectedNode === node.id;
                const isConnecting = connectingFrom === node.id;
                const isCentral = node.type === 'central';

                return (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute cursor-pointer transition-all duration-100",
                      isSelected && "z-20",
                      draggingNode === node.id && "z-30"
                    )}
                    style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      connectingFrom ? toggleConnection(node.id) : setSelectedNode(node.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingNode(node.id);
                      setEditTitle(node.title);
                    }}
                  >
                    <div className={cn("relative", isCentral ? "w-[100px]" : "w-[90px]")}>
                      {/* Glow */}
                      {(isSelected || isConnecting) && (
                        <div className={cn("absolute inset-0 rounded-xl blur-lg opacity-40 -z-10", config.bg)} style={{ transform: 'scale(1.3)' }} />
                      )}

                      {/* Card */}
                      <div className={cn(
                        "rounded-xl border transition-all duration-150",
                        isCentral ? "px-3 py-3" : "px-2.5 py-2",
                        isSelected ? `${config.border} shadow-lg border-2` : theme === 'dark' ? 'border-stone-700 hover:border-stone-600' : 'border-stone-200 hover:border-stone-300',
                        theme === 'dark' ? 'bg-stone-900' : 'bg-white',
                        isConnecting && 'ring-2 ring-blue-500'
                      )}>
                        {/* Icon */}
                        <div className={cn(
                          "rounded-full flex items-center justify-center text-white mx-auto mb-1",
                          isCentral ? "w-8 h-8" : "w-6 h-6",
                          config.bg
                        )}>
                          {config.icon}
                        </div>

                        {/* Title */}
                        {editingNode === node.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingNode(null); }}
                              className={cn(
                                "w-full text-center text-[10px] font-medium bg-transparent outline-none border-b",
                                theme === 'dark' ? 'text-white border-stone-600' : 'text-stone-900 border-stone-300'
                              )}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button onClick={saveEdit} className="text-emerald-500"><Check size={10} /></button>
                          </div>
                        ) : (
                          <h3 className={cn(
                            "text-center font-medium truncate",
                            isCentral ? "text-xs" : "text-[10px]",
                            theme === 'dark' ? 'text-white' : 'text-stone-900'
                          )}>
                            {node.title}
                          </h3>
                        )}

                        {/* Type label */}
                        {!isCentral && (
                          <p className={cn(
                            "text-[8px] text-center uppercase tracking-wider mt-0.5",
                            theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                          )}>
                            {config.label}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {isSelected && !isCentral && (
                        <div className="absolute -top-2 -right-2 flex gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExpandNode(node.id); }}
                            disabled={isGenerating}
                            className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg"
                            title="Expand"
                          >
                            <Wand2 size={8} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleConnection(node.id); }}
                            className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shadow-lg",
                              connectingFrom === node.id ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-white text-stone-600'
                            )}
                            title="Connect"
                          >
                            <Link2 size={8} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                            className={cn("w-5 h-5 rounded-full flex items-center justify-center shadow-lg", theme === 'dark' ? 'bg-stone-700 text-stone-300 hover:bg-red-500 hover:text-white' : 'bg-white text-stone-600 hover:bg-red-500 hover:text-white')}
                            title="Delete"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection hint */}
          {connectingFrom && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-lg">
              Click another node to connect
            </div>
          )}

          {/* Loading */}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center">
              <div className={cn("px-4 py-3 rounded-xl shadow-xl flex items-center gap-2", theme === 'dark' ? 'bg-stone-900' : 'bg-white')}>
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className={cn("text-sm", theme === 'dark' ? 'text-white' : 'text-stone-900')}>Analyzing universe...</span>
              </div>
            </div>
          )}

          {/* Empty */}
          {nodeCount === 0 && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Wand2 className={cn("w-10 h-10 mx-auto mb-2", theme === 'dark' ? 'text-stone-700' : 'text-stone-300')} />
                <p className={cn("text-xs", theme === 'dark' ? 'text-stone-500' : 'text-stone-400')}>
                  {sources.length === 0 ? 'Add sources first' : 'Click "AI Generate"'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {aiInsights.length > 0 && (
          <div className={cn("border-t shrink-0", theme === 'dark' ? 'border-stone-800' : 'border-stone-100')}>
            <button
              onClick={() => setShowInsights(!showInsights)}
              className={cn("w-full px-3 py-1.5 flex items-center justify-between text-xs", theme === 'dark' ? 'hover:bg-stone-800' : 'hover:bg-stone-50')}
            >
              <span className={cn("flex items-center gap-1.5", theme === 'dark' ? 'text-stone-300' : 'text-stone-600')}>
                <Eye size={12} /> AI Insights ({aiInsights.length})
              </span>
              <ChevronRight size={10} className={cn("transition-transform", showInsights && "rotate-90", theme === 'dark' ? 'text-stone-500' : 'text-stone-400')} />
            </button>
            {showInsights && (
              <div className="px-3 pb-2 space-y-1 max-h-24 overflow-y-auto">
                {aiInsights.map((insight, i) => (
                  <p key={i} className={cn("text-[10px] pl-2 border-l-2", theme === 'dark' ? 'text-stone-400 border-purple-500/50' : 'text-stone-500 border-purple-500/50')}>
                    {insight}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MindMap;
