import React, { useState } from 'react'
import { Upload, Image, MessageSquare, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

const STANDARD_FIELDS = ['date','product','category','quantity','unit_price','total_amount','transaction_type','expense_category','description','(skip)']

// ─── Tab A: CSV Upload ───────────────────────────────────────────────────────
function CSVTab({ bizId }) {
  const [step, setStep]             = useState('upload')  // upload|map|validate|done
  const [session, setSession]       = useState(null)
  const [mappings, setMappings]     = useState({})
  const [validation, setValidation] = useState(null)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [dragOver, setDragOver]     = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['.csv','.xlsx','.xls']
    if (!allowed.some(e => file.name.toLowerCase().endsWith(e))) {
      toast.error('Please upload a .csv, .xlsx, or .xls file'); return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await api.post(`/businesses/${bizId}/data-input/upload-csv`, fd)
      setSession(r.data)
      // Pre-fill from suggested mappings
      const init = {}
      r.data.columns.forEach(col => {
        init[col] = r.data.suggested_mappings?.[col] || '(skip)'
      })
      setMappings(init)
      setStep('map')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setLoading(true)
    try {
      const mapList = Object.entries(mappings)
        .filter(([,v]) => v !== '(skip)')
        .map(([source_column, target_field]) => ({ source_column, target_field }))
      const r = await api.post(`/businesses/${bizId}/data-input/validate-csv`, {
        session_id: session.session_id,
        mappings: mapList,
      })
      setValidation(r.data)
      setStep('validate')
    } catch (err) {
      toast.error('Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const mapList = Object.entries(mappings)
        .filter(([,v]) => v !== '(skip)')
        .map(([source_column, target_field]) => ({ source_column, target_field }))
      const r = await api.post(`/businesses/${bizId}/data-input/import-csv`, {
        session_id: session.session_id,
        business_id: bizId,
        mappings: mapList,
      })
      setResult(r.data)
      setStep('done')
      toast.success(`Imported ${r.data.imported} records!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setStep('upload'); setSession(null); setMappings({}); setValidation(null); setResult(null) }

  if (step === 'done') return (
    <div className="text-center py-10">
      <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">Import Complete</h3>
      <p className="text-gray-500 mb-1">{result.imported} records imported successfully.</p>
      {result.skipped > 0 && <p className="text-amber-600 text-sm">{result.skipped} rows skipped.</p>}
      {result.errors?.length > 0 && (
        <details className="mt-3 text-left max-w-lg mx-auto">
          <summary className="text-sm text-gray-500 cursor-pointer">View skipped row details</summary>
          <ul className="mt-2 text-xs text-red-600 space-y-1">{result.errors.map((e,i)=><li key={i}>{e}</li>)}</ul>
        </details>
      )}
      <button onClick={reset} className="btn-primary mt-5">Upload Another File</button>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Step 1: Drop zone */}
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <Upload size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">Drop your CSV or Excel file here</p>
          <p className="text-sm text-gray-400 mb-4">Supports .csv, .xlsx, .xls — up to 10 MB</p>
          <label className="btn-primary cursor-pointer">
            Browse File
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </label>
          {loading && <p className="mt-3 text-sm text-gray-400">Uploading…</p>}
        </div>
      )}

      {/* Step 2: Column mapping */}
      {(step === 'map' || step === 'validate') && session && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">{session.row_count} rows detected</p>
              <p className="text-sm text-gray-500">Map each column to the correct field. Columns marked "(skip)" will be ignored.</p>
            </div>
            <button onClick={reset} className="btn-secondary text-sm">Start Over</button>
          </div>

          {/* Preview */}
          <details className="card">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center gap-2">
              <ChevronDown size={14} /> Preview (first 5 rows)
            </summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-xs">
                <thead>
                  <tr>{session.columns.map(c => <th key={c} className="text-left pb-1 font-medium text-gray-500 pr-4 whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {session.preview.map((row, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      {session.columns.map(c => <td key={c} className="py-1 pr-4 text-gray-700 whitespace-nowrap">{String(row[c] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Mapping grid */}
          <div className="card">
            <h3 className="mb-3">Column Mappings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.columns.map(col => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 font-medium w-40 truncate" title={col}>{col}</span>
                  <span className="text-gray-300">→</span>
                  <select
                    className="input flex-1 text-sm"
                    value={mappings[col] || '(skip)'}
                    onChange={e => setMappings(m => ({ ...m, [col]: e.target.value }))}
                  >
                    {STANDARD_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Validation results */}
          {step === 'validate' && validation && (
            <div className={`card border ${validation.issues?.length ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                {validation.issues?.length
                  ? <AlertCircle size={16} className="text-amber-600" />
                  : <CheckCircle size={16} className="text-green-600" />}
                <span className="font-medium text-sm">
                  {validation.valid_rows} valid rows ready to import
                  {validation.issues?.length > 0 && `, ${validation.issues.length} issue(s) found`}
                </span>
              </div>
              {validation.issues?.length > 0 && (
                <ul className="text-xs text-amber-700 space-y-0.5 mt-1">
                  {validation.issues.map((e,i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {step === 'map' && (
              <button onClick={handleValidate} disabled={loading} className="btn-primary">
                {loading ? 'Validating…' : 'Validate Mappings'}
              </button>
            )}
            {step === 'validate' && (
              <>
                <button onClick={() => setStep('map')} className="btn-secondary">Edit Mappings</button>
                <button onClick={handleImport} disabled={loading || !validation?.valid_rows} className="btn-primary">
                  {loading ? 'Importing…' : `Import ${validation?.valid_rows} Records`}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab B: Image / OCR ──────────────────────────────────────────────────────
function ImageTab({ bizId }) {
  const [file, setFile]             = useState(null)
  const [preview, setPreview]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [ocrResult, setOcrResult]   = useState(null)
  const [editData, setEditData]     = useState(null)
  const [saved, setSaved]           = useState(false)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['.jpg','.jpeg','.png']
    if (!allowed.some(e => f.name.toLowerCase().endsWith(e))) {
      toast.error('Please upload a JPG or PNG image'); return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setOcrResult(null)
    setEditData(null)
    setSaved(false)
  }

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await api.post(`/businesses/${bizId}/data-input/upload-image`, fd)
      setOcrResult(r.data)
      if (r.data.structured_data) setEditData({ ...r.data.structured_data })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'OCR extraction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.post(`/businesses/${bizId}/data-input/confirm-ocr`, { transaction: editData })
      setSaved(true)
      toast.success('Transaction saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const edit = (k) => (e) => setEditData(d => ({ ...d, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="card border-dashed border-2 border-gray-200 text-center p-8">
        <Image size={36} className="text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-700 mb-1">Upload bill or handwritten record image</p>
        <p className="text-sm text-gray-400 mb-4">JPG, JPEG, PNG — up to 5 MB</p>
        <label className="btn-primary cursor-pointer">
          Choose Image
          <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </label>
      </div>

      {preview && (
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-5">
            <img src={preview} alt="preview" className="w-full sm:w-64 h-48 object-contain rounded-lg border border-gray-100 bg-gray-50" />
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-gray-700">Image ready: <span className="text-gray-500">{file?.name}</span></p>
              {!ocrResult && (
                <button onClick={handleExtract} disabled={loading} className="btn-primary">
                  {loading ? 'Extracting with OCR…' : 'Extract Text with OCR'}
                </button>
              )}
              {ocrResult && !ocrResult.success && (
                <div className="flex items-start gap-2 text-red-600 text-sm">
                  <XCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{ocrResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ocrResult?.success && (
        <div className="card">
          <h3 className="mb-3">Extracted Text</h3>
          <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap border border-gray-100 max-h-32 overflow-y-auto">
            {ocrResult.extracted_text}
          </pre>
        </div>
      )}

      {editData && !saved && (
        <div className="card border-2 border-primary-100">
          <h3 className="mb-1">Extracted Transaction — Please Review &amp; Confirm</h3>
          <p className="text-sm text-gray-500 mb-4">Edit any field before saving. Never saves automatically.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['transaction_type','Type (sale/purchase)','text'],
              ['product','Product Name','text'],
              ['category','Category','text'],
              ['quantity','Quantity','number'],
              ['unit_price','Unit Price','number'],
              ['amount','Total Amount','number'],
              ['date','Date (YYYY-MM-DD)','date'],
            ].map(([k, label, type]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input type={type} className="input" value={editData[k] ?? ''} onChange={edit(k)} />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Confirm & Save'}
            </button>
            <button onClick={() => setEditData(null)} className="btn-danger">Cancel</button>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle size={12} /> Confidence: {editData.confidence || 'low'} — please verify all fields.
          </p>
        </div>
      )}

      {saved && (
        <div className="card border-green-200 bg-green-50 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-green-700 font-medium">Transaction saved to database.</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab C: Natural Language ─────────────────────────────────────────────────
function NLPTab({ bizId }) {
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [editData, setEditData] = useState(null)
  const [saved, setSaved]       = useState(false)

  const EXAMPLES = [
    'Sold 10 packets of Maggi for ₹150 today.',
    'Bought 20 kg rice from Sharma Traders for ₹1200.',
    'Purchased 5 dozen eggs at ₹6 each this morning.',
    'Sold 3 Women Kurtis for ₹650 each on 2026-06-10.',
  ]

  const handleExtract = async () => {
    if (!text.trim()) { toast.error('Please enter some text'); return }
    setLoading(true)
    setSaved(false)
    try {
      const r = await api.post(`/businesses/${bizId}/data-input/nlp-extract`, { text })
      setExtracted(r.data)
      setEditData({ ...r.data.extracted })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.post(`/businesses/${bizId}/data-input/confirm-nlp`, { transaction: editData })
      setSaved(true)
      toast.success('Transaction saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const edit = (k) => (e) => setEditData(d => ({ ...d, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="card">
        <label className="label">Describe your transaction in plain English</label>
        <textarea
          className="input h-24 resize-none"
          placeholder='e.g. "Sold 10 packets of Maggi for ₹150 today."'
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => setText(ex)}
              className="text-xs bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-2.5 py-1 rounded-full transition-colors"
            >
              {ex.substring(0, 40)}…
            </button>
          ))}
        </div>
        <button onClick={handleExtract} disabled={loading || !text.trim()} className="btn-primary mt-4">
          {loading ? 'Extracting…' : 'Extract Transaction'}
        </button>
      </div>

      {editData && !saved && (
        <div className="card border-2 border-primary-100">
          <h3 className="mb-1">Extracted Transaction — Please Review</h3>
          <p className="text-sm text-gray-500 mb-4">
            Original: <em className="text-gray-700">"{extracted?.original_text}"</em>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['transaction_type','Type (sale/purchase)'],
              ['product','Product Name'],
              ['category','Category'],
              ['quantity','Quantity'],
              ['unit_price','Unit Price'],
              ['amount','Total Amount'],
              ['date','Date (YYYY-MM-DD)'],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input" value={editData[k] ?? ''} onChange={edit(k)} />
              </div>
            ))}
          </div>
          <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
            <AlertCircle size={12} /> AI confidence: {editData.confidence || 'low'} — verify before saving.
          </p>
          <div className="flex gap-3 mt-3">
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Confirm & Save'}
            </button>
            <button onClick={() => setEditData(null)} className="btn-danger">Cancel</button>
          </div>
        </div>
      )}

      {saved && (
        <div className="card border-green-200 bg-green-50 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-green-700 font-medium">Transaction saved to database.</p>
          <button onClick={() => { setExtracted(null); setEditData(null); setSaved(false); setText('') }} className="ml-auto btn-secondary text-sm">
            Add Another
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'csv',   label: 'Upload CSV / Excel', icon: Upload },
  { id: 'image', label: 'Upload Image (OCR)',  icon: Image },
  { id: 'nlp',   label: 'Natural Language',    icon: MessageSquare },
]

export default function DataInput() {
  const { activeBusiness } = useBusiness()
  const [tab, setTab] = useState('csv')

  if (!activeBusiness) return <NoBusiness />

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Data Input"
        subtitle="Add transaction data through CSV upload, image scanning, or plain text."
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab flex items-center gap-2 ${tab === t.id ? 'active' : ''}`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'csv'   && <CSVTab   bizId={activeBusiness.id} />}
      {tab === 'image' && <ImageTab bizId={activeBusiness.id} />}
      {tab === 'nlp'   && <NLPTab   bizId={activeBusiness.id} />}
    </div>
  )
}
