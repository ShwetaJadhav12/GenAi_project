import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store, BarChart2, Brain, Upload, TrendingUp,
  MessageSquare, FlaskConical, FileText, ArrowRight,
  CheckCircle,
} from 'lucide-react'

const FEATURES = [
  { icon: Upload,        title: 'Multiple Data Sources',    desc: 'Upload CSV/Excel, scan invoices with OCR, or just type in plain English.' },
  { icon: BarChart2,     title: 'Real-Time Dashboard',      desc: 'KPI cards, trend charts, top products, and low-stock alerts — all from your actual data.' },
  { icon: Brain,         title: 'AI-Powered Insights',      desc: 'The analytics engine calculates metrics; the LLM explains them in plain language.' },
  { icon: TrendingUp,    title: 'Sales Forecasting',        desc: 'Machine learning model predicts the next 7 days of sales from your history.' },
  { icon: FlaskConical,  title: 'What-If Simulator',        desc: 'Simulate price changes or expense adjustments and see the estimated impact instantly.' },
  { icon: MessageSquare, title: 'Ask AI',                   desc: 'Chat with your data. Ask "Why did my profit drop?" and get answers backed by real numbers.' },
  { icon: FileText,      title: 'Business Reports',         desc: 'One-click report covering sales, expenses, profit, forecasts, and AI recommendations.' },
  { icon: Store,         title: 'Business Agnostic',        desc: 'Works for grocery, clothing, restaurants, retail — any small business.' },
]

const SUPPORTED = ['Grocery Shops', 'Clothing Stores', 'Restaurants', 'Retail Businesses']

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <Store size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900">AI Business Assistant</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="btn-secondary text-sm">Sign In</button>
          <button onClick={() => navigate('/register')} className="btn-primary text-sm">Get Started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <Brain size={12} /> AI-Powered · Locally Runnable · No Cloud Required
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          AI Operations Assistant<br />
          <span className="text-primary-600">for Small Businesses</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          Manage your business data without spreadsheets. Upload a bill photo, type a sentence,
          or drop a CSV — get instant dashboards, AI insights, and a 7-day sales forecast.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary px-6 py-3 text-base flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary px-6 py-3 text-base"
          >
            Sign In
          </button>
        </div>

        {/* Supported business types */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {SUPPORTED.map(t => (
            <span key={t} className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              <CheckCircle size={13} className="text-green-500" /> {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Everything you need</h2>
          <p className="text-gray-500 text-center mb-10">A complete AI-powered operations suite in one simple app.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                  <f.icon size={20} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Add Your Data', desc: 'Upload a CSV, photograph a bill, or describe a transaction in plain text.' },
            { step: '02', title: 'Automatic Analysis', desc: 'The analytics engine calculates revenue, profit, trends, and inventory alerts.' },
            { step: '03', title: 'AI Insights & Actions', desc: 'The LLM explains results, identifies problems, and suggests prioritised actions.' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary-600 py-14">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to understand your business?</h2>
          <p className="text-primary-100 mb-6">Create your free account and load demo data in under 2 minutes.</p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-primary-700 font-semibold px-7 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        AI Business Assistant · Capstone Project · Built with React, FastAPI, SQLite &amp; Gemini/OpenAI
      </footer>
    </div>
  )
}
