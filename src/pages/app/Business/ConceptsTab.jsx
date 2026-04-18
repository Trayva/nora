import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus } from "react-icons/lu";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { getVendorConcepts } from "../../../api/vendor";
import ConceptCard from "./ConceptCard";
import MenuTab from "./MenuTab";
import CreateConceptModal from "./CreateConceptModal";
import ConceptDrawer from "./ConceptDrawer";
import ConceptOverviewDrawer from "./ConceptOverviewDrawer";

export default function ConceptsTab({ activeTab }) {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [openConcept, setOpenConcept] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [overviewConcept, setOverviewConcept] = useState(null);

  const fetchConcepts = async () => {
    try {
      const res = await getVendorConcepts();
      const list = res.data.data || [];
      setConcepts(list);
      if (list.length > 0 && !selectedConcept) setSelectedConcept(list[0]);
    } catch {
      toast.error("Failed to load concepts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcepts();
  }, []);

  if (activeTab === "menu") {
    return (
      <MenuTab
        concepts={concepts}
        selectedConcept={selectedConcept}
        onSelectConcept={setSelectedConcept}
      />
    );
  }

  return (
    <div className="biz_tab_panel">
      <div className="biz_panel_header">
        <span className="biz_panel_count">
          {concepts.length} concept{concepts.length !== 1 ? "s" : ""}
        </span>
        <button
          className="app_btn app_btn_confirm biz_add_btn"
          onClick={() => setShowCreate(true)}
        >
          <LuPlus size={15} />
          New Concept
        </button>
      </div>

      {loading ? (
        <div className="biz_concepts_grid">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 180, borderRadius: 16 }} />
          ))}
        </div>
      ) : concepts.length === 0 ? (
        <div className="biz_empty">
          <MdOutlineRestaurantMenu size={28} />
          <p>No concepts yet. Create your first menu concept.</p>
        </div>
      ) : (
        <div className="biz_concepts_grid">
          {concepts.map((c) => (
            <ConceptCard
              key={c.id}
              concept={c}
              onUpdate={fetchConcepts}
              onOpen={() => setOpenConcept(c)}
              onOverview={() => setOverviewConcept(c)}
            />
          ))}
        </div>
      )}

      <CreateConceptModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          fetchConcepts();
        }}
      />

      <ConceptDrawer
        concept={openConcept}
        onClose={() => setOpenConcept(null)}
        onUpdate={fetchConcepts}
      />

      <ConceptOverviewDrawer
        concept={overviewConcept}
        onClose={() => setOverviewConcept(null)}
      />
    </div>
  );
}
