"use client";

import React from 'react';
import axios from 'axios';

export default function OCRPage() {
  const [text, setText] = React.useState('');
  const [file, setFile] = React.useState<File|null>(null);

  async function upload() {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const r = await axios.post('/api/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setText(r.data?.text || '');
  }

  return (
    <div className="p-4 text-gray-100 space-y-3">
      <h1 className="text-xl font-semibold">Vision / OCR (stub)</h1>
      <input type="file" onChange={e=> setFile(e.target.files?.[0] || null)} />
      <button className="bg-white/10 px-3 py-1 rounded" onClick={upload}>Upload</button>
      {text && (
        <div className="text-sm whitespace-pre-wrap bg-white/5 rounded p-3">{text}</div>
      )}
    </div>
  );
}

