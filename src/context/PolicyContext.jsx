import { createContext, useContext, useState } from 'react'

const PolicyContext = createContext(null)

export function PolicyProvider({ children }) {
  const [activePolicy, setActivePolicy] = useState(null)
  // activePolicy shape:
  // { id, name, rawText, simplifiedSummary, redFlags, coverageMap, policyType, uploadedAt }

  return (
    <PolicyContext.Provider value={{ activePolicy, setActivePolicy }}>
      {children}
    </PolicyContext.Provider>
  )
}

export function usePolicy() {
  return useContext(PolicyContext)
}