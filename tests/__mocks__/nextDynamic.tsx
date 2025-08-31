import React from 'react';
export default function dynamic(importer: any, _opts?: any) {
  // Special-case the DiffEditor dynamic import used inside CodeDiffViewer
  try {
    const src = typeof importer === 'function' ? String(importer) : '';
    if (src.includes("@monaco-editor/react")) {
      const DiffStub: React.FC<any> = (props) => <div data-testid="monaco-diff" {...props} />;
      return DiffStub as any;
    }
  } catch {}
  // Default placeholder for other dynamics (e.g., CodeDiffViewer wrapper, QuantumGraph)
  const Mocked: React.FC<any> = () => (
    <div data-testid="code-diff-viewer" className="h-[50vh] w-full rounded-lg bg-black/30">
      <div className="text-xs text-neutral-400">Loading…</div>
    </div>
  );
  return Mocked as any;
}
