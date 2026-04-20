import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePolicy } from '../context/PolicyContext'
import { getPolicy } from '../services/firestoreService'
import { saveChatMessage, getChatMessages } from '../services/firestoreService'
import { askPolicyQuestion } from '../services/aiService'
import Navbar from '../components/Navbar'
import { Send, Loader2, Bot, User, ArrowLeft, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Chat() {
  const { policyId } = useParams()
  const { user } = useAuth()
  const { activePolicy, setActivePolicy } = usePolicy()
  const navigate = useNavigate()

  const [policy, setPolicy] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // ── Load policy + chat history ────────────────────────────────
  useEffect(() => {
    async function load() {
      setPageLoading(true)
      try {
        // Use context if available, else fetch from Firestore
        let p = activePolicy?.id === policyId ? activePolicy : null
        if (!p) {
          p = await getPolicy(user.uid, policyId)
          if (!p) { toast.error('Policy not found'); navigate('/dashboard'); return }
          setActivePolicy(p)
        }
        setPolicy(p)

        // Load chat history
        const history = await getChatMessages(user.uid, policyId)
        if (history.length === 0) {
          // Welcome message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Hi! I've read your **${p.name}** policy. Ask me anything about it — what's covered, what's not, confusing clauses, claim processes, anything.`,
          }])
        } else {
          setMessages(history)
        }
      } catch (err) {
        toast.error('Failed to load chat')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [policyId, user])

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Save user message
      await saveChatMessage(user.uid, policyId, { role: 'user', content: userMsg.content })

      // Get AI response
      const chatHistory = messages.filter(m => m.id !== 'welcome').slice(-6)
      console.log('rawText length:', policy?.rawText?.length)
      const answer = await askPolicyQuestion(policy.rawText, userMsg.content, chatHistory)

      const assistantMsg = { id: Date.now().toString() + 'a', role: 'assistant', content: answer }
      setMessages(prev => [...prev, assistantMsg])

      // Save assistant message
      await saveChatMessage(user.uid, policyId, { role: 'assistant', content: answer })
    } catch (err) {
      toast.error('Failed to get response. Try again.')
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, policy, policyId, user])

  // ── Enter key ─────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Suggested questions ───────────────────────────────────────
  const SUGGESTIONS = [
    'What am I covered for?',
    'What are the main exclusions?',
    'How do I make a claim?',
    'Are there any hidden conditions?',
  ]

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 size={32} className="animate-spin text-violet-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Navbar />

      {/* Chat header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-violet-600/20 p-2 rounded-lg">
            <ShieldCheck size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">{policy?.name}</h1>
            <p className="text-gray-500 text-xs capitalize">{policy?.policyType} insurance · Ask anything</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Suggested questions — show only at start */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="text-left text-sm text-gray-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl px-4 py-3 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user'
                  ? 'bg-violet-600'
                  : 'bg-gray-800 border border-gray-700'}`}
              >
                {msg.role === 'user'
                  ? <User size={14} className="text-white" />
                  : <Bot size={14} className="text-violet-400" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-sm'}`}
              >
                {msg.content.split('**').map((part, i) =>
                  i % 2 === 1
                    ? <strong key={i} className="text-white font-semibold">{part}</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-violet-400" />
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your policy..."
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-gray-600 text-xs text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}