import React, { useState } from 'react'
import { Settings as SettingsIcon, Key, Info, ExternalLink } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const { activeBusiness } = useBusiness()
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Settings" subtitle="Application configuration and account information." />

      {/* User info */}
      <div className="card">
        <h3 className="mb-4">Account</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Active business */}
      {activeBusiness && (
        <div className="card">
          <h3 className="mb-4">Active Business</h3>
          <div className="space-y-3">
            {[
              ['Name',     activeBusiness.business_name],
              ['Type',     activeBusiness.business_type],
              ['Currency', activeBusiness.currency],
              ['Location', activeBusiness.location || '—'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium capitalize">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Configuration */}
      <div className="card">
        <h3 className="mb-1 flex items-center gap-2"><Key size={16} /> AI Configuration</h3>
        <p className="text-sm text-gray-500 mb-4">
          The LLM provider and API key are configured via the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> file in the project root. Restart the backend after making changes.
        </p>
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Provider</span>
            <span className="font-mono font-medium">LLM_PROVIDER=gemini</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">API Key</span>
            <span className="font-mono font-medium">LLM_API_KEY=your_key_here</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mode</span>
            <span className="font-medium text-amber-600">Demo mode active if no key set</span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-2 w-fit"
          >
            <ExternalLink size={14} /> Get Gemini API Key
          </a>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-2 w-fit"
          >
            <ExternalLink size={14} /> Get OpenAI API Key
          </a>
        </div>
      </div>

      {/* OCR Config */}
      <div className="card">
        <h3 className="mb-1">OCR Configuration</h3>
        <p className="text-sm text-gray-500 mb-3">
          Tesseract OCR must be installed on your system for image upload to work.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium text-gray-700">Windows Installation</p>
          <ol className="list-decimal ml-4 space-y-1 text-gray-600">
            <li>Download from <a href="https://github.com/UB-Mannheim/tesseract/wiki" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">github.com/UB-Mannheim/tesseract</a></li>
            <li>Install and note the installation path</li>
            <li>Add to <code className="bg-gray-100 px-1 rounded">.env</code>: <code className="bg-gray-100 px-1 rounded">TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe</code></li>
          </ol>
          <p className="font-medium text-gray-700 mt-2">macOS / Linux</p>
          <p className="text-gray-600"><code className="bg-gray-100 px-1 rounded">brew install tesseract</code> or <code className="bg-gray-100 px-1 rounded">apt install tesseract-ocr</code></p>
        </div>
      </div>

      {/* Tech stack info */}
      <div className="card">
        <h3 className="mb-3 flex items-center gap-2"><Info size={16} /> About This Application</h3>
        <div className="text-sm text-gray-600 space-y-1.5">
          <p><strong>Frontend:</strong> React 18 · Vite · Tailwind CSS · Recharts · Axios</p>
          <p><strong>Backend:</strong> Python FastAPI · SQLAlchemy · SQLite · Pandas</p>
          <p><strong>ML:</strong> scikit-learn Linear Regression (sales forecasting)</p>
          <p><strong>OCR:</strong> Tesseract (pytesseract) — swappable engine</p>
          <p><strong>AI:</strong> Gemini / OpenAI — configurable via .env · Demo mode if no key</p>
          <p className="text-gray-400 text-xs mt-2">
            AI Business Assistant · Capstone Project · All business data stored locally in SQLite.
          </p>
        </div>
      </div>
    </div>
  )
}
