import React, { useState } from 'react';

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
    const res = await fetch('http://127.0.0.1:8000/documents/upload', {
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
    <section>
      <h2>Upload PDF</h2>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button disabled={!file} onClick={upload}>Upload</button>
      {status && <p>{status}</p>}
    </section>
  );
};
