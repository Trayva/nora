import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdEdit,
  MdDelete,
  MdClose,
  MdLocationOn,
  MdStorefront,
} from "react-icons/md";
import { LuPlus, LuTrash2, LuStore, LuCloud } from "react-icons/lu";
import api from "../../api/axios";

const EMPTY_BILL = {
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
  intervalInDays: 30,
};

const BLANK_LOCATION_FORM = {
  name: "",
  outletType: "CLOUD_KITCHEN",
  stateId: "",
  address: "",
  city: "",
  lga: "",
  country: "Nigeria",
  locationIdType: "ACTIVE",
  latitude: "",
  longitude: "",
  notes: "",
  bills: [],
};

export default function AdminLocationsManagement({ states = [] }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedStateFilter, setSelectedStateFilter] = useState("");
  const [selectedOutletFilter, setSelectedOutletFilter] = useState("");

  // Create / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState(BLANK_LOCATION_FORM);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/kiosk/location", {
        params: { limit: 100 },
      });
      const list = res.data.data?.items || (Array.isArray(res.data.data) ? res.data.data : []);
      setLocations(list);
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateForm = () => {
    setEditingLocation(null);
    setForm({
      ...BLANK_LOCATION_FORM,
      stateId: states[0]?.id || "",
      country: states[0]?.country || "Nigeria",
      bills: [{ ...EMPTY_BILL }],
    });
    setIsFormOpen(true);
  };

  const openEditForm = (loc) => {
    setEditingLocation(loc);
    let parsedBills = [];
    if (loc.bills) {
      if (typeof loc.bills === "string") {
        try {
          parsedBills = JSON.parse(loc.bills);
        } catch {
          parsedBills = [];
        }
      } else if (Array.isArray(loc.bills)) {
        parsedBills = loc.bills;
      }
    }
    setForm({
      name: loc.name || "",
      outletType: loc.outletType || "CLOUD_KITCHEN",
      stateId: loc.stateId || "",
      address: loc.address || "",
      city: loc.city || "",
      lga: loc.lga || "",
      country: loc.country || "Nigeria",
      locationIdType: loc.locationIdType || "ACTIVE",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      notes: loc.notes || "",
      bills: parsedBills.length > 0 ? parsedBills : [{ ...EMPTY_BILL }],
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
    setForm(BLANK_LOCATION_FORM);
  };

  // Bill Helpers
  const addBill = () => {
    setForm((prev) => ({
      ...prev,
      bills: [...prev.bills, { ...EMPTY_BILL }],
    }));
  };

  const removeBill = (index) => {
    setForm((prev) => ({
      ...prev,
      bills: prev.bills.filter((_, i) => i !== index),
    }));
  };

  const updateBill = (index, field, value) => {
    setForm((prev) => {
      const nextBills = [...prev.bills];
      nextBills[index] = { ...nextBills[index], [field]: value };
      return { ...prev, bills: nextBills };
    });
  };

  // Submit Handler
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Location name is required");
    if (!form.stateId) return toast.error("State is required");
    if (!form.address.trim()) return toast.error("Address is required");
    if (!form.city.trim()) return toast.error("City is required");
    if (!form.lga.trim()) return toast.error("LGA is required");

    // Filter valid bills
    const cleanedBills = (form.bills || [])
      .filter((b) => b.title && b.title.trim())
      .map((b) => ({
        title: b.title.trim(),
        description: b.description?.trim() || "",
        amount: Number(b.amount) || 0,
        refundable: Boolean(b.refundable),
        recurring: Boolean(b.recurring),
        intervalInDays: b.intervalInDays ? Number(b.intervalInDays) : 30,
      }));

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        outletType: form.outletType,
        stateId: form.stateId,
        address: form.address.trim(),
        city: form.city.trim(),
        lga: form.lga.trim(),
        country: form.country.trim() || "Nigeria",
        locationIdType: form.locationIdType,
        latitude: form.latitude !== "" ? Number(form.latitude) : 0,
        longitude: form.longitude !== "" ? Number(form.longitude) : 0,
        notes: form.notes?.trim() || undefined,
        bills: cleanedBills,
      };

      if (editingLocation) {
        await api.patch(`/kiosk/location/${editingLocation.id}`, payload);
        toast.success("Location updated successfully");
      } else {
        await api.post("/kiosk/location", payload);
        toast.success("Location created successfully");
      }

      closeForm();
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/kiosk/location/${id}`);
      toast.success("Location deleted");
      setConfirmDelete(null);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete location");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredLocations = locations.filter((loc) => {
    if (selectedStateFilter && loc.stateId !== selectedStateFilter) return false;
    if (selectedOutletFilter && loc.outletType !== selectedOutletFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = loc.name?.toLowerCase().includes(q);
      const matchAddress = loc.address?.toLowerCase().includes(q);
      const matchCity = loc.city?.toLowerCase().includes(q);
      return matchName || matchAddress || matchCity;
    }
    return true;
  });

  return (
    <div>
      {/* Top Controls: Search, Filters, Add Button */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          className="modal-input"
          placeholder="Search locations by name, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ height: 36, flex: "1 1 180px", marginBottom: 0 }}
        />

        <select
          className="modal-input"
          value={selectedStateFilter}
          onChange={(e) => setSelectedStateFilter(e.target.value)}
          style={{ height: 36, width: 140, flexShrink: 0, marginBottom: 0 }}
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="modal-input"
          value={selectedOutletFilter}
          onChange={(e) => setSelectedOutletFilter(e.target.value)}
          style={{ height: 36, width: 150, flexShrink: 0, marginBottom: 0 }}
        >
          <option value="">All Outlets</option>
          <option value="CLOUD_KITCHEN">Cloud Kitchens</option>
          <option value="KIOSK">Physical Kiosks</option>
        </select>

        {!isFormOpen && (
          <button
            type="button"
            className="app_btn app_btn_confirm"
            style={{ height: 36, fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}
            onClick={openCreateForm}
          >
            <LuPlus size={15} />
            <span>Add Location</span>
          </button>
        )}
      </div>

      {/* Location Create / Edit Form Card */}
      {isFormOpen && (
        <div className="admin_form_card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MdLocationOn size={18} color="var(--accent)" />
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>
                {editingLocation ? `Edit Location: ${editingLocation.name}` : "New Location / Hub"}
              </span>
            </div>
            <button className="biz_icon_btn" onClick={closeForm}>
              <MdClose size={14} />
            </button>
          </div>

          <form onSubmit={handleSave}>
            <div className="admin_form_grid" style={{ marginBottom: 10 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Location Name *</label>
                <input
                  className="modal-input"
                  placeholder="e.g. Central Cloud Kitchen Hub"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Outlet Type *</label>
                <select
                  className="modal-input"
                  value={form.outletType}
                  onChange={(e) => setForm((p) => ({ ...p, outletType: e.target.value }))}
                >
                  <option value="CLOUD_KITCHEN">Cloud Kitchen (Ghost / Shared)</option>
                  <option value="KIOSK">Physical Kiosk / Stand</option>
                  <option value="CLOUD_STORAGE">Cloud Storage / Prep Facility</option>
                </select>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">State / Region *</label>
                <select
                  className="modal-input"
                  value={form.stateId}
                  onChange={(e) => {
                    const st = states.find((s) => s.id === e.target.value);
                    setForm((p) => ({
                      ...p,
                      stateId: e.target.value,
                      country: st?.country || p.country,
                    }));
                  }}
                >
                  <option value="">— Select State —</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || s.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">City *</label>
                <input
                  className="modal-input"
                  placeholder="e.g. Abuja"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                />
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">LGA / District *</label>
                <input
                  className="modal-input"
                  placeholder="e.g. Wuse 2"
                  value={form.lga}
                  onChange={(e) => setForm((p) => ({ ...p, lga: e.target.value }))}
                />
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Status</label>
                <select
                  className="modal-input"
                  value={form.locationIdType}
                  onChange={(e) => setForm((p) => ({ ...p, locationIdType: e.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="POTENTIAL">POTENTIAL</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                </select>
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: 10 }}>
              <label className="modal-label">Street Address *</label>
              <input
                className="modal-input"
                placeholder="e.g. Plot 102 Aminu Kano Crescent"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            <div className="admin_form_grid" style={{ marginBottom: 12 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Latitude</label>
                <input
                  className="modal-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 9.0765"
                  value={form.latitude}
                  onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Longitude</label>
                <input
                  className="modal-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 7.3986"
                  value={form.longitude}
                  onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Notes / Landmarks</label>
                <input
                  className="modal-input"
                  placeholder="Near Banex Plaza"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
            </div>

            {/* ── LOCATION BILLS / PAYMENT SCHEDULE ── */}
            <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                    Location Bills &amp; Facility Payments
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Bills associated with this location (e.g. monthly rent, utilities, facility security fee) automatically added to franchise invoices.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addBill}
                  className="biz_icon_btn"
                  style={{ width: "auto", height: 28, padding: "0 10px", fontSize: "0.72rem", gap: 4 }}
                >
                  <LuPlus size={13} />
                  <span>Add Bill</span>
                </button>
              </div>

              {form.bills.length === 0 ? (
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic", padding: "6px 0" }}>
                  No bills configured for this location yet. Click "Add Bill" to add facility rent or utility fees.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {form.bills.map((b, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--accent)" }}>
                          Bill #{idx + 1}
                        </span>
                        <button
                          type="button"
                          className="biz_icon_btn biz_icon_btn_danger"
                          style={{ width: 22, height: 22 }}
                          onClick={() => removeBill(idx)}
                        >
                          <LuTrash2 size={11} />
                        </button>
                      </div>

                      <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="modal-label">Bill Title *</label>
                          <input
                            className="modal-input"
                            placeholder="e.g. Monthly Space Rent"
                            value={b.title}
                            onChange={(e) => updateBill(idx, "title", e.target.value)}
                          />
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="modal-label">Amount *</label>
                          <input
                            className="modal-input"
                            type="number"
                            min="0"
                            placeholder="e.g. 150000"
                            value={b.amount}
                            onChange={(e) => updateBill(idx, "amount", e.target.value)}
                          />
                        </div>
                        <div className="form-field" style={{ marginBottom: 0 }}>
                          <label className="modal-label">Description</label>
                          <input
                            className="modal-input"
                            placeholder="Includes power & security"
                            value={b.description}
                            onChange={(e) => updateBill(idx, "description", e.target.value)}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => updateBill(idx, "refundable", !b.refundable)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 8,
                            border: `1px solid ${b.refundable ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
                            background: b.refundable ? "rgba(34,197,94,0.08)" : "var(--bg-hover)",
                            color: b.refundable ? "#16a34a" : "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: b.refundable ? "#16a34a" : "var(--border)",
                            }}
                          />
                          Refundable
                        </button>

                        <button
                          type="button"
                          onClick={() => updateBill(idx, "recurring", !b.recurring)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 8,
                            border: `1px solid ${b.recurring ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
                            background: b.recurring ? "rgba(34,197,94,0.08)" : "var(--bg-hover)",
                            color: b.recurring ? "#16a34a" : "var(--text-muted)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: b.recurring ? "#16a34a" : "var(--border)",
                            }}
                          />
                          Recurring
                        </button>

                        {b.recurring && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Every</span>
                            <input
                              className="modal-input"
                              type="number"
                              min="1"
                              value={b.intervalInDays || 30}
                              onChange={(e) => updateBill(idx, "intervalInDays", e.target.value)}
                              style={{ width: 60, height: 28, marginBottom: 0, padding: "0 6px", fontSize: "0.72rem" }}
                            />
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="app_btn app_btn_cancel" style={{ height: 34 }} onClick={closeForm}>
                Cancel
              </button>
              <button
                type="submit"
                className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                style={{ height: 34, minWidth: 90 }}
                disabled={saving}
              >
                <span className="btn_text">{editingLocation ? "Save Changes" : "Create Location"}</span>
                {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Locations List */}
      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div className="page_loader_spinner" style={{ margin: "0 auto" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8, display: "block" }}>
            Loading locations...
          </span>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="admin_empty">
          <MdLocationOn size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: "0.82rem" }}>No locations found matching filter.</p>
        </div>
      ) : (
        <div className="admin_drawer_list">
          {filteredLocations.map((loc) => {
            const bills = Array.isArray(loc.bills)
              ? loc.bills
              : typeof loc.bills === "string"
                ? (() => { try { return JSON.parse(loc.bills); } catch { return []; } })()
                : [];
            const totalBills = bills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            const isCloud = loc.outletType === "CLOUD_KITCHEN";

            return (
              <div
                key={loc.id}
                className="admin_drawer_row"
                style={{
                  alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: isCloud ? "rgba(99,102,241,0.12)" : "rgba(34,197,94,0.12)",
                    border: `1px solid ${isCloud ? "rgba(99,102,241,0.25)" : "rgba(34,197,94,0.25)"}`,
                    color: isCloud ? "#6366f1" : "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {isCloud ? <LuCloud size={18} /> : <LuStore size={18} />}
                </div>

                <div className="admin_drawer_info" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>
                      {loc.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: isCloud ? "rgba(99,102,241,0.1)" : "rgba(34,197,94,0.1)",
                        color: isCloud ? "#6366f1" : "#16a34a",
                        border: `1px solid ${isCloud ? "rgba(99,102,241,0.25)" : "rgba(34,197,94,0.25)"}`,
                      }}
                    >
                      {isCloud ? "Cloud Kitchen" : "Physical Kiosk"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "var(--bg-hover)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {loc.locationIdType}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: 4 }}>
                    {loc.address}, {loc.city}, {loc.lga} • {loc.state?.name || "State"} ({loc.country})
                  </div>

                  {/* Location Bills Chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: totalBills > 0 ? "var(--accent)" : "var(--text-muted)",
                        background: "var(--bg-hover)",
                        padding: "2px 7px",
                        borderRadius: 5,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {bills.length} Bill{bills.length !== 1 ? "s" : ""}
                      {totalBills > 0 && ` (${loc.state.currency} ${totalBills.toLocaleString()})`}
                    </span>

                    {bills.slice(0, 3).map((b, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.68rem",
                          color: "var(--text-body)",
                          background: "var(--bg-card)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {b.title}: {loc.state.currency} {Number(b.amount || 0).toLocaleString()}
                        {b.recurring ? " (rec)" : ""}
                      </span>
                    ))}
                    {bills.length > 3 && (
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                        +{bills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    type="button"
                    className="biz_icon_btn"
                    title="Edit Location"
                    onClick={() => openEditForm(loc)}
                  >
                    <MdEdit size={14} />
                  </button>
                  <button
                    type="button"
                    className="biz_icon_btn biz_icon_btn_danger"
                    title="Delete Location"
                    onClick={() => setConfirmDelete(loc)}
                    disabled={deletingId === loc.id}
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              maxWidth: 420,
              width: "100%",
            }}
          >
            <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 8px" }}>
              Delete Location?
            </h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 20px" }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="app_btn app_btn_cancel"
                style={{ height: 34 }}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app_btn app_btn_confirm"
                style={{ height: 34, background: "#ef4444", borderColor: "#ef4444" }}
                disabled={deletingId === confirmDelete.id}
                onClick={() => handleDelete(confirmDelete.id)}
              >
                {deletingId === confirmDelete.id ? "Deleting..." : "Delete Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
