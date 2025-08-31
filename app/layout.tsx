import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';

export const metadata = {
  title: 'Brahm',
  description: 'Brahm AI - Frontend spanning all Koshas',
}

import { ModelProvider } from "./_components/ModelContext";
import { ToastProvider } from "./_components/Toast";
import dynamic from 'next/dynamic';
const SiteHeader = dynamic(() => import('./_components/SiteHeader'));
const FuturisticShell = dynamic(() => import('./_components/FuturisticShell'), { ssr: false });
const TelemetryDebug = dynamic(() => import('./_components/TelemetryDebug'), { ssr: false });
const EditionBadge = dynamic(() => import('./_components/EditionBadge'), { ssr: false });
const VoiceCommandsShim = dynamic(() => import('./_components/voice/VoiceCommandsShim'), { ssr: false });
const BrahmAgent = dynamic(() => import('./_components/BrahmAgent'), { ssr: false });

const FUT = (process.env.NEXT_PUBLIC_FUTURISTIC_UI ?? 'false') !== 'false';
const inter = Inter({ subsets: ['latin'], display: 'swap' });

const DEFAULT_THEME = (process.env.NEXT_PUBLIC_DEFAULT_THEME ?? 'dark');
const DEFAULT_EDITION = ((process.env.NEXT_PUBLIC_BRAHM_EDITION ?? 'basic').toLowerCase() === 'advanced') ? 'advanced' : 'basic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${DEFAULT_THEME === 'light' ? 'theme-light' : 'theme-dark dark'} ${DEFAULT_EDITION === 'advanced' ? 'edition-advanced' : 'edition-basic'}`}>
      <body className={`${inter.className} min-h-screen`}>
        {/* Early edition sync: set html class from localStorage before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { var e = localStorage.getItem('brahm:edition'); var root = document.documentElement; if (e === 'advanced' || e === 'basic') { root.classList.remove('edition-basic','edition-advanced'); root.classList.add(e === 'advanced' ? 'edition-advanced' : 'edition-basic'); } } catch (e) {} })();`
          }}
        />
        <ModelProvider>
          <ToastProvider>
            {FUT ? (
              <FuturisticShell>
                {children}
              </FuturisticShell>
            ) : (
              <>
                <SiteHeader />
                <main className="p-4">{children}</main>
                <TelemetryDebug />
              </>
            )}
            {/* Global edition badge (footer quick switch) */}
            <EditionBadge />
            {/* Voice/E2E command shim (no UI) */}
            <VoiceCommandsShim />
            {/* Brahm AI omnipresent agent */}
            <BrahmAgent />
          </ToastProvider>
        </ModelProvider>
      </body>
    </html>
  );
}

function HeaderTelemetryStrip() {
  const [last, setLast] = React.useState<{ ok: boolean; status: number; ms: number | null; model?: string } | null>(null);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const handler = (ev: any) => {
      const d = ev?.detail || {};
      setLast({ ok: !!d.ok, status: Number(d.status||0), ms: Number.isFinite(d.clientLatencyMs) ? d.clientLatencyMs : null, model: d.responseModel || d.requestModel });
      setCount(c => c + 1);
    };
    window.addEventListener('telemetry:request', handler as any);
    return () => window.removeEventListener('telemetry:request', handler as any);
  }, []);
  return (
    <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-400">
      <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">{count}</span>
      {last && (
        <span className="px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
          {last.model || '-'} • {last.ms != null ? `${last.ms.toFixed(0)}ms` : '-'} • {last.ok ? 'ok' : `err ${last.status}`}
        </span>
      )}
    </div>
  );
}
