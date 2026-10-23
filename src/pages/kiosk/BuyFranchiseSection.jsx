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
  MdCheck,
} from "react-icons/md";
import { LuStore, LuCloud } from "react-icons/lu";

// Safe helper to parse bills from JSON string or array
const parseBills = (bills) => {
  if (!bills) return [];
  if (Array.isArray(bills)) return bills;
  if (typeof bills === "string") {
    try {
      const parsed = JSON.parse(bills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function BuyFranchiseSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Steps: 1 = Location & Outlet Type, 2 = Select Brand, 3 = Review & Submit
  const [step, setStep] = useState(1);

  // Step 1: Location Form State (for Kiosk)
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

  // Cloud Kitchen Specific State
  const [cloudStateId, setCloudStateId] = useState("");
  const [cloudLocations, setCloudLocations] = useState([]);
  const [loadingCloudLocations, setLoadingCloudLocations] = useState(false);
  const [selectedCloudLocation, setSelectedCloudLocation] = useState(null);

  // Step 2: Brands & Menus
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandMenuItems, setBrandMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);

  // Slots & Country Settings
  const [availableSlots, setAvailableSlots] = useState(null);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [countrySettings, setCountrySettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Payment Selection States:
  // For Kiosk: selectedKioskChoice allows choosing ONLY 1 optional payment that has "kiosk" in title
  const [selectedKioskChoice, setSelectedKioskChoice] = useState(null);
  // Other non-kiosk, non-cloud optional payments can be checked/unchecked
  const [selectedOtherOptional, setSelectedOtherOptional] = useState([]);

  // Step 3 & 4: E-Sign & Submitting
  const [showSignDrawer, setShowSignDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load States on mount
  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => {
        const stateList = res.data.data || [];
        setStates(stateList);
        if (stateList.length > 0) {
          const firstState = stateList[0];
          setCloudStateId(firstState.id);
          if (!locationForm.stateId) {
            setLocationForm((prev) => ({
              ...prev,
              stateId: firstState.id,
              stateName: firstState.name,
              country: firstState.country || "Nigeria",
            }));
          }
        }
      })
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  // Fetch Cloud Kitchen Locations when cloudStateId changes or when switching to CLOUD_KITCHEN
  const fetchCloudLocations = async (stateId) => {
    if (!stateId) return;
    setLoadingCloudLocations(true);
    try {
      const res = await api.get("/kiosk/location", {
        params: {
          outletType: "CLOUD_KITCHEN",
          stateId: stateId,
        },
      });
      const list = res.data.data?.locations || (Array.isArray(res.data.data) ? res.data.data : []);
      setCloudLocations(list);
      // Auto-select first if none selected or previous is not in current list
      setSelectedCloudLocation((prev) => {
        if (prev && list.some((l) => l.id === prev.id)) {
          return prev;
        }
        return list.length > 0 ? list[0] : null;
      });
    } catch {
      toast.error("Failed to load cloud kitchen locations");
      setCloudLocations([]);
      setSelectedCloudLocation(null);
    } finally {
      setLoadingCloudLocations(false);
    }
  };

  const handleCloudStateChange = (stateId) => {
    setCloudStateId(stateId);
    fetchCloudLocations(stateId);
  };

  const handleOutletTypeSelect = (type) => {
    setLocationForm((prev) => ({ ...prev, outletType: type }));
    if (type === "CLOUD_KITCHEN") {
      const targetStateId = cloudStateId || locationForm.stateId || (states[0]?.id || "");
      if (targetStateId) {
        setCloudStateId(targetStateId);
        fetchCloudLocations(targetStateId);
      }
    }
  };

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

  // GPS Auto-detection for physical kiosk
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
      () => {
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

  // Step 1 Validation -> Proceed to Brand Selection (KIOSK)
  const handleProceedKioskLocation = (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) return toast.error("Location name is required");
    if (!locationForm.address.trim()) return toast.error("Street address is required");
    if (!locationForm.city.trim()) return toast.error("City is required");
    if (!locationForm.lga.trim()) return toast.error("LGA is required");
    if (!locationForm.stateId) return toast.error("Please select a state");

    setSelectedCloudLocation(null);
    loadBrands();
    setStep(2);
  };

  // Step 1 Validation -> Proceed to Brand Selection (CLOUD KITCHEN)
  const handleProceedCloudKitchen = (e) => {
    e?.preventDefault();
    if (!selectedCloudLocation) {
      return toast.error("Please choose a cloud kitchen location to proceed");
    }
    const loc = selectedCloudLocation;
    const s = states.find((item) => item.id === loc.stateId);
    setLocationForm((prev) => ({
      ...prev,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      lga: loc.lga,
      stateId: loc.stateId,
      stateName: loc.state?.name || s?.name || prev.stateName,
      country: loc.country || "Nigeria",
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      outletType: "CLOUD_KITCHEN",
      notes: loc.notes || "",
    }));
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
    const checkLat = locationForm.latitude || selectedCloudLocation?.latitude;
    const checkLng = locationForm.longitude || selectedCloudLocation?.longitude;
    const checkStateId = locationForm.stateId || selectedCloudLocation?.stateId;

    if (checkLat && checkLng && checkStateId) {
      setCheckingSlots(true);
      try {
        const res = await api.get("/kiosk/available-slots", {
          params: {
            vendorId: brand.id,
            lat: checkLat,
            lng: checkLng,
            stateId: checkStateId,
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
    const country = locationForm.country || selectedCloudLocation?.country || selectedCloudLocation?.state?.country;
    setLoadingSettings(true);
    try {
      const res = await api.get(`/kioskVendorApplication/settings/country/${encodeURIComponent(country)}`);
      const sData = res.data.data;
      setCountrySettings(sData);

      // Initialize optional payments based on outlet type:
      const payments = Array.isArray(sData?.payments) ? sData.payments : [];
      if (locationForm.outletType === "KIOSK") {
        // Find optional payments that have "kiosk" in title -> auto-select first one or null
        const kioskOpt = payments.filter(
          (p) => Boolean(p.optional || p.isOptional) && /kiosk/i.test(p.title || "")
        );
        setSelectedKioskChoice(kioskOpt.length > 0 ? kioskOpt[0].title : null);
        setSelectedOtherOptional([]);
      } else {
        // CLOUD_KITCHEN: kiosk optional is null, cloud optional will be automatically appended as mandatory
        setSelectedKioskChoice(null);
        setSelectedOtherOptional([]);
      }
    } catch {
      setCountrySettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Toggle other optional payments
  const toggleOtherOptional = (title) => {
    setSelectedOtherOptional((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // ── Fee Calculations & Payment Partitioning ────────────────
  const vendorPayments = Array.isArray(selectedBrand?.franchisePayments) ? selectedBrand.franchisePayments : [];
  const totalVendorPayments = vendorPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const rawGlobalPayments = Array.isArray(countrySettings?.payments) ? countrySettings.payments : [];
  const currency = countrySettings?.currency || "NGN";

  // Filter global payments based on user requirement:
  // KIOSK: filter and remove all optional payments with "cloud" in their title
  // CLOUD_KITCHEN: filter and remove all payments that have "kiosk" in the title
  const filteredGlobalPayments = rawGlobalPayments.filter((p) => {
    const title = p.title || "";
    const isOptional = Boolean(p.optional || p.isOptional);
    if (locationForm.outletType === "KIOSK") {
      if (isOptional && /cloud/i.test(title)) return false;
      return true;
    } else {
      // CLOUD_KITCHEN: remove all payments with "kiosk" in title
      if (/kiosk/i.test(title)) return false;
      return true;
    }
  });

  // Categorize for UI and calculations:
  const mandatoryGlobalItems = filteredGlobalPayments.filter((p) => !Boolean(p.optional || p.isOptional));

  // If KIOSK: filter all optional payments with "kiosk" in title -> allow them to choose ONLY 1
  const kioskOptionalItems = locationForm.outletType === "KIOSK"
    ? filteredGlobalPayments.filter((p) => Boolean(p.optional || p.isOptional) && /kiosk/i.test(p.title))
    : [];

  // If CLOUD_KITCHEN: append all other optional payments with "cloud" in their title as mandatory (no checkbox)
  const cloudFixedItems = locationForm.outletType === "CLOUD_KITCHEN"
    ? filteredGlobalPayments.filter((p) => Boolean(p.optional || p.isOptional) && /cloud/i.test(p.title))
    : [];
  console.log(cloudFixedItems)
  // Other optional items (checkboxes)
  const otherOptionalItems = filteredGlobalPayments.filter((p) => {
    const isOptional = Boolean(p.optional || p.isOptional);
    if (!isOptional) return false;
    const title = p.title || "";
    if (locationForm.outletType === "KIOSK") {
      return !/kiosk/i.test(title) && !/cloud/i.test(title);
    } else {
      return !/cloud/i.test(title) && !/kiosk/i.test(title);
    }
  });

  // Location Bills (for Cloud Kitchen)
  const selectedLocationBills = locationForm.outletType === "CLOUD_KITCHEN" && selectedCloudLocation
    ? parseBills(selectedCloudLocation.bills)
    : [];
  const totalLocationBills = selectedLocationBills.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  // Compute Platform/Global Fees
  const computedGlobalFee = filteredGlobalPayments.reduce((sum, p) => {
    const isOptional = Boolean(p.optional || p.isOptional);
    const title = p.title || "";
    const isPct = Boolean(p.isPercentage);
    const amt = isPct
      ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
      : parseFloat(p.amount) || 0;

    if (locationForm.outletType === "KIOSK") {
      if (isOptional) {
        if (/kiosk/i.test(title)) {
          if (selectedKioskChoice !== title) return sum;
        } else {
          if (!selectedOtherOptional.includes(title)) return sum;
        }
      }
    } else {
      // CLOUD_KITCHEN
      if (isOptional) {
        if (/cloud/i.test(title)) {
          // Mandatory for cloud kitchen! Always include.
        } else {
          if (!selectedOtherOptional.includes(title)) return sum;
        }
      }
    }
    return sum + amt;
  }, 0);

  // Total Due: Brand Fees + Global Setup & Licensing + Location Facility Bills
  const totalFranchiseCost = totalVendorPayments + computedGlobalFee + totalLocationBills;

  // Submit Franchise Purchase
  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    if (!selectedBrand) return;
    setSubmitting(true);
    try {
      const menuIds = brandMenuItems.map((m) => m.id);

      // Determine selected optional payments to pass to invoice
      let finalOptionalPayments = [];
      if (locationForm.outletType === "KIOSK") {
        finalOptionalPayments = [...selectedOtherOptional];
        if (selectedKioskChoice) finalOptionalPayments.push(selectedKioskChoice);
      } else {
        // CLOUD_KITCHEN: include all cloud optional payments (mandatory when choosing cloud kitchen) + checked add-ons
        const cloudOptionalTitles = filteredGlobalPayments
          .filter((p) => Boolean(p.optional || p.isOptional) && /cloud/i.test(p.title))
          .map((p) => p.title);
        finalOptionalPayments = Array.from(new Set([...cloudOptionalTitles, ...selectedOtherOptional]));
      }

      const payload = {
        brandId: selectedBrand.id,
        menuIds,
        selectedOptionalPayments: finalOptionalPayments,
        signatureName,
        terms,
        isSigned,
      };

      if (locationForm.outletType === "CLOUD_KITCHEN" && selectedCloudLocation?.id) {
        payload.locationId = selectedCloudLocation.id;
      } else {
        payload.locationData = {
          name: locationForm.name.trim(),
          address: locationForm.address.trim(),
          city: locationForm.city.trim(),
          lga: locationForm.lga.trim(),
          country: locationForm.country || "Nigeria",
          stateId: locationForm.stateId,
          latitude: locationForm.latitude ? Number(locationForm.latitude) : 0,
          longitude: locationForm.longitude ? Number(locationForm.longitude) : 0,
          outletType: "KIOSK",
          notes: locationForm.notes.trim() || undefined,
        };
      }

      await api.post("/kiosk/buy-franchise", payload);

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
          {(locationForm.name || selectedCloudLocation) && (
            <MdCheckCircle size={15} color={step === 1 ? "#fff" : "var(--accent)"} />
          )}
        </button>

        <span style={{ color: "var(--border)", fontWeight: 700 }}>→</span>

        <button
          type="button"
          disabled={!locationForm.name && !selectedCloudLocation}
          onClick={() => (locationForm.name || selectedCloudLocation) && setStep(2)}
          style={{
            background: step === 2 ? "var(--accent)" : "var(--bg-card)",
            color: step === 2 ? "#fff" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: "8px 18px",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: (locationForm.name || selectedCloudLocation) ? "pointer" : "not-allowed",
            opacity: (locationForm.name || selectedCloudLocation) ? 1 : 0.6,
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

      {/* ── STEP 1: SELECT OUTLET TYPE & LOCATION DETAILS ── */}
      {step === 1 && (
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "1.18rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 6px" }}>
                1. Select Outlet Type &amp; Location
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Choose whether you want to deploy a customized physical kiosk cart or join a certified commercial cloud kitchen hub.
              </p>
            </div>

            {/* Outlet Type Selector */}
            <div style={{ marginBottom: 24 }}>
              <label className="modal-label" style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: 8 }}>
                Outlet Type *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  {
                    id: "KIOSK",
                    label: "Physical Kiosk",
                    desc: "Deploy a walk-up street cart or mall food stand",
                    icon: LuStore,
                  },
                  {
                    id: "CLOUD_KITCHEN",
                    label: "Cloud Kitchen",
                    desc: "Operate inside a shared commercial kitchen facility",
                    icon: LuCloud,
                  },
                ].map((type) => {
                  const isSelected = locationForm.outletType === type.id;
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleOutletTypeSelect(type.id)}
                      style={{
                        background: isSelected ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 12,
                        padding: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          background: isSelected ? "rgba(203,108,220,0.2)" : "var(--bg-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isSelected ? "var(--accent)" : "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={22} />
                      </div>
                      <div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                          {type.label}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.25 }}>
                          {type.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── KIOSK: LOCATION FORM DETAILS ── */}
            {locationForm.outletType === "KIOSK" ? (
              <form onSubmit={handleProceedKioskLocation}>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                  <div style={{ marginBottom: 14 }}>
                    <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                      Kiosk Installation Address
                    </h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Provide exact location details where your physical kiosk cart will operate.
                    </span>
                  </div>

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
                            {s.name} ({s.code || s.country})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Coordinates & Map Picker */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <label className="modal-label" style={{ margin: 0 }}>
                          Coordinates (for slot reservation &amp; radius verification)
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
                            <MdLocationOn size={13} /> {showMap ? "Hide Map" : "Pick on Map"}
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
            ) : (
              /* ── CLOUD KITCHEN: SELECT STATE & CHOOSE FROM EXISTING HUB LOCATIONS ── */
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 4px" }}>
                    Select Certified Cloud Kitchen Facility
                  </h4>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Choose a state and select an available commercial kitchen hub. Each facility lists its facility expenses and bills schedule.
                  </span>
                </div>

                <div className="form-field" style={{ marginBottom: 18 }}>
                  <label className="modal-label">Select State / Region *</label>
                  <select
                    className="modal-input"
                    value={cloudStateId}
                    onChange={(e) => handleCloudStateChange(e.target.value)}
                    disabled={statesLoading}
                  >
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.country})
                      </option>
                    ))}
                  </select>
                </div>

                {loadingCloudLocations ? (
                  <div className="page_loader" style={{ padding: "30px 0" }}>
                    <div className="page_loader_spinner" />
                  </div>
                ) : cloudLocations.length === 0 ? (
                  <div
                    style={{
                      padding: "36px 20px",
                      textAlign: "center",
                      background: "var(--bg-hover)",
                      borderRadius: 12,
                      border: "1px dashed var(--border)",
                      marginBottom: 20,
                    }}
                  >
                    <LuCloud size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: 8 }} />
                    <h5 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 4px", color: "var(--text-heading)" }}>
                      No Cloud Kitchens in this State
                    </h5>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                      No operational cloud kitchen hubs are registered for this state yet. Please select another state or switch to Physical Kiosk.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      Available Facilities ({cloudLocations.length}) — Click to choose 1:
                    </div>

                    {cloudLocations.map((loc) => {
                      const isSelected = selectedCloudLocation?.id === loc.id;
                      const bills = parseBills(loc.bills);
                      const billsSum = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

                      return (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedCloudLocation(loc)}
                          style={{
                            background: isSelected ? "rgba(99,102,241,0.06)" : "var(--bg-card)",
                            border: `2px solid ${isSelected ? "#6366f1" : "var(--border)"}`,
                            borderRadius: 14,
                            padding: "16px 18px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  background: isSelected ? "rgba(99,102,241,0.18)" : "var(--bg-hover)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: isSelected ? "#6366f1" : "var(--text-muted)",
                                  flexShrink: 0,
                                }}
                              >
                                <LuCloud size={22} />
                              </div>
                              <div>
                                <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", margin: "0 0 2px" }}>
                                  {loc.name}
                                </h4>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                  {loc.address}, {loc.city} ({loc.lga})
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                border: `2px solid ${isSelected ? "#6366f1" : "var(--border)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {isSelected && (
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#6366f1" }} />
                              )}
                            </div>
                          </div>

                          {loc.notes && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "5px 10px", borderRadius: 6 }}>
                              {loc.notes}
                            </div>
                          )}

                          {/* Display Bills alongside location */}
                          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                                Facility Bills &amp; Expenses Schedule
                              </span>
                              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isSelected ? "#6366f1" : "var(--text-heading)" }}>
                                Total: {loc.state.currency} {billsSum.toLocaleString()}
                              </span>
                            </div>

                            {bills.length === 0 ? (
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                No specific facility bills listed for this hub
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {bills.map((bill, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "0.75rem",
                                      background: "var(--bg-hover)",
                                      padding: "6px 10px",
                                      borderRadius: 6,
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ color: "var(--text-body)", fontWeight: 600 }}>{bill.title}</span>
                                      {bill.recurring && (
                                        <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                          {bill.intervalInDays ? `${bill.intervalInDays}d` : "Recurring"}
                                        </span>
                                      )}
                                      {bill.refundable && (
                                        <span style={{ fontSize: "0.62rem", color: "#16a34a", background: "rgba(22,163,74,0.12)", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                          Refundable
                                        </span>
                                      )}
                                    </div>
                                    <strong style={{ color: "var(--text-heading)" }}>
                                      {loc.state.currency} {(parseFloat(bill.amount) || 0).toLocaleString()}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleProceedCloudKitchen}
                    disabled={!selectedCloudLocation}
                    className="app_btn app_btn_confirm"
                    style={{ width: "100%", height: 44, fontSize: "0.88rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: selectedCloudLocation ? 1 : 0.6 }}
                  >
                    <span>Select Franchise Brand</span>
                    <MdArrowForward size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
                Selected Facility: <strong>{locationForm.name}</strong> ({locationForm.city}, {locationForm.stateName})
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
                              background: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                            }}
                          >
                            Unavailable in {locationForm.stateName || "State"}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: "0.78rem", color: "var(--text-body)", lineHeight: 1.4, margin: "0 0 14px" }}>
                        {brand.branding?.description || "High-growth fast-casual franchise concept with proven unit economics."}
                      </p>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>
                          Franchise License Fee
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-heading)" }}>
                          NGN {brandFeeTotal.toLocaleString()}
                        </strong>
                      </div>
                      <button
                        type="button"
                        disabled={!isEligible}
                        className="app_btn app_btn_confirm"
                        style={{ height: 32, fontSize: "0.75rem", padding: "0 14px", fontWeight: 700 }}
                      >
                        Select Brand →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: REVIEW FEES, LOCATION BILLS & E-SIGN ───── */}
      {step === 3 && selectedBrand && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 390px", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Location Card */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  1. Outlet Details
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
                    background: locationForm.outletType === "CLOUD_KITCHEN" ? "rgba(99,102,241,0.12)" : "rgba(203,108,220,0.12)",
                    color: locationForm.outletType === "CLOUD_KITCHEN" ? "#6366f1" : "var(--accent)",
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
                      {locationForm.outletType === "CLOUD_KITCHEN" ? "Commercial Cloud Kitchen Hub" : "Physical Kiosk Stand"}
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

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {/* Section 1: Brand Fees */}
              <div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Brand License Fees
                </span>
                {vendorPayments.length === 0 ? (
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No custom brand fees configured.
                  </div>
                ) : (
                  vendorPayments.map((p, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                      <span style={{ color: "var(--text-body)" }}>{p.title}</span>
                      <strong style={{ color: "var(--text-heading)" }}>
                        {currency} {(parseFloat(p.amount) || 0).toLocaleString()}
                      </strong>
                    </div>
                  ))
                )}
              </div>

              {/* Section 2: Location Bills (for Cloud Kitchen) */}
              {locationForm.outletType === "CLOUD_KITCHEN" && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Location Facility Bills
                      </span>
                      {selectedCloudLocation && (
                        <span style={{ fontSize: "0.68rem", color: "#6366f1", fontWeight: 700 }}>
                          {selectedCloudLocation.name}
                        </span>
                      )}
                    </div>

                    {selectedLocationBills.length === 0 ? (
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        No recurring facility bills configured for this location.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {selectedLocationBills.map((bill, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.82rem" }}>
                            <div>
                              <span style={{ color: "var(--text-body)", display: "block", fontWeight: 600 }}>{bill.title}</span>
                              <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                                {bill.recurring && (
                                  <span style={{ fontSize: "0.62rem", color: "#6366f1", background: "rgba(99,102,241,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                    {bill.intervalInDays ? `Every ${bill.intervalInDays}d` : "Recurring"}
                                  </span>
                                )}
                                {bill.refundable && (
                                  <span style={{ fontSize: "0.62rem", color: "#16a34a", background: "rgba(22,163,74,0.1)", padding: "1px 5px", borderRadius: 4 }}>
                                    Refundable Deposit
                                  </span>
                                )}
                              </div>
                            </div>
                            <strong style={{ color: "var(--text-heading)", marginLeft: 8 }}>
                              {currency} {(parseFloat(bill.amount) || 0).toLocaleString()}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Section 3: Platform Setup & Licensing */}
              {filteredGlobalPayments.length > 0 && (
                <>
                  <div style={{ height: 1, background: "var(--border)", margin: "2px 0" }} />
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Platform Setup &amp; Licensing
                    </span>

                    {/* Non-optional Platform Payments */}
                    {mandatoryGlobalItems.map((p, idx) => {
                      const isPct = Boolean(p.isPercentage);
                      const amt = isPct
                        ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                        : parseFloat(p.amount) || 0;
                      return (
                        <div key={`mand-${idx}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 4 }}>
                          <span style={{ color: "var(--text-body)" }}>
                            {p.title} {isPct ? `(${p.amount}%)` : ""}
                          </span>
                          <strong style={{ color: "var(--text-heading)" }}>
                            {currency} {amt.toLocaleString()}
                          </strong>
                        </div>
                      );
                    })}

                    {/* Cloud Kitchen Fixed Payments (appended without checkbox) */}
                    {locationForm.outletType === "CLOUD_KITCHEN" && cloudFixedItems.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                        {cloudFixedItems.map((p, idx) => {
                          const isPct = Boolean(p.isPercentage);
                          const amt = isPct
                            ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                            : parseFloat(p.amount) || 0;
                          return (
                            <div
                              key={`cloud-fix-${idx}`}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.82rem",
                                padding: "8px 10px",
                                borderRadius: 8,
                                background: "rgba(99,102,241,0.06)",
                                border: "1px solid rgba(99,102,241,0.2)",
                              }}
                            >
                              <div>
                                <span style={{ color: "var(--text-heading)", fontWeight: 700, display: "block" }}>
                                  {p.title} {isPct ? `(${p.amount}%)` : ""}
                                </span>
                                <span style={{ fontSize: "0.68rem", color: "#6366f1" }}>
                                  Mandatory cloud kitchen licensing {p.description ? `• ${p.description}` : ""}
                                </span>
                              </div>
                              <strong style={{ color: "var(--text-heading)" }}>
                                {currency} {amt.toLocaleString()}
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Kiosk Package Choice (Allow choosing ONLY 1) */}
                    {locationForm.outletType === "KIOSK" && kioskOptionalItems.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                          Kiosk Tier Package (Choose 1):
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {kioskOptionalItems.map((p, idx) => {
                            const isPct = Boolean(p.isPercentage);
                            const amt = isPct
                              ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                              : parseFloat(p.amount) || 0;
                            const isChecked = selectedKioskChoice === p.title;
                            return (
                              <label
                                key={`kiosk-opt-${idx}`}
                                onClick={() => setSelectedKioskChoice((prev) => (prev === p.title ? null : p.title))}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "0.82rem",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  background: isChecked ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                                  border: `1.5px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                                  cursor: "pointer",
                                  userSelect: "none",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <input
                                    type="radio"
                                    name="kioskChoice"
                                    checked={isChecked}
                                    onChange={() => { }}
                                    style={{ accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
                                  />
                                  <div>
                                    <span style={{ color: "var(--text-heading)", fontWeight: 600, display: "block" }}>
                                      {p.title} {isPct ? `(${p.amount}%)` : ""}
                                    </span>
                                    <span style={{ fontSize: "0.68rem", color: isChecked ? "var(--accent)" : "var(--text-muted)" }}>
                                      {p.description || "Kiosk specification tier"}
                                    </span>
                                  </div>
                                </div>
                                <strong style={{ color: isChecked ? "var(--text-heading)" : "var(--text-muted)" }}>
                                  {currency} {amt.toLocaleString()}
                                </strong>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Optional Add-ons (Checkboxes) */}
                    {otherOptionalItems.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                          Optional Add-ons:
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {otherOptionalItems.map((p, idx) => {
                            const isPct = Boolean(p.isPercentage);
                            const amt = isPct
                              ? totalVendorPayments * ((parseFloat(p.amount) || 0) / 100)
                              : parseFloat(p.amount) || 0;
                            const isChecked = selectedOtherOptional.includes(p.title);
                            return (
                              <label
                                key={`other-opt-${idx}`}
                                onClick={() => toggleOtherOptional(p.title)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "0.82rem",
                                  padding: "8px 10px",
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
                                    onChange={() => { }}
                                    style={{ accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
                                  />
                                  <div>
                                    <span style={{ color: "var(--text-heading)", fontWeight: 600, display: "block" }}>
                                      {p.title} {isPct ? `(${p.amount}%)` : ""}
                                    </span>
                                    <span style={{ fontSize: "0.68rem", color: isChecked ? "var(--accent)" : "var(--text-muted)" }}>
                                      {p.description || "Optional add-on service"}
                                    </span>
                                  </div>
                                </div>
                                <strong style={{ color: isChecked ? "var(--text-heading)" : "var(--text-muted)" }}>
                                  {currency} {amt.toLocaleString()}
                                </strong>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Total Due */}
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
              <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "var(--accent)" }}>
                {currency} {totalFranchiseCost.toLocaleString()}
              </span>
            </div>

            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4, marginBottom: 20 }}>
              An invoice will be generated. Once paid, your location bills and franchise deployment will be activated.
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
            outlet_type: locationForm.outletType === "CLOUD_KITCHEN" ? "Commercial Cloud Kitchen" : "Modular Physical Kiosk",
            location_address: `${locationForm.name} - ${locationForm.address}, ${locationForm.city}`,
          }}
          submitting={submitting}
          onSubmit={handleSignSubmit}
        />
      )}
    </div>
  );
}
