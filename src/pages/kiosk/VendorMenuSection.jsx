import { useState } from "react";
import { toast } from "react-toastify";
import { MdAdd } from "react-icons/md";
import api from "../../api/axios";
import BrandIdleCard from "./BrandIdleCard";
import BrandSelectionDrawer from "./BrandSelectionDrawer";
import ManageMenuDrawer from "./ManageMenuDrawer";
import { MenuDetailDrawer } from "./MenuDetailDrawer";

export default function VendorMenuSection({ cart, onUpdate, onRefresh }) {
  const [showBrandDrawer, setShowBrandDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);
  const [confirmRemoveBrand, setConfirmRemoveBrand] = useState(false);
  const [removingBrand, setRemovingBrand] = useState(false);
  const [idleDetailId, setIdleDetailId] = useState(null);
  const [idleDetailName, setIdleDetailName] = useState("");

  const handleRemoveBrand = async () => {
    setRemovingBrand(true);
    try {
      await api.delete(`/kiosk/${cart.id}/remove-vendor`);
      toast.success("Brand removed");
      setConfirmRemoveBrand(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove brand");
    } finally {
      setRemovingBrand(false);
    }
  };

  const handleIdleMenuClick = (item) => {
    const id = item.menuItemId || item.id;
    const name = item.name || item.menuItem?.name || "Menu Item";
    setIdleDetailId(id);
    setIdleDetailName(name);
  };

  return (
    <>
      {/* Section title with plus icon */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Brands</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          title="Change / Add Brand"
          onClick={() => setShowBrandDrawer(true)}
        >
          <MdAdd size={15} />
        </button>
      </div>

      <BrandIdleCard
        cart={cart}
        onChangeBrand={() => setShowBrandDrawer(true)}
        onManageMenu={() => setShowManageDrawer(true)}
        onMenuClick={handleIdleMenuClick}
        onRemoveBrand={() => setConfirmRemoveBrand(true)}
      />

      {showBrandDrawer && (
        <BrandSelectionDrawer
          cart={cart}
          onClose={() => setShowBrandDrawer(false)}
          onDone={() => {
            setShowBrandDrawer(false);
            onRefresh();
          }}
        />
      )}

      {showManageDrawer && (
        <ManageMenuDrawer
          cart={cart}
          onClose={() => setShowManageDrawer(false)}
          onRefresh={() => {
            onRefresh();
          }}
        />
      )}

      {idleDetailId && (
        <MenuDetailDrawer
          menuId={idleDetailId}
          menuName={idleDetailName}
          cart={cart}
          isSelected={false}
          onToggleSelect={() => { }}
          selectedCount={0}
          onClose={() => {
            setIdleDetailId(null);
            setIdleDetailName("");
          }}
        />
      )}

      {confirmRemoveBrand && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setConfirmRemoveBrand(false)}
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
              background: "var(--bg-card)",
              borderRadius: 16,
              padding: "24px",
              width: "min(360px, 92vw)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                marginBottom: 8,
              }}
            >
              Remove Brand
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                marginBottom: 20,
              }}
            >
              This will remove the brand and all menu items from this Kiosk.
              This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 40 }}
                onClick={() => setConfirmRemoveBrand(false)}
              >
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${removingBrand ? " btn_loading" : ""}`}
                style={{
                  flex: 1,
                  height: 40,
                  background: "#ef4444",
                  position: "relative",
                }}
                onClick={handleRemoveBrand}
                disabled={removingBrand}
              >
                <span className="btn_text">Remove</span>
                {removingBrand && (
                  <span
                    className="btn_loader"
                    style={{ width: 13, height: 13 }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
