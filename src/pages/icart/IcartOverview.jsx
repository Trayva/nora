import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdWifi,
  MdWifiOff,
  MdLock,
  MdLockOpen,
  MdLocationOn,
  MdEdit,
  MdAdd,
  MdStorefront,
  MdSignalCellularAlt,
} from "react-icons/md";
import api from "../../api/axios";

const LOCATION_TYPES = ["ACTIVE", "POTENTIAL", "INACTIVE", "RESTRICTED"];

const BLANK_LOCATION = {
  name: "",
  address: "",
  city: "",
  lga: "",
  country: "",
  stateId: "",
  latitude: "",
  longitude: "",
  locationIdType: "ACTIVE",
  notes: "",
};

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

/* ── Location Form ───────────────────────────────────────────── */
function LocationForm({ cartId, onSaved, onCancel }) {
  const [form, setForm] = useState(BLANK_LOCATION);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);

  // Fetch states on mount
  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => setStates(res.data.data || []))
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // When a state is selected, auto-fill country and stateName from the state object
  const handleStateChange = (stateId) => {
    const selected = states.find((s) => s.id === stateId);
    setForm((p) => ({
      ...p,
      stateId,
      stateName: selected?.name || p.stateName,
      country: selected?.country || p.country,
    }));
  };

  const handleSubmit = async () => {
    const required = [
      "name",
      "address",
      "city",
      "lga",
      "country",
      "stateId",
      "latitude",
      "longitude",
      "locationIdType",
    ];
    for (const key of required) {
      if (!String(form[key]).trim()) return toast.error(`${key} is required`);
    }
    if (isNaN(form.latitude) || isNaN(form.longitude))
      return toast.error("Latitude and longitude must be valid numbers");

    setSaving(true);
    try {
      const locRes = await api.post("/icart/location", {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        lga: form.lga.trim(),
        country: form.country.trim(),
        stateId: form.stateId.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        locationIdType: form.locationIdType,
        notes: form.notes.trim() || undefined,
      });

      const locationId = locRes.data.data?.id;
      if (!locationId) throw new Error("No location ID returned");

      await api.post(`/icart/${cartId}/change-location`, { locationId });

      toast.success("Location created and assigned");
      onSaved(locRes.data.data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to save location",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="icart_location_form">
      <div className="icart_location_form_grid">
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Location Name *</label>
          <input
            className="modal-input"
            placeholder="e.g. Wuse Market Stand"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Address *</label>
          <input
            className="modal-input"
            placeholder="Street address"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">City *</label>
          <input
            className="modal-input"
            placeholder="e.g. Abuja"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">LGA *</label>
          <input
            className="modal-input"
            placeholder="e.g. Wuse"
            value={form.lga}
            onChange={(e) => set("lga", e.target.value)}
          />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">State *</label>
          <select
            className="modal-input"
            value={form.stateId}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={statesLoading}
          >
            <option value="">
              {statesLoading ? "Loading states…" : "Select a state"}
            </option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code}) — {s.country}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Latitude *</label>
          <input
            className="modal-input"
            type="number"
            placeholder="e.g. 9.0765"
            value={form.latitude}
            onChange={(e) => set("latitude", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Longitude *</label>
          <input
            className="modal-input"
            type="number"
            placeholder="e.g. 7.3986"
            value={form.longitude}
            onChange={(e) => set("longitude", e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Location Type *</label>
          <select
            className="modal-input"
            value={form.locationIdType}
            onChange={(e) => set("locationIdType", e.target.value)}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Notes</label>
          <input
            className="modal-input"
            placeholder="Optional"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
          style={{ flex: 1, height: 40 }}
          onClick={handleSubmit}
          disabled={saving || statesLoading}
        >
          <span className="btn_text">Create & Assign</span>
          {saving && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
        <button
          className="app_btn app_btn_cancel"
          style={{ flex: 1, height: 40 }}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function IcartOverview({ cart, onUpdate, onRefresh }) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [editingRadius, setEditingRadius] = useState(false);
  const [radius, setRadius] = useState(cart.serviceRadius || "");
  const [savingRadius, setSavingRadius] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [concepts, setConcepts] = useState([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [markup, setMarkup] = useState("");
  const [addingConcept, setAddingConcept] = useState(false);

  const openConceptForm = async () => {
    setShowConceptForm(true);
    if (concepts.length > 0) return;
    setConceptsLoading(true);
    try {
      const res = await api.get("/vendor/concept");
      setConcepts(res.data.data || []);
    } catch {
      toast.error("Failed to load concepts");
    } finally {
      setConceptsLoading(false);
    }
  };

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
    if (!selectedConceptId) return toast.error("Select a concept");
    if (!markup || isNaN(markup)) return toast.error("Enter a valid markup");
    setAddingConcept(true);
    try {
      await api.post(`/icart/${cart.id}/concepts/add`, {
        id: selectedConceptId,
        markup: Number(markup),
      });
      toast.success("Concept added");
      setShowConceptForm(false);
      setSelectedConceptId("");
      setMarkup("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add concept");
    } finally {
      setAddingConcept(false);
    }
  };

  const handleLocationSaved = (newLocation) => {
    setShowLocationForm(false);
    onUpdate({ ...cart, location: newLocation });
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
      {/* Cart Controls */}
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
        <span>Location</span>
        <button
          className="icart_icon_action_btn"
          style={{ marginLeft: "auto" }}
          title={cart.location ? "Change location" : "Add location"}
          onClick={() => setShowLocationForm((v) => !v)}
        >
          {cart.location ? <MdEdit size={14} /> : <MdAdd size={15} />}
        </button>
      </div>

      {showLocationForm ? (
        <LocationForm
          cartId={cart.id}
          onSaved={handleLocationSaved}
          onCancel={() => setShowLocationForm(false)}
        />
      ) : cart.location ? (
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
            {(cart.location.lga || cart.location.city) && (
              <div className="icart_location_address">
                {[cart.location.lga, cart.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {cart.location.country && (
              <div className="icart_location_address">
                {cart.location.country}
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
          onClick={() =>
            showConceptForm ? setShowConceptForm(false) : openConceptForm()
          }
        >
          <MdAdd size={15} />
        </button>
      </div>

      {showConceptForm && (
        <div className="icart_concept_form">
          <div className="form-field">
            <label className="modal-label">Concept *</label>
            <select
              className="modal-input"
              value={selectedConceptId}
              onChange={(e) => setSelectedConceptId(e.target.value)}
              disabled={conceptsLoading}
            >
              <option value="">
                {conceptsLoading ? "Loading concepts…" : "Select a concept"}
              </option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              disabled={addingConcept || conceptsLoading}
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
                setSelectedConceptId("");
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
