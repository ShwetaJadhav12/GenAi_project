import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { BusinessProvider } from './context/BusinessContext'
import AppLayout from './components/AppLayout'

// Pages
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Register     from './pages/Register'
import BusinessSetup from './pages/BusinessSetup'
import Dashboard    from './pages/Dashboard'
import DataInput    from './pages/DataInput'
import Transactions from './pages/Transactions'
import Products     from './pages/Products'
import Expenses     from './pages/Expenses'
import AIInsights   from './pages/AIInsights'
import Forecast     from './pages/Forecast'
import WhatIf       from './pages/WhatIf'
import AskAI        from './pages/AskAI'
import Reports      from './pages/Reports'
import Settings     from './pages/Settings'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={
        <PrivateRoute>
          <BusinessProvider>
            <AppLayout />
          </BusinessProvider>
        </PrivateRoute>
      }>
        <Route index                   element={<Navigate to="/app/dashboard" replace />} />
        <Route path="setup"            element={<BusinessSetup />} />
        <Route path="dashboard"        element={<Dashboard />} />
        <Route path="data-input"       element={<DataInput />} />
        <Route path="transactions"     element={<Transactions />} />
        <Route path="products"         element={<Products />} />
        <Route path="expenses"         element={<Expenses />} />
        <Route path="ai-insights"      element={<AIInsights />} />
        <Route path="forecast"         element={<Forecast />} />
        <Route path="whatif"           element={<WhatIf />} />
        <Route path="ask-ai"           element={<AskAI />} />
        <Route path="reports"          element={<Reports />} />
        <Route path="settings"         element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
