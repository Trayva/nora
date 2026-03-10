const UNITS = ["g", "ml", "unit"];

export default function UnitSelect({ value, onChange, className = "modal-input", style }) {
  return (
    <select className={className} value={value} onChange={onChange} style={style}>
      <option value="">Select unit</option>
      {UNITS.map((u) => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  );
}