import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import ESignDrawer from "../../components/ESignDrawer";
import MapPicker from "./MapPicker";
import {
  MdStorefront,
  MdLocationOn,
  MdCheckCircle,
  MdOutlineReceiptLong,
  MdArrowBack,
  MdArrowForward,
  MdInfoOutline,
} from "react-icons/md";
import { LuStore, LuCloud } from "react-icons/lu";

export default function BuyFranchiseSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Steps: 1 = Location & Outlet Type, 2 = Select Brand, 3 = Review & Submit
  const [step, setStep] = useState(1);

  // Step 1: Location Form State
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
    city: "",
    lga: "",
    stateId: "",
    stateName: "",
    country: "Nigeria",
    latitude: "",
    longitude: "",
    outletType: "KIOSK", // "KIOSK" | "CLOUD_KITCHEN"
    notes: "",
  });

  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [detectingGPS, setDetectingGPS] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Step 2: Brands & Menus
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandMenuItems, setBrandMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Slots & Fees
  const [availableSlots, setAvailableSlots] = useState(null);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [countrySettings, setCountrySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [selectedOptionalPayments, setSelectedOptionalPayments] = useState([]);

  // Step 3 & 4: E-Sign & Submitting
  const [showSignDrawer, setShowSignDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load States
  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => {
        const stateList = res.data.data || [];
        setStates(stateList);
        if (stateList.length > 0 && !locationForm.stateId) {
          setLocationForm((prev) => ({
            ...prev,
            stateId: stateList[0].id,
            stateName: stateList[0].name,
            country: stateList[0].country || "Nigeria",
          }));
        }
      })
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  // Fetch Brands when moving to Step 2
  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const res = await api.get("/vendor/profile", { params: { limit: 100 } });
      const list = res.data.data?.vendors || (Array.isArray(res.data.data) ? res.data.data : []);
      setBrands(list.filter((b) => b.isPublic !== false));
    } catch {
      toast.error("Failed to load franchise brands");
    } finally {
      setLoadingBrands(false);
    }
  };

  const handleLocationChange = (key, val) => {
    setLocationForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleStateSelect = (stateId) => {
    const s = states.find((item) => item.id === stateId);
    setLocationForm((prev) => ({
      ...prev,
      stateId,
      stateName: s?.name || prev.stateName,
      country: s?.country || prev.country,
    }));
  };

  // GPS Auto-detection
  const detectGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setDetectingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationForm((p) => ({
          ...p,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setShowMap(true);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const geo = await r.json();
          const a = geo.address || {};
          setLocationForm((p) => ({
            ...p,
            name: p.name || a.neighbourhood || a.suburb || a.city || "",
            address: p.address || [a.road, a.house_number].filter(Boolean).join(" ") || a.display_name?.split(",")[0] || "",
            city: p.city || a.city || a.town || a.county || "",
            lga: p.lga || a.county || a.state_district || a.suburb || "",
            country: p.country || a.country || "Nigeria",
          }));
          toast.success("Location coordinates detected");
        } catch {
          toast.success("GPS coordinates detected");
        }
        setDetectingGPS(false);
      },
      (err) => {
        setDetectingGPS(false);
        toast.error("Failed to detect location coordinates");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapPick = (lat, lng) => {
    setLocationForm((p) => ({
      ...p,
      latitude: Number(lat).toFixed(6),
      longitude: Number(lng).toFixed(6),
    }));
  };

  // Step 1 Validation -> Proceed to Brand Selection
  const handleProceedToBrands = (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) return toast.error("Location name is required");
    if (!locationForm.address.trim()) return toast.error("Street address is required");
    if (!locationForm.city.trim()) return toast.error("City is required");
    if (!locationForm.lga.trim()) return toast.error("LGA is required");
    if (!locationForm.stateId) return toast.error("Please select a state");

    loadBrands();
    setStep(2);
  };

  // When a brand is chosen in Step 2
  const handleSelectBrand = async (brand) => {
    setSelectedBrand(brand);
    setLoadingMenu(true);

    try {
      const res = await api.get("/vendor/menu", {
        params: { vendorId: brand.id, page: 1, limit: 100 },
      });
      const items = res.data.data?.items || (Array.isArray(res.data.data) ? res.data.data : []);
      setBrandMenuItems(items);
    } catch {
      setBrandMenuItems([]);
    } finally {
      setLoadingMenu(false);
    }

    // Check slot availability at this location
    if (locationForm.latitude && locationForm.longitude && locationForm.stateId) {
      setCheckingSlots(true);
      try {
        const res = await api.get("/kiosk/available-slots", {
          params: {
            vendorId: brand.id,
            lat: locationForm.latitude,
            lng: locationForm.longitude,
            stateId: locationForm.stateId,
          },
        });
        setAvailableSlots(res.data.data?.availableSlots ?? null);
      } catch {
        setAvailableSlots(null);
      } finally {
        setCheckingSlots(false);
      }
    }

    // Load country settings for legal terms & fees
    const country = locationForm.country || "Nigeria";
    setLoadingSettings(true);
    try {
      const res = await api.get(`/kioskVendorApplication/settings/country/${encodeURIComponent(country)}`);
      setCountrySettings(res.data.data);
      // Initialize optional payments
      setSelectedOptionalPayments([]);
    } catch {
      setCountrySettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  const toggleOptionalPayment = (title) => {
    setSelectedOptionalPayments((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Fee Calculations
  const vendorPayments = Array.isArray(selectedBrand?.franchisePayments) ? selectedBrand.franchisePayments : [];
  const totalVendorPayments = vendorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const globalPayments = Array.isArray(countrySettings?.payments) ? countrySettings.payments : [];
  const currency = countrySettings?.currency || "NGN";

  const computedGlobalFee = globalPayments.reduce((sum, p) => {
    const isOptional = Boolean(p.optional || p.isOptional);
    if (isOptional && !selectedOptionalPayments.includes(p.title)) {
      return sum;
    }
    const isPercentage = Boolean(p.isPercentage);
    const amt = parseFloat(p.amount) || 0;
    return sum + (isPercentage ? totalVendorPayments * (amt / 100) : amt);
  }, 0);

  const totalFranchiseCost = totalVendorPayments + computedGlobalFee;

  // Submit Franchise Purchase with locationData
  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      const menuIds = brandMenuItems.map((m) => m.id);

      await api.post("/kiosk/buy-franchise", {
        locationData: {
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          city: locationForm.city.trim(),
          lga: locationForm.lga.trim(),
          country: locationForm.country || "Nigeria",
          stateId: locationForm.stateId,
          latitude: locationForm.latitude ? Number(locationForm.latitude) : 0,
          longitude: locationForm.longitude ? Number(locationForm.longitude) : 0,
          outletType: locationForm.outletType,
          notes: locationForm.notes.trim() || undefined,
        },
        brandId: selectedBrand.id,
        menuIds,
        selectedOptionalPayments,
        signatureName,
        terms,
        isSigned,
      });

      toast.success("Franchise purchase initiated! Please complete your invoice payment to deploy your Kitchen.");
      setShowSignDrawer(false);
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to initiate franchise purchase");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "10px 0 40px" }}>
      {/* ── Flow Progress Indicator ─────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{
            background: step === 1 ? "var(--accent)" : "var(--bg-card)",
            color: step === 1 ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "8px 18px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>1. Location &amp; Outlet Type</span>
          {locationForm.name && <MdCheckCircle size={15} color={step === 1 ? "#fff" : "var(--accent)"} />}
        </button>

        <span style={{ color: "var(--border)", fontWeight: 700 }}>→</span>

        <button
          type="button"
          disabled={!locationForm.name}
          onClick={() => locationForm.name && setStep(2)}
          style={{
            background: step === 2 ? "var(--accent)" : "var(--bg-card)",
            color: step === 2 ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "8px 18px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: locationForm.name ? "pointer" : "not-allowed",
            opacity: locationForm.name ? 1 : 0.6,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>2. Select Brand</span>
          {selectedBrand && <MdCheckCircle size={15} color={step === 2 ? "#fff" : "var(--accent)"} />}
        </button>

        <span style={{ color: "var(--border)", fontWeight: 700 }}>→</span>

        <button
          type="button"
          disabled={!selectedBrand}
          onClick={() => selectedBrand && setStep(3)}
          style={{
            background: step === 3 ? "var(--accent)" : "var(--bg-card)",
            color: step === 3 ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "8px 18px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: selectedBrand ? "pointer" : "not-allowed",
            opacity: selectedBrand ? 1 : 0.6,
          }}
        >
          <span>3. Review &amp; Sign</span>
        </button>
      </div>

      {/* ── STEP 1: INPUT LOCATION DETAILS & OUTLET TYPE ─── */}
      {step === 1 && (
        <form onSubmit={handleProceedToBrands} style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 6px" }}>
                1. Specify Location Details
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Enter the target location address where your new franchise outlet will be installed.
              </p>
            </div>

            {/* Outlet Type Selector */}
            <div style={{ marginBottom: 22 }}>
              <label className="modal-label" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8 }}>
                Select Outlet Type *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {
                    id: "KIOSK",
                    label: "Physical Kiosk",
                    desc: "Modular walk-up food cart / stand",
                    icon: LuStore,
                  },
                  {
                    id: "CLOUD_KITCHEN",
                    label: "Cloud Kitchen",
                    desc: "Delivery & virtual takeaway kitchen",
                    icon: LuCloud,
                  },
                ].map((type) => {
                  const isSelected = locationForm.outletType === type.id;
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleLocationChange("outletType", type.id)}
                      style={{
                        background: isSelected ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                        border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 12,
                        padding: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: isSelected ? "rgba(203,108,220,0.18)" : "var(--bg-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected ? "var(--accent)" : "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                          {type.label}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.2 }}>
                          {type.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Location Name *</label>
                <input
                  className="modal-input"
                  placeholder="e.g. Wuse II Plaza Stand"
                  value={locationForm.name}
                  onChange={(e) => handleLocationChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Street Address *</label>
                <input
                  className="modal-input"
                  placeholder="Street / Building name"
                  value={locationForm.address}
                  onChange={(e) => handleLocationChange("address", e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">City *</label>
                  <input
                    className="modal-input"
                    placeholder="e.g. Abuja"
                    value={locationForm.city}
                    onChange={(e) => handleLocationChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="modal-label">LGA *</label>
                  <input
                    className="modal-input"
                    placeholder="e.g. Municipal"
                    value={locationForm.lga}
                    onChange={(e) => handleLocationChange("lga", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">State *</label>
                <select
                  className="modal-input"
                  value={locationForm.stateId}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  disabled={statesLoading}
                  required
                >
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coordinates & Map Picker */}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label className="modal-label" style={{ margin: 0 }}>
                    Coordinates (for slot reservation)
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
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
                      }}
                    >
                      <MdLocationOn size={13} /> {detectingGPS ? "Detecting..." : "Detect GPS"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMap(!showMap)}
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
                      }}
                    >
                      🗺 {showMap ? "Hide Map" : "Pick on Map"}
                    </button>
                  </div>
                </div>

                {showMap && (
                  <div style={{ marginBottom: 12 }}>
                    <MapPicker
                      lat={locationForm.latitude}
                      lng={locationForm.longitude}
                      onPick={handleMapPick}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input
                    className="modal-input"
                    type="number"
                    step="any"
                    placeholder="Latitude (e.g. 9.0765)"
                    value={locationForm.latitude}
                    onChange={(e) => handleLocationChange("latitude", e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <input
                    className="modal-input"
                    type="number"
                    step="any"
                    placeholder="Longitude (e.g. 7.3986)"
                    value={locationForm.longitude}
                    onChange={(e) => handleLocationChange("longitude", e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Notes / Nearby Landmarks</label>
                <input
                  className="modal-input"
                  placeholder="Optional landmarks"
                  value={locationForm.notes}
                  onChange={(e) => handleLocationChange("notes", e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                className="app_btn app_btn_confirm"
                style={{ width: "100%", height: 44, fontSize: "0.88rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <span>Select Franchise Brand</span>
                <MdArrowForward size={18} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── STEP 2: SELECT BRAND ─────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 4px" }}>
                2. Choose Brand for {locationForm.outletType === "CLOUD_KITCHEN" ? "Cloud Kitchen" : "Physical Kiosk"}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Location: <strong>{locationForm.name}</strong> ({locationForm.city}, {locationForm.stateName})
              </p>
            </div>
            <button
              type="button"
              className="app_btn app_btn_cancel"
              style={{ height: 34, fontSize: "0.78rem" }}
              onClick={() => setStep(1)}
            >
              ← Edit Location
            </button>
          </div>

          {loadingBrands ? (
            <div className="page_loader" style={{ padding: "40px 0" }}>
              <div className="page_loader_spinner" />
            </div>
          ) : brands.length === 0 ? (
            <div className="kiosk_empty_state" style={{ padding: "40px 0" }}>
              <LuStore size={36} style={{ opacity: 0.3 }} />
              <p className="kiosk_empty_title">No Public Brands Available</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18 }}>
              {brands.map((brand) => {
                const isSelected = selectedBrand?.id === brand.id;
                const outlets = Array.isArray(brand.outletSupport) && brand.outletSupport.length > 0
                  ? brand.outletSupport
                  : ["KIOSK"];
                const supportsCurrentOutlet = outlets.includes(locationForm.outletType);
                const supportedStates = Array.isArray(brand.supportedStates) ? brand.supportedStates : [];
                const supportsCurrentState = supportedStates.length === 0 || (locationForm.stateId && supportedStates.includes(locationForm.stateId));
                const isEligible = supportsCurrentOutlet && supportsCurrentState;
                const payments = Array.isArray(brand.franchisePayments) ? brand.franchisePayments : [];
                const brandFeeTotal = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

                return (
                  <div
                    key={brand.id}
                    onClick={() => {
                      if (!supportsCurrentOutlet) {
                        return toast.error(`${brand.businessName} does not support ${locationForm.outletType === "CLOUD_KITCHEN" ? "Cloud Kitchens" : "Physical Kiosks"}.`);
                      }
                      if (!supportsCurrentState) {
                        return toast.error(`${brand.businessName} does not operate in ${locationForm.stateName || "the selected state"}.`);
                      }
                      handleSelectBrand(brand);
                      setStep(3);
                    }}
                    style={{
                      background: "var(--bg-card)",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : isEligible ? "var(--border)" : "rgba(239, 68, 68, 0.25)"}`,
                      borderRadius: 16,
                      padding: 20,
                      cursor: isEligible ? "pointer" : "not-allowed",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      position: "relative",
                      opacity: isEligible ? 1 : 0.6,
                    }}
                  >
                    <div>
                      {/* Brand Header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: brand.branding?.color || "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid var(--border)",
                          }}
                        >
                          {brand.branding?.logo ? (
                            <img
                              src={brand.branding.logo}
                              alt={brand.businessName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <MdStorefront size={24} color="#fff" />
                          )}
                        </div>
                        <div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                            {brand.businessName}
                          </h4>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {brand.branding?.tagline || "Verified Franchise Partner"}
                          </span>
                        </div>
                      </div>

                      {/* Outlet Support & State Eligibility Tags */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {outlets.map((ot) => (
                          <span
                            key={ot}
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background: ot === "KIOSK" ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)",
                              color: ot === "KIOSK" ? "#16a34a" : "#6366f1",
                              border: `1px solid ${ot === "KIOSK" ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.25)"}`,
                            }}
                          >
                            {ot === "KIOSK" ? "Physical Kiosk" : "Cloud Kitchen"}
                          </span>
                        ))}

                        {!supportsCurrentState && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.25)",
                            }}
                          >
                            Not in {locationForm.stateName || "State"}
                          </span>
                        )}

                        {!supportsCurrentOutlet && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 5,
                              background: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.25)",
                            }}
                          >
                            No {locationForm.outletType === "CLOUD_KITCHEN" ? "Kitchen" : "Kiosk"}
                          </span>
                        )}
                      </div>

                      {/* Slot Conflict Note */}
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "6px 8px", borderRadius: 6, marginBottom: 14 }}>
                        {brand.slotRadius || 30} km slot radius protection
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontSize: "0.66rem", color: "var(--text-muted)", display: "block" }}>
                          Franchise Fee
                        </span>
                        <span style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>
                          {brandFeeTotal > 0 ? `₦${brandFeeTotal.toLocaleString()}` : "Standard Terms"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`app_btn ${isEligible ? "app_btn_confirm" : "app_btn_cancel"}`}
                        style={{
                          height: 32,
                          fontSize: "0.75rem",
                          padding: "0 12px",
                          opacity: isEligible ? 1 : 0.6,
                          cursor: isEligible ? "pointer" : "not-allowed",
                        }}
                      >
                        {isEligible ? "Select & Review →" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: REVIEW & E-SIGN ──────────────────────── */}
      {step === 3 && selectedBrand && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Details Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Location & Outlet Card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  1. Outlet &amp; Location Summary
                </span>
                <button
                  type="button"
                  className="app_btn app_btn_cancel"
                  style={{ height: 30, fontSize: "0.72rem", padding: "0 10px" }}
                  onClick={() => setStep(1)}
                >
                  Edit Location
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(203,108,220,0.12)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {locationForm.outletType === "CLOUD_KITCHEN" ? <LuCloud size={22} /> : <LuStore size={22} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                      {locationForm.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background: locationForm.outletType === "CLOUD_KITCHEN" ? "rgba(99,102,241,0.1)" : "rgba(34,197,94,0.1)",
                        color: locationForm.outletType === "CLOUD_KITCHEN" ? "#6366f1" : "#16a34a",
                      }}
                    >
                      {locationForm.outletType === "CLOUD_KITCHEN" ? "Cloud Kitchen" : "Physical Kiosk"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                    {locationForm.address}, {locationForm.city}, {locationForm.stateName} ({locationForm.country})
                  </p>
                </div>
              </div>

              {/* Slot check indicator */}
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: checkingSlots
                    ? "var(--bg-hover)"
                    : availableSlots !== null && availableSlots <= 0
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(34,197,94,0.1)",
                  border: `1px solid ${checkingSlots
                      ? "var(--border)"
                      : availableSlots !== null && availableSlots <= 0
                        ? "rgba(239,68,68,0.3)"
                        : "rgba(34,197,94,0.3)"
                    }`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.76rem",
                }}
              >
                <MdInfoOutline size={16} />
                {checkingSlots ? (
                  <span>Checking slot availability...</span>
                ) : availableSlots !== null && availableSlots <= 0 ? (
                  <span style={{ color: "#ef4444", fontWeight: 600 }}>
                    Deployment warning: Slots for this brand are fully booked in this radius.
                  </span>
                ) : (
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
                    Location confirmed: Exclusivity slot is open for {selectedBrand.businessName}!
                  </span>
                )}
              </div>
            </div>

            {/* Brand & Menu Items Card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  2. Selected Brand &amp; Recipes
                </span>
                <button
                  type="button"
                  className="app_btn app_btn_cancel"
                  style={{ height: 30, fontSize: "0.72rem", padding: "0 10px" }}
                  onClick={() => setStep(2)}
                >
                  Change Brand
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: selectedBrand.branding?.color || "var(--bg-hover)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  {selectedBrand.branding?.logo ? (
                    <img
                      src={selectedBrand.branding.logo}
                      alt={selectedBrand.businessName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <MdStorefront size={22} color="#fff" />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                    {selectedBrand.businessName}
                  </h4>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                    {brandMenuItems.length} recipes and menu items deployed automatically
                  </span>
                </div>
              </div>

              {brandMenuItems.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                  {brandMenuItems.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 8,
                        textAlign: "center",
                      }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: "100%", height: 50, objectFit: "cover", borderRadius: 4, marginBottom: 4 }}
                        />
                      )}
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-heading)", display: "block" }}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checkout & E-Sign Sidebar */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
              position: "sticky",
              top: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MdOutlineReceiptLong size={20} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-heading)", margin: 0 }}>
                Franchise Investment
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Brand Fees
              </span>
              {vendorPayments.length === 0 ? (
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No custom brand fees configured.
                </div>
              ) : (
                vendorPayments.map((p, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                    <span style={{ color: "var(--text-body)" }}>{p.title}</span>
                    <strong style={{ color: "var(--text-heading)" }}>
                      {currency} {(parseFloat(p.amount) || 0).toLocaleString()}
                    </strong>
                  </div>
                ))
              )}

              {globalPayments.length > 0 && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Platform Setup &amp; Licensing
                  </span>
                  {globalPayments.map((p, idx) => {
                    const isPct = Boolean(p.isPercentage);
                    const amt = isPct
                      ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                      : parseFloat(p.amount) || 0;
                    const isOptional = Boolean(p.optional || p.isOptional);
                    const isChecked = selectedOptionalPayments.includes(p.title);

                    if (isOptional) {
                      return (
                        <label
                          key={idx}
                          onClick={() => toggleOptionalPayment(p.title)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.82rem",
                            padding: "7px 10px",
                            borderRadius: 8,
                            background: isChecked ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                            border: `1px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                            cursor: "pointer",
                            userSelect: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              style={{ accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
                            />
                            <div>
                              <span style={{ color: "var(--text-heading)", fontWeight: 600, display: "block" }}>
                                {p.title} {isPct ? `(${p.amount}%)` : ""}
                              </span>
                              <span style={{ fontSize: "0.68rem", color: isChecked ? "var(--accent)" : "var(--text-muted)" }}>
                                Optional add-on {p.description ? `• ${p.description}` : ""}
                              </span>
                            </div>
                          </div>
                          <strong style={{ color: isChecked ? "var(--text-heading)" : "var(--text-muted)" }}>
                            {currency} {amt.toLocaleString()}
                          </strong>
                        </label>
                      );
                    }

                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <span style={{ color: "var(--text-body)" }}>
                          {p.title} {isPct ? `(${p.amount}%)` : ""}
                        </span>
                        <strong style={{ color: "var(--text-heading)" }}>
                          {currency} {amt.toLocaleString()}
                        </strong>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div
              style={{
                paddingTop: 16,
                borderTop: "2px dashed var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)" }}>
                Total Due
              </span>
              <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--accent)" }}>
                {currency} {totalFranchiseCost.toLocaleString()}
              </span>
            </div>

            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 20 }}>
              An invoice will be generated. Once paid, your location and kitchen will be created automatically.
            </p>

            <button
              type="button"
              className="app_btn app_btn_confirm"
              style={{ width: "100%", height: 46, fontSize: "0.88rem", fontWeight: 800 }}
              disabled={submitting}
              onClick={() => setShowSignDrawer(true)}
            >
              Review &amp; Sign Agreement →
            </button>
          </div>
        </div>
      )}

      {/* ── E-SIGN DRAWER ─────────────────────────────────── */}
      {showSignDrawer && (
        <ESignDrawer
          isOpen={showSignDrawer}
          onClose={() => setShowSignDrawer(false)}
          title={`Franchise Agreement: ${selectedBrand?.businessName}`}
          description="Review the franchise licensing terms and provide your e-signature to complete your purchase."
          templateText={countrySettings?.terms}
          variables={{
            buyer_name: user?.fullName || user?.email || "Franchisee Partner",
            buyer_address: `${locationForm.address}, ${locationForm.city}, ${locationForm.stateName}`,
            brand_name: selectedBrand?.businessName || "Nora Brand Partner",
            purchase_price: totalFranchiseCost.toLocaleString(),
            currency: currency,
            outlet_type: locationForm.outletType === "CLOUD_KITCHEN" ? "Cloud Kitchen" : "Modular QSR Kiosk",
            location_address: `${locationForm.name} - ${locationForm.address}, ${locationForm.city}`,
          }}
          submitting={submitting}
          onSubmit={handleSignSubmit}
        />
      )}
    </div>
  );
}
