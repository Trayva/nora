import {
  MdStorefront,
  MdAdd,
  MdEdit,
  MdClose,
  MdRestaurantMenu,
  MdOpenInNew,
  MdAccessTime,
} from "react-icons/md";

const MAX_MENU_ITEMS = 5;

export default function BrandIdleCard({
  cart,
  onChangeBrand,
  onManageMenu,
  onMenuClick,
  onRemoveBrand,
}) {
  const assignedVendor = cart.vendor;
  const menuItems = cart.menuItems || [];
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  if (!assignedVendor && menuItems.length === 0) {
    return (
      <div
        style={{
          border: "2px dashed var(--border)",
          borderRadius: 16,
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
          background: "var(--bg-hover)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onClick={onChangeBrand}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "rgba(203,108,220,0.4)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdStorefront
            size={24}
            style={{ color: "var(--accent)", opacity: 0.7 }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.9rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              marginBottom: 4,
            }}
          >
            No Brand Selected
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
            Tap to choose a brand and menu items for this Kiosk
          </div>
        </div>
        <button
          className="app_btn app_btn_confirm"
          style={{
            height: 38,
            padding: "0 20px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.82rem",
          }}
        >
          <MdAdd size={15} /> Select Brand
        </button>
      </div>
    );
  }

  const brandColor = assignedVendor?.brandColor;
  const gradientBg = brandColor
    ? `linear-gradient(135deg, ${brandColor}22 0%, ${brandColor}08 100%)`
    : "linear-gradient(135deg, rgba(203,108,220,0.1) 0%, rgba(203,108,220,0.03) 100%)";
  const borderCol = brandColor ? `${brandColor}44` : "rgba(203,108,220,0.2)";

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${borderCol}`,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: gradientBg,
          padding: "18px 18px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {assignedVendor?.brandLogo ? (
            <img
              src={assignedVendor.brandLogo}
              alt=""
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                objectFit: "cover",
                flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.15)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdStorefront
                size={22}
                style={{ color: brandColor || "var(--accent)" }}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 900,
                color: "var(--text-heading)",
                marginBottom: 2,
              }}
            >
              {assignedVendor?.businessName || assignedVendor?.name || "Brand"}
            </div>
            {assignedVendor?.brandTagline && (
              <div
                style={{
                  fontSize: "0.74rem",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {assignedVendor.brandTagline}
              </div>
            )}
          </div>
          {/* Change brand → just a plus/edit icon, no text */}
          <button
            onClick={onChangeBrand}
            title="Change Brand"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid rgba(203,108,220,0.3)",
              background: "rgba(203,108,220,0.08)",
              color: "var(--accent)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdEdit size={15} />
          </button>
          <button
            onClick={onRemoveBrand}
            title="Remove Brand"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.06)",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdClose size={15} />
          </button>
        </div>
      </div>

      {menuItems.length > 0 ? (
        <div style={{ padding: "14px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                }}
              >
                {menuItems.length} Menu Item{menuItems.length !== 1 ? "s" : ""}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginLeft: 8,
                }}
              >
                · {MAX_MENU_ITEMS - menuItems.length} slot
                {MAX_MENU_ITEMS - menuItems.length !== 1 ? "s" : ""} left
              </span>
            </div>
            <button
              onClick={onManageMenu}
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "0.72rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MdRestaurantMenu size={12} /> Manage
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 8,
            }}
          >
            {menuItems.map((item, idx) => {
              const name = item.name || item.menuItem?.name || "Item";
              const img = item.image || item.menuItem?.image;
              const price =
                item.sellingPrice || item.menuItem?.sellingPrice || 0;
              const ticketTime =
                item.ticketTime || item.menuItem?.ticketTime || 0;
              return (
                <div
                  key={item.id || idx}
                  onClick={() => onMenuClick?.(item)}
                  style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 11,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "border-color 0.12s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor =
                      "rgba(203,108,220,0.4)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  {img ? (
                    <img
                      src={img}
                      alt={name}
                      style={{
                        width: "100%",
                        height: 64,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: 64,
                        background: "var(--bg-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MdRestaurantMenu
                        size={20}
                        style={{ color: "var(--text-muted)", opacity: 0.4 }}
                      />
                    </div>
                  )}
                  {/* Clickable indicator overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MdOpenInNew
                      size={10}
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    />
                  </div>
                  <div style={{ padding: "7px 8px" }}>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        marginTop: 2,
                      }}
                    >
                      {price > 0 && (
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--accent)",
                            fontWeight: 700,
                          }}
                        >
                          ₦{fmt(price)}
                        </div>
                      )}
                      {ticketTime > 0 && (
                        <div
                          style={{
                            fontSize: "0.62rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <MdAccessTime size={10} />
                          {ticketTime}m
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {Array.from({ length: MAX_MENU_ITEMS - menuItems.length }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    border: "1.5px dashed var(--border)",
                    borderRadius: 11,
                    height: 100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.4,
                  }}
                >
                  <MdAdd size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              ),
            )}
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              background: "var(--bg-hover)",
              border: "1px dashed var(--border)",
              borderRadius: 11,
              cursor: "pointer",
            }}
            onClick={onChangeBrand}
          >
            <MdAdd
              size={16}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No menu items — click to select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
