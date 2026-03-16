import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import {
  MdVerified,
  MdEdit,
  MdLocalShipping,
  MdExpandMore,
  MdExpandLess,
  MdUpload,
  MdBusiness,
  MdCheck,
  MdArrowForward,
  MdCalendarToday,
  MdSearch,
  MdClose,
  MdAttachMoney,
  MdImage,
} from "react-icons/md";
import { PiTruck } from "react-icons/pi";

/* ── helpers ──────────────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const STATUS = {
  PENDING: {
    color: "#ca8a04",
    bg: "rgba(234,179,8,0.1)",
    border: "rgba(234,179,8,0.25)",
    label: "Pending",
  },
  ACCEPTED: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.25)",
    label: "Accepted",
  },
  SHIPPED: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    border: "rgba(168,85,247,0.25)",
    label: "Shipped",
  },
  DELIVERED: {
    color: "#16a34a",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    label: "Delivered",
  },
  CANCELLED: {
    color: "#6b7280",
    bg: "rgba(107,114,128,0.1)",
    border: "rgba(107,114,128,0.2)",
    label: "Cancelled",
  },
};
const getS = (k) => STATUS[k] || STATUS.PENDING;

function Chip({ status }) {
  const s = getS(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.62rem",
        fontWeight: 800,
        padding: "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.color,
        }}
      />
      {s.label}
    </span>
  );
}

/* ── File upload ──────────────────────────────────────────── */
function FileInput({ label, accept = "image/*", onChange, currentUrl, hint }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [name, setName] = useState(null);
  const handle = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    setName(f.name);
    onChange(f);
  };
  return (
    <div className="form-field">
      <label className="modal-label">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          background: "var(--bg-hover)",
          border: "1px dashed var(--border)",
          borderRadius: 10,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              border: "1px solid var(--border)",
            }}
          />
        ) : (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--bg-active)",
              border: "1px solid rgba(203,108,220,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdUpload size={14} style={{ color: "var(--accent)" }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: name || preview ? "var(--text-body)" : "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name || (preview ? "Uploaded · change" : "Click to upload")}
          </div>
          {hint && (
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {hint}
            </div>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handle}
      />
    </div>
  );
}

