import { useState, useEffect } from 'react'
import { getPolicies, deletePolicy } from '../services/firestoreService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export function usePolicies() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchPolicies()
  }, [user])

  async function fetchPolicies() {
    setLoading(true)
    try {
      const data = await getPolicies(user.uid)
      setPolicies(data)
    } catch (err) {
      toast.error('Failed to load policies')
    } finally {
      setLoading(false)
    }
  }

  async function removePolicy(policyId) {
    try {
      await deletePolicy(user.uid, policyId)
      setPolicies(prev => prev.filter(p => p.id !== policyId))
      toast.success('Policy deleted')
    } catch (err) {
      toast.error('Failed to delete policy')
    }
  }

  return { policies, loading, refetch: fetchPolicies, removePolicy }
}