import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { bulkUploadContainers } from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'

const CSV_TEMPLATE =
  'containerNumber,size,type,organizationId,status,locationLabel,shippingLineCode,lastFreeDay\n' +
  'MSKU1234567,FORTY_FT,DRY,ORG_ID_HERE,AT_PORT,Port of Djibouti,MSK,2026-06-15\n'

export function ContainerBulkUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<{
    created: number
    failed: { row: number; error: string }[]
  } | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'containers-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const res = await bulkUploadContainers(file)
      setResult(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <Link to="/admin/containers" className="inline-flex items-center gap-1 text-sm font-medium text-korecha-primary hover:underline">
        ← Back to Containers
      </Link>

      <PageHeader
        title="Bulk Container Upload"
        description="Upload a CSV file to import multiple containers at once"
      />

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}

      <Card className="max-w-xl">
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm font-semibold text-korecha-primary hover:underline"
        >
          Download CSV template
        </button>

        <div
          className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-12 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleUpload(file)
          }}
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <svg className="h-7 w-7 text-korecha-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="font-medium text-slate-700">Drag and drop a CSV file here</p>
          <p className="mt-1 text-sm text-korecha-muted">or</p>
          <Button className="mt-4" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </div>

        <p className="mt-4 text-xs text-korecha-muted">
          Required: containerNumber, size, type, organizationId. Optional: status, locationLabel, shippingLineCode, lastFreeDay
        </p>
      </Card>

      {result && (
        <Card className="mt-6 max-w-xl">
          <h3 className="font-bold text-slate-900">Upload Results</h3>
          <p className="mt-2 font-semibold text-emerald-600">{result.created} containers created</p>
          {result.failed.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-red-600">{result.failed.length} failed:</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {result.failed.map((f) => (
                  <li key={f.row}>Row {f.row}: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
