import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Store, User, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Setting up your workspace.')
      navigate('/app/setup')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Store size={22} className="text-white" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">AI Assistant</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create workspace</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Start running your small business operations with AI</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-card-hover border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Rahul Sharma"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pl-10"
                    placeholder="Min 6 chars"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Confirm</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pl-10"
                    placeholder="Confirm"
                    value={form.confirm}
                    onChange={set('confirm')}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-2.5 text-sm font-semibold shadow-md mt-2"
              disabled={loading}
            >
              {loading ? 'Setting up workspace…' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5 pt-5 border-t border-slate-100">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
