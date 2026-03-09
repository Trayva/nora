import { useState } from "react";
import { LuPenLine } from "react-icons/lu";
import { MdOutlineBusiness, MdOutlinePalette, MdOutlineVerified } from "react-icons/md";
import RegisterBusinessModal from "./RegisterBusinessModal";

export default function BusinessProfile({ vendor, onUpdate }) {
  const [showEdit, setShowEdit] = useState(false);

  const logo = vendor.branding?.logo || vendor.brandLogo;
  const color = vendor.branding?.color || vendor.brandColor;
  const tagline = vendor.branding?.tagline || vendor.brandTagline;

  const membershipColor = {
    ACTIVE: "email_badge_verified",
    PENDING: "email_badge_unverified",
    EXPIRED: "email_badge_unverified",
  }[vendor.membershipStatus] || "email_badge_unverified";

  return (
    <>
      <div className="biz_profile">
        {/* Colored banner strip */}
        <div
          className="biz_banner"
          style={{
            background: color
              ? `linear-gradient(135deg, ${color}30 0%, ${color}08 100%)`
              : "linear-gradient(135deg, rgba(203,108,220,0.12), rgba(168,85,247,0.04))",
            borderBottom: `1px solid ${color ? color + "25" : "var(--border)"}`,
          }}
        >
          {color && (
            <div
              className="biz_banner_orb"
              style={{ background: `radial-gradient(circle, ${color}40 0%, transparent 70%)` }}
            />
          )}
        </div>

        {/* Profile content row */}
        <div className="biz_profile_content">
          {/* Big logo */}
          <div className="biz_avatar_wrap">
            {logo ? (
              <img src={logo} alt={vendor.businessName} className="biz_avatar" />
            ) : (
              <div className="biz_avatar biz_avatar_placeholder">
                <MdOutlineBusiness size={52} />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="biz_info">
            <div className="biz_name_row">
              <h2 className="biz_name">{vendor.businessName}</h2>
              {vendor.businessRegDoc && (
                <MdOutlineVerified size={20} style={{ color: "#22c55e", flexShrink: 0 }} title="Registered" />
              )}
            </div>

            {tagline && <p className="biz_tagline">"{tagline}"</p>}
            {vendor.email && <p className="biz_email">{vendor.email}</p>}

            <div className="biz_meta_row">
              <span className={`email_badge ${membershipColor}`}>
                {vendor.membershipStatus}
              </span>
              {color && (
                <div className="biz_meta_item">
                  <MdOutlinePalette size={13} />
                  <span className="biz_color_dot" style={{ background: color }} />
                  <span>{color}</span>
                </div>
              )}
            </div>
          </div>

          {/* Edit button top-right */}
          <button className="biz_edit_btn" onClick={() => setShowEdit(true)}>
            <LuPenLine size={14} />
            Edit
          </button>
        </div>
      </div>

      <RegisterBusinessModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={() => { setShowEdit(false); onUpdate(); }}
        mode="update"
        defaultValues={{ ...vendor, brandColor: color, brandTagline: tagline }}
      />
    </>
  );
}