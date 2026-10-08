import React, { useState } from 'react'
import {
  Upload, Image, MessageSquare, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronUp, FileSpreadsheet,
  Sparkles, CheckCircle2, ArrowRight, Scan, HelpCircle
} from 'lucide-react'
import api from '../services/api'
import { useBusiness } from '../context/BusinessContext'
import NoBusiness from '../components/NoBusiness'
import PageHeader from '../components/PageHeader'
import toast from 'react-hot-toast'

const STANDARD_FIELDS = [
  'date', 'product', 'category', 'quantity', 'unit_price',
  'total_amount', 'transaction_type', 'expense_category', 'description', '(skip)'
]

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
      const init = {}
      r.data.columns.forEach(col => {
        init[col] = r.data.suggested_mappings?.[col] || '(skip)'
      })
      setMappings(init)
      setStep('map')
      toast.success(`Found ${r.data.row_count} rows in file`)
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
      toast.success('Column mappings verified')
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
      toast.success(`Successfully imported ${r.data.imported} records!`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setStep('upload'); setSession(null); setMappings({}); setValidation(null); setResult(null) }

  if (step === 'done') return (
    <div className="card text-center py-12 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
        <CheckCircle2 size={32} />
      </div>
      <h3 className="text-lg font-bold text-slate-900">Ingestion Complete</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
        Successfully loaded <strong className="text-slate-800">{result.imported}</strong> ledger records into your database.
      </p>
      {result.skipped > 0 && <p className="text-amber-600 text-xs font-semibold">{result.skipped} rows skipped due to invalid formats.</p>}
      {result.errors?.length > 0 && (
        <details className="mt-3 text-left max-w-md mx-auto text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
          <summary className="font-semibold cursor-pointer">View skipped row error details</summary>
          <ul className="mt-2 space-y-1">{result.errors.map((e,i)=><li key={i}>• {e}</li>)}</ul>
        </details>
      )}
      <div className="pt-4">
        <button onClick={reset} className="btn-primary">Upload Another File</button>
      </div>
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
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            dragOver
              ? 'border-primary-500 bg-primary-50/60 ring-4 ring-primary-500/10'
              : 'border-slate-200/90 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Upload size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Upload CSV or Excel Spreadsheet</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">
            Drag and drop your sales reports, billing sheets, or inventory exports (.csv, .xlsx, .xls up to 10MB)
          </p>
          <label className="btn-primary cursor-pointer px-5 py-2.5 shadow-sm">
            <span>Browse Local Files</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </label>
          {loading && <p className="mt-4 text-xs font-semibold text-primary-600 animate-pulse">Parsing columns and previewing data…</p>}
        </div>
      )}

      {/* Step 2: Column mapping */}
      {(step === 'map' || step === 'validate') && session && (
        <>
          <div className="flex items-center justify-between pb-1">
            <div>
              <p className="font-bold text-slate-800 text-sm">{session.row_count} Rows Detected</p>
              <p className="text-xs text-slate-500">Map your file headers to our ledger fields. Columns marked "(skip)" are ignored.</p>
            </div>
            <button onClick={reset} className="btn-secondary text-xs py-1.5 px-3">Start Over</button>
          </div>

          {/* Preview accordion */}
          <details className="card p-4">
            <summary className="cursor-pointer text-xs font-bold text-slate-700 flex items-center gap-2">
              <ChevronDown size={14} /> Preview (first 5 rows from file)
            </summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-left">
                    {session.columns.map(c => <th key={c} className="pb-1.5 pr-4 whitespace-nowrap">{c}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {session.preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {session.columns.map(c => <td key={c} className="py-1.5 pr-4 text-slate-700 whitespace-nowrap">{String(row[c] ?? '')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Mapping grid */}
          <div className="card">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Field Alignment Schema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {session.columns.map(col => (
                <div key={col} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-700 w-36 truncate" title={col}>{col}</span>
                  <span className="text-slate-300 text-xs">→</span>
                  <select
                    className="input flex-1 text-xs py-1.5 bg-white"
                    value={mappings[col] || '(skip)'}
                    onChange={e => setMappings(m => ({ ...m, [col]: e.target.value }))}
                  >
                    {STANDARD_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Validation card */}
          {step === 'validate' && validation && (
            <div className={`card border ${validation.issues?.length ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'}`}>
              <div className="flex items-center gap-2 mb-1">
                {validation.issues?.length
                  ? <AlertCircle size={17} className="text-amber-600" />
                  : <CheckCircle size={17} className="text-emerald-600" />}
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  {validation.valid_rows} rows verified and ready to commit
                  {validation.issues?.length > 0 && ` (${validation.issues.length} warnings detected)`}
                </span>
              </div>
              {validation.issues?.length > 0 && (
                <ul className="text-xs text-amber-700 space-y-1 mt-2">
                  {validation.issues.map((e,i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
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
      toast.success('Text and numbers digitized via OCR')
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
      toast.success('Transaction saved to database!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const edit = (k) => (e) => setEditData(d => ({ ...d, [k]: e.target.value }))

  return (
    <div className="space-y-5">
      <div className="card border-dashed border-2 border-slate-200/90 text-center p-8 bg-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <Scan size={24} />
        </div>
        <p className="font-bold text-slate-800 text-sm mb-1">Scan Invoice, Receipt or Bill Photo</p>
        <p className="text-xs text-slate-400 mb-4">Supports JPG, PNG paper camera captures up to 5 MB</p>
        <label className="btn-primary cursor-pointer px-5 py-2 text-xs">
          Choose Receipt Image
          <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        </label>
      </div>

      {preview && (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-5 items-center">
            <img src={preview} alt="preview" className="w-full sm:w-60 h-44 object-contain rounded-xl border border-slate-200 bg-slate-50" />
            <div className="flex-1 space-y-3">
              <p className="text-xs font-bold text-slate-700">Image Loaded: <span className="text-slate-500 font-normal">{file?.name}</span></p>
              {!ocrResult && (
                <button onClick={handleExtract} disabled={loading} className="btn-primary text-xs">
                  {loading ? 'Running OCR Engine…' : 'Extract Text & Digitize'}
                </button>
              )}
              {ocrResult && !ocrResult.success && (
                <div className="flex items-start gap-2 text-rose-600 text-xs">
                  <XCircle size={15} className="mt-0.5 shrink-0" />
                  <p>{ocrResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {ocrResult?.success && (
        <div className="card p-4">
          <h3 className="text-xs font-bold text-slate-900 mb-2">Raw Extracted Text</h3>
          <pre className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 whitespace-pre-wrap border border-slate-200 max-h-32 overflow-y-auto font-mono">
            {ocrResult.extracted_text}
          </pre>
        </div>
      )}

      {editData && !saved && (
        <div className="card border-2 border-primary-200/80 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full uppercase">
              Human-in-the-Loop Review
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Review Digitized Transaction</h3>
            <p className="text-xs text-slate-500">Verify extracted amounts before committing to the business ledger.</p>
          </div>

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
                <input type={type} className="input text-xs" value={editData[k] ?? ''} onChange={edit(k)} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Confirm & Save Transaction'}
            </button>
            <button onClick={() => setEditData(null)} className="btn-danger">Cancel</button>
          </div>
        </div>
      )}

      {saved && (
        <div className="card border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-800">Transaction successfully saved to database.</p>
          </div>
          <button
            onClick={() => { setFile(null); setPreview(null); setOcrResult(null); setEditData(null); setSaved(false) }}
            className="btn-secondary text-xs py-1 px-3"
          >
            Scan Another
          </button>
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
      toast.success('Parsed transaction details from text')
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
      <div className="card space-y-3">
        <label className="label">Describe Your Transaction in Plain Natural Language</label>
        <textarea
          className="input h-24 resize-none text-xs sm:text-sm"
          placeholder='e.g. "Sold 10 packets of Maggi for ₹150 today in cash."'
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div>
          <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">Quick Examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => setText(ex)}
                className="text-xs bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-600 px-3 py-1 rounded-full transition-colors border border-slate-200/60"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleExtract} disabled={loading || !text.trim()} className="btn-primary mt-2">
          {loading ? 'Parsing with NLP…' : 'Extract Transaction'}
        </button>
      </div>

      {editData && !saved && (
        <div className="card border-2 border-primary-200/80 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full uppercase">
              NLP Extraction Review
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">Review Extracted Details</h3>
            <p className="text-xs text-slate-500">
              Source: <em className="text-slate-700">"{extracted?.original_text}"</em>
            </p>
          </div>

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
                <input className="input text-xs" value={editData[k] ?? ''} onChange={edit(k)} />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Confirm & Save'}
            </button>
            <button onClick={() => setEditData(null)} className="btn-danger">Cancel</button>
          </div>
        </div>
      )}

      {saved && (
        <div className="card border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-xs font-bold text-emerald-800">Transaction successfully saved to database.</p>
          </div>
          <button
            onClick={() => { setExtracted(null); setEditData(null); setSaved(false); setText('') }}
            className="btn-secondary text-xs py-1 px-3"
          >
            Add Another
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'csv',   label: 'CSV / Excel Upload', icon: FileSpreadsheet, desc: 'Batch spreadsheets' },
  { id: 'image', label: 'Receipt Scanner (OCR)', icon: Scan, desc: 'Paper bill images' },
  { id: 'nlp',   label: 'Natural Language Entry', icon: MessageSquare, desc: 'Sentence dictation' },
]

export default function DataInput() {
  const { activeBusiness } = useBusiness()
  const [tab, setTab] = useState('csv')

  if (!activeBusiness) return <NoBusiness />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Multimodal Data Ingestion"
        subtitle={`Capture sales, expenses, and inventory adjustments into ${activeBusiness.business_name} ledger.`}
        badge="Zero Manual Entry"
      />

      {/* Segmented Tab Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              tab === t.id
                ? 'border-primary-600 bg-white ring-2 ring-primary-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                tab === t.id ? 'bg-primary-600 text-white' : 'bg-slate-200/80 text-slate-500'
              }`}>
                <t.icon size={16} />
              </div>
              <div>
                <p className={`text-xs font-bold ${tab === t.id ? 'text-primary-700' : 'text-slate-800'}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-slate-400">{t.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {tab === 'csv'   && <CSVTab   bizId={activeBusiness.id} />}
      {tab === 'image' && <ImageTab bizId={activeBusiness.id} />}
      {tab === 'nlp'   && <NLPTab   bizId={activeBusiness.id} />}
    </div>
  )
}