/* ── Profile Form ─────────────────────────────────────────── */
function ProfileForm({ existing, onSaved, onCancel }) {
  const [name, setName] = useState(existing?.businessName || "");
  const [logo, setLogo] = useState(null);
  const [doc, setDoc] = useState(null);
  const [stateId, setStateId] = useState(existing?.state?.id || "");
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isEdit = !!existing;

  useEffect(() => {
    api
      .get("/config/state")
      .then((r) => setStates(r.data.data || []))
      .catch(() => toast.error("Failed to load states"))
      .finally(() => setStatesLoading(false));
  }, []);

  const submit = async () => {
    if (name.trim().length < 3)
      return toast.error("Business name must be at least 3 characters");
    if (!stateId) return toast.error("Please select your state");
    const fd = new FormData();
    fd.append("businessName", name.trim());
    fd.append("stateId", stateId);
    if (logo) fd.append("brandLogo", logo);
    if (doc) fd.append("businessRegDoc", doc);
    setSaving(true);
    try {
      await api[isEdit ? "put" : "post"](
        isEdit ? "/supplier/update-business" : "/supplier/register-business",
        fd,
      );
      toast.success(isEdit ? "Profile updated" : "Supplier profile created!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: 24,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "var(--bg-active)",
            border: "1px solid rgba(203,108,220,0.2)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdBusiness size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
            }}
          >
            {isEdit ? "Edit Profile" : "Become a Supplier"}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            {isEdit
              ? "Update your business details"
              : "Register to receive supply requests"}
          </div>
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Business Name *</label>
        <input
          className="modal-input"
          placeholder="e.g. Fresh Foods Nigeria Ltd"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">State *</label>
        <select
          className="modal-input"
          value={stateId}
          onChange={(e) => setStateId(e.target.value)}
          disabled={statesLoading}
        >
          <option value="">
            {statesLoading ? "Loading…" : "Select your state"}
          </option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.country ? ` — ${s.country}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FileInput
          label="Brand Logo"
          accept="image/*"
          currentUrl={existing?.brandLogo}
          onChange={setLogo}
          hint="PNG or JPG"
        />
        <FileInput
          label="Reg. Document"
          accept="image/*,application/pdf"
          currentUrl={existing?.businessRegDoc}
          onChange={setDoc}
          hint="PDF or image"
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {isEdit && onCancel && (
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 42 }}
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
          style={{ flex: 2, height: 42, position: "relative" }}
          onClick={submit}
          disabled={saving || statesLoading}
        >
          <span className="btn_text">
            {isEdit ? "Save Changes" : "Create Profile"}
          </span>
          {saving && (
            <span className="btn_loader" style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Profile Card ─────────────────────────────────────────── */
function ProfileCard({ profile, onEdit }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 28,
      }}
    >
      <div
        style={{
          height: 3,
          background: profile.isApproved
            ? "linear-gradient(90deg,#16a34a,#22c55e)"
            : "linear-gradient(90deg,#ca8a04,#eab308)",
        }}
      />
      <div style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {profile.brandLogo ? (
            <img
              src={profile.brandLogo}
              alt=""
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                objectFit: "cover",
                flexShrink: 0,
                border: "1px solid var(--border)",
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdBusiness size={24} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                }}
              >
                {profile.businessName}
              </span>
              {profile.isApproved && (
                <MdVerified
                  size={15}
                  style={{ color: "#16a34a", flexShrink: 0 }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
                padding: "2px 9px",
                borderRadius: 999,
                ...(profile.isApproved
                  ? {
                      background: "rgba(34,197,94,0.1)",
                      color: "#16a34a",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }
                  : {
                      background: "rgba(234,179,8,0.1)",
                      color: "#ca8a04",
                      border: "1px solid rgba(234,179,8,0.2)",
                    }),
              }}
            >
              {profile.isApproved ? "ACTIVE" : "PENDING APPROVAL"}
            </span>
          </div>
          <button onClick={onEdit} className="icart_icon_action_btn">
            <MdEdit size={14} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 7,
          }}
        >
          {[
            { label: "Email", value: profile.user?.email },
            { label: "State", value: profile.state?.name },
            { label: "Since", value: fmtDate(profile.createdAt) },
          ]
            .filter((m) => m.value)
            .map((m) => (
              <div
                key={m.label}
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 9,
                  padding: "8px 11px",
                }}
              >
                <div
                  style={{
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 2,
                  }}
                >
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          {profile.businessRegDoc && (
            <div
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "8px 11px",
              }}
            >
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 2,
                }}
              >
                Doc
              </div>
              <a
                href={profile.businessRegDoc}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  textDecoration: "none",
                }}
              >
                View <MdArrowForward size={10} />
              </a>
            </div>
          )}
        </div>

        {!profile.isApproved && (
          <div
            style={{
              marginTop: 12,
              padding: "9px 12px",
              background: "rgba(234,179,8,0.07)",
              border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: 9,
              fontSize: "0.76rem",
              color: "#ca8a04",
            }}
          >
            ⏳ Awaiting admin approval before you can receive supply requests.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Ingredient Search ────────────────────────────────────── */
function IngredientSearch({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const search = (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(
          `/library/ingredient?returnPrep=true&search=${encodeURIComponent(q)}&limit=8`,
        );
        const d = r.data.data;
        setResults([...(d?.ingredient || []), ...(d?.preps || [])]);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 12px",
          background: "var(--bg-hover)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        {value?.image ? (
          <img
            src={value.image}
            alt=""
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <MdSearch
            size={14}
            style={{ color: "var(--text-muted)", flexShrink: 0 }}
          />
        )}
        <input
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "0.82rem",
            color: "var(--text-body)",
            fontFamily: "inherit",
          }}
          placeholder="Search ingredient…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            search(e.target.value);
          }}
          onFocus={() => setOpen(true)}
        />
        {(query || value) && (
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
              setResults([]);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              padding: 0,
            }}
          >
            <MdClose size={12} />
          </button>
        )}
      </div>
      {open && query && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            zIndex: 60,
            maxHeight: 180,
            overflowY: "auto",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {searching ? (
            <div
              style={{
                padding: "10px 12px",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: "10px 12px",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              No results
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onChange(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdImage size={12} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {item.name}
                  </div>
                  {item.unit && (
                    <div
                      style={{
                        fontSize: "0.66rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.unit}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Review Panel ─────────────────────────────────────────── */
function ReviewPanel({ req, profile, onDone, onCancel }) {
  const firstItem = req.items?.[0];
  const [ingredient, setIngredient] = useState(firstItem?.ingredient || null);
  const [suppliedQty, setSuppliedQty] = useState(
    firstItem?.quantity?.toString() || "",
  );
  const [cannotSupply, setCannotSupply] = useState(false);
  const [price, setPrice] = useState("");
  const [showPrice, setShowPrice] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const savePrice = async () => {
    if (!ingredient || !price || !profile?.state?.id)
      return toast.error("Missing ingredient, price or state");
    setSavingPrice(true);
    try {
      await api.post("/library/ingredient/supplier-price", {
        ingredientId: ingredient.id,
        stateId: profile.state.id,
        price: Number(price),
      });
      toast.success("Price saved!");
      setPriceSaved(true);
      setShowPrice(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save price");
    } finally {
      setSavingPrice(false);
    }
  };

  const submit = async () => {
    if (!ingredient) return toast.error("Select an ingredient");
    const qty = cannotSupply ? 0 : Number(suppliedQty);
    if (!cannotSupply && (isNaN(qty) || qty <= 0))
      return toast.error("Enter a valid quantity");
    setSubmitting(true);
    try {
      // Build items — use supplier's selected ingredient.id for all items
      // (review confirms the ingredient being supplied against the request)
      const reviewItems =
        req.items?.length > 0
          ? req.items.map((item) => ({
              ingredientId: ingredient.id,
              suppliedQuantity: qty,
            }))
          : [{ ingredientId: ingredient.id, suppliedQuantity: qty }];

      await api.patch(`/icart/supply/${req.id}/review`, { items: reviewItems });
      toast.success(
        cannotSupply ? "Submitted — 0 supplied" : "Request accepted!",
      );
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 800,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Review Request
      </div>

      {/* Ingredient */}
      <div>
        <label className="modal-label">Ingredient *</label>
        <IngredientSearch
          value={ingredient}
          onChange={(item) => {
            setIngredient(item);
            setPriceSaved(false);
            setShowPrice(false);
          }}
        />
        {ingredient && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {ingredient.unit && `Unit: ${ingredient.unit}`}
            </span>
            {!priceSaved ? (
              <button
                onClick={() => setShowPrice((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: 0,
                }}
              >
                <MdAttachMoney size={13} />
                {showPrice ? "Cancel" : "Set Price"}
              </button>
            ) : (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#16a34a",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <MdCheck size={12} />
                Price saved
              </span>
            )}
          </div>
        )}
      </div>

      {/* Price input */}
      {showPrice && ingredient && (
        <div
          style={{
            background: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Price per {ingredient.unit || "unit"} for {ingredient.name}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                ₦
              </span>
              <input
                className="modal-input"
                type="number"
                style={{ paddingLeft: 24 }}
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <button
              className={`app_btn app_btn_confirm${savingPrice ? " btn_loading" : ""}`}
              style={{
                height: 40,
                padding: "0 16px",
                fontSize: "0.78rem",
                position: "relative",
                flexShrink: 0,
              }}
              onClick={savePrice}
              disabled={savingPrice || !price}
            >
              <span className="btn_text">Save</span>
              {savingPrice && (
                <span
                  className="btn_loader"
                  style={{ width: 12, height: 12 }}
                />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <label className="modal-label" style={{ margin: 0 }}>
            Quantity to Supply
          </label>
          <button
            onClick={() => setCannotSupply((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: cannotSupply ? "#ef4444" : "var(--text-muted)",
              fontSize: "0.7rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            {cannotSupply ? "✕ Can't supply" : "Can't supply?"}
          </button>
        </div>
        {cannotSupply ? (
          <div
            style={{
              padding: "9px 12px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 9,
              fontSize: "0.78rem",
              color: "#ef4444",
              fontWeight: 600,
            }}
          >
            Will submit 0 as supplied quantity
          </div>
        ) : (
          <input
            className="modal-input"
            type="number"
            placeholder={`Requested: ${firstItem?.quantity?.toLocaleString() || "—"}`}
            value={suppliedQty}
            onChange={(e) => setSuppliedQty(e.target.value)}
          />
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="app_btn app_btn_cancel"
          style={{ flex: 1, height: 38 }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
          style={{ flex: 2, height: 38, position: "relative" }}
          onClick={submit}
          disabled={submitting}
        >
          <span className="btn_text">
            {cannotSupply ? "Submit (0 supplied)" : "Submit Review"}
          </span>
          {submitting && (
            <span className="btn_loader" style={{ width: 13, height: 13 }} />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Supply Card ──────────────────────────────────────────── */
function SupplyCard({ req, profile, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [shipping, setShipping] = useState(false);
  const s = getS(req.status);
  const cartSerial =
    req.cart?.serialNumber ||
    `#${(req.cartId || "").slice(0, 8).toUpperCase()}`;

  const ship = async () => {
    setShipping(true);
    try {
      await api.post(`/icart/supply/${req.id}/ship`);
      toast.success("Marked as shipped");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setShipping(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Colour stripe */}
      <div style={{ height: 3, background: s.color }} />
      <div style={{ padding: "14px 16px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                  fontFamily: "monospace",
                }}
              >
                #{req.id.slice(0, 8).toUpperCase()}
              </span>
              <Chip status={req.status} />
            </div>
            <div
              style={{
                fontSize: "0.71rem",
                color: "var(--text-muted)",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                🛒 {cartSerial}
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
              >
                <MdCalendarToday size={10} />
                {fmtDate(req.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setExpanded((v) => !v);
              if (reviewing) setReviewing(false);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              flexShrink: 0,
            }}
          >
            {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
          </button>
        </div>

        {/* Ingredient chips */}
        {req.items?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 5,
              marginBottom: 12,
            }}
          >
            {req.items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 9px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                }}
              >
                {item.ingredient?.image && (
                  <img
                    src={item.ingredient.image}
                    alt=""
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: 3,
                      objectFit: "cover",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {item.ingredient?.name || "Item"}
                </span>
                <span
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    color: s.color,
                  }}
                >
                  · {item.quantity?.toLocaleString()}
                  {item.ingredient?.unit || ""}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {req.status === "PENDING" && !reviewing && (
          <button
            className="app_btn app_btn_confirm"
            style={{
              height: 36,
              padding: "0 16px",
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
            onClick={() => setReviewing(true)}
          >
            <MdCheck size={13} /> Review & Accept
          </button>
        )}
        {req.status === "ACCEPTED" && (
          <button
            className={`app_btn app_btn_confirm${shipping ? " btn_loading" : ""}`}
            style={{
              height: 36,
              padding: "0 16px",
              fontSize: "0.78rem",
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
            onClick={ship}
            disabled={shipping}
          >
            <span className="btn_text">
              <MdLocalShipping size={13} /> Mark as Shipped
            </span>
            {shipping && (
              <span className="btn_loader" style={{ width: 12, height: 12 }} />
            )}
          </button>
        )}
        {req.status === "SHIPPED" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.2)",
              borderRadius: 8,
              fontSize: "0.74rem",
              color: "#a855f7",
              fontWeight: 600,
            }}
          >
            📦 Awaiting confirmation from operator / cart owner
          </div>
        )}
        {req.status === "DELIVERED" && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 8,
              fontSize: "0.74rem",
              color: "#16a34a",
              fontWeight: 600,
            }}
          >
            <MdCheck size={13} /> Delivered
          </div>
        )}

        {/* Review panel */}
        {reviewing && (
          <ReviewPanel
            req={req}
            profile={profile}
            onDone={() => {
              setReviewing(false);
              onRefresh();
            }}
            onCancel={() => setReviewing(false)}
          />
        )}

        {/* Expanded detail */}
        {expanded && !reviewing && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7,
              }}
            >
              {[
                {
                  label: "Supplied Qty",
                  value:
                    req.suppliedQuantity != null
                      ? req.suppliedQuantity.toLocaleString()
                      : null,
                },
                {
                  label: "Updated",
                  value:
                    req.updatedAt !== req.createdAt
                      ? fmtDate(req.updatedAt)
                      : null,
                },
              ]
                .filter((r) => r.value)
                .map((r) => (
                  <div
                    key={r.label}
                    style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 2,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────── */
export default function SupplierHome() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const fetchProfile = async () => {
    try {
      const r = await api.get("/supplier/me");
      setProfile(r.data.data);
    } catch {
      setProfile(null);
    }
  };

  const fetchReqs = async () => {
    setReqLoading(true);
    try {
      const r = await api.get("/icart/supply");
      const d = r.data.data;
      setRequests(Array.isArray(d) ? d : d?.items || []);
    } catch {
      toast.error("Failed to load supply requests");
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
    fetchReqs();
  }, []);

  const filtered =
    filter === "ALL" ? requests : requests.filter((r) => r.status === filter);
  const pending = requests.filter((r) => r.status === "PENDING").length;

  if (loading)
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );

  return (
    <div className="page_wrapper">
      {/* Header */}
      <div className="icart_page_header">
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginBottom: 3,
            }}
          >
    
            <h2 className="page_title_big m-0">Supplier</h2>
          </div>
          <p
            className="welcome_message"
            style={{ marginBottom: 0}}
          >
            Manage your business and fulfil supply requests
          </p>
        </div>
        {pending > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.25)",
              borderRadius: 999,
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#ca8a04",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ca8a04",
              }}
            />
            {pending} pending
          </span>
        )}
      </div>

      {/* Profile */}
      {!profile || editing ? (
        <ProfileForm
          existing={editing ? profile : null}
          onSaved={() => {
            setEditing(false);
            fetchProfile();
          }}
          onCancel={editing ? () => setEditing(false) : undefined}
        />
      ) : (
        <ProfileCard profile={profile} onEdit={() => setEditing(true)} />
      )}

      {/* Requests */}
      {profile && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span className="icart_section_label">Supply Requests</span>
            <span className="icart_section_count">{requests.length}</span>
          </div>

          {requests.length > 0 && (
            <div className="icart_sub_nav" style={{ marginBottom: 14 }}>
              {["ALL", ...Object.keys(STATUS)].map((k) => {
                const count =
                  k === "ALL"
                    ? requests.length
                    : requests.filter((r) => r.status === k).length;
                if (k !== "ALL" && count === 0) return null;
                const ps = k !== "ALL" ? getS(k) : null;
                return (
                  <button
                    key={k}
                    className={`icart_sub_nav_btn ${filter === k ? "icart_sub_nav_active" : ""}`}
                    style={
                      filter === k && ps
                        ? {
                            color: ps.color,
                            borderColor: ps.border,
                            background: ps.bg,
                          }
                        : {}
                    }
                    onClick={() => setFilter(k)}
                  >
                    {k === "ALL" ? "All" : STATUS[k].label}
                    {count > 0 && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: "0.61rem",
                          fontWeight: 800,
                          opacity: 0.75,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {reqLoading ? (
            <div className="drawer_loading">
              <div className="page_loader_spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="icart_empty_state" style={{ padding: "40px 0" }}>
              <MdLocalShipping size={28} style={{ opacity: 0.25 }} />
              <p className="icart_empty_title">
                {requests.length === 0
                  ? "No supply requests yet"
                  : `No ${filter.toLowerCase()} requests`}
              </p>
              <p className="icart_empty_sub">
                {requests.length === 0
                  ? "Once approved, requests from iCart operators will appear here."
                  : "Try a different filter."}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((req) => (
                <SupplyCard
                  key={req.id}
                  req={req}
                  profile={profile}
                  onRefresh={fetchReqs}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
