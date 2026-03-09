import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPenLine, LuPlus } from "react-icons/lu";
import { MdOutlineBusiness } from "react-icons/md";
import { getVendorProfile } from "../../../api/vendor";
import BusinessProfile from "./BusinessProfile";
import ConceptsTab from "./ConceptsTab";
import RegisterBusinessModal from "./RegisterBusinessModal";
import "./Business.css";
import ExtrasTab from "./ExtrasTab";

export default function Business() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("concepts");
  const [showRegister, setShowRegister] = useState(false);

  const fetchVendor = async () => {
    try {
      const res = await getVendorProfile();
      setVendor(res.data.data);
    } catch (err) {
      // 404 = not registered yet, that's fine
      if (err.response?.status !== 404) {
        toast.error("Failed to load business profile");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, []);

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  // Not registered yet
  if (!vendor) {
    return (
      <div className="page_wrapper">
        <div className="business_empty_state">
          <div className="business_empty_icon">
            <MdOutlineBusiness size={32} />
          </div>
          <h3 className="business_empty_title">No Business Yet</h3>
          <p className="business_empty_desc">
            Register your business to start managing concepts and menus.
          </p>
          <button
            className="app_btn app_btn_confirm"
            style={{ height: 42, paddingInline: 28 }}
            onClick={() => setShowRegister(true)}
          >
            <LuPlus size={16} />
            Register Business
          </button>
        </div>

        <RegisterBusinessModal
          isOpen={showRegister}
          onClose={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            fetchVendor();
          }}
          mode="register"
        />
      </div>
    );
  }

  return (
    <div className="business_page">
      {/* Profile header */}
      <BusinessProfile vendor={vendor} onUpdate={fetchVendor} />

      {/* X-style tab bar */}
      <div className="business_tabs">
        <button
          className={`business_tab ${activeTab === "concepts" ? "business_tab_active" : ""}`}
          onClick={() => setActiveTab("concepts")}
        >
          Concepts
        </button>
        <button
          className={`business_tab ${activeTab === "menu" ? "business_tab_active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu Items
        </button>
        <button
          className={`business_tab ${activeTab === "extras" ? "business_tab_active" : ""}`}
          onClick={() => setActiveTab("extras")}
        >
          Extras
        </button>
      </div>

      {/* Tab content */}
      <div className="business_tab_content">
        {activeTab === "extras" ? (
          <ExtrasTab />
        ) : (
          <ConceptsTab activeTab={activeTab} />
        )}
      </div>
    </div>
  );
}
