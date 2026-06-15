import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdClose,
  MdRestaurantMenu,
  MdAccessTime,
  MdOpenInNew,
  MdAdd,
} from "react-icons/md";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { MenuDetailDrawer } from "./MenuDetailDrawer";

const MAX_MENU_ITEMS = 5;

export default function ManageMenuDrawer({ cart, onClose, onRefresh }) {
  const assignedVendor = cart.vendor;
  const [cartMenuItems, setCartMenuItems] = useState(cart.menuItems || []);
  const [vendorMenuItems, setVendorMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuPage, setMenuPage] = useState(1);
  const [pendingAdd, setPendingAdd] = useState([]);
  const [markupValues, setMarkupValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [manageDetailId, setManageDetailId] = useState(null);
  const [manageDetailName, setManageDetailName] = useState("");
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  const MENU_PAGE_SIZE = 8;

  // Fix drawer scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const vendorId = assignedVendor?.id || cart.menuItems?.[0]?.vendorId;
    if (!vendorId) return;
    setMenuLoading(true);
    api
      .get(`/vendor/menu?vendorId=${vendorId}&page=1&limit=100`)
      .then((r) => {
        const d = r.data.data;
        setVendorMenuItems(
          d?.items || (Array.isArray(d) ? d : d?.menuItems || d?.data || []),
        );
      })
      .catch(() => toast.error("Failed to load menu items"))
      .finally(() => setMenuLoading(false));
  }, [assignedVendor, cart.menuItems]);

  const isPending = (id) => pendingAdd.some((p) => p.id === id);
  const isAdded = (id) =>
    cartMenuItems.some((m) => m.id === id || m.menuItemId === id);
  const totalSelected = cartMenuItems.length + pendingAdd.length;
  const atLimit = totalSelected >= MAX_MENU_ITEMS;

  const togglePending = (item) => {
    if (isAdded(item.id)) return;
    setPendingAdd((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      if (atLimit) {
        toast.error(`Max ${MAX_MENU_ITEMS} items`);
        return prev;
      }
      return [...prev, { id: item.id, markup: 0 }];
    });
    setMarkupValues((p) => ({ ...p, [item.id]: p[item.id] ?? "0" }));
  };

  const handleSave = async () => {
    if (!pendingAdd.length) return;
    setSaving(true);
    try {
      await api.post(`/kiosk/${cart.id}/menu-items`, {
        items: pendingAdd.map((p) => ({
          id: p.id,
        })),
      });
      toast.success(
        `${pendingAdd.length} item${pendingAdd.length !== 1 ? "s" : ""} added`,
      );
      setPendingAdd([]);
      setMarkupValues({});
      const refreshed = await api.get(`/kiosk/${cart.id}`);
      setCartMenuItems(refreshed.data.data?.menuItems || []);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      await api.delete(`/kiosk/${cart.id}/menu-items`, {
        data: { ids: [confirmRemove.id || confirmRemove.menuItemId] },
      });
      toast.success("Item removed");
      setConfirmRemove(null);
      setCartMenuItems((p) =>
        p.filter(
          (m) => m.id !== confirmRemove.id && m.menuItemId !== confirmRemove.id,
        ),
      );
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setRemoving(false);
    }
  };

  const filteredMenu = vendorMenuItems.filter(
    (m) =>
      !menuSearch || m.name?.toLowerCase().includes(menuSearch.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredMenu.length / MENU_PAGE_SIZE),
  );
  const pagedMenu = filteredMenu.slice(
    (menuPage - 1) * MENU_PAGE_SIZE,
    menuPage * MENU_PAGE_SIZE,
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(560px, 100vw)",
          background: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            <MdClose size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 900,
                color: "var(--text-heading)",
              }}
            >
              Manage Menu
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {totalSelected}/{MAX_MENU_ITEMS} items
            </div>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 999,
              background: atLimit ? "rgba(239,68,68,0.1)" : "var(--bg-active)",
              color: atLimit ? "#ef4444" : "var(--accent)",
              border: `1px solid ${atLimit ? "rgba(239,68,68,0.25)" : "rgba(203,108,220,0.3)"}`,
            }}
          >
            {totalSelected}/{MAX_MENU_ITEMS}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          {/* Active items */}
          {cartMenuItems.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 10,
                }}
              >
                Active Items
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cartMenuItems.map((item) => {
                  const name = item.name || item.menuItem?.name || "Item";
                  const img = item.image || item.menuItem?.image;
                  const price =
                    item.sellingPrice || item.menuItem?.sellingPrice || 0;
                  const ticketTime =
                    item.ticketTime || item.menuItem?.ticketTime || 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        const id = item.menuItemId || item.id;
                        const n = item.name || item.menuItem?.name || "Item";
                        setManageDetailId(id);
                        setManageDetailName(n);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 13px",
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 11,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor =
                          "rgba(203,108,220,0.3)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = "var(--border)")
                      }
                    >
                      {img ? (
                        <img
                          src={img}
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
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MdRestaurantMenu
                            size={14}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.84rem",
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
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          {price > 0 && (
                            <div
                              style={{
                                fontSize: "0.68rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              ₦{fmt(price)}
                            </div>
                          )}
                          {/* Ticket time badge */}
                          {ticketTime > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: "0.64rem",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                padding: "1px 5px",
                                borderRadius: 4,
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <MdAccessTime size={10} />
                              {ticketTime}min
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Clickable indicator */}
                      <MdOpenInNew
                        size={13}
                        style={{
                          color: "var(--text-muted)",
                          opacity: 0.5,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.6rem",
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "rgba(34,197,94,0.1)",
                          color: "#16a34a",
                          border: "1px solid rgba(34,197,94,0.25)",
                          flexShrink: 0,
                        }}
                      >
                        Active
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRemove(item);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "rgba(239,68,68,0.06)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "#ef4444",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdClose size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add from brand */}
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Add from Brand{" "}
            {atLimit && (
              <span style={{ color: "#ef4444" }}>— Limit reached</span>
            )}
          </div>

          {vendorMenuItems.length > MENU_PAGE_SIZE && (
            <input
              className="modal-input"
              placeholder="Search menu…"
              value={menuSearch}
              onChange={(e) => {
                setMenuSearch(e.target.value);
                setMenuPage(1);
              }}
              style={{ marginBottom: 10 }}
            />
          )}

          {menuLoading ? (
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 44, borderRadius: 10 }} />
              ))}
            </div>
          ) : vendorMenuItems.length === 0 ? (
            <div className="kiosk_empty_inline">
              <MdRestaurantMenu size={18} style={{ opacity: 0.3 }} />
              <span>No menu items available</span>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pagedMenu.map((item) => {
                  const added = isAdded(item.id);
                  const pending = isPending(item.id);
                  const disabled = !pending && !added && atLimit;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: pending
                          ? "var(--bg-active)"
                          : "var(--bg-hover)",
                        border: `1.5px solid ${pending ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        borderRadius: 11,
                        overflow: "hidden",
                        opacity: disabled ? 0.45 : 1,
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
                        onClick={() => {
                          setManageDetailId(item.id);
                          setManageDetailName(item.name || "Menu Item");
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
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
                              background: "var(--bg-card)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <MdRestaurantMenu
                              size={14}
                              style={{ color: "var(--text-muted)" }}
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "0.84rem",
                              fontWeight: 700,
                              color: pending
                                ? "var(--accent)"
                                : "var(--text-body)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            {item.sellingPrice > 0 && (
                              <div
                                style={{
                                  fontSize: "0.68rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                ₦{fmt(item.sellingPrice)}
                              </div>
                            )}
                            {/* Ticket time badge */}
                            {item.ticketTime > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: "0.64rem",
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  padding: "1px 5px",
                                  borderRadius: 4,
                                  background: "var(--bg-card)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <MdAccessTime size={10} />
                                {item.ticketTime}min
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Clickable indicator */}
                        <MdOpenInNew
                          size={13}
                          style={{
                            color: "var(--text-muted)",
                            opacity: 0.4,
                            flexShrink: 0,
                          }}
                        />
                        {added ? (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: "rgba(34,197,94,0.1)",
                              color: "#16a34a",
                              border: "1px solid rgba(34,197,94,0.25)",
                              flexShrink: 0,
                            }}
                          >
                            Added
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) togglePending(item);
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 7,
                              background: pending
                                ? "var(--accent)"
                                : "var(--bg-card)",
                              border: `1px solid ${pending ? "var(--accent)" : "var(--border)"}`,
                              color: pending ? "#fff" : "var(--text-muted)",
                              cursor: disabled ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {pending ? (
                              <MdClose size={13} />
                            ) : (
                              <MdAdd size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    className="biz_icon_btn"
                    onClick={() => setMenuPage((p) => Math.max(1, p - 1))}
                    disabled={menuPage <= 1}
                    style={{ width: 28, height: 28 }}
                  >
                    ‹
                  </button>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {menuPage}/{totalPages}
                  </span>
                  <button
                    className="biz_icon_btn"
                    onClick={() =>
                      setMenuPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={menuPage >= totalPages}
                    style={{ width: 28, height: 28 }}
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}

          {pendingAdd.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button
                className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                style={{
                  width: "100%",
                  height: 42,
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                onClick={handleSave}
                disabled={saving}
              >
                <span className="btn_text">
                  Add {pendingAdd.length} Item
                  {pendingAdd.length !== 1 ? "s" : ""}
                </span>
                {saving && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Menu Item"
        description={`Remove "${confirmRemove?.name || confirmRemove?.menuItem?.name}" from this Kiosk?`}
      >
        <div className="modal-body">
          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              onClick={() => setConfirmRemove(null)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${removing ? " btn_loading" : ""}`}
              style={{
                background: "#ef4444",
                position: "relative",
                minWidth: 110,
              }}
              onClick={handleRemove}
              disabled={removing}
            >
              <span className="btn_text">Remove</span>
              {removing && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      </Modal>

      {manageDetailId && (
        <MenuDetailDrawer
          menuId={manageDetailId}
          menuName={manageDetailName}
          cart={cart}
          isSelected={false}
          onToggleSelect={() => { }}
          selectedCount={0}
          onClose={() => {
            setManageDetailId(null);
            setManageDetailName("");
          }}
        />
      )}
    </div>
  );
}
