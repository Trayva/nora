import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Drawer from "../../components/Drawer";
import IcartOverview from "./IcartOverview";
import IcartTasks from "./IcartTasks";
import IcartWorkforce from "./IcartWorkforce";
import IcartInventory from "./IcartInventory";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "workforce", label: "Workforce" },
  { key: "inventory", label: "Inventory" },
];

export default function IcartDrawer({ cartId, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!cartId) return;
    setLoading(true);
    try {
      const res = await api.get(`/icart/${cartId}`);
      setCart(res.data.data);
      console.log(res)
    } catch {
      toast.error("Failed to load iCart details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cartId) {
      setActiveTab("overview");
      fetchCart();
    } else {
      setCart(null);
    }
  }, [cartId]);

  const handleCartUpdate = (updatedCart) => {
    setCart(updatedCart);
    if (onUpdate) onUpdate(updatedCart);
  };

  return (
    <Drawer
      isOpen={!!cartId}
      onClose={onClose}
      title={cart ? cart.serialNumber : "iCart Details"}
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
            <IcartOverview
              cart={cart}
              onUpdate={handleCartUpdate}
              onRefresh={fetchCart}
            />
          )}
          {activeTab === "tasks" && <IcartTasks cart={cart} />}
          {activeTab === "workforce" && (
            <IcartWorkforce cart={cart} onRefresh={fetchCart} />
          )}
          {activeTab === "inventory" && <IcartInventory cart={cart} />}
        </>
      )}
    </Drawer>
  );
}
