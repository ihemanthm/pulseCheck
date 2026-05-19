import { useState } from 'react'
import { ordersAPI } from '../api/orders'
import { useToast } from '../context/ToastContext'
import { validateCSVFile } from '../utils/validators'
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  HelpCircle,
  Download,
  Info,
  ChevronRight,
  ListFilter
} from 'lucide-react'

export default function UploadPage() {
  const { success, error: showError } = useToast()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const handleDrag = e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles[0]) {
      handleFileSelect(droppedFiles[0])
    }
  }

  const handleFileSelect = selectedFile => {
    // 10MB size limit check
    if (selectedFile.size > 10 * 1024 * 1024) {
      showError('File is too large. Max size is 10MB.')
      return
    }

    const validation = validateCSVFile(selectedFile)
    if (!validation.valid) {
      showError(validation.error)
      return
    }
    setFile(selectedFile)
    setUploadResult(null)
  }

  const handleInputChange = e => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      showError('Please select a file to upload')
      return
    }

    try {
      setIsUploading(true)
      const result = await ordersAPI.uploadCSV(file)
      setUploadResult(result)
      
      const added = result.new_orders || 0
      const dups = result.skipped_duplicates || 0
      
      success(`Successfully uploaded CSV! Added ${added} new orders.`)
    } catch (err) {
      showError(err.message || 'CSV upload failed due to parsing or server error.')
    } finally {
      setIsUploading(false)
    }
  }

  // Programmatic template downloader
  const downloadTemplate = () => {
    const headers = [
      'invoice_number',
      'sku',
      'product_name',
      'customer_name',
      'customer_phone',
      'purchase_date',
      'amount_paid',
      'purchase_mode',
      'brand',
      'purchase_qty'
    ].join(',')
    
    const sampleRow = [
      'INV-20260519-001',
      'SKU-APL-MAC14',
      'Apple MacBook Pro 14 M3',
      'Jane Cooper',
      '+15550199',
      '19/05/2026',
      '1599.00',
      'online',
      'Apple',
      '1'
    ].join(',')

    const blob = new Blob([`${headers}\n${sampleRow}`], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pulsecheck_orders_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100">Upload Orders</h1>
        <p className="text-slate-400 mt-1">Ingest batch customer orders via CSV to trigger outbound phone reviews.</p>
      </div>

      {/* Main Form container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Drag & Drop Box */}
        <div className="md:col-span-2 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              glass-panel border-2 border-dashed p-10 text-center transition-all duration-300 relative flex flex-col items-center justify-center min-h-[320px]
              ${dragActive 
                ? 'border-primary-500 bg-primary-950/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]' 
                : 'border-slate-800 hover:border-slate-750 hover:bg-slate-900/30'
              }
            `}
          >
            <div className="p-4 rounded-full bg-slate-950/50 border border-slate-800 text-primary-400 mb-4 animate-pulse-soft">
              <UploadCloud className="w-10 h-10" />
            </div>

            <h3 className="text-base font-bold text-slate-200 mb-1">Drag and drop CSV here</h3>
            <p className="text-xs text-slate-500 mb-6">File size limit: 10MB</p>

            <input
              type="file"
              id="file-input"
              onChange={handleInputChange}
              accept=".csv"
              className="hidden"
            />
            
            <label
              htmlFor="file-input"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors cursor-pointer"
            >
              Browse Files
            </label>

            {file && (
              <div className="mt-6 flex items-center justify-between p-3.5 rounded-lg bg-slate-955/60 border border-slate-800/80 w-full max-w-sm animate-slide-up">
                <div className="flex items-center space-x-3 text-left">
                  <FileSpreadsheet className="w-5 h-5 text-primary-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => setFile(null)} 
                  className="p-1 rounded-full text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Uploading & validating records...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm and Upload CSV</span>
                </>
              )}
            </button>
          )}

          {/* Upload Result Summary panel */}
          {uploadResult && (
            <div className="p-6 glass-panel border-slate-800 shadow-xl animate-slide-up space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">CSV Ingestion Report</h4>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">New Orders</p>
                  <p className="text-2xl font-bold font-mono text-emerald-450 mt-1">{uploadResult.new_orders}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Duplicates</p>
                  <p className="text-2xl font-bold font-mono text-amber-450 mt-1">{uploadResult.skipped_duplicates}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-850">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Rows</p>
                  <p className="text-2xl font-bold font-mono text-slate-300 mt-1">
                    {uploadResult.new_orders + uploadResult.skipped_duplicates + (uploadResult.phone_validation_errors?.length || 0)}
                  </p>
                </div>
              </div>

              {/* Validation errors lists */}
              {uploadResult.phone_validation_errors && uploadResult.phone_validation_errors.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Failed Rows ({uploadResult.phone_validation_errors.length})</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-2 text-xs font-mono text-rose-300/80">
                    {uploadResult.phone_validation_errors.map((err, idx) => (
                      <div key={idx} className="flex justify-between border-b border-rose-950 pb-1">
                        <span>Row: {err.row || 'N/A'} - Invoice: {err.invoice || 'N/A'}</span>
                        <span className="text-rose-455 font-medium">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Instructions & Instructions Template */}
        <div className="space-y-4">
          <div className="p-5 glass-panel space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2.5">
              <Info className="w-4.5 h-4.5 text-primary-400" />
              <span>CSV Ingestion Guide</span>
            </div>
            
            <p className="text-xs text-slate-450 leading-relaxed">
              PulseCheck parses columns case-insensitively and filters extra headers as custom order metadata. Phone formats should ideally support international country codes.
            </p>

            <button
              onClick={downloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </div>

          <div className="p-5 glass-panel space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Fields</p>
            <ul className="space-y-2 text-xs text-slate-450">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
                <span><strong className="text-slate-350 font-semibold font-mono">invoice_number</strong> - unique id</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
                <span><strong className="text-slate-350 font-semibold font-mono">customer_phone</strong> - call number</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
                <span><strong className="text-slate-350 font-semibold font-mono">customer_name</strong> - greeting tag</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-primary-400" />
                <span><strong className="text-slate-350 font-semibold font-mono">product_name</strong> - feedback item</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
