import { useState } from "react";
import { MdOutlineRestaurantMenu } from "react-icons/md";
import { updateConceptStatus } from "../../../api/vendor";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  CREATED: "email_badge_unverified",
  ACTIVE: "email_badge_verified",
  INACTIVE: "email_badge_unverified",
};

export default function ConceptCard({ concept, onUpdate, onOpen }) {
  const [toggling, setToggling] = useState(false);

  //   const toggleStatus = async (e) => {
  //     e.stopPropagation();
  //     setToggling(true);
  //     try {
  //       const next = concept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  //       await updateConceptStatus(concept.id, next);
  //       toast.success(`Concept ${next.toLowerCase()}`);
  //       onUpdate();
  //     } catch (err) {
  //       toast.error(err.response?.data?.message || "Failed to update status");
  //     } finally {
  //       setToggling(false);
  //     }
  //   };

  return (
    <div className="concept_card" onClick={onOpen}>
      {concept.banner ? (
        <img
          src={concept.banner}
          alt={concept.name}
          className="concept_banner"
        />
      ) : (
        <div className="concept_banner concept_banner_placeholder">
          <MdOutlineRestaurantMenu size={24} />
        </div>
      )}

      <div className="concept_body">
        <div className="concept_header_row">
          <div>
            <h3 className="concept_name">{concept.name}</h3>
            {concept.origin && (
              <p className="concept_location">{concept.origin}</p>
            )}
          </div>
          <span className="concept_currency_badge">{concept.status}</span>
        </div>

        <div className="concept_info_row">
          <span className="concept_info_label">Serves</span>
          <span className="concept_info_value">{concept.serveTo || "—"}</span>
        </div>

        {/* {concept.description && (
          <p className="concept_desc">{concept.description}</p>
        )} */}

        <div className="concept_total_row">
          <span className="concept_total_label">Menu Items</span>
          <span className="concept_total_value">View →</span>
        </div>

        {/* <button
          className={`concept_select_btn ${toggling ? "btn_loading" : ""}`}
          onClick={toggleStatus}
          disabled={toggling}
          style={{ position: "relative" }}
        >
          <span className="btn_text">
            {concept.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </span>
          {toggling && <span className="btn_loader" style={{ width: 16, height: 16, borderColor: "#fff", borderTopColor: "transparent" }} />}
        </button> */}
      </div>
    </div>
  );
}
