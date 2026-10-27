import { MdCheck, MdImage, MdInfoOutline } from "react-icons/md";

// Grid of menu items; the checkbox toggles inclusion, clicking the card opens details.
export default function BrandMenuSelector({ items, selectedIds, onToggle, onToggleAll, onOpen }) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
          {selectedIds.length} of {items.length} selected
        </span>
        <button
          type="button"
          onClick={onToggleAll}
          style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
        >
          {allSelected ? "Unselect all" : "Select all"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onOpen(item)}
              style={{
                position: "relative",
                background: "var(--bg-hover)",
                border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                padding: 8,
                cursor: "pointer",
                opacity: selected ? 1 : 0.55,
                transition: "all .15s ease",
              }}
            >
              <button
                type="button"
                aria-label={selected ? `Unselect ${item.name}` : `Select ${item.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.id);
                }}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  zIndex: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `2px solid ${selected ? "var(--accent)" : "#fff"}`,
                  background: selected ? "var(--accent)" : "rgba(0,0,0,0.35)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {selected && <MdCheck size={14} />}
              </button>

              <div
                style={{
                  width: "100%",
                  height: 80,
                  borderRadius: 6,
                  overflow: "hidden",
                  marginBottom: 6,
                  background: "var(--bg-card)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <MdImage size={26} />
                )}
              </div>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-heading)", display: "block", textAlign: "center" }}>
                {item.name}
              </span>
              <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", display: "flex", justifyContent: "center", alignItems: "center", gap: 3, marginTop: 2 }}>
                <MdInfoOutline size={11} /> View details
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
