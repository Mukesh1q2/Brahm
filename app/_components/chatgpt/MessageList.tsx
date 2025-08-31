"use client";
import { useEffect, useRef } from "react";
import { useChatStore } from "@/app/_stores/chatStore";
import MessageBubble from "./MessageBubble";

export default function MessageList() {
  const { conversations, activeId } = useChatStore();
  const conv = conversations.find(c => c.id === activeId);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv?.messages.length]);

  return (
    <main className="flex-1 overflow-y-auto px-4">
      <div className="mx-auto max-w-3xl py-6 space-y-4">
        {(conv?.messages ?? []).map(m => <MessageBubble key={m.id} msg={m} />)}
        <div ref={endRef} />
      </div>
    </main>
  );
}

