import Link from "next/link";

export const metadata = { title: 'Education \u2027 Quantum Demos' };

export default function EducationIndexPage() {
  const demos = [
    { href: '/education/superposition', title: 'Superposition', desc: 'Two-state system with measurement.' },
    { href: '/education/tunneling', title: 'Tunneling', desc: 'Barrier + wavefunction intuition.' },
    { href: '/education/gravity', title: 'Gravity & Curvature', desc: 'Shader-based curvature visualization.' },
    { href: '/education/bloch', title: 'Bloch Sphere', desc: 'Spin precession, phases, and dephasing.' },
    { href: '/education/bb84', title: 'BB84 QKD', desc: 'Quantum key distribution with sifting & QBER.' },
    { href: '/education/circuits', title: 'Circuit Playground', desc: 'Compose small quantum circuits and run/step.' },
    { href: '/education/qft', title: 'QFT (n\u2264 3)', desc: 'Fourier transform toy with Playground presets.' },
    { href: '/education/teleportation', title: 'Teleportation', desc: 'Guided sequence (concept + steps).' },
    { href: '/education/repeaters', title: 'Quantum Repeaters', desc: 'Latency and fidelity sliders across hops.' },
    { href: '/education/superdense', title: 'Superdense Coding', desc: 'Send 2 classical bits with 1 qubit.' },
    { href: '/education/adiabatic', title: 'Adiabatic QC (2\u2011level)', desc: 'Gap and ground state populations vs s.' },
    { href: '/education/annealing', title: 'Annealing Landscape', desc: 'Ising toy with J, h, T sliders.' },
    { href: '/education/density', title: 'Density Matrices', desc: 'Depolarization knob with live \u03c1 display.' },
  ];
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Education \u2027 Quantum Demos</h1>
      <p className="text-sm text-gray-400">Interactive lessons with 3D when available, and safe 2D fallbacks.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {demos.map(d => (
          <Link key={d.href} href={d.href} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
            <div className="text-lg font-medium text-gray-200">{d.title}</div>
            <div className="text-xs text-gray-400 mt-1">{d.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
