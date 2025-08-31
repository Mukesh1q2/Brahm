"use client";

import ChatLayout from "../_components/chatgpt/ChatLayout";
import React from "react";

export default function ChatPage() {
  // Default to enabled unless explicitly set to 'false'
  const enabled = ((process.env.NEXT_PUBLIC_CHATGPT_UI ?? "true") !== "false") ||
    (typeof window !== 'undefined' && window.localStorage.getItem('CHATGPT_UI_OVERRIDE') === 'true');

  if (!enabled) {
    return (
      <div className="p-6 text-sm text-neutral-300">
        <div>ChatGPT-style UI is disabled.</div>
        <div className="mt-2 text-neutral-500">Set NEXT_PUBLIC_CHATGPT_UI=true or enable a local override.</div>
        <button
          className="mt-3 px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10"
          onClick={() => { try { localStorage.setItem('CHATGPT_UI_OVERRIDE', 'true'); location.reload(); } catch {} }}
        >
          Enable here
        </button>
      </div>
    );
  }
  return <ChatLayout />;
}

