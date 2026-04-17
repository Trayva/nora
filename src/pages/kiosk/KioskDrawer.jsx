import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Drawer from "../../components/Drawer";
import KioskOverview from "./KioskOverview";
import KioskTasks from "./KioskTasks";
import KioskWorkforce from "./KioskWorkforce";
import KioskInventory from "./KioskInventory";
import KioskSales from "./KioskSales";
import KioskOrders from "./KioskOrders";
import KioskReports from "./KioskReports"; // ← new

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "workforce", label: "Workforce" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "orders", label: "Orders" },
  { key: "reports", label: "Reports" }, // ← new
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
      <div className="drawer_tabs_bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`drawer_tab_btn ${activeTab === tab.key ? "drawer_tab_active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
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
          {activeTab === "inventory" && <KioskInventory cart={cart} />}
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
