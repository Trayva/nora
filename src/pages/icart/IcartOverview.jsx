import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdWifi, MdWifiOff, MdLock, MdLockOpen, MdLocationOn, MdEdit, MdAdd,
  MdStorefront, MdSignalCellularAlt, MdPerson, MdVerified, MdExpandMore,
  MdExpandLess, MdImage, MdRestaurantMenu, MdVideocam, MdClose,
  MdBuild, MdMenuBook, MdArrowBack, MdArrowForward, MdSearch, MdCheck,
  MdOutlineInventory2,
} from "react-icons/md";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const LOCATION_TYPES = ["ACTIVE", "POTENTIAL", "INACTIVE", "RESTRICTED"];
const BLANK_LOCATION = {
  name: "", address: "", city: "", lga: "", country: "", stateName: "",
  latitude: "", longitude: "", locationIdType: "ACTIVE", notes: "",
};

function ToggleRow({ icon, label, value, loading, onToggle }) {
  return (
    <div className="icart_toggle_row">
      <div className="icart_toggle_left">
        <span className="profile_phone_date_icon">{icon}</span>
        <span className="icart_toggle_label">{label}</span>
      </div>
      <button className={`icart_toggle_switch ${value ? "icart_toggle_on" : ""}`} onClick={onToggle} disabled={loading}>
        <span className="icart_toggle_knob" />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="icart_meta_row">
      <span className="icart_meta_key">{label}</span>
      <span className="icart_meta_val">{value || <span className="icart_meta_muted">—</span>}</span>
    </div>
  );
}

