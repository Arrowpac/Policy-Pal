import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { PolicyProvider } from './context/PolicyContext'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy-loaded pages
const Login     = lazy(() => import('./pages/Login'))
const Signup    = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analyzer  = lazy(() => import('./pages/Analyzer'))
const Chat      = lazy(() => import('./pages/Chat'))
const Saved     = lazy(() => import('./pages/Saved'))
const Compare   = lazy(() => import('./pages/Compare'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PolicyProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' }
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/analyzer"  element={<ProtectedRoute><Analyzer /></ProtectedRoute>} />
              <Route path="/chat/:policyId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/saved"     element={<ProtectedRoute><Saved /></ProtectedRoute>} />
              <Route path="/compare"   element={<ProtectedRoute><Compare /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </PolicyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}