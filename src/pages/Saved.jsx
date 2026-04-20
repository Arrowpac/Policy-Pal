import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicies } from '../hooks/usePolicies'
import Navbar from '../components/Navbar'
import {
  Search, MessageSquare, Trash2, ShieldCheck,
  ShieldX, AlertTriangle, Loader2, Plus
} from 'lucide-react'

const TYPE_COLORS = {
  health: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  vehicle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  life: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  home: 'bg-green-500/10 text-green-400 border-green-500/20',
  travel: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function Saved() {
  const navigate = useNavigate()
  const { policies, loading, removePolicy } = usePolicies()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const types = useMemo(() => {
    const t = [...new Set(policies.map(p => p.policyType))]
    return ['all', ...t]
  }, [policies])

  const filtered = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.summary?.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || p.policyType === filterType
      return matchSearch && matchType
    })
  }, [policies, search, filterType])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Saved Policies</h1>
            <p className="text-gray-400 mt-1">{policies.length} policies analyzed</p>
          </div>
          <button
            onClick={() => navigate('/analyzer')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            New analysis
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search policies..."
              className="w-full bg-gray-900 border border-gray-800 text-gray-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors border
                  ${filterType === type
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-violet-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No policies found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(policy => (
              <div key={policy.id} className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-white font-semibold truncate">{policy.name}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border capitalize shrink-0 ${TYPE_COLORS[policy.policyType]}`}>
                        {policy.policyType}
                      </span>
                      {policy.redFlags?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                          <AlertTriangle size={10} />
                          {policy.redFlags.length} red flag{policy.redFlags.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {policy.summary}
                    </p>

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