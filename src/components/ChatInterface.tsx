import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { Source } from '../types';
import { generateAnswer } from '../services/geminiService';
import { useStory } from '../context/StoryContext';
import { cn } from '../lib/utils';

interface ChatInterfaceProps {
  sources: Source[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ sources }) => {
  const { chatHistory, addChatMessage, clearChatHistory } = useStory();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use chatHistory directly as source of truth - no duplicate state
  const messages = chatHistory;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (sources.length === 0) {
      alert("Please add items to your Story Bible first.");
      return;
    }

    const userText = input;
    setInput('');
    setIsLoading(true);

    // Add user message to context first
    addChatMessage({ role: 'user', text: userText });

    try {
      const history = [...chatHistory, { role: 'user' as const, text: userText }].map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const answer = await generateAnswer(history, sources);

      if (answer) {
        addChatMessage({ role: 'model', text: answer });
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "I encountered an error. Please try again.";
      addChatMessage({ role: 'model', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl shadow-subtle border overflow-hidden bg-white border-stone-200/60">
      
      {/* Header */}
      {messages.length > 0 && (
        <div className="h-11 px-5 flex items-center justify-between border-b shrink-0 border-stone-100">
          <span className="text-xs font-medium text-stone-500">
            {messages.length} messages
          </span>
          <button
            onClick={clearChatHistory}
            className="h-7 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors text-stone-400 hover:text-stone-600 hover:bg-stone-100"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-stone-50/30">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 bg-stone-100">
              <Sparkles size={28} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-stone-900">Co-Writer</h3>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500">
              Ask questions about your story, explore character motivations, or brainstorm new plot directions.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' && "flex-row-reverse")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' 
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-500'
            )}>
              {msg.role === 'user' ? <User size={14} strokeWidth={2} /> : <Bot size={14} strokeWidth={2} />}
            </div>
            <div className={cn(
              "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === 'user' 
                ? 'bg-stone-900 text-white rounded-tr-md'
                : 'bg-stone-100 text-stone-700 rounded-tl-md'
            )}>
              <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-stone-100 text-stone-400">
              <Bot size={14} strokeWidth={2} />
            </div>
            <div className="rounded-2xl rounded-tl-md px-4 py-3 flex gap-1.5 items-center bg-stone-100">
              <div className="w-1.5 h-1.5 rounded-full animate-bounce bg-stone-400" />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms] bg-stone-400" />
              <div className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms] bg-stone-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone-100">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your co-writer..."
            className="w-full h-11 pl-4 pr-12 rounded-xl border shadow-subtle outline-none transition-all text-sm font-medium bg-stone-50 border-stone-200 text-stone-800 placeholder:text-stone-400 focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 bg-stone-900 text-white hover:bg-stone-700"
          >
            <Send size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;