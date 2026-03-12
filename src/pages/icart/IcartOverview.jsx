import { useState } from "react";
import { toast } from "react-toastify";
import {
  MdWifi,
  MdWifiOff,
  MdLock,
  MdLockOpen,
  MdLocationOn,
  MdEdit,
  MdCheck,
  MdClose,
  MdAdd,
  MdStorefront,
  MdSignalCellularAlt,
  MdCalendarToday,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import api from "../../api/axios";

function ToggleRow({ icon, label, value, loading, onToggle }) {
  return (
    <div className="icart_toggle_row">
      <div className="icart_toggle_left">
        <span className="profile_phone_date_icon">{icon}</span>
        <span className="icart_toggle_label">{label}</span>
      </div>
      <button
        className={`icart_toggle_switch ${value ? "icart_toggle_on" : ""}`}
        onClick={onToggle}
        disabled={loading}
      >
        <span className="icart_toggle_knob" />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="icart_meta_row">
      <span className="icart_meta_key">{label}</span>
      <span className="icart_meta_val">
        {value || <span className="icart_meta_muted">—</span>}
      </span>
    </div>
  );
}

export default function IcartOverview({ cart, onUpdate, onRefresh }) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);

  // Service radius edit
  const [editingRadius, setEditingRadius] = useState(false);
  const [radius, setRadius] = useState(cart.serviceRadius || "");
  const [savingRadius, setSavingRadius] = useState(false);

  // Add concept
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [conceptId, setConceptId] = useState("");
  const [markup, setMarkup] = useState("");
  const [addingConcept, setAddingConcept] = useState(false);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/online`);
      onUpdate({
        ...cart,
        isOnline: res.data.data?.isOnline ?? !cart.isOnline,
      });
      toast.success(`Cart is now ${!cart.isOnline ? "online" : "offline"}`);
    } catch {
      toast.error("Failed to toggle online status");
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/lock`);
      onUpdate({
        ...cart,
        isLocked: res.data.data?.isLocked ?? !cart.isLocked,
      });
      toast.success(`Cart is now ${!cart.isLocked ? "locked" : "unlocked"}`);
    } catch {
      toast.error("Failed to toggle lock status");
    } finally {
      setTogglingLock(false);
    }
  };

  const handleSaveRadius = async () => {
    if (!radius || isNaN(radius)) return toast.error("Enter a valid radius");
    setSavingRadius(true);
    try {
      await api.patch(`/icart/service-radius/${cart.id}`, {
        serviceRadius: Number(radius),
      });
      onUpdate({ ...cart, serviceRadius: Number(radius) });
      toast.success("Service radius updated");
      setEditingRadius(false);
    } catch {
      toast.error("Failed to update radius");
    } finally {
      setSavingRadius(false);
    }
  };

  const handleAddConcept = async () => {
    if (!conceptId.trim()) return toast.error("Enter a concept ID");
    if (!markup || isNaN(markup)) return toast.error("Enter a valid markup");
    setAddingConcept(true);
    try {
      await api.post(`/icart/${cart.id}/concepts/add`, {
        id: conceptId.trim(),
        markup: Number(markup),
      });
      toast.success("Concept added");
      setShowConceptForm(false);
      setConceptId("");
      setMarkup("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add concept");
    } finally {
      setAddingConcept(false);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <div className="icart_tab_content">
      {/* Status toggles */}
      <div className="drawer_section_title">Cart Controls</div>
      <div className="icart_toggles_block">
        <ToggleRow
          icon={cart.isOnline ? <MdWifi size={15} /> : <MdWifiOff size={15} />}
          label="Online Status"
          value={cart.isOnline}
          loading={togglingOnline}
          onToggle={handleToggleOnline}
        />
        <ToggleRow
          icon={cart.isLocked ? <MdLock size={15} /> : <MdLockOpen size={15} />}
          label="Cart Lock"
          value={cart.isLocked}
          loading={togglingLock}
          onToggle={handleToggleLock}
        />
      </div>

      {/* Service Radius */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Service Radius
      </div>
      <div className="icart_radius_block">
        <div className="icart_radius_row">
          <span className="profile_phone_date_icon">
            <MdSignalCellularAlt size={15} />
          </span>
          <span className="icart_toggle_label">Radius</span>
          {editingRadius ? (
            <div className="icart_radius_edit">
              <input
                className="modal-input"
                style={{
                  width: 90,
                  height: 34,
                  padding: "0 10px",
                  fontSize: "0.82rem",
                }}
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="km"
              />
              <button
                className={`app_btn app_btn_confirm ${savingRadius ? "btn_loading" : ""}`}
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={handleSaveRadius}
                disabled={savingRadius}
              >
                <span className="btn_text">Save</span>
                {savingRadius && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={() => {
                  setEditingRadius(false);
                  setRadius(cart.serviceRadius || "");
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="icart_radius_display">
              <span className="icart_meta_val">
                {cart.serviceRadius ? (
                  `${cart.serviceRadius} km`
                ) : (
                  <span className="icart_meta_muted">Not set</span>
                )}
              </span>
              <button
                className="icart_icon_action_btn"
                onClick={() => setEditingRadius(true)}
              >
                <MdEdit size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Info */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Cart Info
      </div>
      <div className="icart_item_meta" style={{ marginBottom: 0 }}>
        <InfoRow label="Serial Number" value={cart.serialNumber} />
        <InfoRow label="Status" value={cart.status} />
        <InfoRow
          label="Vendor"
          value={cart.vendor?.businessName || cart.vendor?.name}
        />
        <InfoRow label="Owner" value={cart.owner?.name || cart.owner?.email} />
        <InfoRow
          label="Contract Start"
          value={formatDate(cart.contractStartDate)}
        />
        <InfoRow
          label="Contract End"
          value={formatDate(cart.contractEndDate)}
        />
      </div>

      {/* Location */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Location
      </div>
      {cart.location ? (
        <div className="icart_location_card">
          <div className="icart_location_icon_wrap">
            <MdLocationOn size={18} />
          </div>
          <div className="icart_location_info">
            <div className="icart_location_name">{cart.location.name}</div>
            {cart.location.address && (
              <div className="icart_location_address">
                {cart.location.address}
              </div>
            )}
            {(cart.location.city || cart.location.lga) && (
              <div className="icart_location_address">
                {[cart.location.lga, cart.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="icart_empty_inline">
          <MdLocationOn size={18} style={{ opacity: 0.3 }} />
          <span>No location assigned</span>
        </div>
      )}

      {/* Concepts */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Active Concepts</span>
        <button
          className="icart_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={() => setShowConceptForm((v) => !v)}
        >
          <MdAdd size={15} />
        </button>
      </div>

      {showConceptForm && (
        <div className="icart_concept_form">
          <div className="form-field">
            <label className="modal-label">Concept ID</label>
            <input
              className="modal-input"
              placeholder="Enter concept UUID"
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Markup (%)</label>
            <input
              className="modal-input"
              type="number"
              placeholder="e.g. 10"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className={`app_btn app_btn_confirm ${addingConcept ? "btn_loading" : ""}`}
              style={{ flex: 1, height: 38 }}
              onClick={handleAddConcept}
              disabled={addingConcept}
            >
              <span className="btn_text">Add Concept</span>
              {addingConcept && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 38 }}
              onClick={() => {
                setShowConceptForm(false);
                setConceptId("");
                setMarkup("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {cart.concepts?.length > 0 ? (
        <div className="icart_concepts_list">
          {cart.concepts.map((c, i) => (
            <div key={c.id || i} className="icart_concept_row">
              <div className="icart_concept_icon">
                <MdStorefront size={14} />
              </div>
              <div className="icart_concept_info">
                <div className="icart_concept_name">
                  {c.name || c.concept?.name || `Concept ${i + 1}`}
                </div>
                {c.markup != null && (
                  <div className="icart_concept_markup">{c.markup}% markup</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showConceptForm && (
          <div className="icart_empty_inline">
            <MdStorefront size={18} style={{ opacity: 0.3 }} />
            <span>No concepts attached</span>
          </div>
        )
      )}
    </div>
  );
}
