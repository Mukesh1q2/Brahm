"use client";
import { useChatStore } from "@/app/_stores/chatStore";
import ModelPill from "./ModelPill";
import { useRightPanelStore } from "@/store/rightPanelStore";

export default function ChatHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { conversations, activeId } = useChatStore();
  const conv = conversations.find(c => c.id === activeId);
  const { setTab } = useRightPanelStore();
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur">
      <div className="h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md bg-white/5 border border-white/10 hover:bg-white/10"
            aria-haspopup="dialog"
            aria-expanded="false"
          >
            <span className="sr-only">Open sidebar</span>
            {/* simple hamburger */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="font-medium truncate">{conv?.title ?? "Brahm"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('diff')}
            className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hidden sm:inline-flex">
            Right Panel
          </button>
          <ModelPill />
        </div>
      </div>
    </header>
  );
}

