import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../context/AuthContext'
import { simplifyPolicy } from '../services/aiService'
import { savePolicy } from '../services/firestoreService'
import { extractTextFromPDF } from '../utils/pdfParser'
import Navbar from '../components/Navbar'
import {
  Upload, Loader2, ShieldCheck, ShieldX,
  AlertTriangle, CheckCircle, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

function DropZone({ label, fileName, onDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-gray-700 hover:border-gray-600 bg-gray-900'}`}
    >
      <input {...getInputProps()} />
      <Upload size={24} className="mx-auto text-gray-500 mb-2" />
      {fileName
        ? <p className="text-violet-400 text-sm font-medium">{fileName}</p>
        : <>
            <p className="text-gray-300 text-sm font-medium">{label}</p>
            <p className="text-gray-500 text-xs mt-1">PDF or TXT</p>
          </>
      }
    </div>
  )
}

export default function Compare() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState([null, null])
  const [fileNames, setFileNames] = useState(['', ''])
  const [rawTexts, setRawTexts] = useState(['', ''])
  const [results, setResults] = useState([null, null])
  const [loading, setLoading] = useState(false)

  const handleDrop = useCallback((index) => async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    const newNames = [...fileNames]
    newNames[index] = file.name
    setFileNames(newNames)

    let text = ''
    if (file.type === 'application/pdf') {
      try {
        toast.loading('Reading PDF...', { id: `pdf${index}` })
        text = await extractTextFromPDF(file)
        toast.success('PDF loaded!', { id: `pdf${index}` })
      } catch {
        toast.error('Could not read PDF', { id: `pdf${index}` })
        return
      }
    } else {
      text = await file.text()
    }

    const newTexts = [...rawTexts]
    newTexts[index] = text
    setRawTexts(newTexts)
  }, [fileNames, rawTexts])

  async function handleCompare() {
    if (!rawTexts[0] || !rawTexts[1]) {
      toast.error('Please upload both policies first')
      return
    }
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        simplifyPolicy(rawTexts[0]),
        simplifyPolicy(rawTexts[1]),
      ])
      setResults([r1, r2])

      // Save both to Firestore
      await Promise.all([
        savePolicy(user.uid, { name: fileNames[0], rawText: rawTexts[0], ...r1 }),
        savePolicy(user.uid, { name: fileNames[1], rawText: rawTexts[1], ...r2 }),
      ])

      toast.success('Comparison ready!')
    } catch (err) {
      console.error(err)
      toast.error('Comparison failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const allCovered = results[0] && results[1]
    ? [...new Set([...results[0].covered, ...results[1].covered])]
    : []

  const allExclusions = results[0] && results[1]
    ? [...new Set([...results[0].notCovered, ...results[1].notCovered])]
    : []

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold">Compare Policies</h1>
          <p className="text-gray-400 mt-1">Upload two policies to see a side-by-side breakdown.</p>
        </div>

        {/* Upload zones */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DropZone label="Policy A" fileName={fileNames[0]} onDrop={handleDrop(0)} />
          <DropZone label="Policy B" fileName={fileNames[1]} onDrop={handleDrop(1)} />
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !rawTexts[0] || !rawTexts[1]}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-10"
        >
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Comparing policies...</>
            : 'Compare Policies'
          }
        </button>

        {/* Results */}
        {results[0] && results[1] && (
          <div className="space-y-8">

            {/* Summaries */}
            <div className="grid grid-cols-2 gap-4">
              {results.map((r, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">
                    Policy {i === 0 ? 'A' : 'B'} — {fileNames[i]}
                  </p>
                  <p className="text-gray-200 text-sm leading-relaxed">{r.summary}</p>
                  {r.redFlags?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 text-red-400 text-xs">
                      <AlertTriangle size={12} />
                      {r.redFlags.length} red flag{r.redFlags.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Coverage comparison table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-400" />
                Coverage comparison
              </h3>
              <div className="space-y-2">
                {allCovered.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-800 last:border-0">
                    <p className="text-gray-300 text-sm col-span-1">{item}</p>
                    <div className="flex justify-center">
                      {results[0].covered.includes(item)
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <XCircle size={16} className="text-red-400" />}
                    </div>
                    <div className="flex justify-center">
                      {results[1].covered.includes(item)
                        ? <CheckCircle size={16} className="text-green-400" />
                        : <XCircle size={16} className="text-red-400" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div />
                <p className="text-center text-gray-500 text-xs">{fileNames[0] || 'Policy A'}</p>
                <p className="text-center text-gray-500 text-xs">{fileNames[1] || 'Policy B'}</p>
              </div>
            </div>

            {/* Exclusions comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <ShieldX size={16} className="text-red-400" />
                Exclusions comparison
              </h3>
              <div className="space-y-2">
                {allExclusions.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-800 last:border-0">
                    <p className="text-gray-300 text-sm col-span-1">{item}</p>
                    <div className="flex justify-center">
                      {results[0].notCovered.includes(item)
                        ? <XCircle size={16} className="text-red-400" />
                        : <CheckCircle size={16} className="text-green-400" />}
                    </div>
                    <div className="flex justify-center">
                      {results[1].notCovered.includes(item)
                        ? <XCircle size={16} className="text-red-400" />
                        : <CheckCircle size={16} className="text-green-400" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div />
                <p className="text-center text-gray-500 text-xs">{fileNames[0] || 'Policy A'}</p>
                <p className="text-center text-gray-500 text-xs">{fileNames[1] || 'Policy B'}</p>
              </div>
            </div>

            {/* Red flags side by side */}
            {(results[0].redFlags?.length > 0 || results[1].redFlags?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {results.map((r, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-amber-400 text-xs font-semibold uppercase mb-3 flex items-center gap-2">
                      <AlertTriangle size={12} />
                      Policy {i === 0 ? 'A' : 'B'} red flags
                    </h3>
                    {r.redFlags?.length === 0
                      ? <p className="text-gray-500 text-sm">No red flags found ✓</p>
                      : r.redFlags.map((flag, j) => (
                          <div key={j} className="mb-3 last:mb-0">
                            <p className="text-gray-300 text-xs italic mb-1">"{flag.clause}"</p>
                            <p className="text-gray-500 text-xs">{flag.explanation}</p>
                          </div>
                        ))
                    }
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}