import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { ShieldCheck, LogOut, FileText, BookOpen, GitCompare, Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2 text-violet-400 font-semibold text-lg">
        <ShieldCheck size={22} />
        PolicyPal
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <BookOpen size={16} />
          Dashboard
        </Link>
        <Link to="/analyzer" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <FileText size={16} />
          Analyze
        </Link>
        <Link to="/saved" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <Bookmark size={16} />
          Saved
        </Link>
        <Link to="/compare" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <GitCompare size={16} />
          Compare
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-sm transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  )
}