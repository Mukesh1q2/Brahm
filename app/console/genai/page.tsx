"use client";

import React from 'react';
import axios from 'axios';

export default function GenAIPage() {
  const [promptI, setPromptI] = React.useState('a glowing lotus in neon');
  const [img, setImg] = React.useState<string>('');
  const [promptM, setPromptM] = React.useState('a calm meditation sound');
  const [audio, setAudio] = React.useState<string>('');

  async function genImage() {
    const r = await axios.post('/api/genai/image', { prompt: promptI });
    setImg(r.data?.image||'');
  }
  async function genMusic() {
    const r = await axios.post('/api/genai/music', { prompt: promptM });
    setAudio(r.data?.audio||'');
  }

  return (
    <div className="p-4 text-gray-100 space-y-6">
      <h1 className="text-xl font-semibold">GenAI (stubs)</h1>
      <section className="space-y-2">
        <h2 className="text-lg">Image</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" value={promptI} onChange={e=>setPromptI(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={genImage}>Generate</button>
        </div>
        {img && <img src={img} alt="gen" className="border border-white/10 rounded w-40 h-40 object-contain" />}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg">Music</h2>
        <div className="flex gap-2">
          <input className="flex-1 bg-white/5 rounded px-2 py-1" value={promptM} onChange={e=>setPromptM(e.target.value)} />
          <button className="bg-white/10 px-3 py-1 rounded" onClick={genMusic}>Generate</button>
        </div>
        {audio && <audio controls src={audio} className="w-full max-w-md" />}
      </section>
    </div>
  );
}

