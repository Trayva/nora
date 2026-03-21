import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { LuPlus } from "react-icons/lu";
import { MdOutlineBusiness } from "react-icons/md";
import { getVendorProfile } from "../../../api/vendor";
import BusinessProfile from "./BusinessProfile";
import ConceptsTab from "./ConceptsTab";
import RegisterBusinessModal from "./RegisterBusinessModal";
import ConceptOverviewDrawer from "./ConceptOverviewDrawer";
import "./Business.css";
import ExtrasTab from "./ExtrasTab";

export default function Business() {
  const location = useLocation();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("concepts");
  const [showRegister, setShowRegister] = useState(false);
  const [overviewConcept, setOverviewConcept] = useState(null);

  const fetchVendor = async () => {
    try {
      const res = await getVendorProfile();
      setVendor(res.data.data);
    } catch (err) {
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

  // If navigated here from IcartDrawer with a concept to preview
  useEffect(() => {
    if (location.state?.openConcept) {
      setOverviewConcept(location.state.openConcept);
      // Clear state so a refresh doesn't re-open it
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

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

        {/* Still allow overview to open even if vendor not loaded yet */}
        <ConceptOverviewDrawer
          concept={overviewConcept}
          onClose={() => setOverviewConcept(null)}
        />
      </div>
    );
  }

  return (
    <div className="business_page">
      <BusinessProfile vendor={vendor} onUpdate={fetchVendor} />

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

      <div className="business_tab_content">
        {activeTab === "extras" ? (
          <ExtrasTab />
        ) : (
          <ConceptsTab activeTab={activeTab} />
        )}
      </div>

      {/* Opens automatically when navigated from iCart active concepts */}
      <ConceptOverviewDrawer
        concept={overviewConcept}
        onClose={() => setOverviewConcept(null)}
      />
    </div>
  );
}