import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

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
    <div>
      <div className="file-upload" onClick={() => document.getElementById('file-input')?.click()}>
        <input 
          id="file-input"
          type="file" 
          accept="application/pdf" 
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={{ display: 'none' }}
        />
        <div style={{ textAlign: 'center' }}>
          {file ? (
            <>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📄 {file.name}</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Click to change file</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>📁 Click to select PDF</p>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Or drag and drop your file here</p>
            </>
          )}
        </div>
      </div>
      
      {file && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button className="btn btn-primary" disabled={!file} onClick={upload}>
            {status === 'Uploading...' ? <span className="loading-spinner"></span> : 'Upload PDF'}
          </button>
        </div>
      )}
      
      {status && (
        <p className={
          status === 'Uploaded' ? 'status-success' : 
          status.startsWith('Error') ? 'status-error' : 
          'status-loading'
        }>
          {status === 'Uploaded' ? '✅ Upload successful!' : 
           status === 'Uploading...' ? '⏳ Uploading...' : 
           status}
        </p>
      )}
    </div>
  );
};
