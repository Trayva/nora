import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MdStorefront,
  MdOutlineAssignment,
  MdOutlinePeople,
  MdOutlineInventory2,
  MdBuild,
  MdAttachMoney,
  MdReceiptLong,
  MdOutlineAssessment
} from "react-icons/md";
import api from "../../api/axios";
import Drawer from "../../components/Drawer";
import Tabs from "../../components/Tabs";
import KioskOverview from "./KioskOverview";
import KioskTasks from "./KioskTasks";
import KioskWorkforce from "./KioskWorkforce";
import KioskInventory from "./KioskInventory";
import KioskSales from "./KioskSales";
import KioskOrders from "./KioskOrders";
import KioskReports from "./KioskReports"; // ← new

const TABS = [
  { key: "overview", label: "Overview", icon: MdStorefront },
  { key: "tasks", label: "Tasks", icon: MdOutlineAssignment },
  { key: "workforce", label: "Workforce", icon: MdOutlinePeople },
  { key: "inventory", label: "Inventory", icon: MdOutlineInventory2 },
  { key: "utilities", label: "Utilities", icon: MdBuild },
  { key: "sales", label: "Sales", icon: MdAttachMoney },
  { key: "orders", label: "Orders", icon: MdReceiptLong },
  { key: "reports", label: "Reports", icon: MdOutlineAssessment },
];

export default function KioskDrawer({ kioskId, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!kioskId) return;
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/${kioskId}`);
      setCart(res.data.data);
    } catch {
      toast.error("Failed to load Kiosk details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (kioskId) {
      setActiveTab("overview");
      fetchCart();
    } else {
      setCart(null);
    }
  }, [kioskId]);

  const handleCartUpdate = (updatedCart) => {
    setCart(updatedCart);
    if (onUpdate) onUpdate(updatedCart);
  };

  return (
    <Drawer
      isOpen={!!kioskId}
      onClose={onClose}
      title={cart ? cart.serialNumber : "Kiosk Details"}
      description={cart ? cart.location?.name || "No location assigned" : ""}
      width={520}
    >
      {/* Sticky Tabs */}
      <Tabs
        tabs={TABS}
        className="borderless"
        activeTab={activeTab}
        onChange={setActiveTab}
        style={{
          margin: "-20px -24px 20px",
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
        }}
      />

      {/* Content */}
      {loading ? (
        <div style={{ padding: "12px" }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "120px", height: "16px", marginBottom: "20px" }} />
          <div
            className="skeleton_shimmer skeleton_rect"
            style={{ height: "60px", borderRadius: "12px", marginBottom: "12px" }}
          />
          <div
            className="skeleton_shimmer skeleton_rect"
            style={{ height: "60px", borderRadius: "12px", marginBottom: "12px" }}
          />
          <div
            className="skeleton_shimmer skeleton_rect"
            style={{ height: "60px", borderRadius: "12px", marginBottom: "12px" }}
          />
          <div className="skeleton_shimmer skeleton_text" style={{ width: "140px", height: "16px", marginTop: "24px", marginBottom: "20px" }} />
          <div
            className="skeleton_shimmer skeleton_rect"
            style={{ height: "120px", borderRadius: "12px" }}
          />
        </div>
      ) : !cart ? null : (
        <>
          {activeTab === "overview" && (
            <KioskOverview
              cart={cart}
              onUpdate={handleCartUpdate}
              onRefresh={fetchCart}
            />
          )}
          {activeTab === "tasks" && <KioskTasks cart={cart} />}
          {activeTab === "workforce" && (
            <KioskWorkforce cart={cart} onRefresh={fetchCart} />
          )}
          {activeTab === "inventory" && <KioskInventory cart={cart} isUtilities={false} />}
          {activeTab === "utilities" && <KioskInventory cart={cart} isUtilities={true} />}
          {activeTab === "sales" && <KioskSales cart={cart} />}
          {activeTab === "orders" && <KioskOrders kioskId={cart.id} />}
          {activeTab === "reports" && (
            <KioskReports cart={cart} canUpdateStatus={true} />
          )}
        </>
      )}
    </Drawer>
  );
}
