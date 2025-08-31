"use client";
import { useChatStore } from "@/app/_stores/chatStore";
import { Plus, Search } from "lucide-react";

export default function Sidebar() {
  const { conversations, activeId, newConversation, setActive, deleteConversation } = useChatStore();
  return (
    <aside className="h-full border-r border-[var(--panel-border)] bg-[var(--panel-bg)]">
      <div className="p-3 flex items-center gap-2">
        <button
          onClick={newConversation}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--panel-border)] bg-[var(--app-bg)]/10 hover:bg-[var(--app-bg)]/15 transition">
          <Plus className="w-4 h-4" /> New chat
        </button>
        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 opacity-60" />
          <input
            className="pl-8 pr-2 py-2 text-sm bg-[var(--app-bg)]/10 rounded-md outline-none focus:bg-[var(--app-bg)]/15 border border-[var(--panel-border)]"
            placeholder="Search"
          />
        </div>
      </div>
      <div className="px-2 overflow-y-auto h-[calc(100%-56px)]">
        {conversations.map(c => (
          <div key={c.id} className={`group flex items-center gap-2 w-full px-2 py-1 mb-1 rounded border border-[var(--panel-border)] ${activeId === c.id ? 'bg-[var(--app-bg)]/15' : 'hover:bg-[var(--app-bg)]/10'}`}>
            <button
              onClick={() => setActive(c.id)}
              className="flex-1 text-left truncate"
              title={c.title}
            >
              <div className="truncate">{c.title}</div>
              <div className="text-[10px] text-neutral-500">
                {new Date(c.createdAt).toLocaleDateString()}
              </div>
            </button>
            <button
              aria-label="Delete conversation"
              className="opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-red-400"
              onClick={() => {
                if (confirm('Delete this conversation?')) deleteConversation(c.id);
              }}
            >
              {/* trash icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

