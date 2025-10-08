import React, { useState } from 'react';
import { AuthPanel } from '../components/AuthPanel';
import { UploadPanel } from '../components/UploadPanel';
import { FlashcardsPanel } from '../components/FlashcardsPanel';
import { ExplainPanel } from '../components/ExplainPanel';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', margin: '1rem', maxWidth: 960 }}>
      <h1>AcademIQ Minimal Tester</h1>
      <AuthPanel onAuth={(t) => setToken(t)} token={token} />
      <hr />
      <UploadPanel token={token} onUploaded={(id) => setDocumentId(id)} />
      <hr />
      <FlashcardsPanel token={token} documentId={documentId} />
      <hr />
      <ExplainPanel token={token} documentId={documentId} />
    </div>
  );
};
