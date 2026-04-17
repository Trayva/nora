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
import { LuStore } from "react-icons/lu";

// Import all tab components from OperatorKioskPage
// These are defined in OperatorKioskPage.jsx — we re-export them via a shared barrel
// OR we inline the tab rendering here using the same components.
// Since React doesn't support cross-file named function imports easily without
// refactoring, we import from OperatorKioskPage via a re-export pattern.
// The cleanest approach: OperatorKioskPage exports its tabs, drawer imports them.
import {
  TasksTab,
  InventoryTab,
  MenuTab,
  ELearningTab,
  SalesTab,
} from "./OperatorKiosk";
import KioskOrders from "../../kiosk/KioskOrders";

const TABS = [
  { key: "tasks", label: "Tasks", icon: <MdTask size={13} /> },
  { key: "inventory", label: "Inventory", icon: <MdInventory2 size={13} /> },
  { key: "menu", label: "Menu", icon: <MdMenuBook size={13} /> },
  { key: "elearning", label: "E-Learning", icon: <MdSchool size={13} /> },
  { key: "sales", label: "Sales", icon: <MdPointOfSale size={13} /> },
  { key: "orders", label: "Orders", icon: <MdOutlineShoppingBag size={13} /> },
];

export default function OperatorKioskDrawer({ kioskId, onClose }) {
  const [kiosk, setKiosk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (!kioskId) {
      setKiosk(null);
      return;
    }
    setActiveTab("tasks");
    setLoading(true);
    api
      .get(`/kiosk/${kioskId}`)
      .then((r) => setKiosk(r.data.data))
      .catch(() => toast.error("Failed to load kiosk"))
      .finally(() => setLoading(false));
  }, [kioskId]);

  const kioskSerial = kiosk?.serialNumber || "My Kiosk";
  const kioskLocation = kiosk?.location?.name || "";

  return (
    <Drawer
      isOpen={!!kioskId}
      onClose={onClose}
      title={kioskSerial}
      description={kioskLocation}
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
      ) : !kiosk ? null : (
        <>
          {activeTab === "tasks" && <TasksTab kioskId={kioskId} />}
          {activeTab === "inventory" && <InventoryTab kioskId={kioskId} />}
          {activeTab === "menu" && <MenuTab menuItems={kiosk.menuItems || []} />}
          {activeTab === "elearning" && (
            <ELearningTab menuItems={kiosk.menuItems || []} />
          )}
          {activeTab === "sales" && (
            <SalesTab
              kioskId={kioskId}
              menuItems={kiosk.menuItems || []}
              isOperator={true}
            />
          )}
          {activeTab === "orders" && <KioskOrders kioskId={kioskId} />}
        </>
      )}
    </Drawer>
  );
}
