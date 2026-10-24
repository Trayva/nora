import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdEdit,
  MdDelete,
  MdClose,
  MdLocationOn,
  MdStorefront,
  MdImage,
  MdZoomIn,
  MdCloudUpload,
} from "react-icons/md";
import { LuPlus, LuTrash2, LuStore, LuCloud, LuImage } from "react-icons/lu";
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
  images: [], // existing uploaded URLs
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
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Lightbox Preview Modal
  const [previewModalImage, setPreviewModalImage] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/kiosk/location", {
        params: { limit: 100 },
      });
      const d = res.data?.data;
      const list = Array.isArray(d) ? d : d?.locations || d?.items || [];
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

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      newImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newImagePreviews]);

  const openCreateForm = () => {
    setEditingLocation(null);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setForm({
      ...BLANK_LOCATION_FORM,
      stateId: states[0]?.id || "",
      country: states[0]?.country || "Nigeria",
      bills: [{ ...EMPTY_BILL }],
      images: [],
    });
    setIsFormOpen(true);
  };

  const openEditForm = (loc) => {
    setEditingLocation(loc);
    setNewImageFiles([]);
    setNewImagePreviews([]);

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

    let parsedImages = [];
    if (loc.images) {
      if (Array.isArray(loc.images)) {
        parsedImages = loc.images;
      } else if (typeof loc.images === "string") {
        try {
          const p = JSON.parse(loc.images);
          parsedImages = Array.isArray(p) ? p : [loc.images];
        } catch {
          parsedImages = loc.images.split(",").map((s) => s.trim()).filter(Boolean);
        }
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
      latitude: loc.latitude != null ? Number(loc.latitude) : 0,
      longitude: loc.longitude != null ? Number(loc.longitude) : 0,
      notes: loc.notes || "",
      bills: parsedBills.length > 0 ? parsedBills : [{ ...EMPTY_BILL }],
      images: parsedImages,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setForm(BLANK_LOCATION_FORM);
  };

  // Image Selection Handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingImage = (imgUrl) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((url) => url !== imgUrl),
    }));
  };

  const removeNewFile = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
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
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("outletType", form.outletType);
      fd.append("stateId", form.stateId);
      fd.append("address", form.address.trim());
      fd.append("city", form.city.trim());
      fd.append("lga", form.lga.trim());
      fd.append("country", form.country.trim() || "Nigeria");
      fd.append("locationIdType", form.locationIdType);
      fd.append("latitude", form.latitude !== "" ? Number(form.latitude) : 0);
      fd.append("longitude", form.longitude !== "" ? Number(form.longitude) : 0);
      if (form.notes) fd.append("notes", form.notes.trim());

      fd.append("bills", JSON.stringify(cleanedBills));
      fd.append("images", JSON.stringify(form.images || []));

      // Append new image files
      newImageFiles.forEach((file) => {
        fd.append("images", file);
      });

      if (editingLocation) {
        await api.patch(`/kiosk/location/${editingLocation.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Location updated successfully");
      } else {
        await api.post("/kiosk/location", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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
          <option value="STORE_FRONT">Store Fronts</option>
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
                  <option value="STORE_FRONT">Store Front (Retail / Dine-in / Walk-up)</option>
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

            <div className="admin_form_grid" style={{ marginBottom: 14 }}>
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

            {/* ── LOCATION IMAGES UPLOAD & MANAGEMENT ── */}
            <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                    Location Images &amp; Facility Photos
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Upload photographs of the kitchen workstations, prep bays, and exterior to showcase to prospective franchisees.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="biz_icon_btn"
                  style={{ width: "auto", height: 28, padding: "0 10px", fontSize: "0.72rem", gap: 5 }}
                >
                  <MdCloudUpload size={16} />
                  <span>Upload Images</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />

              {/* Existing Images Gallery */}
              {form.images && form.images.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Current Photos ({form.images.length})
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {form.images.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          position: "relative",
                          overflow: "hidden",
                          border: "1px solid var(--border)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        <img
                          src={url}
                          alt={`Location ${idx + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                          onClick={() => setPreviewModalImage(url)}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          title="Remove image"
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MdClose size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newly Selected Images (Ready to Upload) */}
              {newImagePreviews.length > 0 && (
                <div>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    New Photos to Upload ({newImagePreviews.length})
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {newImagePreviews.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          position: "relative",
                          overflow: "hidden",
                          border: "2px dashed var(--accent)",
                        }}
                      >
                        <img
                          src={url}
                          alt="New upload"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile(idx)}
                          title="Cancel upload"
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(239,68,68,0.85)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MdClose size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!form.images || form.images.length === 0) && newImagePreviews.length === 0 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    border: "1.5px dashed var(--border)",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: "var(--bg-card)",
                  }}
                >
                  <LuImage size={24} style={{ color: "var(--text-muted)", marginBottom: 4 }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                    No photos added yet. Click to select location photographs.
                  </span>
                </div>
              )}
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
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ flex: "1 1 180px" }}>
                          <input
                            className="modal-input"
                            placeholder="Bill Title (e.g. Facility Rent)"
                            value={b.title}
                            onChange={(e) => updateBill(idx, "title", e.target.value)}
                            style={{ marginBottom: 0, height: 32, fontSize: "0.78rem" }}
                          />
                        </div>
                        <div style={{ width: 130 }}>
                          <input
                            className="modal-input"
                            type="number"
                            min="0"
                            placeholder="Amount (NGN)"
                            value={b.amount}
                            onChange={(e) => updateBill(idx, "amount", e.target.value)}
                            style={{ marginBottom: 0, height: 32, fontSize: "0.78rem" }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBill(idx)}
                          className="biz_icon_btn"
                          title="Remove bill"
                          style={{ height: 32, width: 32, color: "#ef4444" }}
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <input
                          className="modal-input"
                          placeholder="Optional bill description..."
                          value={b.description || ""}
                          onChange={(e) => updateBill(idx, "description", e.target.value)}
                          style={{ marginBottom: 0, height: 28, fontSize: "0.72rem" }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
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
            const isStoreFront = loc.outletType === "STORE_FRONT";

            const locImages = Array.isArray(loc.images)
              ? loc.images
              : typeof loc.images === "string"
                ? (() => { try { return JSON.parse(loc.images); } catch { return []; } })()
                : [];

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
                {/* Thumbnail Icon or First Image */}
                {locImages.length > 0 ? (
                  <div
                    onClick={() => setPreviewModalImage(locImages[0])}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      overflow: "hidden",
                      flexShrink: 0,
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      position: "relative",
                      marginTop: 2,
                    }}
                    title="Click to view image"
                  >
                    <img
                      src={locImages[0]}
                      alt={loc.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {locImages.length > 1 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          padding: "1px 3px",
                          borderTopLeftRadius: 4,
                        }}
                      >
                        +{locImages.length - 1}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: isCloud
                        ? "rgba(99,102,241,0.12)"
                        : isStoreFront
                          ? "rgba(245,158,11,0.12)"
                          : "rgba(34,197,94,0.12)",
                      border: `1px solid ${
                        isCloud
                          ? "rgba(99,102,241,0.25)"
                          : isStoreFront
                            ? "rgba(245,158,11,0.3)"
                            : "rgba(34,197,94,0.25)"
                      }`,
                      color: isCloud ? "#6366f1" : isStoreFront ? "#d97706" : "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {isCloud ? (
                      <LuCloud size={18} />
                    ) : isStoreFront ? (
                      <MdStorefront size={18} />
                    ) : (
                      <LuStore size={18} />
                    )}
                  </div>
                )}

                <div className="admin_drawer_info" style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
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
                        background: isCloud
                          ? "rgba(99,102,241,0.1)"
                          : isStoreFront
                            ? "rgba(245,158,11,0.12)"
                            : "rgba(34,197,94,0.1)",
                        color: isCloud ? "#6366f1" : isStoreFront ? "#d97706" : "#16a34a",
                        border: `1px solid ${
                          isCloud
                            ? "rgba(99,102,241,0.25)"
                            : isStoreFront
                              ? "rgba(245,158,11,0.3)"
                              : "rgba(34,197,94,0.25)"
                        }`,
                      }}
                    >
                      {isCloud ? "Cloud Kitchen" : isStoreFront ? "Store Front" : "Physical Kiosk"}
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
                    {locImages.length > 0 && (
                      <span
                        onClick={() => setPreviewModalImage(locImages[0])}
                        style={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "rgba(59,130,246,0.1)",
                          color: "#3b82f6",
                          border: "1px solid rgba(59,130,246,0.25)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <MdImage size={11} /> {locImages.length} photo{locImages.length > 1 ? "s" : ""}
                      </span>
                    )}
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
                      Total Bills: {loc.state?.currency || "NGN"} {totalBills.toLocaleString()}
                    </span>

                    {bills.slice(0, 3).map((b, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.66rem",
                          color: "var(--text-muted)",
                          background: "var(--bg-hover)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {b.title}: {loc.state?.currency || "NGN"} {parseFloat(b.amount || 0).toLocaleString()}
                      </span>
                    ))}
                    {bills.length > 3 && (
                      <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                        +{bills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    className="biz_icon_btn"
                    title="Edit Location"
                    onClick={() => openEditForm(loc)}
                  >
                    <MdEdit size={14} />
                  </button>
                  <button
                    className="biz_icon_btn"
                    title="Delete Location"
                    style={{ color: "#ef4444" }}
                    onClick={() => setConfirmDelete(loc)}
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewModalImage && (
        <div
          onClick={() => setPreviewModalImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "85vh",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              background: "#000",
            }}
          >
            <button
              onClick={() => setPreviewModalImage(null)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <MdClose size={18} />
            </button>
            <img
              src={previewModalImage}
              alt="Location preview"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1500,
            background: "rgba(0,0,0,0.5)",
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
              borderRadius: 14,
              padding: 24,
              maxWidth: 420,
              width: "100%",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)" }}>
              Delete Location?
            </h4>
            <p style={{ margin: "0 0 20px", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? Any associated kiosks or franchise listings may be impacted.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="app_btn app_btn_cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app_btn"
                style={{ background: "#ef4444", color: "#fff" }}
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
