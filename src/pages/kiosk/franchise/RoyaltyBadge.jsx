// Small badge showing the brand's royalty (vendor share of the sales formula)
export function RoyaltyIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5L3 8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RoyaltyBadge({ percent, loading }) {
  if (!loading && (percent === null || percent === undefined)) return null;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(234,179,8,0.35)",
        background: "linear-gradient(135deg, rgba(234,179,8,0.14), rgba(203,108,220,0.10))",
      }}
    >
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ca8a04",
          background: "rgba(234,179,8,0.18)",
        }}
      >
        <RoyaltyIcon />
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>
          Royalty
        </span>
        <strong style={{ fontSize: "0.98rem", color: "var(--text-heading)" }}>
          {loading ? "…" : `${Number(percent)}%`}
        </strong>
      </span>
    </div>
  );
}
