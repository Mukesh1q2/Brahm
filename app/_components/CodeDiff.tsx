"use client";

import React from 'react';
import dynamic from 'next/dynamic';

export type CodeDiffProps = {
  original?: string;
  modified: string;
  language?: string;
  height?: string;
};

// Wrap DiffEditor from @monaco-editor/react with dynamic import (client-only), with typed props
const Diff = dynamic<CodeDiffProps>(
  async () => {
    const mod: any = await import('@monaco-editor/react');
    const DiffEditor = (mod as any).DiffEditor || (mod as any).default;
    const Comp: React.FC<CodeDiffProps> = (props) => (
      <DiffEditor
        height={props.height || '280px'}
        language={props.language || 'plaintext'}
        original={props.original || ''}
        modified={props.modified || ''}
        theme="vs-dark"
        options={{ readOnly: true, renderSideBySide: true, minimap: { enabled: false } }}
      />
    );
    return Comp as any;
  },
  { ssr: false }
);

export default function CodeDiff({ original, modified, language, height }: CodeDiffProps) {
  return <Diff original={original} modified={modified} language={language} height={height} />;
}

