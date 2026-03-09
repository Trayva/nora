import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { MdOutlineBlender } from "react-icons/md";
import { getVendorExtras, deleteExtra } from "../../../api/library";
import { getVendorProfile } from "../../../api/vendor";
import ExtraDrawer from "./ExtraDrawer";
import CreateExtraModal from "./CreateExtraModal";

export default function ExtrasTab() {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState(null);
  const [openExtra, setOpenExtra] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchExtras = async (vid) => {
    const id = vid || vendorId;
    if (!id) return;
    try {
      const res = await getVendorExtras(id);
      setExtras(res.data.data || []);
    } catch {
      toast.error("Failed to load extras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await getVendorProfile();
        const vid = res.data.data.id;
        setVendorId(vid);
        await fetchExtras(vid);
      } catch {
        toast.error("Failed to load vendor");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteExtra(id);
      toast.success("Extra deleted");
      fetchExtras();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="biz_tab_panel">
      <div className="biz_panel_header">
        <span className="biz_panel_count">
          {extras.length} prep item{extras.length !== 1 ? "s" : ""}
        </span>
        <button
          className="app_btn app_btn_confirm biz_add_btn"
          onClick={() => setShowCreate(true)}
        >
          <LuPlus size={15} />
          New Extra
        </button>
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : extras.length === 0 ? (
        <div className="biz_empty">
          <MdOutlineBlender size={28} />
          <p>No prep items yet. Create your first extra like "Pepper Mix".</p>
        </div>
      ) : (
        <div className="biz_concepts_grid">
          {extras.map((extra) => (
            <div
              key={extra.id}
              className="concept_card"
              onClick={() => setOpenExtra(extra)}
            >
              <div className="extra_card_banner">
                <MdOutlineBlender size={28} />
              </div>

              <div className="concept_body">
                <div className="concept_header_row">
                  <div>
                    <h3 className="concept_name">{extra.name}</h3>
                    {extra.description && (
                      <p className="concept_location">{extra.description}</p>
                    )}
                  </div>
                  <span className="concept_currency_badge">{extra.unit}</span>
                </div>

                <div className="concept_info_row">
                  <span className="concept_info_label">Recipe Output</span>
                  <span className="concept_info_value">
                    {extra.recipeOutput} {extra.unit}
                  </span>
                </div>

                <div className="concept_total_row">
                  <span className="concept_total_label">Recipe Steps</span>
                  <span className="concept_total_value">
                    {extra.prepRecipes?.length || 0} steps →
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="concept_select_btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenExtra(extra);
                    }}
                    style={{ flex: 1 }}
                  >
                    View Recipe
                  </button>
                  <button
                    className="biz_icon_btn biz_icon_btn_danger"
                    onClick={(e) => handleDelete(extra.id, e)}
                    disabled={deleting === extra.id}
                    style={{ position: "relative", height: 40, width: 40 }}
                  >
                    {deleting === extra.id ? (
                      <span
                        className="btn_loader"
                        style={{
                          width: 14,
                          height: 14,
                          borderColor: "#ef4444",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <LuTrash2 size={15} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateExtraModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false);
          fetchExtras();
        }}
      />

      <ExtraDrawer
        extra={openExtra}
        onClose={() => {
          setOpenExtra(null);
          fetchExtras();
        }}
        onUpdate={(updated) => {
          // update the card in the list with real step count
          setExtras((prev) =>
            prev.map((e) =>
              e.id === updated.id
                ? { ...e, prepRecipes: updated.prepRecipes }
                : e,
            ),
          );
        }}
      />
    </div>
  );
}
