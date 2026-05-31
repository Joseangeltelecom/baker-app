'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPage() {
  const { symbol } = useCurrency();
  const { transcript, listening, start, stop, reset: resetTranscript, supported: voiceSupported } = useSpeechRecognition();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeBlock, setRecipeBlock] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Sincronizar transcripción con input
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

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

        // Buscar bloque de receta
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
      await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeBlock),
      });
      alert('Receta guardada exitosamente');
      setRecipeBlock(null);
    } catch (e) {
      alert('Error al guardar');
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">💬 Chat Repostero</h1>
        <Link href="/" className="text-pink-500 underline">← Inicio</Link>
      </div>

      <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow p-4 space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg animate-pulse">Escribiendo...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {recipeBlock && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
          <p className="text-green-800 font-semibold">🎂 ¡Receta encontrada!</p>
          <p className="text-sm">{recipeBlock.name}</p>
          <button onClick={saveRecipeFromChat} className="mt-2 bg-green-500 text-white px-4 py-1 rounded">
            Guardar en mis recetas
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {voiceSupported && (
          <button
            onClick={listening ? stop : start}
            className={`px-3 py-2 rounded-lg ${listening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {listening ? '⏹️' : '🎤'}
          </button>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Pregúntame algo de repostería..."
          className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-pink-500"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </main>
  );
}