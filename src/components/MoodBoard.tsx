import React, { useState, useCallback } from 'react';
import { useStory } from '../context/StoryContext';
import { 
  Plus, Trash2, Image, Link, Type, Palette, X, Upload, 
  Sparkles, Wand2, Loader2, RefreshCw, Maximize2, Sun,
  Camera, Film, Paintbrush, Pencil, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MoodBoardItem } from '../types';
import { generateImage, editImage, ImageGenerationOptions } from '../services/imageService';

type TabType = 'add' | 'generate' | 'edit';

const STYLES = [
  { id: 'photorealistic', label: 'Photo', icon: Camera },
  { id: 'cinematic', label: 'Cinema', icon: Film },
  { id: 'artistic', label: 'Art', icon: Paintbrush },
  { id: 'sketch', label: 'Sketch', icon: Pencil },
  { id: 'vintage', label: 'Vintage', icon: Clock },
] as const;

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '4:3', label: '4:3' },
] as const;

const MoodBoardComponent: React.FC = () => {
  const { moodBoard, addMoodBoardItem, updateMoodBoardItem, deleteMoodBoardItem } = useStory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('add');
  const [addType, setAddType] = useState<MoodBoardItem['type']>('image');
  const [inputValue, setInputValue] = useState('');
  const [captionValue, setCaptionValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // AI Generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState<ImageGenerationOptions['style']>('cinematic');
  const [aiAspectRatio, setAiAspectRatio] = useState<ImageGenerationOptions['aspectRatio']>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Edit state
  const [editingItem, setEditingItem] = useState<MoodBoardItem | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editType, setEditType] = useState<'enhance' | 'style-transfer' | 'expand' | 'relight'>('enhance');
  const [isEditing, setIsEditing] = useState(false);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    
    addMoodBoardItem({
      type: addType,
      content: inputValue.trim(),
      caption: captionValue.trim() || undefined,
    });
    
    resetAndClose();
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImage(null);

    try {
      const imageUrl = await generateImage({
        prompt: aiPrompt,
        style: aiStyle,
        aspectRatio: aiAspectRatio,
        quality: 'hd',
      });
      setGeneratedImage(imageUrl);
    } catch (error: any) {
      setGenerationError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGenerated = () => {
    if (!generatedImage) return;
    
    addMoodBoardItem({
      type: 'image',
      content: generatedImage,
      caption: aiPrompt.slice(0, 50) + (aiPrompt.length > 50 ? '...' : ''),
    });
    
    resetAndClose();
  };

  const handleEdit = async () => {
    if (!editingItem || !editPrompt.trim()) return;
    
    setIsEditing(true);
    setGenerationError(null);

    try {
      const editedImage = await editImage({
        imageBase64: editingItem.content,
        prompt: editPrompt,
        editType,
      });
      
      updateMoodBoardItem(editingItem.id, { content: editedImage });
      resetAndClose();
    } catch (error: any) {
      setGenerationError(error.message);
    } finally {
      setIsEditing(false);
    }
  };

  const resetAndClose = () => {
    setInputValue('');
    setCaptionValue('');
    setAiPrompt('');
    setGeneratedImage(null);
    setGenerationError(null);
    setEditingItem(null);
    setEditPrompt('');
    setIsModalOpen(false);
    setActiveTab('add');
  };

  const openEditModal = (item: MoodBoardItem) => {
    if (item.type !== 'image') return;
    setEditingItem(item);
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        addMoodBoardItem({
          type: 'image',
          content: dataUrl,
          caption: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }, [addMoodBoardItem]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-white rounded-2xl shadow-subtle border border-stone-200/60 overflow-hidden relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-4 z-50 bg-stone-50 flex flex-col items-center justify-center border-2 border-stone-300 border-dashed rounded-2xl pointer-events-none">
          <Upload size={32} className="text-stone-400 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-stone-600">Drop images here</p>
        </div>
      )}

      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-3">
          <Image size={18} className="text-stone-400" strokeWidth={1.75} />
          <div>
            <h2 className="text-base font-semibold text-stone-900">Mood Board</h2>
            <p className="text-xs text-stone-500">{moodBoard.length} items</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('generate'); setIsModalOpen(true); }}
            className="h-8 px-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium text-xs hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={14} strokeWidth={2} />
            AI Generate
          </button>
          <button
            onClick={() => { setActiveTab('add'); setIsModalOpen(true); }}
            className="h-8 px-3 bg-stone-900 text-white rounded-lg font-medium text-xs hover:bg-stone-800 transition-all flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2} />
            Add
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-y-auto p-6">
        {moodBoard.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-violet-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-medium text-stone-700 mb-1">Create your mood board</h3>
            <p className="text-xs text-stone-500 max-w-xs mb-4">
              Add images, generate AI art, or drop files to visualize your story's aesthetic
            </p>
            <button
              onClick={() => { setActiveTab('generate'); setIsModalOpen(true); }}
              className="h-9 px-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2"
            >
              <Sparkles size={16} />
              Generate with AI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {moodBoard.map(item => (
              <MoodBoardCard
                key={item.id}
                item={item}
                onUpdate={(updates) => updateMoodBoardItem(item.id, updates)}
                onDelete={() => deleteMoodBoardItem(item.id)}
                onEdit={() => openEditModal(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-floating animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Header with Tabs */}
            <div className="px-6 pt-5 pb-4 border-b border-stone-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {activeTab === 'generate' ? 'AI Image Generation' : 
                     activeTab === 'edit' ? 'Edit Image' : 'Add to Mood Board'}
                  </h3>
                  {activeTab === 'generate' && (
                    <p className="text-xs text-stone-500 mt-1">Powered by Nano Banana Pro</p>
                  )}
                </div>
                <button 
                  onClick={resetAndClose} 
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              {/* Tabs */}
              {!editingItem && (
                <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
                  <button
                    onClick={() => setActiveTab('add')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                      activeTab === 'add'
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    )}
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                      activeTab === 'generate'
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    )}
                  >
                    <Sparkles size={14} />
                    AI Generate
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'add' && (
                <div className="space-y-4">
                  {/* Type selector */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'image', label: 'Image', icon: Image },
                      { id: 'color', label: 'Color', icon: Palette },
                      { id: 'text', label: 'Text', icon: Type },
                      { id: 'link', label: 'Link', icon: Link },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setAddType(type.id as MoodBoardItem['type'])}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          addType === type.id
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        )}
                      >
                        <type.icon size={18} className="text-stone-600" />
                        <span className="text-xs font-medium text-stone-900">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      {addType === 'image' ? 'Image URL' : 
                       addType === 'color' ? 'Color (hex)' :
                       addType === 'link' ? 'URL' : 'Text'}
                    </label>
                    {addType === 'color' ? (
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={inputValue || '#000000'}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="w-12 h-11 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-900/10 font-mono"
                        />
                      </div>
                    ) : addType === 'text' ? (
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter text..."
                        className="w-full h-24 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
                      />
                    ) : (
                      <input
                        type="url"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-900/10"
                      />
                    )}
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={captionValue}
                      onChange={(e) => setCaptionValue(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stone-900/10"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'generate' && (
                <div className="space-y-5">
                  {/* Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Describe your image
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="A noir detective in a rain-soaked alley, dramatic lighting..."
                      className="w-full h-24 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                    />
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Style
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {STYLES.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setAiStyle(style.id)}
                          className={cn(
                            "h-9 px-3 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                            aiStyle === style.id
                              ? 'bg-violet-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          )}
                        >
                          <style.icon size={14} />
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Aspect Ratio
                    </label>
                    <div className="flex gap-2">
                      {ASPECT_RATIOS.map(ratio => (
                        <button
                          key={ratio.id}
                          onClick={() => setAiAspectRatio(ratio.id)}
                          className={cn(
                            "h-9 px-4 rounded-lg text-xs font-medium transition-all",
                            aiAspectRatio === ratio.id
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          )}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generated Image Preview */}
                  {generatedImage && (
                    <div className="relative rounded-xl overflow-hidden border border-stone-200">
                      <img 
                        src={generatedImage} 
                        alt="Generated" 
                        className="w-full max-h-64 object-contain bg-stone-50"
                      />
                      <button
                        onClick={handleGenerate}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {generationError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {generationError}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'edit' && editingItem && (
                <div className="space-y-5">
                  {/* Current Image */}
                  <div className="rounded-xl overflow-hidden border border-stone-200">
                    <img 
                      src={editingItem.content} 
                      alt="To edit" 
                      className="w-full max-h-48 object-contain bg-stone-50"
                    />
                  </div>

                  {/* Edit Type */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      Edit Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'enhance', label: 'Enhance', icon: Wand2 },
                        { id: 'style-transfer', label: 'Style Transfer', icon: Paintbrush },
                        { id: 'expand', label: 'Expand', icon: Maximize2 },
                        { id: 'relight', label: 'Relight', icon: Sun },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setEditType(type.id as any)}
                          className={cn(
                            "h-11 px-3 rounded-xl text-xs font-medium transition-all flex items-center gap-2",
                            editType === type.id
                              ? 'bg-violet-600 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          )}
                        >
                          <type.icon size={14} />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edit Prompt */}
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-2">
                      {editType === 'enhance' ? 'Enhancement details (optional)' :
                       editType === 'style-transfer' ? 'Target style' :
                       editType === 'expand' ? 'What to add' :
                       'Lighting direction'}
                    </label>
                    <input
                      type="text"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder={
                        editType === 'enhance' ? 'Sharper, more vibrant...' :
                        editType === 'style-transfer' ? 'Oil painting, anime style...' :
                        editType === 'expand' ? 'Extend the forest on the left...' :
                        'Golden hour, dramatic side lighting...'
                      }
                      className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  {/* Error */}
                  {generationError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {generationError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="h-16 px-6 flex justify-end items-center gap-3 border-t border-stone-100">
              <button 
                onClick={resetAndClose}
                className="h-10 px-5 text-stone-600 font-medium hover:bg-stone-100 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              
              {activeTab === 'add' && (
                <button 
                  onClick={handleAdd}
                  disabled={!inputValue.trim()}
                  className="h-10 px-6 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 disabled:opacity-40 text-sm transition-all"
                >
                  Add Item
                </button>
              )}

              {activeTab === 'generate' && (
                <>
                  {!generatedImage ? (
                    <button 
                      onClick={handleGenerate}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="h-10 px-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-sm transition-all flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={handleSaveGenerated}
                      className="h-10 px-6 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 text-sm transition-all"
                    >
                      Add to Board
                    </button>
                  )}
                </>
              )}

              {activeTab === 'edit' && (
                <button 
                  onClick={handleEdit}
                  disabled={isEditing}
                  className="h-10 px-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-sm transition-all flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      Apply Edit
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MoodBoardCardProps {
  item: MoodBoardItem;
  onUpdate: (updates: Partial<MoodBoardItem>) => void;
  onDelete: () => void;
  onEdit: () => void;
}

const MoodBoardCard: React.FC<MoodBoardCardProps> = ({ item, onUpdate, onDelete, onEdit }) => {
  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative group/image">
            <img 
              src={item.content} 
              alt={item.caption || 'Mood board image'}
              className="w-full h-40 object-cover rounded-t-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23e7e5e4" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2378716c" font-size="14">Image Error</text></svg>';
              }}
            />
            <button
              onClick={onEdit}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-violet-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-all"
            >
              <Wand2 size={14} />
            </button>
          </div>
        );
      case 'color':
        return (
          <div 
            className="w-full h-40 rounded-t-xl"
            style={{ backgroundColor: item.content }}
          />
        );
      case 'text':
        return (
          <div className="w-full h-40 p-4 bg-stone-50 rounded-t-xl flex items-center justify-center">
            <p className="text-sm text-stone-600 text-center italic line-clamp-5">
              "{item.content}"
            </p>
          </div>
        );
      case 'link':
        return (
          <a 
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-40 p-4 bg-stone-50 rounded-t-xl flex flex-col items-center justify-center gap-2 hover:bg-stone-100 transition-colors"
          >
            <Link size={24} className="text-stone-400" />
            <span className="text-xs text-stone-500 truncate max-w-full px-2">
              {(() => { try { return new URL(item.content).hostname; } catch { return item.content; }})()}
            </span>
          </a>
        );
    }
  };

  return (
    <div className="group rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all bg-white">
      {renderContent()}
      
      <div className="p-3 flex items-center justify-between">
        <input
          value={item.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Add caption..."
          className="flex-1 text-xs text-stone-600 bg-transparent outline-none placeholder:text-stone-400"
        />
        <button
          onClick={onDelete}
          className="p-1 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default MoodBoardComponent;