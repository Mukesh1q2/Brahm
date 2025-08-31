"use client";

import React from "react";
import Sidebar from "./Sidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import RightPanel from "./RightPanel";

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const closeSidebar = React.useCallback(() => setSidebarOpen(false), []);
  React.useEffect(() => {
    // Start sync orchestrator (Phase 4) if enabled
    try { import("@/app/_lib/syncOrchestrator").then(m => m.startSyncOrchestrator()); } catch {}
  }, []);

  return (
    <div className="h-dvh grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] bg-[var(--app-bg)] text-[var(--app-fg)]">
      {/* Desktop sidebar */}
      <div className="hidden md:block h-dvh">
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col h-dvh">
        <ChatHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <MessageList />
        <RightPanel />
        <ChatComposer />
      </div>

      {/* Mobile off-canvas sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeSidebar}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="h-full w-72 bg-[#0f0f0f] border-r border-white/10 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            onKeyDown={(e) => { if (e.key === 'Escape') closeSidebar(); }}
          >
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}

