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
  MdPerson,
  MdVerified,
  MdExpandMore,
  MdExpandLess,
  MdImage,
} from "react-icons/md";
import api from "../../api/axios";

const LOCATION_TYPES = ["ACTIVE", "POTENTIAL", "INACTIVE", "RESTRICTED"];

const BLANK_LOCATION = {
  name: "",
  address: "",
  city: "",
  lga: "",
  country: "",
  stateName: "",
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
      _selectedStateId: stateId,
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
      "latitude",
      "longitude",
      "locationIdType",
    ];
    for (const key of required) {
      if (!String(form[key]).trim()) return toast.error(`${key} is required`);
    }
    if (isNaN(form.latitude) || isNaN(form.longitude))
      return toast.error("Latitude and longitude must be valid numbers");
    if (!form._selectedStateId) return toast.error("Please select a state");

    setSaving(true);
    try {
      const locRes = await api.post("/icart/location", {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        lga: form.lga.trim(),
        country: form.country.trim(),
        stateId: form._selectedStateId,
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
            value={form._selectedStateId || ""}
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

/* ── Concept Card ───────────────────────────────────────────── */
function ConceptCard({ concept, onConceptClick }) {
  const [expanded, setExpanded] = useState(false);
  const menuItems = concept.menuItems || [];

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          cursor: menuItems.length > 0 ? "pointer" : "default",
        }}
        onClick={() => menuItems.length > 0 && setExpanded((v) => !v)}
      >
        <div className="icart_concept_icon">
          <MdStorefront size={14} />
        </div>
        <div className="icart_concept_info" style={{ flex: 1, minWidth: 0 }}>
          <div className="icart_concept_name">{concept.name || `Concept`}</div>
          <div className="icart_task_meta">
            {concept.status && <span>{concept.status}</span>}
            {menuItems.length > 0 && (
              <>
                <span className="contract_row_dot">·</span>
                <span>
                  {menuItems.length} item{menuItems.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
            {concept.markup != null && (
              <>
                <span className="contract_row_dot">·</span>
                <span>{concept.markup}% markup</span>
              </>
            )}
          </div>
        </div>
        {menuItems.length > 0 &&
          (expanded ? (
            <MdExpandLess
              size={16}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          ) : (
            <MdExpandMore
              size={16}
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          ))}
        {onConceptClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConceptClick(concept);
            }}
            style={{
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.25)",
              borderRadius: 7,
              color: "var(--accent)",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "3px 9px",
              cursor: "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Overview
          </button>
        )}
      </div>

      {/* Menu items */}
      {expanded && menuItems.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {menuItems.map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderBottom:
                  idx < menuItems.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                background: "var(--bg-hover)",
              }}
            >
              {/* Image */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdImage size={15} style={{ color: "var(--text-muted)" }} />
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {item.name}
                </div>
                {item.description && (
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.description}
                  </div>
                )}
              </div>

              {/* Price + ticket time */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {item.sellingPrice != null && (
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: "var(--text-heading)",
                    }}
                  >
                    ₦{Number(item.sellingPrice).toLocaleString()}
                  </div>
                )}
                {item.ticketTime > 0 && (
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    {item.ticketTime} min
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function IcartOverview({
  cart,
  onUpdate,
  onRefresh,
  onConceptClick,
}) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [editingRadius, setEditingRadius] = useState(false);
  const [radius, setRadius] = useState(cart.serviceRadius || "");
  const [savingRadius, setSavingRadius] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [conceptSource, setConceptSource] = useState("mine"); // "mine" | "public"
  const [myConcepts, setMyConcepts] = useState([]);
  const [publicConcepts, setPublicConcepts] = useState([]);
  const [publicSearch, setPublicSearch] = useState("");
  const [publicPage, setPublicPage] = useState(1);
  const [publicTotal, setPublicTotal] = useState(0);
  const PUBLIC_LIMIT = 10;
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [markup, setMarkup] = useState("");
  const [addingConcept, setAddingConcept] = useState(false);

  const openConceptForm = async () => {
    setShowConceptForm(true);
    setConceptSource("mine");
    setSelectedConceptId("");
    if (myConcepts.length > 0) return;
    setConceptsLoading(true);
    try {
      const res = await api.get("/vendor/concept");
      const d = res.data.data;
      setMyConcepts(Array.isArray(d) ? d : d?.concepts || d?.items || []);
    } catch {
      toast.error("Failed to load concepts");
    } finally {
      setConceptsLoading(false);
    }
  };

  const fetchPublicConcepts = async (
    search = publicSearch,
    page = publicPage,
  ) => {
    setConceptsLoading(true);
    try {
      const params = { page, limit: PUBLIC_LIMIT };
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/vendor/concept/public-rental", { params });
      const d = res.data.data;
      const list = Array.isArray(d) ? d : d?.items || d?.concepts || [];
      setPublicConcepts(list);
      setPublicTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load public concepts");
    } finally {
      setConceptsLoading(false);
    }
  };

  const switchToPublic = () => {
    setConceptSource("public");
    setSelectedConceptId("");
    setPublicSearch("");
    setPublicPage(1);
    fetchPublicConcepts("", 1);
  };

  const switchToMine = () => {
    setConceptSource("mine");
    setSelectedConceptId("");
    setPublicSearch("");
    setPublicPage(1);
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
          {/* Source toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button
              onClick={switchToMine}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${conceptSource === "mine" ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                background:
                  conceptSource === "mine"
                    ? "var(--bg-active)"
                    : "var(--bg-hover)",
                color:
                  conceptSource === "mine"
                    ? "var(--accent)"
                    : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              My Concepts
            </button>
            <button
              onClick={switchToPublic}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${conceptSource === "public" ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                background:
                  conceptSource === "public"
                    ? "var(--bg-active)"
                    : "var(--bg-hover)",
                color:
                  conceptSource === "public"
                    ? "var(--accent)"
                    : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Public Concepts
            </button>
          </div>

          {/* List */}
          {conceptsLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 0",
              }}
            >
              <div
                className="page_loader_spinner"
                style={{ width: 20, height: 20 }}
              />
            </div>
          ) : (conceptSource === "mine" ? myConcepts : publicConcepts)
              .length === 0 ? (
            <div className="icart_empty_inline">
              <MdStorefront size={18} style={{ opacity: 0.3 }} />
              <span>
                {conceptSource === "mine"
                  ? "No concepts on your account"
                  : "No public concepts available"}
              </span>
            </div>
          ) : (
            <>
              {/* Search — only for public */}
              {conceptSource === "public" && (
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input
                    className="modal-input"
                    style={{ marginBottom: 0, paddingRight: 32 }}
                    placeholder="Search public concepts…"
                    value={publicSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPublicSearch(v);
                      setPublicPage(1);
                      setSelectedConceptId("");
                      fetchPublicConcepts(v, 1);
                    }}
                  />
                  {conceptsLoading && (
                    <div
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <div
                        className="page_loader_spinner"
                        style={{ width: 14, height: 14 }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="form-field">
                <label className="modal-label">
                  {conceptSource === "mine" ? "My Concept" : "Public Concept"} *
                </label>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 240,
                    overflowY: "auto",
                    paddingRight: 2,
                  }}
                >
                  {(conceptSource === "mine" ? myConcepts : publicConcepts).map(
                    (c) => {
                      const isSelected = selectedConceptId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedConceptId(c.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            background: isSelected
                              ? "var(--bg-active)"
                              : "var(--bg-hover)",
                            border: `1px solid ${isSelected ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                            borderRadius: 10,
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                        >
                          {c.banner ? (
                            <img
                              src={c.banner}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <MdStorefront
                                size={16}
                                style={{ color: "var(--text-muted)" }}
                              />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: isSelected
                                  ? "var(--accent)"
                                  : "var(--text-body)",
                                marginBottom: 2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                              }}
                            >
                              {c.vendor?.businessName && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 999,
                                    background: "rgba(203,108,220,0.1)",
                                    color: "var(--accent)",
                                    border: "1px solid rgba(203,108,220,0.2)",
                                  }}
                                >
                                  {c.vendor.businessName}
                                </span>
                              )}
                              {c.menuItems?.length > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {c.menuItems.length} item
                                  {c.menuItems.length !== 1 ? "s" : ""}
                                </span>
                              )}
                              {c.status && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    color: "#16a34a",
                                    fontWeight: 600,
                                  }}
                                >
                                  {c.status}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div
                              style={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                background: "var(--accent)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <MdVerified size={12} style={{ color: "#fff" }} />
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Pagination — public only */}
              {conceptSource === "public" && publicTotal > PUBLIC_LIMIT && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <button
                    className="biz_icon_btn"
                    onClick={() => {
                      const p = publicPage - 1;
                      setPublicPage(p);
                      setSelectedConceptId("");
                      fetchPublicConcepts(publicSearch, p);
                    }}
                    disabled={publicPage <= 1 || conceptsLoading}
                    style={{ width: 28, height: 28 }}
                  >
                    ‹
                  </button>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {publicPage} / {Math.ceil(publicTotal / PUBLIC_LIMIT)}
                  </span>
                  <button
                    className="biz_icon_btn"
                    onClick={() => {
                      const p = publicPage + 1;
                      setPublicPage(p);
                      setSelectedConceptId("");
                      fetchPublicConcepts(publicSearch, p);
                    }}
                    disabled={
                      publicPage >= Math.ceil(publicTotal / PUBLIC_LIMIT) ||
                      conceptsLoading
                    }
                    style={{ width: 28, height: 28 }}
                  >
                    ›
                  </button>
                </div>
              )}

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
                  disabled={addingConcept || !selectedConceptId}
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
                    setConceptSource("mine");
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cart.concepts?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.concepts.map((c, i) => (
            <ConceptCard
              key={c.id || i}
              concept={c}
              onConceptClick={onConceptClick}
            />
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

      {/* ── Operators ── */}
      <div className="drawer_section_title" style={{ marginTop: 24 }}>
        Operators
        <span className="icart_section_count" style={{ marginLeft: 8 }}>
          {cart.operators?.length || 0}
        </span>
      </div>

      {cart.operators?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.operators.map((op) => {
            const name =
              op.user?.fullName ||
              op.user?.email ||
              `Operator #${op.id.slice(0, 6).toUpperCase()}`;
            const initial = name[0].toUpperCase();
            return (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                {/* Avatar */}
                <div
                  className="icart_operator_avatar"
                  style={{ flexShrink: 0 }}
                >
                  {initial}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span className="icart_operator_name">{name}</span>
                    {op.isApproved && (
                      <MdVerified
                        size={14}
                        style={{ color: "#16a34a", flexShrink: 0 }}
                      />
                    )}
                  </div>
                  <div className="icart_operator_meta">
                    {op.user?.email && <span>{op.user.email}</span>}
                    {op.state?.name && (
                      <span style={{ marginLeft: op.user?.email ? 6 : 0 }}>
                        {op.user?.email ? "· " : ""}
                        {op.state.name}
                      </span>
                    )}
                    {op.certification && (
                      <span style={{ marginLeft: 6 }}>
                        · {op.certification}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status chip */}
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    flexShrink: 0,
                    ...(op.isApproved
                      ? {
                          background: "rgba(34,197,94,0.1)",
                          color: "#16a34a",
                          border: "1px solid rgba(34,197,94,0.25)",
                        }
                      : {
                          background: "rgba(234,179,8,0.1)",
                          color: "#ca8a04",
                          border: "1px solid rgba(234,179,8,0.25)",
                        }),
                  }}
                >
                  {op.isApproved ? "Active" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="icart_empty_inline">
          <MdPerson size={18} style={{ opacity: 0.3 }} />
          <span>No operators assigned</span>
        </div>
      )}
    </div>
  );
}
