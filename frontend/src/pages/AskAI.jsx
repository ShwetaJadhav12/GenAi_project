import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Bot, User, Lightbulb,
  Sparkles, Copy, Check, RotateCcw, ShieldCheck
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  { text: 'Why did my profit decrease this month?', tag: 'Profit' },
  { text: 'What are my highest-margin products?', tag: 'Revenue' },
  { text: 'Which products are running low on stock?', tag: 'Inventory' },
  { text: 'Why are operating expenses trending up?', tag: 'Expenses' },
  { text: 'How are my sales performing compared to last week?', tag: 'Sales' },
  { text: 'What 3 actions should I take this week?', tag: 'Strategy' },
]

function FormattedContent({ text }) {
  // Format simple markdown lines: bold, bullet points
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-2" />
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-1">
              <span className="text-primary-500 font-bold mt-1 text-[10px]">•</span>
              <span>{renderBold(line.trim().substring(2))}</span>
            </div>
          )
        }
        return <p key={idx}>{renderBold(line)}</p>
      })}
    </div>
  )
}

function renderBold(str) {
  const parts = str.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

function Message({ role, content, onCopy, copiedIndex, index }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3.5 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-xs ${
        isUser
          ? 'bg-slate-800 text-white'
          : 'bg-gradient-to-tr from-primary-600 to-indigo-600 text-white'
      }`}>
        {isUser ? <User size={15} /> : <Sparkles size={15} />}
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[85%] sm:max-w-[78%] px-4 py-3 rounded-2xl shadow-xs ${
        isUser
          ? 'bg-primary-600 text-white rounded-tr-xs'
          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs'
      }`}>
        <FormattedContent text={content} />

        {/* Copy button for Assistant messages */}
        {!isUser && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <ShieldCheck size={11} /> Grounded in database
            </span>
            <button
              onClick={() => onCopy(content, index)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              title="Copy answer"
            >
              {copiedIndex === index ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AskAI() {
  const { activeBusiness } = useBusiness()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const bottomRef = useRef(null)

  // Initialize or update greeting when business changes
  useEffect(() => {
    if (activeBusiness) {
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I am your AI Business Copilot for **${activeBusiness.business_name}**.\n\nAsk me anything regarding your revenue, expense patterns, inventory health, or operational decisions. All answers are mathematically computed from your recorded transactions.`,
        }
      ])
    }
  }, [activeBusiness?.id, activeBusiness?.business_name])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const sendMessage = async (text) => {
    const q = (text || input).trim()
    if (!q || !activeBusiness) return

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
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-4xl mx-auto">
      <PageHeader
        title="Business Copilot"
        subtitle={`Interactive intelligence grounded in real ledger data for ${activeBusiness.business_name}.`}
        badge="Zero Hallucination"
        actions={
          <button
            onClick={() => {
              setMessages([
                {
                  role: 'assistant',
                  content: `Conversation reset. Ask me anything about ${activeBusiness.business_name}.`,
                }
              ])
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset Chat</span>
          </button>
        }
      />

      {/* Main chat surface */}
      <div className="card flex-1 flex flex-col min-h-0 p-4 sm:p-5 shadow-card overflow-hidden">
        {/* Messages viewport */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((m, i) => (
            <Message
              key={i}
              role={m.role}
              content={m.content}
              index={i}
              copiedIndex={copiedIndex}
              onCopy={copyText}
            />
          ))}

          {loading && (
            <div className="flex gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={15} />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium ml-1">Analyzing database records…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompts Pill Section */}
        {messages.length <= 2 && (
          <div className="pt-3 pb-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Lightbulb size={12} className="text-amber-500" /> Suggested Inquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(item.text)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-50 hover:bg-primary-50 border border-slate-200 hover:border-primary-300 text-slate-700 hover:text-primary-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs text-left"
                >
                  <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-white text-slate-500 uppercase">{item.tag}</span>
                  <span>{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Input Dock */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
            <input
              type="text"
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 outline-none px-2.5 placeholder:text-slate-400"
              placeholder={`Ask anything about ${activeBusiness.business_name} (e.g., "What was my highest sales day?")`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-95"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            All AI responses are cross-referenced with your local SQLite database ledger.
          </p>
        </div>
      </div>
    </div>
  )
}
