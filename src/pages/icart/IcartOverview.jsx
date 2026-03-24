import { useState, useEffect, useRef } from "react";
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
  MdRestaurantMenu,
  MdVideocam,
  MdClose,
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

/* ── Live Stream Modal ─────────────────────────────────────── */
function LiveStreamModal({ onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(520px, 92vw)",
          background: "var(--bg-card)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              Live Stream
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Kitchen camera feed
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <MdClose size={15} />
          </button>
        </div>
        {/* Video placeholder */}
        <div
          style={{
            position: "relative",
            background: "#0a0a0a",
            aspectRatio: "16/9",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {/* Scanline effect */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "2px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={28} style={{ color: "rgba(239,68,68,0.6)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}
            >
              No Feed Available
            </div>
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}
            >
              Live stream will appear here when the camera is connected
            </div>
          </div>
          {/* Red recording dot */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              OFFLINE
            </span>
          </div>
        </div>
        <div
          style={{
            padding: "12px 20px",
            fontSize: "0.74rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Camera integration coming soon
        </div>
      </div>
    </div>
  );
}

/* ── Location Form ─────────────────────────────────────────── */
/* ── Map Picker ──────────────────────────────────────────────── */
function MapPicker({ lat, lng, onPick }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Default center: Abuja, Nigeria
  const DEFAULT_LAT = 9.0765;
  const DEFAULT_LNG = 7.3986;
  const initLat = lat && !isNaN(Number(lat)) ? Number(lat) : DEFAULT_LAT;
  const initLng = lng && !isNaN(Number(lng)) ? Number(lng) : DEFAULT_LNG;

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      if (window.L) {
        initMap();
        return;
      }
      if (document.getElementById("leaflet-js")) {
        // already loading — wait
        const wait = setInterval(() => {
          if (window.L) {
            clearInterval(wait);
            initMap();
          }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      script.onerror = () => setLoadError(true);
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current || leafletRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current).setView([initLat, initLng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Custom accent-colored marker
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#cb6cdc;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(203,108,220,0.5)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      const marker = L.marker([initLat, initLng], {
        icon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;
      leafletRef.current = map;

      // Click map → move marker
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onPick(lat, lng);
      });

      // Drag marker
      marker.on("dragend", (e) => {
        const { lat, lng } = e.target.getLatLng();
        onPick(lat, lng);
      });

      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Keep marker in sync when lat/lng are typed manually
  useEffect(() => {
    if (!markerRef.current || !leafletRef.current) return;
    const newLat = Number(lat);
    const newLng = Number(lng);
    if (!isNaN(newLat) && !isNaN(newLng) && newLat !== 0 && newLng !== 0) {
      markerRef.current.setLatLng([newLat, newLng]);
      leafletRef.current.setView(
        [newLat, newLng],
        leafletRef.current.getZoom(),
      );
    }
  }, [lat, lng]);

  if (loadError)
    return (
      <div
        style={{
          height: 220,
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 8,
          color: "var(--text-muted)",
          fontSize: "0.8rem",
        }}
      >
        <MdLocationOn size={24} style={{ opacity: 0.3 }} />
        Map failed to load — enter coordinates manually
      </div>
    );

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div
        ref={mapRef}
        style={{ height: 240, width: "100%", background: "var(--bg-hover)" }}
      />
      {!mapReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <div
            className="page_loader_spinner"
            style={{ width: 18, height: 18 }}
          />{" "}
          Loading map…
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.85)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        Click map or drag pin to set location
      </div>
    </div>
  );
}

function LocationForm({ cartId, onSaved, onCancel }) {
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
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setShowMap(true);
        toast.success("Location detected!");
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

  const handleMapPick = (lat, lng) => {
    setForm((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
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

        {/* Coordinates section */}
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
              {/* Detect GPS */}
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
              {/* Toggle map */}
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

          {/* Map */}
          {showMap && (
            <div style={{ marginBottom: 10 }}>
              <MapPicker
                lat={form.latitude}
                lng={form.longitude}
                onPick={handleMapPick}
              />
            </div>
          )}

          {/* Lat/Lng manual inputs */}
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
                onChange={(e) => {
                  set("latitude", e.target.value);
                }}
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
                onChange={(e) => {
                  set("longitude", e.target.value);
                }}
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

/* ── Public Concept Detail Modal ──────────────────────────── */
function ConceptDetailModal({ concept, onClose }) {
  const [tab, setTab] = useState("menu");
  const items = concept.menuItems || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(560px, 95vw)",
          maxHeight: "85vh",
          background: "var(--bg-card)",
          borderRadius: 18,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}
      >
        {/* Banner */}
        {concept.banner ? (
          <div style={{ position: "relative", height: 120, flexShrink: 0 }}>
            <img
              src={concept.banner}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
              }}
            />
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 30,
                height: 30,
                borderRadius: 7,
                background: "rgba(0,0,0,0.4)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <MdClose size={15} />
            </button>
            <div style={{ position: "absolute", bottom: 12, left: 16 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "#fff",
                  marginBottom: 2,
                }}
              >
                {concept.name}
              </div>
              {concept.vendor?.businessName && (
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.75)",
                    fontWeight: 600,
                  }}
                >
                  {concept.vendor.businessName}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                flexShrink: 0,
              }}
            >
              <MdStorefront size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                }}
              >
                {concept.name}
              </div>
              {concept.vendor?.businessName && (
                <div
                  style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                >
                  {concept.vendor.businessName}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
              }}
            >
              <MdClose size={15} />
            </button>
          </div>
        )}

        {/* Meta chips */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            padding: "10px 16px 0",
            flexShrink: 0,
          }}
        >
          {concept.status && (
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 999,
                background:
                  concept.status === "APPROVED"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(234,179,8,0.1)",
                color: concept.status === "APPROVED" ? "#16a34a" : "#ca8a04",
                border: `1px solid ${concept.status === "APPROVED" ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
              }}
            >
              {concept.status}
            </span>
          )}
          {concept.origin && (
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              🌍 {concept.origin}
            </span>
          )}
          {concept.serveTo && (
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              👥 {concept.serveTo}
            </span>
          )}
          <span
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: "2px 8px",
            }}
          >
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        </div>

        {concept.description && (
          <p
            style={{
              margin: "8px 16px 0",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.55,
              flexShrink: 0,
            }}
          >
            {concept.description}
          </p>
        )}

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            margin: "10px 0 0",
            flexShrink: 0,
          }}
        >
          {["menu"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 18px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
                color: tab === t ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: tab === t ? 700 : 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
              }}
            >
              Menu Items ({items.length})
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px 16px" }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--text-muted)",
                fontSize: "0.82rem",
              }}
            >
              No menu items
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    background: "var(--bg-hover)",
                    borderRadius: 11,
                  }}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 9,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 9,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdImage
                        size={17}
                        style={{ color: "var(--text-muted)" }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
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
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      {item.ticketTime > 0 && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          ⏱ {item.ticketTime}min
                        </span>
                      )}
                      {item.tutorialVideo && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "#ef4444",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          ▶ Video
                        </span>
                      )}
                      {item.variants?.length > 0 && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--accent)",
                            background: "var(--bg-active)",
                            border: "1px solid rgba(203,108,220,0.2)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          {item.variants.length} variant
                          {item.variants.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {item.extras?.length > 0 && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "#3b82f6",
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            borderRadius: 4,
                            padding: "1px 6px",
                          }}
                        >
                          {item.extras.length} extra
                          {item.extras.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {item.sellingPrice > 0 && (
                      <div
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                        }}
                      >
                        ₦{Number(item.sellingPrice).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Concept Card ───────────────────────────────────────────── */
function ConceptCard({ concept, cartId, onConceptClick, onMarkupUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const [editingMarkup, setEditingMarkup] = useState(false);
  const [markupVal, setMarkupVal] = useState(concept.markup?.toString() || "");
  const [savingMarkup, setSavingMarkup] = useState(false);
  const menuItems = concept.menuItems || [];

  const saveMarkup = async () => {
    const val = Number(markupVal);
    if (isNaN(val) || val < 0) return toast.error("Enter a valid markup %");
    setSavingMarkup(true);
    try {
      await api.patch(`/icart/${cartId}/concepts/${concept.id}/markup`, {
        markup: val,
      });
      toast.success("Markup updated");
      setEditingMarkup(false);
      if (onMarkupUpdated) onMarkupUpdated(concept.id, val);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update markup");
    } finally {
      setSavingMarkup(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
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
          <div className="icart_concept_name">{concept.name || "Concept"}</div>
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
      </div>

      {/* Action row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px 12px",
          borderTop: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {editingMarkup ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <input
                className="modal-input"
                type="number"
                min="0"
                style={{
                  marginBottom: 0,
                  height: 32,
                  paddingRight: 24,
                  fontSize: "0.8rem",
                }}
                placeholder="e.g. 30"
                value={markupVal}
                onChange={(e) => setMarkupVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveMarkup()}
                autoFocus
              />
              <span
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  pointerEvents: "none",
                  fontWeight: 700,
                }}
              >
                %
              </span>
            </div>
            <button
              className={`app_btn app_btn_confirm${savingMarkup ? " btn_loading" : ""}`}
              style={{
                height: 32,
                padding: "0 12px",
                fontSize: "0.74rem",
                position: "relative",
                flexShrink: 0,
              }}
              onClick={saveMarkup}
              disabled={savingMarkup}
            >
              <span className="btn_text">Save</span>
              {savingMarkup && (
                <span
                  className="btn_loader"
                  style={{ width: 11, height: 11 }}
                />
              )}
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{
                height: 32,
                padding: "0 10px",
                fontSize: "0.74rem",
                flexShrink: 0,
              }}
              onClick={() => {
                setEditingMarkup(false);
                setMarkupVal(concept.markup?.toString() || "");
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setEditingMarkup(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "1px dashed var(--border)",
                borderRadius: 7,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.72rem",
                fontWeight: 700,
                color:
                  concept.markup != null
                    ? "var(--accent)"
                    : "var(--text-muted)",
                flex: 1,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            >
              <MdEdit size={12} />
              {concept.markup != null
                ? `${concept.markup}% markup`
                : "Set markup"}
            </button>
            {onConceptClick && (
              <button
                onClick={() => onConceptClick(concept)}
                style={{
                  height: 32,
                  padding: "0 14px",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 2px 8px rgba(203,108,220,0.35)",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <MdRestaurantMenu size={13} />
                View Overview
              </button>
            )}
          </>
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
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [conceptSource, setConceptSource] = useState("mine");
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
  const [detailConcept, setDetailConcept] = useState(null); // for public concept detail modal

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
      console.log("Failed to load concepts");
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
      {/* ── Kitchen Controls ── */}
      <div className="drawer_section_title">Kitchen Controls</div>
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
          label="Kitchen Lock"
          value={cart.isLocked}
          loading={togglingLock}
          onToggle={handleToggleLock}
        />
        {/* Live Stream row */}
        <div
          className="icart_toggle_row"
          style={{ cursor: "pointer" }}
          onClick={() => setShowLiveStream(true)}
        >
          <div className="icart_toggle_left">
            <span className="profile_phone_date_icon">
              <MdVideocam size={15} />
            </span>
            <span className="icart_toggle_label">Live Stream</span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: "rgba(107,114,128,0.1)",
              color: "#6b7280",
              border: "1px solid rgba(107,114,128,0.2)",
            }}
          >
            View
          </span>
        </div>
      </div>

      {/* ── Service Radius ── */}
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

      {/* ── Kitchen Info ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Kitchen Info
      </div>
      <div className="icart_item_meta" style={{ marginBottom: 0 }}>
        <InfoRow label="Serial Number" value={cart.serialNumber} />
        <InfoRow label="Status" value={cart.status} />
        <InfoRow label="Owner" value={cart.owner?.name || cart.owner?.email} />
      </div>

      {/* ── Location ── */}
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

      {/* ── Active Concepts ── */}
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
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              alignItems: "flex-end",
                              flexShrink: 0,
                            }}
                          >
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
                                }}
                              >
                                <MdVerified
                                  size={12}
                                  style={{ color: "#fff" }}
                                />
                              </div>
                            )}
                            {/* View details button for public concepts */}
                            {conceptSource === "public" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailConcept(c);
                                }}
                                style={{
                                  fontSize: "0.6rem",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 5,
                                  background: "var(--bg-hover)",
                                  border: "1px solid var(--border)",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  fontFamily: "inherit",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Details
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

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
              cartId={cart.id}
              onConceptClick={onConceptClick}
              onMarkupUpdated={(conceptId, markup) =>
                onUpdate({
                  ...cart,
                  concepts: cart.concepts.map((cc) =>
                    cc.id === conceptId ? { ...cc, markup } : cc,
                  ),
                })
              }
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
                <div
                  className="icart_operator_avatar"
                  style={{ flexShrink: 0 }}
                >
                  {name[0].toUpperCase()}
                </div>
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

      {/* ── Modals ── */}
      {showLiveStream && (
        <LiveStreamModal onClose={() => setShowLiveStream(false)} />
      )}
      {detailConcept && (
        <ConceptDetailModal
          concept={detailConcept}
          onClose={() => setDetailConcept(null)}
        />
      )}
    </div>
  );
}
