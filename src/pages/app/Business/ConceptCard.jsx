import { useState } from "react";
import { MdOutlineRestaurantMenu, MdOutlineBarChart } from "react-icons/md";
import { updateConceptStatus } from "../../../api/vendor";
import { toast } from "react-toastify";

const STATUS_BADGE = {
  CREATED: "email_badge_unverified",
  ACTIVE: "email_badge_verified",
  INACTIVE: "email_badge_unverified",
};

export default function ConceptCard({ concept, onUpdate, onOpen, onOverview }) {
  const [toggling, setToggling] = useState(false);

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

        <div className="concept_total_row">
          <span className="concept_total_label">Menu Items</span>
          <button
            className="biz_icon_btn"
            onClick={(e) => {
              e.stopPropagation();
              onOverview();
            }}
            title="Concept overview"
            style={{ width: 28, height: 28, borderRadius: 7 }}
          >
            <MdOutlineBarChart size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
