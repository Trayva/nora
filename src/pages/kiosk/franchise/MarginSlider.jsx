// Beautiful margin slider: gradient-filled track with live badge and quick presets
const PRESETS = [20, 30, 50, 100, 200];
const MAX = 500;

export default function MarginSlider({ value, onChange }) {
  const pct = Math.min(100, (value / MAX) * 100);
  return (
    <div className="fmd-margin">
      <style>{`
        .fmd-margin { padding: 16px 18px; border-radius: 16px; border: 1px solid var(--border);
          background: linear-gradient(135deg, rgba(203,108,220,0.10), rgba(59,130,246,0.06)); }
        .fmd-margin-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .fmd-margin-label { font-size: .74rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
        .fmd-margin-value { font-size: 1.15rem; font-weight: 900; color: #fff; padding: 3px 14px; border-radius: 999px;
          background: linear-gradient(90deg, #cb6cdc, #7c5cfc); box-shadow: 0 4px 14px rgba(124,92,252,.35); min-width: 64px; text-align: center; }
        .fmd-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 10px; border-radius: 999px; outline: none; cursor: pointer; }
        .fmd-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #fff;
          border: 4px solid #cb6cdc; box-shadow: 0 2px 10px rgba(0,0,0,.25); transition: transform .12s ease; }
        .fmd-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .fmd-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #fff; border: 4px solid #cb6cdc; box-shadow: 0 2px 10px rgba(0,0,0,.25); }
        .fmd-presets { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
        .fmd-preset { border: 1px solid var(--border); background: var(--bg-card); color: var(--text-body); border-radius: 999px;
          font-size: .72rem; font-weight: 700; padding: 4px 11px; cursor: pointer; transition: all .12s ease; }
        .fmd-preset:hover { border-color: var(--accent); color: var(--accent); }
        .fmd-preset.on { background: var(--accent); border-color: var(--accent); color: #fff; }
      `}</style>
      <div className="fmd-margin-head">
        <span className="fmd-margin-label">Margin</span>
        <span className="fmd-margin-value">{value}%</span>
      </div>
      <input
        type="range"
        className="fmd-slider"
        min={0}
        max={MAX}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: `linear-gradient(90deg, #cb6cdc ${pct}%, var(--bg-hover) ${pct}%)` }}
        aria-label="Margin percentage"
      />
      <div className="fmd-presets">
        {PRESETS.map((p) => (
          <button key={p} type="button" className={`fmd-preset${value === p ? " on" : ""}`} onClick={() => onChange(p)}>
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}
