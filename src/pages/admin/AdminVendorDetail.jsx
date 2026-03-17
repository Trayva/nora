import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdExpandMore, MdExpandLess, MdImage } from "react-icons/md";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

function ConceptRow({ concept }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMenu = async () => {
    if (menu !== null) return;
    setLoading(true);
    try {
      const r = await api.get(`/vendor/concept/${concept.id}`);
      setMenu(r.data.data);
    } catch {
      toast.error("Failed to load concept details");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!open) loadMenu();
    setOpen((v) => !v);
  };

  return (
    <div
      style={{
        background: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: 11,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          cursor: "pointer",
        }}
        onClick={handleToggle}
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
                    concept.status === "ACTIVE"
                      ? "#16a34a"
                      : "var(--text-muted)",
                }}
              >
                {concept.status}
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div
            className="page_loader_spinner"
            style={{ width: 14, height: 14 }}
          />
        ) : open ? (
          <MdExpandLess size={15} style={{ color: "var(--text-muted)" }} />
        ) : (
          <MdExpandMore size={15} style={{ color: "var(--text-muted)" }} />
        )}
      </div>

      {open && menu && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {menu.description && (
            <div
              style={{
                padding: "8px 12px",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {menu.description}
            </div>
          )}
          {/* Menu items */}
          {menu.menuItems?.length > 0 ? (
            <div>
              <div
                style={{
                  padding: "6px 12px",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Menu Items ({menu.menuItems.length})
              </div>
              {menu.menuItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdImage
                        size={12}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                      }}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {item.price != null && (
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                        }}
                      >
                        ₦{fmt(item.price)}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "0.62rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.status || ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "12px",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              No menu items.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminVendorDetail({ vendor, onClose }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  vendor.membershipStatus === "ACTIVE" ? "#16a34a" : "#ca8a04",
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
          concepts.map((c) => <ConceptRow key={c.id} concept={c} />)
        )}
      </div>
    </Drawer>
  );
}
