import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePolicies } from '../hooks/usePolicies'
import Navbar from '../components/Navbar'
import {
  ShieldCheck, Plus, Loader2, FileText,
  AlertTriangle, MessageSquare, Trash2,
  ShieldX, TrendingUp
} from 'lucide-react'

const TYPE_COLORS = {
  health: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  vehicle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  life: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  home: 'bg-green-500/10 text-green-400 border-green-500/20',
  travel: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { policies, loading, removePolicy } = usePolicies()

  const stats = useMemo(() => ({
    total: policies.length,
    redFlags: policies.reduce((acc, p) => acc + (p.redFlags?.length || 0), 0),
    types: [...new Set(policies.map(p => p.policyType))].length,
  }), [policies])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Greeting */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">
              Welcome back, {user?.displayName?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="text-gray-400 mt-1">Here are all your analyzed policies.</p>
          </div>
          <button
            onClick={() => navigate('/analyzer')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            Analyze new policy
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-violet-500/10 p-2 rounded-lg">
                <FileText size={16} className="text-violet-400" />
              </div>
              <span className="text-gray-400 text-sm">Total Policies</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <span className="text-gray-400 text-sm">Red Flags Found</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.redFlags}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <span className="text-gray-400 text-sm">Policy Types</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.types}</p>
          </div>
        </div>

        {/* Policies list */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-violet-400" />
          </div>
        ) : policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-gray-900 border border-gray-800 rounded-full p-6 mb-4">
              <ShieldCheck size={32} className="text-gray-600" />
            </div>
            <h3 className="text-gray-300 font-semibold mb-1">No policies yet</h3>
            <p className="text-gray-500 text-sm mb-4">Upload your first policy to get started</p>
            <button
              onClick={() => navigate('/analyzer')}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Analyze your first policy
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map(policy => (
              <div
                key={policy.id}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name + type badge */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{policy.name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${TYPE_COLORS[policy.policyType]}`}>
                        {policy.policyType}
                      </span>
                      {policy.redFlags?.length > 0 && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                          {policy.redFlags.length} red flag{policy.redFlags.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {policy.summary}
                    </p>

                    {/* Coverage pills */}
                    <div className="flex gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-green-400">
                        <ShieldCheck size={12} />
                        <span>{policy.covered?.length || 0} covered</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-red-400">
                        <ShieldX size={12} />
                        <span>{policy.notCovered?.length || 0} exclusions</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/chat/${policy.id}`)}
                      className="flex items-center gap-1.5 text-xs bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 border border-violet-500/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      <MessageSquare size={12} />
                      Ask AI
                    </button>
                    <button
                      onClick={() => removePolicy(policy.id)}
                      className="flex items-center gap-1.5 text-xs bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}