'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

function formatMessage(text: string) {
  const parts: { type: string; content: string }[] = [];
  const lines = text.split('\n');
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      parts.push({ type: 'list', content: listItems.join('\n') });
      listItems = [];
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      parts.push({ type: 'br', content: '' });
      continue;
    }

    const headerMatch = trimmed.match(/^###\s+(.*)/);
    if (headerMatch) {
      flushList();
      parts.push({ type: 'h3', content: headerMatch[1] });
      continue;
    }

    const listMatch = trimmed.match(/^(\d+\.|[-*])\s+(.*)/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[2]);
      continue;
    }

    flushList();
    parts.push({ type: 'p', content: trimmed });
  }
  flushList();

  return parts.map((part, i) => {
    switch (part.type) {
      case 'br':
        return <br key={i} />;
      case 'h3':
        return (
          <p key={i} className="font-bold text-base mt-3 mb-1 text-pink-700">
            {part.content}
          </p>
        );
      case 'list':
        return (
          <ul key={i} className="list-disc list-inside space-y-0.5 my-1">
            {part.content.split('\n').map((item, j) => (
              <li key={j}>{inlineFormat(item)}</li>
            ))}
          </ul>
        );
      default:
        return (
          <p key={i} className="mb-1 leading-relaxed">
            {inlineFormat(part.content)}
          </p>
        );
    }
  });
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={idx++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={idx++}>{match[3]}</em>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length ? parts : text;
}

function Toast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full text-center scale-100 transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">✅</div>
        <p className="text-gray-800 font-semibold text-lg">{message}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { symbol } = useCurrency();
  const { transcript, interim, listening, start, stop, reset: resetTranscript, supported: voiceSupported } = useSpeechRecognition();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeBlock, setRecipeBlock] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const displayValue = listening && interim ? interim : input;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const sendMessage = async (text?: string) => {
    const finalText = (text || input).trim();
    if (!finalText || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text: finalText }];
    setMessages(newMessages);
    setInput('');
    resetTranscript();
    setRecipeBlock(null);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', text: '❌ Error: ' + data.error }]);
      } else {
        const reply = data.reply;
        setMessages([...newMessages, { role: 'assistant', text: reply }]);

        const match = reply.match(/<!--RECIPE-->([\s\S]*?)<!--END_RECIPE-->/);
        if (match) {
          try {
            const recipeJson = match[1].trim();
            const recipe = JSON.parse(recipeJson);
            setRecipeBlock(recipe);
          } catch (e) {
            console.error('Error al parsear receta del chat', e);
          }
        }
      }
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', text: 'Error de conexión' }]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipeFromChat = async () => {
    if (!recipeBlock) return;
    try {
      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeBlock),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
        showToast(err.error || 'Error al guardar');
        return;
      }
      setRecipeBlock(null);
      showToast('Receta guardada exitosamente');
    } catch (e) {
      showToast('Error al guardar la receta');
    }
  };

  const messageBubble = (msg: Message, i: number) => {
    if (msg.role === 'user') {
      return (
        <div key={i} className="flex justify-end">
          <div className="max-w-[80%] bg-pink-500 text-white p-3 rounded-2xl rounded-br-sm">
            <p className="leading-relaxed">{msg.text}</p>
          </div>
        </div>
      );
    }

    const displayText = msg.text.replace(/<!--RECIPE-->[\s\S]*?<!--END_RECIPE-->/g, '').trim();

    return (
      <div key={i} className="flex justify-start">
        <div className="max-w-[85%] bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded-2xl rounded-bl-sm shadow-sm">
          <div className="prose prose-sm prose-pink max-w-none [&_ul]:pl-4 [&_li]:mb-0.5 [&_strong]:text-pink-600">
            {formatMessage(displayText)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col h-[calc(100vh-120px)]">
      <Toast message={toastMsg} visible={toastVisible} onClose={() => setToastVisible(false)} />

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">💬 Chat Repostero</h1>
        <Link href="/" className="text-pink-500 underline">← Inicio</Link>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 space-y-4 mb-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center py-12">
            <span className="text-6xl mb-4">🧁</span>
            <p className="text-lg font-medium">Pregúntame sobre repostería</p>
            <p className="text-sm mt-1">Escribe o usa el micrófono 🎤</p>
          </div>
        )}
        {messages.map((msg, i) => messageBubble(msg, i))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {recipeBlock && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-xl mb-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-green-800 font-semibold flex items-center gap-1.5">
                🎂 Receta lista
              </p>
              <p className="text-sm text-green-700 truncate mt-0.5">{recipeBlock.name}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={saveRecipeFromChat}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                💾 Guardar
              </button>
              <button
                onClick={() => setRecipeBlock(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {voiceSupported && (
          <button
            onClick={listening ? stop : start}
            className={`px-3 py-2 rounded-lg transition-colors shrink-0 ${
              listening
                ? 'bg-red-500 text-white shadow-md animate-pulse'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {listening ? '⏹️' : '🎤'}
          </button>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={listening ? 'Escuchando...' : 'Pregúntame algo de repostería...'}
          className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors shrink-0"
        >
          Enviar
        </button>
      </div>
    </main>
  );
}
