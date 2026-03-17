import { MdCircle } from "react-icons/md";

export const STATUS_COLORS = {
  SUBMITTED: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  APPROVED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  ACTIVE: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  CREATED: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  INACTIVE: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  REJECTED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
};

export const getS = (s) => STATUS_COLORS[s] || STATUS_COLORS.INACTIVE;

export function StatusBadge({ status }) {
  const s = getS(status);
  return (
    <span
      className="admin_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={5} />
      {status}
    </span>
  );
}

export const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Senegal",
  "Ivory Coast",
  "Cameroon",
  "Zimbabwe",
  "Zambia",
  "Mozambique",
  "Angola",
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "France",
  "UAE",
  "Other",
];

export function CountrySelect({ value, onChange, required }) {
  return (
    <select
      className="modal-input"
      value={value}
      onChange={onChange}
      required={required}
    >
      <option value="">Select country…</option>
      {COUNTRIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
