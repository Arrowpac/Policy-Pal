import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../context/AuthContext'
import { usePolicy } from '../context/PolicyContext'
import { simplifyPolicy } from '../services/aiService'
import { savePolicy } from '../services/firestoreService'
import { extractTextFromPDF } from '../utils/pdfParser'
import Navbar from '../components/Navbar'
import {
  Upload, FileText, Loader2, CheckCircle,
  AlertTriangle, ShieldCheck, ShieldX, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = ['Extracting text...', 'Analyzing policy...', 'Detecting red flags...', 'Saving results...']

const TYPE_COLORS = {
  health: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  vehicle: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  life: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  home: 'bg-green-500/10 text-green-400 border-green-500/30',
  travel: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
}

const SEVERITY_COLORS = {
  high: 'border-red-500/40 bg-red-500/5',
  medium: 'border-amber-500/40 bg-amber-500/5',
  low: 'border-yellow-500/40 bg-yellow-500/5',
}

const SEVERITY_BADGE = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-yellow-500/20 text-yellow-400',
}

export default function Analyzer() {
  const { user } = useAuth()
  const { setActivePolicy } = usePolicy()
  const navigate = useNavigate()

  const [rawText, setRawText] = useState('')
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState(null)
  const [expandedClauses, setExpandedClauses] = useState(false)

  // ── Dropzone ──────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    setFileName(file.name)
    setResult(null)

    if (file.type === 'application/pdf') {
      try {
        toast.loading('Reading PDF...', { id: 'pdf' })
        const text = await extractTextFromPDF(file)
        setRawText(text)
        toast.success('PDF loaded!', { id: 'pdf' })
      } catch {
        toast.error('Could not read PDF. Try pasting text instead.', { id: 'pdf' })
      }
    } else {
      const text = await file.text()
      setRawText(text)
      toast.success('File loaded!')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  // ── Analyze ───────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!rawText.trim()) {
      toast.error('Please upload a file or paste your policy text first')
      return
    }
    if (rawText.trim().length < 100) {
      toast.error('Policy text is too short to analyze')
      return
    }

    setAnalyzing(true)
    setStepIndex(0)

    try {
      setStepIndex(0) // Extracting
      await delay(600)
      setStepIndex(1) // Analyzing
      const analysis = await simplifyPolicy(rawText)

      setStepIndex(2) // Red flags
      await delay(400)
      setStepIndex(3) // Saving

      const policyData = {
        name: fileName || 'Pasted Policy',
        rawText,
        policyType: analysis.policyType || 'other',
        summary: analysis.summary,
        covered: analysis.covered || [],
        notCovered: analysis.notCovered || [],
        keyDetails: analysis.keyDetails || [],
        redFlags: analysis.redFlags || [],
        simplifiedClauses: analysis.simplifiedClauses || [],
      }

      const policyId = await savePolicy(user.uid, policyData)
      const saved = { id: policyId, ...policyData }

      setActivePolicy(saved)
      setResult(saved)
      toast.success('Analysis complete!')
    } catch (err) {
      console.error(err)
      toast.error('Analysis failed. Check your Gemini API key or try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Policy Analyzer</h1>
          <p className="text-gray-400 mt-1">Upload your insurance policy and get a plain-English breakdown instantly.</p>
        </div>

        {/* Upload area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors mb-4
            ${isDragActive
              ? 'border-violet-500 bg-violet-500/5'
              : 'border-gray-700 hover:border-gray-600 bg-gray-900'}`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className="mx-auto text-gray-500 mb-3" />
          {fileName ? (
            <div className="flex items-center justify-center gap-2">
              <FileText size={16} className="text-violet-400" />
              <span className="text-violet-400 font-medium">{fileName}</span>
            </div>
          ) : (
            <>
              <p className="text-gray-300 font-medium">Drop your policy PDF here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse — PDF or TXT</p>
            </>
          )}
        </div>

        {/* Paste text area */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-gray-500 text-xs">or paste policy text</span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="Paste your insurance policy text here..."
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
          />
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !rawText.trim()}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {STEPS[stepIndex]}
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Analyze Policy
            </>
          )}
        </button>

        {/* ── Results ─────────────────────────────────────────── */}
        {result && (
          <div className="mt-10 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-white text-xl font-bold">Analysis Results</h2>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border capitalize ${TYPE_COLORS[result.policyType]}`}>
                {result.policyType} insurance
              </span>
            </div>

            {/* Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Summary</h3>
              <p className="text-gray-200 leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Details */}
            {result.keyDetails?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Key Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {result.keyDetails.map((detail, i) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-3">
                      <p className="text-gray-500 text-xs mb-1">{detail.label}</p>
                      <p className="text-white text-sm font-medium">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coverage Map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Covered */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={16} className="text-green-400" />
                  <h3 className="text-green-400 text-xs font-semibold uppercase tracking-wider">What's Covered</h3>
                </div>
                <ul className="space-y-2">
                  {result.covered.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Not Covered */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldX size={16} className="text-red-400" />
                  <h3 className="text-red-400 text-xs font-semibold uppercase tracking-wider">What's Not Covered</h3>
                </div>
                <ul className="space-y-2">
                  {result.notCovered.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                      <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Red Flags */}
            {result.redFlags?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h3 className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                    Red Flags ({result.redFlags.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {result.redFlags.map((flag, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${SEVERITY_COLORS[flag.severity]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-300 text-sm font-medium italic">"{flag.clause}"</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-3 shrink-0 ${SEVERITY_BADGE[flag.severity]}`}>
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{flag.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simplified Clauses */}
            {result.simplifiedClauses?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <button
                  onClick={() => setExpandedClauses(p => !p)}
                  className="flex items-center justify-between w-full"
                >
                  <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    Simplified Clauses ({result.simplifiedClauses.length})
                  </h3>
                  {expandedClauses
                    ? <ChevronUp size={16} className="text-gray-500" />
                    : <ChevronDown size={16} className="text-gray-500" />
                  }
                </button>

                {expandedClauses && (
                  <div className="mt-4 space-y-4">
                    {result.simplifiedClauses.map((clause, i) => (
                      <div key={i} className="border border-gray-800 rounded-xl p-4">
                        <p className="text-gray-500 text-xs mb-1">Original</p>
                        <p className="text-gray-400 text-sm italic mb-3">"{clause.original}"</p>
                        <p className="text-gray-500 text-xs mb-1">What it means</p>
                        <p className="text-gray-200 text-sm">{clause.simplified}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={() => navigate(`/chat/${result.id}`)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Ask questions about this policy →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}