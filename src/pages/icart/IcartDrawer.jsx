import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Drawer from "../../components/Drawer";
import IcartOverview from "./IcartOverview";
import IcartTasks from "./IcartTasks";
import IcartWorkforce from "./IcartWorkforce";
import IcartInventory from "./IcartInventory";
import IcartSales from "./IcartSales";
import IcartOrders from "./IcartOrders";

const TABS = [
  { key: "overview",   label: "Overview" },
  { key: "tasks",      label: "Tasks" },
  { key: "workforce",  label: "Workforce" },
  { key: "inventory",  label: "Inventory" },
  { key: "sales",      label: "Sales" },
  { key: "orders",     label: "Orders" },
];

export default function IcartDrawer({ cartId, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!cartId) return;
    setLoading(true);
    try {
      const res = await api.get(`/icart/${cartId}`);
      setCart(res.data.data);
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

  // When a concept is clicked from the Active Concepts section:
  // close this drawer, navigate to /app/business, pass the concept in state
  // so Business page can open ConceptOverviewDrawer directly
  const handleConceptClick = (concept) => {
    onClose();
    navigate("/app/business", { state: { openConcept: concept } });
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
              onConceptClick={handleConceptClick}
            />
          )}
          {activeTab === "tasks"     && <IcartTasks cart={cart} />}
          {activeTab === "workforce" && <IcartWorkforce cart={cart} onRefresh={fetchCart} />}
          {activeTab === "inventory" && <IcartInventory cart={cart} />}
          {activeTab === "sales"     && <IcartSales cart={cart} />}
          {activeTab === "orders"    && <IcartOrders cartId={cart.id} />}
        </>
      )}
    </Drawer>
  );
}