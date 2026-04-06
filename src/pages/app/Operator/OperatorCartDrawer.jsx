import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import Drawer from "../../../components/Drawer";
import {
  MdTask,
  MdInventory2,
  MdMenuBook,
  MdSchool,
  MdPointOfSale,
  MdOutlineShoppingBag,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

// Import all tab components from OperatorCartPage
// These are defined in OperatorCartPage.jsx — we re-export them via a shared barrel
// OR we inline the tab rendering here using the same components.
// Since React doesn't support cross-file named function imports easily without
// refactoring, we import from OperatorCartPage via a re-export pattern.
// The cleanest approach: OperatorCartPage exports its tabs, drawer imports them.
import {
  TasksTab,
  InventoryTab,
  MenuTab,
  ELearningTab,
  SalesTab,
} from "./OperatorCart";
import IcartOrders from "../../icart/IcartOrders";

const TABS = [
  { key: "tasks", label: "Tasks", icon: <MdTask size={13} /> },
  { key: "inventory", label: "Inventory", icon: <MdInventory2 size={13} /> },
  { key: "menu", label: "Menu", icon: <MdMenuBook size={13} /> },
  { key: "elearning", label: "E-Learning", icon: <MdSchool size={13} /> },
  { key: "sales", label: "Sales", icon: <MdPointOfSale size={13} /> },
  { key: "orders", label: "Orders", icon: <MdOutlineShoppingBag size={13} /> },
];

export default function OperatorCartDrawer({ cartId, onClose }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (!cartId) {
      setCart(null);
      return;
    }
    setActiveTab("tasks");
    setLoading(true);
    api
      .get(`/icart/${cartId}`)
      .then((r) => setCart(r.data.data))
      .catch(() => toast.error("Failed to load cart"))
      .finally(() => setLoading(false));
  }, [cartId]);

  const cartSerial = cart?.serialNumber || "My iCart";
  const cartLocation = cart?.location?.name || "";

  return (
    <Drawer
      isOpen={!!cartId}
      onClose={onClose}
      title={cartSerial}
      description={cartLocation}
      width={560}
    >
      {/* Tab bar */}
      <div className="drawer_tabs_bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`drawer_tab_btn ${activeTab === tab.key ? "drawer_tab_active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}&nbsp;{tab.label}
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
          {activeTab === "tasks" && <TasksTab cartId={cartId} />}
          {activeTab === "inventory" && <InventoryTab cartId={cartId} />}
          {activeTab === "menu" && <MenuTab menuItems={cart.menuItems || []} />}
          {activeTab === "elearning" && (
            <ELearningTab menuItems={cart.menuItems || []} />
          )}
          {activeTab === "sales" && (
            <SalesTab
              cartId={cartId}
              menuItems={cart.menuItems || []}
              isOperator={true}
            />
          )}
          {activeTab === "orders" && <IcartOrders cartId={cartId} />}
        </>
      )}
    </Drawer>
  );
}
