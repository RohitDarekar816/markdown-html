import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/files')
      const data = await response.json()
      setFiles(data.files || [])
      setError(null)
    } catch (err) {
      setError('Failed to load files')
      console.error('Error loading files:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Success! View your webpage: ${result.url}`)
        loadFiles() // Refresh the file list
      } else {
        alert(`Error: ${result.error || 'Upload failed'}`)
      }
    } catch (err) {
      alert('Upload failed. Please try again.')
      console.error('Upload error:', err)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Markdown to Webpage Converter</h1>
        <p>Upload your Markdown files and get instant webpage links</p>
      </header>

      <main className="main">
        <FileUpload onUpload={handleUpload} />
        <FileList files={files} loading={loading} error={error} />
      </main>
    </div>
  )
}

function FileUpload({ onUpload }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md'))) {
      setSelectedFile(file)
    } else {
      alert('Please select a valid Markdown (.md) file')
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    try {
      await onUpload(selectedFile)
      setSelectedFile(null)
      e.target.reset()
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="upload-section">
      <h2>Upload Markdown File</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="fileInput">Select Markdown File (.md)</label>
          <input
            type="file"
            id="fileInput"
            accept=".md,text/markdown"
            onChange={handleFileChange}
            required
            disabled={uploading}
          />
        </div>
        <button type="submit" disabled={!selectedFile || uploading} className="btn btn-primary">
          {uploading ? 'Converting...' : 'Convert to Webpage'}
        </button>
      </form>
    </section>
  )
}

function FileList({ files, loading, error }) {
  if (loading) {
    return (
      <section className="files-section">
        <h2>Converted Files</h2>
        <div className="loading">Loading files...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="files-section">
        <h2>Converted Files</h2>
        <div className="error">{error}</div>
      </section>
    )
  }

  return (
    <section className="files-section">
      <h2>Converted Files ({files.length})</h2>
      {files.length === 0 ? (
        <div className="empty">No converted files yet. Upload a Markdown file above!</div>
      ) : (
        <div className="files-grid">
          {files.map(file => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </section>
  )
}

function FileItem({ file }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const formatSize = (bytes) => {
    return (bytes / 1024).toFixed(1) + ' KB'
  }

  return (
    <div className="file-item">
      <div className="file-info">
        <h3>File {file.id.slice(0, 8)}...</h3>
        <div className="file-meta">
          <span>Created: {formatDate(file.createdAt)}</span>
          <span>Size: {formatSize(file.size)}</span>
        </div>
      </div>
      <div className="file-actions">
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          View
        </a>
        <a href={file.url} download className="btn btn-secondary">
          Download
        </a>
      </div>
    </div>
  )
}

export default App