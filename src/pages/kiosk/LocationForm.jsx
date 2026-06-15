import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdLocationOn } from "react-icons/md";
import api from "../../api/axios";
import MapPicker from "./MapPicker";

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

export default function LocationForm({ kioskId, onSaved, onCancel }) {
  const [form, setForm] = useState(BLANK_LOCATION);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => setStates(res.data.data || []))
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const handleStateChange = (stateId) => {
    const selected = states.find((s) => s.id === stateId);
    setForm((p) => ({
      ...p,
      _selectedStateId: stateId,
      stateName: selected?.name || p.stateName,
      country: selected?.country || p.country,
    }));
  };

  const detectGPS = () => {
    if (!navigator.geolocation)
      return toast.error("Geolocation not supported in this browser");
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setShowMap(true);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          const geo = await r.json();
          const a = geo.address || {};
          setForm((p) => ({
            ...p,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            name:
              p.name ||
              a.neighbourhood ||
              a.suburb ||
              a.village ||
              a.town ||
              a.city ||
              "",
            address:
              p.address ||
              [a.road, a.house_number].filter(Boolean).join(" ") ||
              a.display_name?.split(",")[0] ||
              "",
            city: p.city || a.city || a.town || a.village || a.county || "",
            lga: p.lga || a.county || a.state_district || a.suburb || "",
            country: p.country || a.country || "",
          }));
          toast.success("Location detected and filled!");
        } catch {
          toast.success("Location detected — please fill in address details");
        }
        setDetectingGPS(false);
      },
      (err) => {
        setDetectingGPS(false);
        const msgs = {
          1: "Location permission denied",
          2: "Location unavailable",
          3: "Location request timed out",
        };
        toast.error(msgs[err.code] || "Failed to detect location");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMapPick = async (lat, lng) => {
    setForm((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const geo = await r.json();
      const a = geo.address || {};
      setForm((p) => ({
        ...p,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        name:
          p.name ||
          a.neighbourhood ||
          a.suburb ||
          a.village ||
          a.town ||
          a.city ||
          p.name,
        address:
          p.address ||
          [a.road, a.house_number].filter(Boolean).join(" ") ||
          p.address,
        city: p.city || a.city || a.town || a.village || a.county || p.city,
        lga: p.lga || a.county || a.state_district || a.suburb || p.lga,
        country: p.country || a.country || p.country,
      }));
    } catch {
      /* silent */
    }
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
      const locRes = await api.post("/kiosk/location", {
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
      await api.post(`/kiosk/${kioskId}/change-location`, { locationId });
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
    <div className="kiosk_location_form">
      <div className="kiosk_location_form_grid">
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

        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <label className="modal-label" style={{ margin: 0 }}>
              Coordinates *
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={detectGPS}
                disabled={detectingGPS}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.06)",
                  color: "#3b82f6",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {detectingGPS ? (
                  <>
                    <div
                      className="page_loader_spinner"
                      style={{
                        width: 11,
                        height: 11,
                        borderColor: "#3b82f6",
                        borderTopColor: "transparent",
                      }}
                    />{" "}
                    Detecting…
                  </>
                ) : (
                  <>
                    <MdLocationOn size={13} /> Detect Location
                  </>
                )}
              </button>
              <button
                onClick={() => setShowMap((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  height: 28,
                  padding: "0 10px",
                  borderRadius: 7,
                  border: `1px solid ${showMap ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                  background: showMap ? "var(--bg-active)" : "var(--bg-hover)",
                  color: showMap ? "var(--accent)" : "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                🗺 {showMap ? "Hide Map" : "Pick on Map"}
              </button>
            </div>
          </div>

          {showMap && (
            <div style={{ marginBottom: 10 }}>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onPick={handleMapPick}
              />
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>
                Latitude
              </label>
              <input
                className="modal-input"
                type="number"
                step="any"
                placeholder="e.g. 9.0765"
                value={form.latitude}
                onChange={(e) => set("latitude", e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>
                Longitude
              </label>
              <input
                className="modal-input"
                type="number"
                step="any"
                placeholder="e.g. 7.3986"
                value={form.longitude}
                onChange={(e) => set("longitude", e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
          {form.latitude &&
            form.longitude &&
            !isNaN(Number(form.latitude)) &&
            !isNaN(Number(form.longitude)) && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MdLocationOn size={12} style={{ color: "var(--accent)" }} />
                {Number(form.latitude).toFixed(4)},{" "}
                {Number(form.longitude).toFixed(4)}
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginLeft: 4,
                    color: "var(--accent)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Verify on Google Maps ↗
                </a>
              </div>
            )}
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
