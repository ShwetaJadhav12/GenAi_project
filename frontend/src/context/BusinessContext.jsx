import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const BusinessContext = createContext(null)

export function BusinessProvider({ children }) {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [activeBusiness, setActiveBusiness] = useState(() => {
    const saved = localStorage.getItem('activeBusiness')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) fetchBusinesses()
    else {
      setBusinesses([])
      setActiveBusiness(null)
    }
  }, [user])

  const fetchBusinesses = async () => {
    setLoading(true)
    try {
      const r = await api.get('/businesses')
      setBusinesses(r.data)
      // If saved active business no longer exists, clear it
      if (activeBusiness) {
        const still = r.data.find(b => b.id === activeBusiness.id)
        if (!still) selectBusiness(r.data[0] || null)
        else selectBusiness(still)
      } else if (r.data.length > 0) {
        selectBusiness(r.data[0])
      }
    } catch (e) {
      console.error('Failed to fetch businesses', e)
    } finally {
      setLoading(false)
    }
  }

  const selectBusiness = (biz) => {
    setActiveBusiness(biz)
    if (biz) localStorage.setItem('activeBusiness', JSON.stringify(biz))
    else localStorage.removeItem('activeBusiness')
  }

  const createBusiness = async (data) => {
    const r = await api.post('/businesses', data)
    await fetchBusinesses()
    selectBusiness(r.data)
    return r.data
  }

  const loadDemo = async (type) => {
    if (!activeBusiness) throw new Error('No active business selected')
    const r = await api.post(`/businesses/${activeBusiness.id}/load-demo?demo_type=${type}`)
    return r.data
  }

  return (
    <BusinessContext.Provider value={{
      businesses, activeBusiness, loading,
      fetchBusinesses, selectBusiness, createBusiness, loadDemo,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export const useBusiness = () => {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider')
  return ctx
}
