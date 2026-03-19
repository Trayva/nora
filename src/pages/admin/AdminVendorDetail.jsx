import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdImage, MdExpandMore, MdExpandLess } from "react-icons/md";
import Drawer from "../../components/Drawer";
import ConceptOverviewDrawer from "../app/Business/ConceptOverviewDrawer";
import api from "../../api/axios";

/* ── Concept row — click to open the full overview drawer ── */
function ConceptRow({ concept, onSelect }) {
  return (
    <div
      onClick={() => onSelect(concept)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 11,
        marginBottom: 8,
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(203,108,220,0.35)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {concept.banner ? (
        <img
          src={concept.banner}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MdImage size={16} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--text-heading)",
            marginBottom: 3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {concept.name}
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {concept.origin && (
            <span className="admin_meta_chip">{concept.origin}</span>
          )}
          {concept.serveTo && (
            <span className="admin_meta_chip">{concept.serveTo}</span>
          )}
          {concept.status && (
            <span
              className="admin_meta_chip"
              style={{
                color:
                  concept.status === "ACTIVE" || concept.status === "APPROVED"
                    ? "#16a34a"
                    : "var(--text-muted)",
              }}
            >
              {concept.status}
            </span>
          )}
          {concept.menuItems?.length > 0 && (
            <span className="admin_meta_chip">
              {concept.menuItems.length} items
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          color: "var(--text-muted)",
          fontSize: "0.72rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        View →
      </div>
    </div>
  );
}

export default function AdminVendorDetail({ vendor, onClose }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);

  useEffect(() => {
    api
      .get("/vendor/concept", { params: { vendorId: vendor.id } })
      .then((r) => {
        const d = r.data.data;
        setConcepts(Array.isArray(d) ? d : d?.concepts || d?.items || []);
      })
      .catch(() => toast.error("Failed to load concepts"))
      .finally(() => setLoading(false));
  }, [vendor.id]);

  const branding = vendor.branding || {};

  return (
    <>
      <Drawer
        isOpen
        onClose={onClose}
        title={vendor.businessName || "Vendor"}
        description={vendor.email}
        width={520}
      >
        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            padding: "12px 14px",
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          {branding.logo ? (
            <img
              src={branding.logo}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: branding.color
                  ? `${branding.color}22`
                  : "var(--bg-active)",
                border: `2px solid ${branding.color || "rgba(203,108,220,0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                fontWeight: 900,
                color: branding.color || "var(--accent)",
                flexShrink: 0,
              }}
            >
              {(vendor.businessName || "V").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                marginBottom: 3,
              }}
            >
              {vendor.businessName}
            </div>
            {branding.tagline && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {branding.tagline}
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span
                className="admin_meta_chip"
                style={{
                  color:
                    vendor.membershipStatus === "ACTIVE"
                      ? "#16a34a"
                      : "#ca8a04",
                }}
              >
                {vendor.membershipStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Concepts */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              Concepts
            </span>
            <span className="admin_section_count">{concepts.length}</span>
            {concepts.length > 0 && (
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                · click to preview
              </span>
            )}
          </div>
          {loading ? (
            <div className="page_loader">
              <div className="page_loader_spinner" />
            </div>
          ) : concepts.length === 0 ? (
            <div className="admin_empty">
              <p style={{ margin: 0, fontSize: "0.8rem" }}>No concepts yet.</p>
            </div>
          ) : (
            concepts.map((c) => (
              <ConceptRow
                key={c.id}
                concept={c}
                onSelect={setSelectedConcept}
              />
            ))
          )}
        </div>
      </Drawer>

      {/* Full concept overview — same as vendor view */}
      {selectedConcept && (
        <ConceptOverviewDrawer
          concept={selectedConcept}
          onClose={() => setSelectedConcept(null)}
        />
      )}
    </>
  );
}
