import React, { useState } from 'react';
import '../styles/UploadPanel.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

interface Props {
  token: string | null;
  onUploaded: (id: string) => void;
}

export const UploadPanel: React.FC<Props> = ({ token, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');

  async function upload() {
    if (!file) return;
    setStatus('Uploading...');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus('Error: ' + (data.detail || 'upload failed'));
      return;
    }
    setStatus('Uploaded');
    onUploaded(data.document_id);
  }

  return (
    <div className="upload-panel">
      <div className={`file-upload ${file ? 'file-selected' : ''}`} onClick={() => document.getElementById('file-input')?.click()}>
        <input 
          id="file-input"
          type="file" 
          accept="application/pdf" 
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">
          {file ? '📄' : '📁'}
        </div>
        <div>
          {file ? (
            <>
              <div className="upload-text">{file.name}</div>
              <div className="upload-subtitle">Click to change file</div>
            </>
          ) : (
            <>
              <div className="upload-text">Click to select PDF</div>
              <div className="upload-subtitle">Or drag and drop your file here</div>
            </>
          )}
        </div>
      </div>
      
      {file && (
        <div className="upload-actions">
          <button className="btn btn-primary" disabled={!file || status === 'Uploading...'} onClick={upload}>
            {status === 'Uploading...' ? <span className="loading-spinner"></span> : 'Upload PDF'}
          </button>
        </div>
      )}
      
      {status && (
        <div className={`upload-status ${
          status === 'Uploaded' ? 'success' : 
          status.startsWith('Error') ? 'error' : 
          'loading'
        }`}>
          {status === 'Uploaded' ? '✅ Upload successful!' : 
           status === 'Uploading...' ? '⏳ Uploading...' : 
           status}
        </div>
      )}
    </div>
  );
};
