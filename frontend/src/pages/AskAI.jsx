import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Bot, User, Lightbulb } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

const SUGGESTED = [
  'Why did my profit decrease?',
  'What are my best-selling products?',
  'Which products should I restock?',
  'Why are my expenses increasing?',
  'How are my sales performing this month?',
  'What should I focus on this week?',
]

function Message({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
        isUser ? 'bg-primary-600' : 'bg-gray-100'
      }`}>
        {isUser
          ? <User size={15} className="text-white" />
          : <Bot size={15} className="text-gray-500" />
        }
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-primary-600 text-white rounded-tr-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
      }`}>
        {content}
      </div>
    </div>
  )
}

export default function AskAI() {
  const { activeBusiness } = useBusiness()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your AI business assistant. Ask me anything about ${
        activeBusiness?.business_name || 'your business'
      } — sales, expenses, inventory, or recommendations. I'll answer using your actual business data.`,
    }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef(null)

  // Update greeting when business changes
  useEffect(() => {
    if (activeBusiness) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm your AI business assistant for ${activeBusiness.business_name}. Ask me anything about your sales, expenses, inventory, or business performance.`,
      }])
    }
  }, [activeBusiness?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q) return

    setMessages(m => [...m, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const r = await api.post(`/businesses/${activeBusiness.id}/ai/chat`, {
        business_id: activeBusiness.id,
        message: q,
      })
      setMessages(m => [...m, { role: 'assistant', content: r.data.reply }])
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'AI service error. Please try again.'
      setMessages(m => [...m, { role: 'assistant', content: `Sorry, I encountered an error: ${errMsg}` }])
    } finally {
      setLoading(false)
    }
  }

  if (!activeBusiness) return <NoBusiness />

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="Ask AI"
        subtitle="Chat with your business data. All answers are backed by real metrics."
      />

      {/* Chat container */}
      <div className="flex flex-col flex-1 min-h-0 max-w-3xl w-full">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Bot size={15} className="text-gray-500" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Lightbulb size={12} /> Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
          <input
            type="text"
            className="flex-1 text-sm outline-none px-2 placeholder-gray-400"
            placeholder="Ask about your sales, products, expenses…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Answers are generated from your actual business data, not generic AI responses.
        </p>
      </div>
    </div>
  )
}
