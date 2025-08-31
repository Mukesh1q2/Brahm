"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const DiffEditor = dynamic(
  async () => {
    const monaco = await import("@monaco-editor/react");
    return monaco.DiffEditor;
  },
  { ssr: false, loading: () => <div className="text-xs text-neutral-400">Loading diff…</div> }
) as any;

type CodeDiffViewerProps = {
  original: string;
  modified: string;
  language?: string;
};

export default function CodeDiffViewer({ original, modified, language = "typescript" }: CodeDiffViewerProps) {
  const options = useMemo(
    () => ({ readOnly: true, renderSideBySide: true, minimap: { enabled: false } }),
    []
  );

  return (
    <div className="h-[50vh] w-full rounded-lg bg-black/30" data-testid="code-diff-viewer">
      <DiffEditor
        original={original}
        modified={modified}
        language={language}
        options={options as any}
        theme="vs-dark"
      />
    </div>
  );
}
