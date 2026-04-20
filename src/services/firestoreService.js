import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ── Save a new policy ──────────────────────────────────────────
export async function savePolicy(uid, policyData) {
  const ref = collection(db, 'users', uid, 'policies')
  const docRef = await addDoc(ref, {
    ...policyData,
    uploadedAt: serverTimestamp(),
  })
  return docRef.id
}

// ── Get all policies for a user ────────────────────────────────
export async function getPolicies(uid) {
  const ref = collection(db, 'users', uid, 'policies')
  const q = query(ref, orderBy('uploadedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Get a single policy ────────────────────────────────────────
export async function getPolicy(uid, policyId) {
  const ref = doc(db, 'users', uid, 'policies', policyId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// ── Update a policy ────────────────────────────────────────────
export async function updatePolicy(uid, policyId, data) {
  const ref = doc(db, 'users', uid, 'policies', policyId)
  await updateDoc(ref, data)
}

// ── Delete a policy ────────────────────────────────────────────
export async function deletePolicy(uid, policyId) {
  const ref = doc(db, 'users', uid, 'policies', policyId)
  await deleteDoc(ref)
}

// ── Chat messages ──────────────────────────────────────────────
export async function saveChatMessage(uid, policyId, message) {
  const ref = collection(db, 'users', uid, 'policies', policyId, 'messages')
  await addDoc(ref, {
    ...message,
    createdAt: serverTimestamp(),
  })
}

export async function getChatMessages(uid, policyId) {
  const ref = collection(db, 'users', uid, 'policies', policyId, 'messages')
  const q = query(ref, orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}