/* ── Live Stream Modal ─────────────────────────────────────── */
function LiveStreamModal({ onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch { /* browser may deny */ }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync state when user presses Escape to exit fullscreen
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Close modal on Escape (only when not fullscreen — browser handles Escape in fullscreen)
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && !document.fullscreenElement) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }} />
      <div ref={containerRef} style={{ position: "relative", zIndex: 1, width: "min(520px, 92vw)", background: "var(--bg-card)", borderRadius: isFullscreen ? 0 : 18, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.3)", ...(isFullscreen ? { width: "100vw", height: "100vh", display: "flex", flexDirection: "column" } : {}) }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MdVideocam size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>Live Stream</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Kitchen camera feed</div>
          </div>
          {/* Fullscreen toggle */}
          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", marginRight: 4, fontSize: "0.9rem" }}>
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
            <MdClose size={15} />
          </button>
        </div>

        {/* Video placeholder */}
        <div style={{ position: "relative", background: "#0a0a0a", ...(isFullscreen ? { flex: 1 } : { aspectRatio: "16/9" }), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          {/* Scanlines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)", pointerEvents: "none" }} />
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MdVideocam size={28} style={{ color: "rgba(239,68,68,0.6)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>No Feed Available</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>Live stream will appear here when the camera is connected</div>
          </div>
          {/* Status badge */}
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", background: "rgba(0,0,0,0.5)", borderRadius: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", opacity: 0.5 }} />
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontWeight: 700, letterSpacing: "0.05em" }}>OFFLINE</span>
          </div>
          {/* Fullscreen hint */}
          {!isFullscreen && (
            <button onClick={toggleFullscreen} style={{ position: "absolute", bottom: 10, right: 10, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: "0.65rem", fontWeight: 700 }}>
              ⤢ Fullscreen
            </button>
          )}
        </div>

        <div style={{ padding: "12px 20px", fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "center", flexShrink: 0 }}>
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
      if (window.L) { initMap(); return; }
      if (document.getElementById("leaflet-js")) {
        // already loading — wait
        const wait = setInterval(() => { if (window.L) { clearInterval(wait); initMap(); } }, 100);
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
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map);

      // Custom accent-colored marker
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#cb6cdc;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(203,108,220,0.5)"></div>`,
        iconSize: [22, 22], iconAnchor: [11, 22],
      });

      const marker = L.marker([initLat, initLng], { icon, draggable: true }).addTo(map);
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
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; markerRef.current = null; }
    };
  }, []);

  // Keep marker in sync when lat/lng are typed manually
  useEffect(() => {
    if (!markerRef.current || !leafletRef.current) return;
    const newLat = Number(lat);
    const newLng = Number(lng);
    if (!isNaN(newLat) && !isNaN(newLng) && newLat !== 0 && newLng !== 0) {
      markerRef.current.setLatLng([newLat, newLng]);
      leafletRef.current.setView([newLat, newLng], leafletRef.current.getZoom());
    }
  }, [lat, lng]);

  if (loadError) return (
    <div style={{ height: 220, background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "var(--text-muted)", fontSize: "0.8rem" }}>
      <MdLocationOn size={24} style={{ opacity: 0.3 }} />
      Map failed to load — enter coordinates manually
    </div>
  );

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div ref={mapRef} style={{ height: 240, width: "100%", background: "var(--bg-hover)" }} />
      {!mapReady && (
        <div style={{ position: "absolute", inset: 0, background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.78rem", color: "var(--text-muted)" }}>
          <div className="page_loader_spinner" style={{ width: 18, height: 18 }} /> Loading map…
        </div>
      )}
      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", borderRadius: 6, padding: "4px 10px", fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", pointerEvents: "none", whiteSpace: "nowrap" }}>
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
    api.get("/config/state").then((res) => setStates(res.data.data || [])).catch(() => toast.error("Failed to load states")).finally(() => setStatesLoading(false));
  }, []);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const handleStateChange = (stateId) => {
    const selected = states.find((s) => s.id === stateId);
    setForm((p) => ({ ...p, _selectedStateId: stateId, stateName: selected?.name || p.stateName, country: selected?.country || p.country }));
  };

  const detectGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported in this browser");
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({ ...p, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
        setShowMap(true);
        // Reverse geocode with Nominatim
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await r.json();
          const a = geo.address || {};
          setForm((p) => ({
            ...p,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            name: p.name || a.neighbourhood || a.suburb || a.village || a.town || a.city || "",
            address: p.address || [a.road, a.house_number].filter(Boolean).join(" ") || a.display_name?.split(",")[0] || "",
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
        const msgs = { 1: "Location permission denied", 2: "Location unavailable", 3: "Location request timed out" };
        toast.error(msgs[err.code] || "Failed to detect location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPick = async (lat, lng) => {
    setForm((p) => ({ ...p, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const geo = await r.json();
      const a = geo.address || {};
      setForm((p) => ({
        ...p,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        name: p.name || a.neighbourhood || a.suburb || a.village || a.town || a.city || p.name,
        address: p.address || [a.road, a.house_number].filter(Boolean).join(" ") || p.address,
        city: p.city || a.city || a.town || a.village || a.county || p.city,
        lga: p.lga || a.county || a.state_district || a.suburb || p.lga,
        country: p.country || a.country || p.country,
      }));
    } catch { /* silent — coords already set */ }
  };

  const handleSubmit = async () => {
    const required = ["name", "address", "city", "lga", "country", "latitude", "longitude", "locationIdType"];
    for (const key of required) { if (!String(form[key]).trim()) return toast.error(`${key} is required`); }
    if (isNaN(form.latitude) || isNaN(form.longitude)) return toast.error("Latitude and longitude must be valid numbers");
    if (!form._selectedStateId) return toast.error("Please select a state");
    setSaving(true);
    try {
      const locRes = await api.post("/icart/location", {
        name: form.name.trim(), address: form.address.trim(), city: form.city.trim(), lga: form.lga.trim(),
        country: form.country.trim(), stateId: form._selectedStateId, latitude: Number(form.latitude),
        longitude: Number(form.longitude), locationIdType: form.locationIdType, notes: form.notes.trim() || undefined,
      });
      const locationId = locRes.data.data?.id;
      if (!locationId) throw new Error("No location ID returned");
      await api.post(`/icart/${cartId}/change-location`, { locationId });
      toast.success("Location created and assigned");
      onSaved(locRes.data.data);
    } catch (err) { toast.error(err.response?.data?.message || err.message || "Failed to save location"); }
    finally { setSaving(false); }
  };

  return (
    <div className="icart_location_form">
      <div className="icart_location_form_grid">
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Location Name *</label>
          <input className="modal-input" placeholder="e.g. Wuse Market Stand" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">Address *</label>
          <input className="modal-input" placeholder="Street address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="form-field">
          <label className="modal-label">City *</label>
          <input className="modal-input" placeholder="e.g. Abuja" value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="form-field">
          <label className="modal-label">LGA *</label>
          <input className="modal-input" placeholder="e.g. Wuse" value={form.lga} onChange={(e) => set("lga", e.target.value)} />
        </div>
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <label className="modal-label">State *</label>
          <select className="modal-input" value={form._selectedStateId || ""} onChange={(e) => handleStateChange(e.target.value)} disabled={statesLoading}>
            <option value="">{statesLoading ? "Loading states…" : "Select a state"}</option>
            {states.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code}) — {s.country}</option>)}
          </select>
        </div>

        {/* Coordinates section */}
        <div className="form-field" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label className="modal-label" style={{ margin: 0 }}>Coordinates *</label>
            <div style={{ display: "flex", gap: 6 }}>
              {/* Detect GPS */}
              <button onClick={detectGPS} disabled={detectingGPS}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.06)", color: "#3b82f6", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {detectingGPS ? <><div className="page_loader_spinner" style={{ width: 11, height: 11, borderColor: "#3b82f6", borderTopColor: "transparent" }} /> Detecting…</> : <><MdLocationOn size={13} /> Detect Location</>}
              </button>
              {/* Toggle map */}
              <button onClick={() => setShowMap((v) => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 7, border: `1px solid ${showMap ? "rgba(203,108,220,0.4)" : "var(--border)"}`, background: showMap ? "var(--bg-active)" : "var(--bg-hover)", color: showMap ? "var(--accent)" : "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                🗺 {showMap ? "Hide Map" : "Pick on Map"}
              </button>
            </div>
          </div>

          {/* Map */}
          {showMap && (
            <div style={{ marginBottom: 10 }}>
              <MapPicker lat={form.latitude} lng={form.longitude} onPick={handleMapPick} />
            </div>
          )}

          {/* Lat/Lng manual inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>Latitude</label>
              <input className="modal-input" type="number" step="any" placeholder="e.g. 9.0765" value={form.latitude}
                onChange={(e) => { set("latitude", e.target.value); }} style={{ marginBottom: 0 }} />
            </div>
            <div>
              <label className="modal-label" style={{ fontSize: "0.65rem" }}>Longitude</label>
              <input className="modal-input" type="number" step="any" placeholder="e.g. 7.3986" value={form.longitude}
                onChange={(e) => { set("longitude", e.target.value); }} style={{ marginBottom: 0 }} />
            </div>
          </div>
          {form.latitude && form.longitude && !isNaN(Number(form.latitude)) && !isNaN(Number(form.longitude)) && (
            <div style={{ marginTop: 6, fontSize: "0.68rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
              <MdLocationOn size={12} style={{ color: "var(--accent)" }} />
              {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
              <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer"
                style={{ marginLeft: 4, color: "var(--accent)", fontSize: "0.65rem", fontWeight: 700, textDecoration: "none" }}>
                Verify on Google Maps ↗
              </a>
            </div>
          )}
        </div>

        <div className="form-field">
          <label className="modal-label">Location Type *</label>
          <select className="modal-input" value={form.locationIdType} onChange={(e) => set("locationIdType", e.target.value)}>
            {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="modal-label">Notes</label>
          <input className="modal-input" placeholder="Optional" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`} style={{ flex: 1, height: 40 }} onClick={handleSubmit} disabled={saving || statesLoading}>
          <span className="btn_text">Create & Assign</span>
          {saving && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
        </button>
        <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 40 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}


/* ── Invoice Payment Modal ───────────────────────────────────── */
function InvoicePayModal({ invoice, application, onPaid, onClose }) {
  const [paying, setPaying] = useState(null); // "wallet" | "online"
  const [showMethods, setShowMethods] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const fmtAmt = (n) => `${invoice.currency || "NGN"} ${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const statusColors = {
    PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
    PAID: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
    OVERDUE: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
    CANCELLED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
  };
  const sc = statusColors[invoice.status] || statusColors.PENDING;

  useEffect(() => {
    api.get("/finance/wallet")
      .then((r) => setWallet(r.data.data))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, []);

  const handlePay = async (method) => {
    setPaying(method);
    setShowMethods(false);
    try {
      const res = await api.get(`/finance/invoice/${invoice.id}/pay`, {
        params: { method, shouldRedirect: false },
      });
      const paymentLink = res.data?.data?.paymentLink;
      if (method === "online" && paymentLink) {
        window.open(paymentLink, "_blank");
        toast.success("Payment page opened");
        onPaid();
      } else {
        toast.success("Payment successful!");
        onPaid();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(null);
    }
  };

  const sufficient = wallet && wallet.balance >= invoice.total;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={!paying ? onClose : undefined} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "min(420px, 95vw)", background: "var(--bg-card)", borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--text-heading)" }}>Invoice #{invoice.id.slice(0, 8).toUpperCase()}</div>
            <span style={{ fontSize: "0.62rem", fontWeight: 800, padding: "2px 9px", borderRadius: 999, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{invoice.status}</span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 16 }}>
            Due {fmtDate(invoice.dueDate)}{application?.vendor?.businessName && ` · ${application.vendor.businessName}`}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>
          <div style={{ background: "var(--bg-hover)", borderRadius: 11, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ padding: "8px 13px 6px", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)" }}>Items</div>
            {invoice.items?.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 13px", borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>{item.title}</div>
                  {item.description && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>{item.description}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>× {item.quantity}</div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "var(--text-heading)" }}>{fmtAmt(item.amount * item.quantity)}</div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderTop: "2px solid var(--border)", background: "var(--bg-card)" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)" }}>Total</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>{fmtAmt(invoice.total)}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
            {[
              { label: "Created", value: fmtDate(invoice.createdAt) },
              { label: "Due Date", value: fmtDate(invoice.dueDate) },
              ...(invoice.paidAt ? [{ label: "Paid At", value: fmtDate(invoice.paidAt) }] : []),
              ...(invoice.paymentMethod ? [{ label: "Method", value: invoice.paymentMethod }] : []),
            ].map((m) => (
              <div key={m.label} style={{ background: "var(--bg-hover)", borderRadius: 9, padding: "8px 11px" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)" }}>{m.value}</div>
              </div>
            ))}
          </div>
          {invoice.status === "PENDING" && (
            <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", marginBottom: 16 }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Wallet Balance</div>
              {walletLoading
                ? <div className="page_loader_spinner" style={{ width: 16, height: 16 }} />
                : <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 900, color: sufficient ? "#16a34a" : "#ef4444" }}>{fmtAmt(wallet?.balance || 0)}</span>
                    {!sufficient && <span style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 700 }}>Insufficient</span>}
                  </div>
              }
            </div>
          )}
        </div>
        <div style={{ padding: "14px 20px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
          {invoice.status === "PENDING" && (
            showMethods ? (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={`app_btn app_btn_confirm${paying === "wallet" ? " btn_loading" : ""}`}
                    style={{ flex: 1, height: 42, position: "relative", opacity: (!sufficient && !walletLoading) ? 0.5 : 1 }}
                    onClick={() => handlePay("wallet")} disabled={!!paying || (!sufficient && wallet !== null)}>
                    <span className="btn_text">Pay with Wallet</span>
                    {paying === "wallet" && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
                  </button>
                  <button className={`app_btn app_btn_confirm${paying === "online" ? " btn_loading" : ""}`}
                    style={{ flex: 1, height: 42, position: "relative" }}
                    onClick={() => handlePay("online")} disabled={!!paying}>
                    <span className="btn_text">Pay Online</span>
                    {paying === "online" && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
                  </button>
                </div>
                <button className="app_btn app_btn_cancel" style={{ width: "100%", height: 42 }} onClick={() => setShowMethods(false)} disabled={!!paying}>Cancel</button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 42 }} onClick={onClose} disabled={!!paying}>Later</button>
                <button className="app_btn app_btn_confirm" style={{ flex: 2, height: 42 }} onClick={() => setShowMethods(true)}>Pay Now</button>
              </div>
            )
          )}
          {invoice.status !== "PENDING" && (
            <button className="app_btn app_btn_cancel" style={{ width: "100%", height: 42 }} onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── VendorMenuSection ───────────────────────────────────────── */
const MAX_MENU_ITEMS = 5;
const VENDOR_PAGE_SIZE = 8;

/* ════════════════════════════════════════════════════════════════
   BRAND + MENU SELECTION DRAWER
   Wide drawer: brand list → menu detail tabs → financials
   ════════════════════════════════════════════════════════════════ */

/* ── Menu Detail Tabs Drawer ──────────────────────────────────── */
function MenuDetailDrawer({ menuId, menuName, isSelected, onToggleSelect, selectedCount, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!menuId) return;
    setLoading(true);
    setSummary(null);
    api.get(`/vendor/menu/${menuId}/summary`)
      .then((r) => setSummary(r.data.data))
      .catch(() => toast.error("Failed to load menu details"))
      .finally(() => setLoading(false));
  }, [menuId]);

  const fmt = (n) => n != null ? Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 }) : "—";

  const TABS = [
    { key: "overview",     label: "Overview" },
    { key: "machinery",    label: "Tools" },
    { key: "ingredients",  label: "Ingredients" },
    { key: "preps",        label: "Prep Items" },
    { key: "sops",         label: "SOPs" },
  ];

  const item = summary?.menuItem || summary;
  const concept = summary?.concept || {};
  const machineries = summary?.machineries || [];
  const ingredients = summary?.ingredients || [];
  const prepItems = summary?.prepItems || [];
  const sops = summary?.sops || item?.sops || [];
  const recipe = summary?.recipe || item?.recipe || [];
  // Concept fields fall through to item for backwards compat
  const displayPackaging = item?.packaging || concept?.packaging;
  const displayPackagingImage = item?.packagingImage || concept?.packagingImage;
  const displayServeTo = item?.serveTo || concept?.serveTo;
  const displayOrigin = item?.origin || concept?.origin;
  const displayDescription = item?.description || concept?.description;
  const baseCost = summary?.baseCost;

  const atLimit = selectedCount >= MAX_MENU_ITEMS && !isSelected;

  return (
    /* Full-screen overlay drawer */
    <div style={{ position: "fixed", inset: 0, zIndex: 1400, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{
        position: "relative", zIndex: 1, width: "min(680px, 96vw)",
        background: "var(--bg-card)", display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.25)", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "18px 24px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
            <MdArrowBack size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{menuName}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Menu item details</div>
          </div>
          {/* Select toggle */}
          <button
            onClick={onToggleSelect}
            disabled={atLimit}
            style={{
              height: 38, padding: "0 18px", borderRadius: 10, cursor: atLimit ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontWeight: 800, fontSize: "0.82rem", flexShrink: 0,
              display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.15s",
              border: `1.5px solid ${isSelected ? "rgba(34,197,94,0.5)" : atLimit ? "var(--border)" : "rgba(203,108,220,0.4)"}`,
              background: isSelected ? "rgba(34,197,94,0.1)" : atLimit ? "var(--bg-hover)" : "var(--bg-active)",
              color: isSelected ? "#16a34a" : atLimit ? "var(--text-muted)" : "var(--accent)",
              opacity: atLimit ? 0.5 : 1,
            }}
          >
            {isSelected ? <><MdCheck size={15} /> Selected</> : atLimit ? "Limit reached" : <><MdAdd size={15} /> Select</>}
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", overflowX: "auto", scrollbarWidth: "none", background: "var(--bg-card)", flexShrink: 0 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: "12px 18px", background: "transparent", border: "none",
                borderBottom: `2px solid ${activeTab === t.key ? "var(--accent)" : "transparent"}`,
                color: activeTab === t.key ? "var(--accent)" : "var(--text-muted)",
                fontSize: "0.8rem", fontWeight: activeTab === t.key ? 700 : 500,
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
              <div className="page_loader_spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : !summary ? (
            <div className="icart_empty_inline" style={{ padding: "48px 0" }}>
              <MdRestaurantMenu size={28} style={{ opacity: 0.25 }} />
              <span>No details available</span>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div>
                  {item?.image && (
                    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))" }} />
                      <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>{item.name}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {item.ticketTime > 0 && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.9)" }}>⏱ {item.ticketTime} min</span>}
                          {displayServeTo && <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.9)" }}>👥 {displayServeTo}</span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Concept + vendor info */}
                  {(concept?.name || summary?.vendor?.businessName) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      {concept?.name && (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: "var(--bg-active)", color: "var(--accent)", border: "1px solid rgba(203,108,220,0.3)" }}>
                          📦 {concept.name}
                        </span>
                      )}
                      {summary?.vendor?.businessName && (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "4px 11px", borderRadius: 999, background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          🏷 {summary.vendor.businessName}
                        </span>
                      )}
                    </div>
                  )}
                  {displayDescription && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: 20 }}>{displayDescription}</p>
                  )}

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                    {[
                      { label: "Selling Price", value: item?.sellingPrice > 0 ? `₦${fmt(item.sellingPrice)}` : null, accent: true },
                      { label: "Recipe Cost", value: baseCost != null ? `₦${fmt(baseCost)}` : item?.recipeCost > 0 ? `₦${fmt(item.recipeCost)}` : null },
                      { label: "Ticket Time", value: item?.ticketTime > 0 ? `${item.ticketTime} min` : null },
                      { label: "Serves", value: displayServeTo || null },
                      { label: "Origin", value: displayOrigin || null },
                      { label: "Ingredients", value: ingredients.length > 0 ? String(ingredients.length) : null },
                      { label: "Prep Items", value: prepItems.length > 0 ? String(prepItems.length) : null },
                      { label: "Tools", value: machineries.length > 0 ? String(machineries.length) : null },
                    ].filter((s) => s.value).map((s) => (
                      <div key={s.label} style={{ background: s.accent ? "var(--bg-active)" : "var(--bg-hover)", border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px" }}>
                        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 900, color: s.accent ? "var(--accent)" : "var(--text-heading)" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Packaging */}
                  {displayPackaging && (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Packaging</div>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        {displayPackagingImage && <img src={displayPackagingImage} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-body)", lineHeight: 1.6 }}>{displayPackaging}</p>
                      </div>
                    </div>
                  )}

                  {/* Tutorial video */}
                  {item?.tutorialVideo && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Tutorial Video</div>
                      {(() => {
                        const src = item.tutorialVideo;
                        const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
                        const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        const embedUrl = vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : null;
                        return embedUrl ? (
                          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden" }}>
                            <iframe src={embedUrl} allow="autoplay; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                          </div>
                        ) : (
                          <video src={src} controls style={{ width: "100%", borderRadius: 12, maxHeight: 260 }} />
                        );
                      })()}
                    </div>
                  )}

                  {/* Variants */}
                  {(summary?.variants || item?.variants)?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Variants</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {(summary?.variants || item?.variants).map((v, i) => (
                          <span key={v.id || i} style={{ fontSize: "0.78rem", fontWeight: 700, padding: "6px 14px", borderRadius: 999, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-body)" }}>{v.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipe steps */}
                  {recipe.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Recipe Steps</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {recipe.map((step, i) => {
                          const ing = step.ingredient || step.prepItem;
                          return (
                            <div key={step.id || i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.3)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.62rem", fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                              {ing?.image ? <img src={ing.image} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : null}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>{ing?.name || step.type}</div>
                                {step.quantity != null && <div style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700 }}>{step.quantity}{ing?.unit || ""}</div>}
                                {step.instruction && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{step.instruction}</div>}
                              </div>
                              <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: step.type === "prep" ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)", color: step.type === "prep" ? "#3b82f6" : "#16a34a", border: `1px solid ${step.type === "prep" ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)"}`, flexShrink: 0 }}>{step.type}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TOOLS / MACHINERY ── */}
              {activeTab === "machinery" && (
                <div>
                  {machineries.length === 0 ? (
                    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
                      <MdBuild size={26} style={{ opacity: 0.25 }} />
                      <span>No machineries listed</span>
                    </div>
                  ) : machineries.map((m, i) => {
                    const mach = m.machinery || m;
                    return (
                      <div key={m.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                        {mach.image ? <img src={mach.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : (
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <MdBuild size={18} style={{ color: "var(--text-muted)" }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-body)" }}>{mach.name}</div>
                          {mach.manufacturer && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{mach.manufacturer}</div>}
                        </div>
                        {m.quantity > 1 && <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>× {m.quantity}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── INGREDIENTS ── */}
              {activeTab === "ingredients" && (
                <div>
                  {ingredients.length === 0 ? (
                    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
                      <MdOutlineInventory2 size={26} style={{ opacity: 0.25 }} />
                      <span>No ingredients listed</span>
                    </div>
                  ) : ingredients.map((ing, i) => (
                    <div key={ing.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      {ing.image ? <img src={ing.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : (
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <MdOutlineInventory2 size={18} style={{ color: "var(--text-muted)" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-body)" }}>{ing.name}</div>
                        {ing.totalQuantity != null && (
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Total: {ing.totalQuantity} {ing.unit}</div>
                        )}
                        {ing.usedIn?.length > 0 && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{ing.usedIn.map((u) => `${u.source}: ${u.quantity}${ing.unit || ""}`).join(" · ")}</div>
                        )}
                      </div>
                      {ing.cost != null && (
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)" }}>₦{fmt(ing.cost)}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{ing.unit}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── PREP ITEMS ── */}
              {activeTab === "preps" && (
                <div>
                  {prepItems.length === 0 ? (
                    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
                      <MdRestaurantMenu size={26} style={{ opacity: 0.25 }} />
                      <span>No prep items listed</span>
                    </div>
                  ) : prepItems.map((prep, i) => (
                    <div key={prep.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, rgba(203,108,220,0.15), rgba(203,108,220,0.05))", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MdRestaurantMenu size={18} style={{ color: "var(--accent)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-body)" }}>{prep.name}</div>
                        {prep.unit && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{prep.unit}</div>}
                        {prep.usedIn?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                            {prep.usedIn.map((u, j) => (
                              <span key={j} style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: 4, background: u.source === "extra" ? "rgba(168,85,247,0.1)" : "var(--bg-hover)", border: `1px solid ${u.source === "extra" ? "rgba(168,85,247,0.25)" : "var(--border)"}`, color: u.source === "extra" ? "#a855f7" : "var(--text-muted)" }}>
                                {u.source} · {u.quantity}{prep.unit || ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {prep.cost != null && (
                        <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)", flexShrink: 0 }}>₦{fmt(prep.cost)}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── SOPs ── */}
              {activeTab === "sops" && (
                <div>
                  {sops.length === 0 ? (
                    <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
                      <MdMenuBook size={26} style={{ opacity: 0.25 }} />
                      <span>No SOPs defined</span>
                    </div>
                  ) : sops.map((sop, i) => (
                    <div key={sop.id || i} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                      <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 6 }}>{sop.title || sop.name || `Step ${i + 1}`}</div>
                      {sop.description && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{sop.description}</p>}
                      {sop.steps?.length > 0 && (
                        <ol style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                          {sop.steps.map((step, j) => (
                            <li key={j} style={{ fontSize: "0.8rem", color: "var(--text-body)", lineHeight: 1.6, marginBottom: 4 }}>{step}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Brand + Menu Selection Drawer ───────────────────────────── */
function BrandSelectionDrawer({ cart, onClose, onDone }) {
  // sub-view: "brands" | "financials"
  const [view, setView] = useState("brands");

  // Brand list
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");

  // Expanded brand (to show its menus inline)
  const [expandedBrandId, setExpandedBrandId] = useState(null);
  const [brandMenus, setBrandMenus] = useState({}); // { [brandId]: { loading, items } }

  // Selection
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]); // max 5

  // Menu detail drawer
  const [detailMenuId, setDetailMenuId] = useState(null);
  const [detailMenuName, setDetailMenuName] = useState("");

  // Financials
  const [termsData, setTermsData] = useState(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  // ── Load brands ──
  useEffect(() => {
    api.get("/vendor/profile")
      .then((r) => { const d = r.data.data; setBrands(d?.vendors || (Array.isArray(d) ? d : [])); })
      .catch(() => toast.error("Failed to load brands"))
      .finally(() => setBrandsLoading(false));
  }, []);

  // ── Load menus for a brand ──
  const loadBrandMenus = async (brandId) => {
    if (brandMenus[brandId]) return; // already loaded
    setBrandMenus((p) => ({ ...p, [brandId]: { loading: true, items: [] } }));
    try {
      const r = await api.get(`/vendor/menu?vendorId=${brandId}&page=1&limit=100`);
      const d = r.data.data;
      const items = d?.items || (Array.isArray(d) ? d : d?.menuItems || d?.data || []);
      setBrandMenus((p) => ({ ...p, [brandId]: { loading: false, items } }));
    } catch {
      setBrandMenus((p) => ({ ...p, [brandId]: { loading: false, items: [] } }));
    }
  };

  // ── Toggle brand expand ──
  const toggleBrand = (brandId) => {
    if (expandedBrandId === brandId) { setExpandedBrandId(null); return; }
    setExpandedBrandId(brandId);
    loadBrandMenus(brandId);
  };

  // ── Toggle menu selection ──
  const toggleMenu = (menuId, brandId) => {
    // Switching brand — clear previous selection
    if (selectedBrandId && selectedBrandId !== brandId) {
      setSelectedBrandId(brandId);
      setSelectedMenuIds([menuId]);
      return;
    }
    setSelectedBrandId(brandId);
    setSelectedMenuIds((prev) => {
      if (prev.includes(menuId)) return prev.filter((id) => id !== menuId);
      if (prev.length >= MAX_MENU_ITEMS) { toast.error(`Max ${MAX_MENU_ITEMS} items`); return prev; }
      return [...prev, menuId];
    });
  };

  // ── Load terms when entering financials ──
  useEffect(() => {
    if (view !== "financials") return;
    const country = cart.location?.country || "";
    if (!country) return;
    setTermsLoading(true);
    api.get(`/icartVendorApplication/settings/country/${encodeURIComponent(country)}`)
      .then((r) => setTermsData(r.data.data))
      .catch((err) => toast.error(err.response?.data?.message || "No brand settings found"))
      .finally(() => setTermsLoading(false));
  }, [view]);

  // ── Confirm brand ──
  const handleConfirm = async () => {
    if (!termsAccepted) { toast.error("Accept the terms to continue"); return; }
    if (!selectedBrandId) { toast.error("Select a brand first"); return; }
    setConfirming(true);
    try {
      const res = await api.post(`/icart/${cart.id}/change-vendor`, { vendorId: selectedBrandId });
      const data = res.data.data;
      // If backend returns invoice, show it; otherwise go straight to adding menus
      if (data?.invoice) {
        setInvoiceData({ invoice: data.invoice, application: data.application });
      } else {
        // No invoice needed — add menus directly
        if (selectedMenuIds.length > 0) {
          await api.post(`/icart/${cart.id}/menu-items`, {
            items: selectedMenuIds.map((id) => ({ id, markup: 0 })),
          });
        }
        toast.success("Brand and menu items set!");
        onDone();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set brand");
    } finally {
      setConfirming(false);
    }
  };

  // ── After payment ──
  const handlePaid = async () => {
    if (selectedMenuIds.length > 0) {
      try {
        await api.post(`/icart/${cart.id}/menu-items`, {
          items: selectedMenuIds.map((id) => ({ id, markup: 0 })),
        });
      } catch { /* silent — menus can be added later */ }
    }
    setInvoiceData(null);
    toast.success("Brand confirmed!");
    onDone();
  };

  const filteredBrands = brands.filter((b) =>
    !brandSearch.trim() ||
    b.businessName?.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.brandTagline || b.branding?.tagline)?.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  // Invoice modal renders on top
  if (invoiceData) {
    return (
      <InvoicePayModal
        invoice={invoiceData.invoice}
        application={invoiceData.application}
        onPaid={handlePaid}
        onClose={() => setInvoiceData(null)}
      />
    );
  }

  return (
    <>
      {/* Main selection drawer */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
        <div style={{
          position: "relative", zIndex: 1, width: "min(720px, 96vw)",
          background: "var(--bg-card)", display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
        }}>

          {/* Header */}
          <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border)", padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
              <MdClose size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--text-heading)" }}>
                {view === "financials" ? "Financials & Terms" : "Choose Brand"}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {view === "financials"
                  ? `${selectedBrand?.businessName} · ${selectedMenuIds.length} item${selectedMenuIds.length !== 1 ? "s" : ""} selected`
                  : `${selectedMenuIds.length}/${MAX_MENU_ITEMS} menus selected${selectedBrand ? ` from ${selectedBrand.businessName}` : ""}`
                }
              </div>
            </div>
            {view === "brands" && selectedMenuIds.length > 0 && (
              <button
                className="app_btn app_btn_confirm"
                style={{ height: 40, padding: "0 20px", display: "inline-flex", alignItems: "center", gap: 7, flexShrink: 0, fontSize: "0.84rem" }}
                onClick={() => setView("financials")}
              >
                Continue <MdArrowForward size={15} />
              </button>
            )}
            {view === "financials" && (
              <button
                onClick={() => setView("brands")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit", flexShrink: 0 }}
              >
                ← Back
              </button>
            )}
          </div>

          {/* ── BRANDS VIEW ── */}
          {view === "brands" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Search */}
              <div style={{ position: "relative", marginBottom: 20 }}>
                <MdSearch size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input className="modal-input" style={{ paddingLeft: 36, height: 42, marginBottom: 0, fontSize: "0.88rem" }}
                  placeholder="Search brands…" value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} />
                {brandSearch && (
                  <button onClick={() => setBrandSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                    <MdClose size={14} />
                  </button>
                )}
              </div>

              {/* Selection summary bar */}
              {selectedMenuIds.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.3)", borderRadius: 12, marginBottom: 16 }}>
                  {(selectedBrand?.branding?.logo || selectedBrand?.brandLogo) ? (
                    <img src={selectedBrand.branding?.logo || selectedBrand.brandLogo} alt="" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(203,108,220,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MdStorefront size={14} style={{ color: "var(--accent)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>{selectedBrand?.businessName}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{selectedMenuIds.length} of {MAX_MENU_ITEMS} items selected</div>
                  </div>
                  <div style={{ display: "flex", gap: -4 }}>
                    {selectedMenuIds.slice(0, 5).map((id, i) => {
                      const allItems = brandMenus[selectedBrandId]?.items || [];
                      const item = allItems.find((m) => m.id === id);
                      return item?.image ? (
                        <img key={id} src={item.image} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover", border: "2px solid var(--bg-card)", marginLeft: i > 0 ? -6 : 0 }} />
                      ) : null;
                    })}
                  </div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--accent)", flexShrink: 0, padding: "4px 10px", background: "rgba(203,108,220,0.15)", borderRadius: 8 }}>
                    {selectedMenuIds.length}/{MAX_MENU_ITEMS}
                  </div>
                </div>
              )}

              {brandsLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                  <div className="page_loader_spinner" style={{ width: 24, height: 24 }} />
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="icart_empty_inline" style={{ padding: "40px 0" }}>
                  <MdStorefront size={28} style={{ opacity: 0.25 }} />
                  <span>No brands found</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filteredBrands.map((brand) => {
                    const isExpanded = expandedBrandId === brand.id;
                    const menus = brandMenus[brand.id];
                    const brandSelected = selectedBrandId === brand.id;
                    const brandMenuCount = menus?.items?.length ?? null;

                    return (
                      <div key={brand.id} style={{
                        background: brandSelected ? "var(--bg-active)" : "var(--bg-hover)",
                        border: `1.5px solid ${brandSelected ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                        borderRadius: 16, overflow: "hidden", transition: "all 0.15s",
                      }}>
                        {/* Brand header row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }} onClick={() => toggleBrand(brand.id)}>
                          {(brand.branding?.logo || brand.brandLogo) ? (
                            <img src={brand.branding?.logo || brand.brandLogo} alt="" style={{ width: 46, height: 46, borderRadius: 11, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
                          ) : (
                            <div style={{ width: 46, height: 46, borderRadius: 11, background: brandSelected ? "rgba(203,108,220,0.2)" : "var(--bg-card)", border: `1px solid ${brandSelected ? "rgba(203,108,220,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <MdStorefront size={20} style={{ color: brandSelected ? "var(--accent)" : "var(--text-muted)" }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: brandSelected ? "var(--accent)" : "var(--text-heading)", marginBottom: 2 }}>{brand.businessName}</div>
                            {(brand.branding?.tagline || brand.brandTagline) && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand.branding?.tagline || brand.brandTagline}</div>}
                            {brandMenuCount !== null && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{brandMenuCount} menu item{brandMenuCount !== 1 ? "s" : ""}</div>}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            {brandSelected && selectedMenuIds.length > 0 && (
                              <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "rgba(203,108,220,0.15)", color: "var(--accent)", border: "1px solid rgba(203,108,220,0.3)" }}>
                                {selectedMenuIds.length} selected
                              </span>
                            )}
                            {isExpanded ? <MdExpandLess size={18} style={{ color: "var(--text-muted)" }} /> : <MdExpandMore size={18} style={{ color: "var(--text-muted)" }} />}
                          </div>
                        </div>

                        {/* Menu list — collapsible */}
                        {isExpanded && (
                          <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
                            {menus?.loading ? (
                              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                                <div className="page_loader_spinner" style={{ width: 18, height: 18 }} />
                              </div>
                            ) : !menus?.items?.length ? (
                              <div className="icart_empty_inline" style={{ padding: "24px 0" }}>
                                <MdRestaurantMenu size={20} style={{ opacity: 0.25 }} />
                                <span>No menu items</span>
                              </div>
                            ) : (
                              <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ fontSize: "0.62rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: brandSelected ? "var(--accent)" : "var(--text-muted)", marginBottom: 4 }}>
                                  Menu · {menus.items.length} item{menus.items.length !== 1 ? "s" : ""}
                                </div>
                                {menus.items.map((item) => {
                                  const isSel = selectedMenuIds.includes(item.id) && selectedBrandId === brand.id;
                                  const atLimit = selectedMenuIds.length >= MAX_MENU_ITEMS && !isSel;
                                  return (
                                    <div key={item.id}
                                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: isSel ? "var(--bg-active)" : "var(--bg-hover)", border: `1.5px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`, borderRadius: 11, opacity: atLimit ? 0.5 : 1, transition: "all 0.12s" }}
                                    >
                                      {/* Image */}
                                      {item.image ? (
                                        <img src={item.image} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                                      ) : (
                                        <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                          <MdRestaurantMenu size={16} style={{ color: "var(--text-muted)" }} />
                                        </div>
                                      )}
                                      {/* Info */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: isSel ? "var(--accent)" : "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                                          {item.sellingPrice > 0 && <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>₦{fmt(item.sellingPrice)}</span>}
                                          {item.ticketTime > 0 && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>⏱ {item.ticketTime}min</span>}
                                        </div>
                                      </div>
                                      {/* Actions */}
                                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                        {/* View details */}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setDetailMenuId(item.id); setDetailMenuName(item.name); }}
                                          style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}
                                          title="View details"
                                        >
                                          <MdExpandMore size={15} />
                                        </button>
                                        {/* Select toggle */}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); if (!atLimit) toggleMenu(item.id, brand.id); }}
                                          disabled={atLimit}
                                          style={{ width: 32, height: 32, borderRadius: 8, background: isSel ? "var(--accent)" : "var(--bg-hover)", border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`, cursor: atLimit ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: isSel ? "#fff" : "var(--text-muted)" }}
                                          title={isSel ? "Deselect" : "Select"}
                                        >
                                          {isSel ? <MdCheck size={16} /> : <MdAdd size={15} />}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FINANCIALS VIEW ── */}
          {view === "financials" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
              {/* Selected brand recap */}
              {selectedBrand && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.3)", borderRadius: 14, marginBottom: 20 }}>
                  {(selectedBrand.branding?.logo || selectedBrand.brandLogo) ? (
                    <img src={selectedBrand.branding?.logo || selectedBrand.brandLogo} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(203,108,220,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MdStorefront size={18} style={{ color: "var(--accent)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 900, color: "var(--accent)" }}>{selectedBrand.businessName}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{selectedMenuIds.length} menu item{selectedMenuIds.length !== 1 ? "s" : ""} selected</div>
                  </div>
                  <MdVerified size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                </div>
              )}

              {/* Selected menu items preview */}
              {selectedMenuIds.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Selected Menu Items</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selectedMenuIds.map((id) => {
                      const allItems = brandMenus[selectedBrandId]?.items || [];
                      const item = allItems.find((m) => m.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10 }}>
                          {item.image ? <img src={item.image} alt="" style={{ width: 32, height: 32, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 32, height: 32, borderRadius: 7, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdRestaurantMenu size={14} style={{ color: "var(--text-muted)" }} /></div>}
                          <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                          {item.sellingPrice > 0 && <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>₦{fmt(item.sellingPrice)}</span>}
                          <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", flexShrink: 0 }}>Selected</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Country indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 16 }}>
                <MdLocationOn size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-body)", fontWeight: 600 }}>
                  {cart.location?.country || "No location set on this iCart"}
                </span>
              </div>

              {termsLoading && <div className="drawer_loading"><div className="page_loader_spinner" /></div>}

              {!termsLoading && !termsData && (
                <div style={{ padding: "14px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, fontSize: "0.8rem", color: "#ca8a04", marginBottom: 16 }}>
                  {cart.location?.country ? `No brand settings found for ${cart.location.country}.` : "Set a location on this iCart first to load terms."}
                </div>
              )}

              {termsData && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {termsData.payments?.length > 0 && (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>Payment Schedule</div>
                      {termsData.payments.map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: i < termsData.payments.length - 1 ? 10 : 0, marginBottom: i < termsData.payments.length - 1 ? 10 : 0, borderBottom: i < termsData.payments.length - 1 ? "1px solid var(--border)" : "none" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-body)", marginBottom: 3 }}>{p.title}</div>
                            {p.description && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{p.description}</div>}
                            <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                              {p.recurring && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}>Recurring</span>}
                              {p.refundable && <span style={{ fontSize: "0.6rem", fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)" }}>Refundable</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--accent)", flexShrink: 0 }}>{termsData.currency} {fmt(p.amount)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {termsData.terms && (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 10 }}>Terms & Conditions</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-body)", lineHeight: 1.7, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>{termsData.terms}</div>
                    </div>
                  )}

                  {/* Accept checkbox */}
                  <button onClick={() => setTermsAccepted((v) => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 14, background: termsAccepted ? "var(--bg-active)" : "var(--bg-hover)", border: `2px solid ${termsAccepted ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${termsAccepted ? "var(--accent)" : "var(--border)"}`, background: termsAccepted ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {termsAccepted && <MdCheck size={15} style={{ color: "#fff" }} />}
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: termsAccepted ? "var(--accent)" : "var(--text-body)" }}>I agree to the terms and conditions</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>For {termsData.country} · {termsData.currency}</div>
                    </div>
                  </button>
                </div>
              )}

              {/* Confirm button */}
              <div style={{ marginTop: 24 }}>
                <button
                  className={`app_btn app_btn_confirm${confirming ? " btn_loading" : ""}`}
                  style={{ width: "100%", height: 48, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.92rem", fontWeight: 800 }}
                  onClick={handleConfirm}
                  disabled={confirming || !selectedBrandId}
                >
                  <span className="btn_text">Confirm — {selectedBrand?.businessName}</span>
                  {confirming && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu detail drawer — renders on top */}
      {detailMenuId && (
        <MenuDetailDrawer
          menuId={detailMenuId}
          menuName={detailMenuName}
          isSelected={selectedMenuIds.includes(detailMenuId) && selectedBrandId === expandedBrandId}
          onToggleSelect={() => {
            const brandId = expandedBrandId;
            if (brandId) toggleMenu(detailMenuId, brandId);
          }}
          selectedCount={selectedMenuIds.length}
          onClose={() => { setDetailMenuId(null); setDetailMenuName(""); }}
        />
      )}
    </>
  );
}

/* ── Beautiful Idle Card ──────────────────────────────────────── */
function BrandIdleCard({ cart, onChangeBrand, onManageMenu }) {
  const assignedVendor = cart.vendor;
  const menuItems = cart.menuItems || [];
  const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  if (!assignedVendor && menuItems.length === 0) {
    return (
      <div style={{
        border: "2px dashed var(--border)", borderRadius: 16, padding: "28px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
        background: "var(--bg-hover)", cursor: "pointer", transition: "all 0.15s",
      }}
        onClick={onChangeBrand}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(203,108,220,0.4)"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MdStorefront size={24} style={{ color: "var(--accent)", opacity: 0.7 }} />
        </div>
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 4 }}>No Brand Selected</div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Tap to choose a brand and menu items for this iCart</div>
        </div>
        <button className="app_btn app_btn_confirm" style={{ height: 38, padding: "0 20px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem" }}>
          <MdAdd size={15} /> Select Brand
        </button>
      </div>
    );
  }

  const brandColor = assignedVendor?.brandColor;
  const gradientBg = brandColor
    ? `linear-gradient(135deg, ${brandColor}22 0%, ${brandColor}08 100%)`
    : "linear-gradient(135deg, rgba(203,108,220,0.1) 0%, rgba(203,108,220,0.03) 100%)";
  const borderCol = brandColor ? `${brandColor}44` : "rgba(203,108,220,0.2)";

  return (
    <div style={{ background: "var(--bg-card)", border: `1px solid ${borderCol}`, borderRadius: 18, overflow: "hidden" }}>
      {/* Gradient brand header */}
      <div style={{ background: gradientBg, padding: "18px 18px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {assignedVendor?.brandLogo ? (
            <img src={assignedVendor.brandLogo} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MdStorefront size={22} style={{ color: brandColor || "var(--accent)" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "var(--text-heading)", marginBottom: 2 }}>
              {assignedVendor?.businessName || assignedVendor?.name || "Brand"}
            </div>
            {(assignedVendor?.brandTagline) && (
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignedVendor.brandTagline}</div>
            )}
          </div>
          <button
            onClick={onChangeBrand}
            style={{ height: 34, padding: "0 13px", borderRadius: 9, border: "1px solid rgba(203,108,220,0.3)", background: "rgba(203,108,220,0.08)", color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.76rem", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}
          >
            <MdEdit size={13} /> Change Brand
          </button>
        </div>
      </div>

      {/* Menu items strip */}
      {menuItems.length > 0 ? (
        <div style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)" }}>{menuItems.length} Menu Item{menuItems.length !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: 8 }}>· {MAX_MENU_ITEMS - menuItems.length} slot{MAX_MENU_ITEMS - menuItems.length !== 1 ? "s" : ""} left</span>
            </div>
            <button onClick={onManageMenu}
              style={{ height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <MdRestaurantMenu size={12} /> Manage
            </button>
          </div>
          {/* Menu cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {menuItems.map((item, idx) => {
              const name = item.name || item.menuItem?.name || "Item";
              const img = item.image || item.menuItem?.image;
              const price = item.sellingPrice || item.menuItem?.sellingPrice || 0;
              return (
                <div key={item.id || idx} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 11, overflow: "hidden" }}>
                  {img ? (
                    <img src={img} alt={name} style={{ width: "100%", height: 64, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: 64, background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MdRestaurantMenu size={20} style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                    </div>
                  )}
                  <div style={{ padding: "7px 8px" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    {price > 0 && <div style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700 }}>₦{fmt(price)}</div>}
                  </div>
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: MAX_MENU_ITEMS - menuItems.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ border: "1.5px dashed var(--border)", borderRadius: 11, height: 100, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
                <MdAdd size={16} style={{ color: "var(--text-muted)" }} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 11, cursor: "pointer" }} onClick={onChangeBrand}>
            <MdAdd size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No menu items — click to select</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Manage Existing Menu (after brand is set) ────────────────── */
function ManageMenuDrawer({ cart, onClose, onRefresh }) {
  const assignedVendor = cart.vendor;
  const [cartMenuItems, setCartMenuItems] = useState(cart.menuItems || []);
  const [vendorMenuItems, setVendorMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuPage, setMenuPage] = useState(1);
  const [pendingAdd, setPendingAdd] = useState([]);
  const [markupValues, setMarkupValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);
  const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  const MENU_PAGE_SIZE = 8;

  useEffect(() => {
    const vendorId = assignedVendor?.id || cart.menuItems?.[0]?.vendorId;
    if (!vendorId) return;
    setMenuLoading(true);
    api.get(`/vendor/menu?vendorId=${vendorId}&page=1&limit=100`)
      .then((r) => { const d = r.data.data; setVendorMenuItems(d?.items || (Array.isArray(d) ? d : d?.menuItems || d?.data || [])); })
      .catch(() => toast.error("Failed to load menu items"))
      .finally(() => setMenuLoading(false));
  }, []);

  const isPending = (id) => pendingAdd.some((p) => p.id === id);
  const isAdded = (id) => cartMenuItems.some((m) => m.id === id || m.menuItemId === id);
  const totalSelected = cartMenuItems.length + pendingAdd.length;
  const atLimit = totalSelected >= MAX_MENU_ITEMS;

  const togglePending = (item) => {
    if (isAdded(item.id)) return;
    setPendingAdd((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) return prev.filter((p) => p.id !== item.id);
      if (atLimit) { toast.error(`Max ${MAX_MENU_ITEMS} items`); return prev; }
      return [...prev, { id: item.id, markup: 0 }];
    });
    setMarkupValues((p) => ({ ...p, [item.id]: p[item.id] ?? "0" }));
  };

  const handleSave = async () => {
    if (!pendingAdd.length) return;
    setSaving(true);
    try {
      await api.post(`/icart/${cart.id}/menu-items`, { items: pendingAdd.map((p) => ({ id: p.id, markup: Number(markupValues[p.id] || 0) })) });
      toast.success(`${pendingAdd.length} item${pendingAdd.length !== 1 ? "s" : ""} added`);
      setPendingAdd([]); setMarkupValues({});
      const refreshed = await api.get(`/icart/${cart.id}`);
      setCartMenuItems(refreshed.data.data?.menuItems || []);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setRemoving(true);
    try {
      await api.delete(`/icart/${cart.id}/menu-items`, { data: { ids: [confirmRemove.id || confirmRemove.menuItemId] } });
      toast.success("Item removed");
      setConfirmRemove(null);
      setCartMenuItems((p) => p.filter((m) => m.id !== confirmRemove.id && m.menuItemId !== confirmRemove.id));
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setRemoving(false); }
  };

  const filteredMenu = vendorMenuItems.filter((m) => !menuSearch || m.name?.toLowerCase().includes(menuSearch.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredMenu.length / MENU_PAGE_SIZE));
  const pagedMenu = filteredMenu.slice((menuPage - 1) * MENU_PAGE_SIZE, menuPage * MENU_PAGE_SIZE);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "min(560px, 96vw)", background: "var(--bg-card)", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border)", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg-hover)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
            <MdClose size={16} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-heading)" }}>Manage Menu</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{totalSelected}/{MAX_MENU_ITEMS} items</div>
          </div>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, padding: "4px 10px", borderRadius: 999, background: atLimit ? "rgba(239,68,68,0.1)" : "var(--bg-active)", color: atLimit ? "#ef4444" : "var(--accent)", border: `1px solid ${atLimit ? "rgba(239,68,68,0.25)" : "rgba(203,108,220,0.3)"}` }}>
            {totalSelected}/{MAX_MENU_ITEMS}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          {/* Active items */}
          {cartMenuItems.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Active Items</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {cartMenuItems.map((item) => {
                  const name = item.name || item.menuItem?.name || "Item";
                  const img = item.image || item.menuItem?.image;
                  const price = item.sellingPrice || item.menuItem?.sellingPrice || 0;
                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 11 }}>
                      {img ? <img src={img} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdRestaurantMenu size={14} style={{ color: "var(--text-muted)" }} /></div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                        {price > 0 && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>₦{fmt(price)}</div>}
                      </div>
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", flexShrink: 0 }}>Active</span>
                      <button onClick={() => setConfirmRemove(item)} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MdClose size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add from brand */}
          <div style={{ fontSize: "0.62rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            Add from Brand {atLimit && <span style={{ color: "#ef4444" }}>— Limit reached</span>}
          </div>

          {vendorMenuItems.length > MENU_PAGE_SIZE && (
            <input className="modal-input" placeholder="Search menu…" value={menuSearch}
              onChange={(e) => { setMenuSearch(e.target.value); setMenuPage(1); }} style={{ marginBottom: 10 }} />
          )}

          {menuLoading ? (
            <div className="drawer_loading"><div className="page_loader_spinner" /></div>
          ) : vendorMenuItems.length === 0 ? (
            <div className="icart_empty_inline"><MdRestaurantMenu size={18} style={{ opacity: 0.3 }} /><span>No menu items available</span></div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {pagedMenu.map((item) => {
                  const added = isAdded(item.id);
                  const pending = isPending(item.id);
                  const disabled = !pending && !added && atLimit;
                  return (
                    <div key={item.id} style={{ background: pending ? "var(--bg-active)" : "var(--bg-hover)", border: `1.5px solid ${pending ? "rgba(203,108,220,0.4)" : "var(--border)"}`, borderRadius: 11, overflow: "hidden", opacity: disabled ? 0.45 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                        {item.image ? <img src={item.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdRestaurantMenu size={14} style={{ color: "var(--text-muted)" }} /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: 700, color: pending ? "var(--accent)" : "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                          {item.sellingPrice > 0 && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>₦{fmt(item.sellingPrice)}</div>}
                        </div>
                        {added ? <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)", flexShrink: 0 }}>Added</span>
                          : <button onClick={() => !disabled && togglePending(item)} style={{ width: 28, height: 28, borderRadius: 7, background: pending ? "var(--accent)" : "var(--bg-card)", border: `1px solid ${pending ? "var(--accent)" : "var(--border)"}`, color: pending ? "#fff" : "var(--text-muted)", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {pending ? <MdClose size={13} /> : <MdAdd size={14} />}
                          </button>
                        }
                      </div>
                      {pending && (
                        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 12px 9px" }}>
                          <label style={{ fontSize: "0.66rem", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Markup %</label>
                          <input className="modal-input" type="number" min="0" placeholder="0" value={markupValues[item.id] ?? "0"} onChange={(e) => setMarkupValues((p) => ({ ...p, [item.id]: e.target.value }))} style={{ height: 30, fontSize: "0.78rem", marginBottom: 0, flex: 1, maxWidth: 90 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  <button className="biz_icon_btn" onClick={() => setMenuPage((p) => Math.max(1, p - 1))} disabled={menuPage <= 1} style={{ width: 28, height: 28 }}>‹</button>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>{menuPage}/{totalPages}</span>
                  <button className="biz_icon_btn" onClick={() => setMenuPage((p) => Math.min(totalPages, p + 1))} disabled={menuPage >= totalPages} style={{ width: 28, height: 28 }}>›</button>
                </div>
              )}
            </>
          )}

          {pendingAdd.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                style={{ width: "100%", height: 42, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={handleSave} disabled={saving}>
                <span className="btn_text">Add {pendingAdd.length} Item{pendingAdd.length !== 1 ? "s" : ""}</span>
                {saving && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Remove Menu Item"
        description={`Remove "${confirmRemove?.name || confirmRemove?.menuItem?.name}" from this iCart?`}>
        <div className="modal-body">
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" onClick={() => setConfirmRemove(null)}>Cancel</button>
            <button className={`app_btn app_btn_confirm${removing ? " btn_loading" : ""}`}
              style={{ background: "#ef4444", position: "relative", minWidth: 110 }}
              onClick={handleRemove} disabled={removing}>
              <span className="btn_text">Remove</span>
              {removing && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── VendorMenuSection (root) ─────────────────────────────────── */
function VendorMenuSection({ cart, onUpdate, onRefresh }) {
  const [showBrandDrawer, setShowBrandDrawer] = useState(false);
  const [showManageDrawer, setShowManageDrawer] = useState(false);

  return (
    <>
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Brand & Menu</span>
      </div>

      <BrandIdleCard
        cart={cart}
        onChangeBrand={() => setShowBrandDrawer(true)}
        onManageMenu={() => setShowManageDrawer(true)}
      />

      {showBrandDrawer && (
        <BrandSelectionDrawer
          cart={cart}
          onClose={() => setShowBrandDrawer(false)}
          onDone={() => { setShowBrandDrawer(false); onRefresh(); }}
        />
      )}

      {showManageDrawer && (
        <ManageMenuDrawer
          cart={cart}
          onClose={() => setShowManageDrawer(false)}
          onRefresh={() => { onRefresh(); }}
        />
      )}
    </>
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
  const [showLiveStream, setShowLiveStream] = useState(false);

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/online`);
      onUpdate({ ...cart, isOnline: res.data.data?.isOnline ?? !cart.isOnline });
      toast.success(`Cart is now ${!cart.isOnline ? "online" : "offline"}`);
    } catch { toast.error("Failed to toggle online status"); }
    finally { setTogglingOnline(false); }
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const res = await api.patch(`/icart/${cart.id}/status/lock`);
      onUpdate({ ...cart, isLocked: res.data.data?.isLocked ?? !cart.isLocked });
      toast.success(`Cart is now ${!cart.isLocked ? "locked" : "unlocked"}`);
    } catch { toast.error("Failed to toggle lock status"); }
    finally { setTogglingLock(false); }
  };

  const handleSaveRadius = async () => {
    if (!radius || isNaN(radius)) return toast.error("Enter a valid radius");
    setSavingRadius(true);
    try {
      await api.patch(`/icart/service-radius/${cart.id}`, { serviceRadius: Number(radius) });
      onUpdate({ ...cart, serviceRadius: Number(radius) });
      toast.success("Service radius updated");
      setEditingRadius(false);
    } catch { toast.error("Failed to update radius"); }
    finally { setSavingRadius(false); }
  };


  const handleLocationSaved = (newLocation) => { setShowLocationForm(false); onUpdate({ ...cart, location: newLocation }); };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

  return (
    <div className="icart_tab_content">
      {/* ── Kitchen Controls ── */}
      <div className="drawer_section_title">Kitchen Controls</div>
      <div className="icart_toggles_block">
        <ToggleRow icon={cart.isOnline ? <MdWifi size={15} /> : <MdWifiOff size={15} />} label="Online Status" value={cart.isOnline} loading={togglingOnline} onToggle={handleToggleOnline} />
        <ToggleRow icon={cart.isLocked ? <MdLock size={15} /> : <MdLockOpen size={15} />} label="Kitchen Lock" value={cart.isLocked} loading={togglingLock} onToggle={handleToggleLock} />
        {/* Live Stream row */}
        <div className="icart_toggle_row" style={{ cursor: "pointer" }} onClick={() => setShowLiveStream(true)}>
          <div className="icart_toggle_left">
            <span className="profile_phone_date_icon"><MdVideocam size={15} /></span>
            <span className="icart_toggle_label">Live Stream</span>
          </div>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: "rgba(107,114,128,0.1)", color: "#6b7280", border: "1px solid rgba(107,114,128,0.2)" }}>View</span>
        </div>
      </div>

      {/* ── Service Radius ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>Service Radius</div>
      <div className="icart_radius_block">
        <div className="icart_radius_row">
          <span className="profile_phone_date_icon"><MdSignalCellularAlt size={15} /></span>
          <span className="icart_toggle_label">Radius</span>
          {editingRadius ? (
            <div className="icart_radius_edit">
              <input className="modal-input" style={{ width: 90, height: 34, padding: "0 10px", fontSize: "0.82rem" }} type="number" value={radius} onChange={(e) => setRadius(e.target.value)} placeholder="km" />
              <button className={`app_btn app_btn_confirm ${savingRadius ? "btn_loading" : ""}`} style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }} onClick={handleSaveRadius} disabled={savingRadius}>
                <span className="btn_text">Save</span>
                {savingRadius && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
              </button>
              <button className="app_btn app_btn_cancel" style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }} onClick={() => { setEditingRadius(false); setRadius(cart.serviceRadius || ""); }}>Cancel</button>
            </div>
          ) : (
            <div className="icart_radius_display">
              <span className="icart_meta_val">{cart.serviceRadius ? `${cart.serviceRadius} km` : <span className="icart_meta_muted">Not set</span>}</span>
              <button className="icart_icon_action_btn" onClick={() => setEditingRadius(true)}><MdEdit size={14} /></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Kitchen Info ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>Kitchen Info</div>
      <div className="icart_item_meta" style={{ marginBottom: 0 }}>
        <InfoRow label="Serial Number" value={cart.serialNumber} />
        <InfoRow label="Status" value={cart.status} />
        <InfoRow label="Owner" value={cart.owner?.name || cart.owner?.email} />
      </div>

      {/* ── Location ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Location</span>
        <button className="icart_icon_action_btn" style={{ marginLeft: "auto" }} title={cart.location ? "Change location" : "Add location"} onClick={() => setShowLocationForm((v) => !v)}>
          {cart.location ? <MdEdit size={14} /> : <MdAdd size={15} />}
        </button>
      </div>

      {showLocationForm ? (
        <LocationForm cartId={cart.id} onSaved={handleLocationSaved} onCancel={() => setShowLocationForm(false)} />
      ) : cart.location ? (
        <div className="icart_location_card">
          <div className="icart_location_icon_wrap"><MdLocationOn size={18} /></div>
          <div className="icart_location_info">
            <div className="icart_location_name">{cart.location.name}</div>
            {cart.location.address && <div className="icart_location_address">{cart.location.address}</div>}
            {(cart.location.lga || cart.location.city) && <div className="icart_location_address">{[cart.location.lga, cart.location.city].filter(Boolean).join(", ")}</div>}
            {cart.location.country && <div className="icart_location_address">{cart.location.country}</div>}
          </div>
        </div>
      ) : (
        <div className="icart_empty_inline"><MdLocationOn size={18} style={{ opacity: 0.3 }} /><span>No location assigned</span></div>
      )}

      {/* ── Brand & Menu ── */}
      <VendorMenuSection cart={cart} onUpdate={onUpdate} onRefresh={onRefresh} />

            {/* ── Operators ── */}
      <div className="drawer_section_title" style={{ marginTop: 24 }}>
        Operators<span className="icart_section_count" style={{ marginLeft: 8 }}>{cart.operators?.length || 0}</span>
      </div>

      {cart.operators?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.operators.map((op) => {
            const name = op.user?.fullName || op.user?.email || `Operator #${op.id.slice(0, 6).toUpperCase()}`;
            return (
              <div key={op.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div className="icart_operator_avatar" style={{ flexShrink: 0 }}>{name[0].toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="icart_operator_name">{name}</span>
                    {op.isApproved && <MdVerified size={14} style={{ color: "#16a34a", flexShrink: 0 }} />}
                  </div>
                  <div className="icart_operator_meta">
                    {op.user?.email && <span>{op.user.email}</span>}
                    {op.state?.name && <span style={{ marginLeft: op.user?.email ? 6 : 0 }}>{op.user?.email ? "· " : ""}{op.state.name}</span>}
                    {op.certification && <span style={{ marginLeft: 6 }}>· {op.certification}</span>}
                  </div>
                </div>
                <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "3px 9px", borderRadius: 999, flexShrink: 0, ...(op.isApproved ? { background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)" } : { background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" }) }}>
                  {op.isApproved ? "Active" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="icart_empty_inline"><MdPerson size={18} style={{ opacity: 0.3 }} /><span>No operators assigned</span></div>
      )}

      {/* ── Modals ── */}
      {showLiveStream && <LiveStreamModal onClose={() => setShowLiveStream(false)} />}
    </div>
  );
}