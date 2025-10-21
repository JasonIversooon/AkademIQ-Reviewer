import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import '../styles/UploadPanel.css';

interface Props {
  token: string | null;
  onUploaded: (id: string) => void;
}

interface StoredDocument {
  id: string;
  filename: string;
  pages: number;
  size: number;
  upload_date: string;
  status: string;
}

export const UploadPanel: React.FC<Props> = ({ token, onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [mode, setMode] = useState<'upload' | 'select'>('upload');
  const [storedDocuments, setStoredDocuments] = useState<StoredDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');

  // Load stored documents when component mounts or token changes
  useEffect(() => {
    if (token) {
      loadStoredDocuments();
    }
  }, [token]);

  // Also load when switching to select mode
  useEffect(() => {
    if (mode === 'select' && token && storedDocuments.length === 0) {
      loadStoredDocuments();
    }
  }, [mode, token]);

  const loadStoredDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const res = await fetch(`${API_BASE}/documents/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      
      if (res.ok) {
        const data = await res.json();
        setStoredDocuments(data.documents || []);
      } else {
        console.error('Failed to load stored documents');
        setStoredDocuments([]);
      }
    } catch (error) {
      console.error('Error loading stored documents:', error);
      setStoredDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const upload = async () => {
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
  };

  const selectStoredDocument = () => {
    if (!selectedDocumentId) return;
    setStatus('Document selected');
    onUploaded(selectedDocumentId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="upload-panel">
      {/* Mode Selection */}
      <div className="upload-mode-selector">
        <button 
          className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => setMode('upload')}
        >
          📁 Upload New
        </button>
        <button 
          className={`mode-btn ${mode === 'select' ? 'active' : ''}`}
          onClick={() => setMode('select')}
        >
          📚 Select Stored
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          {/* Upload New File */}
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
        </>
      ) : (
        <>
          {/* Select Stored Document */}
          <div className="stored-documents">
            {loadingDocuments ? (
              <div className="loading-documents">
                <div className="loading-spinner"></div>
                <p>Loading your documents...</p>
              </div>
            ) : storedDocuments.length > 0 ? (
              <>
                <div className="documents-list">
                  {storedDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className={`document-item ${selectedDocumentId === doc.id ? 'selected' : ''}`}
                      onClick={() => setSelectedDocumentId(doc.id)}
                    >
                      <div className="doc-icon">📄</div>
                      <div className="doc-info">
                        <div className="doc-name">{doc.filename}</div>
                        <div className="doc-details">
                          {doc.pages} pages • {formatFileSize(doc.size)} • {formatDate(doc.upload_date)}
                        </div>
                      </div>
                      <div className="doc-status">
                        {selectedDocumentId === doc.id ? '✓' : '○'}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedDocumentId && (
                  <div className="upload-actions">
                    <button className="btn btn-primary" onClick={selectStoredDocument}>
                      Select Document
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="no-documents">
                <div className="no-docs-icon">📭</div>
                <p>No stored documents found</p>
                <p className="no-docs-subtitle">Upload a document first to see it here</p>
                <button className="btn btn-secondary" onClick={() => setMode('upload')}>
                  Upload New Document
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {status && (
        <div className={`upload-status ${
          status === 'Uploaded' || status === 'Document selected' ? 'success' : 
          status.startsWith('Error') ? 'error' : 
          'loading'
        }`}>
          {status === 'Uploaded' ? '✅ Upload successful!' : 
           status === 'Document selected' ? '✅ Document selected!' :
           status === 'Uploading...' ? '⏳ Uploading...' : 
           status}
        </div>
      )}
    </div>
  );
};
