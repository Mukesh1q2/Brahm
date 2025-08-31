"use client";
import { useModel } from "../../_components/ModelContext";

export default function ModelPill() {
  const { model, setModel, options } = useModel();
  return (
    <label className="flex items-center gap-2 text-xs">
      <span className="text-neutral-400 hidden sm:inline">Model</span>
      <select
        className="px-2 py-1 rounded-full bg-white/5 border border-white/10"
        value={model}
        onChange={(e) => setModel(e.target.value)}
      >
        {options.map(m => (<option key={m} value={m}>{m}</option>))}
      </select>
    </label>
  );
}

