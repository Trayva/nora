import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
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
  MdOutlineLocationOn,
  MdOutlinePriceChange,
  MdContentCopy,
  MdMap,
  MdFilterList,
  MdOutlineInventory2,
  MdRefresh,
  MdCircle,
} from "react-icons/md";
import { PiTruck } from "react-icons/pi";
import api from "../../../api/axios";
import Drawer from "../../../components/Drawer";

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
  SUPPLIER_REVIEWED: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    label: "Reviewed",
  },
};
const getS = (k) => STATUS[k] || STATUS.PENDING;

function Chip({ status, small }) {
  const s = getS(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: small ? "0.58rem" : "0.62rem",
        fontWeight: 800,
        padding: small ? "1px 7px" : "2px 9px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      <MdCircle size={4} />
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
      {/* <div
        style={{
          height: 3,
          background: profile.isApproved
            ? "linear-gradient(90deg,#16a34a,#22c55e)"
            : "linear-gradient(90deg,#ca8a04,#eab308)",
        }}
      /> */}
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
                <MdVerified size={15} style={{ color: "#16a34a" }} />
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

/* ── Inline Price editor (inside drawer) ─────────────────── */
function InlinePrice({ ingredientId, stateId }) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMyPrice = () => {
    if (!ingredientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/library/ingredient/supplier/my-prices", {
        params: { ingredientId },
      })
      .then((r) => {
        const list = r.data?.data?.data || [];
        const entry = list.find((p) => p.ingredientId === ingredientId);
        const p = entry?.price != null ? Number(entry.price) : null;
        setPrice(p);
        if (p != null) setVal(String(p));
      })
      .catch(() => setPrice(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyPrice();
  }, [ingredientId]);

  const save = async () => {
    if (!val || isNaN(Number(val)) || Number(val) < 0)
      return toast.error("Enter a valid price");
    setSaving(true);
    try {
      const res = await api.post("/library/ingredient/supplier-price", {
        ingredientId,
        stateId,
        price: Number(val),
      });
      const saved =
        res.data?.data?.price != null
          ? Number(res.data.data.price)
          : Number(val);
      setPrice(saved);
      setVal(String(saved));
      setEditing(false);
      toast.success("Price saved");
      fetchMyPrice();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="page_loader_spinner" style={{ width: 12, height: 12 }} />
    );

  if (editing)
    return (
      <div
        style={{ display: "flex", gap: 5, alignItems: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 7,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          >
            ₦
          </span>
          <input
            className="modal-input"
            type="number"
            min="0"
            autoFocus
            style={{
              paddingLeft: 20,
              height: 28,
              width: 90,
              fontSize: "0.76rem",
              marginBottom: 0,
            }}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        </div>
        <button
          className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
          style={{
            height: 28,
            padding: "0 10px",
            fontSize: "0.7rem",
            position: "relative",
          }}
          onClick={save}
          disabled={saving}
        >
          <span className="btn_text">Save</span>
          {saving && (
            <span className="btn_loader" style={{ width: 10, height: 10 }} />
          )}
        </button>
        <button
          className="app_btn app_btn_cancel"
          style={{ height: 28, padding: "0 8px", fontSize: "0.7rem" }}
          onClick={() => setEditing(false)}
        >
          ✕
        </button>
      </div>
    );

  if (price != null)
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 6,
          padding: "2px 8px",
          cursor: "pointer",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#16a34a",
        }}
      >
        <MdAttachMoney size={12} />₦{fmt(price)}
        <MdEdit size={10} style={{ opacity: 0.6 }} />
      </button>
    );

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{
        background: "rgba(239,68,68,0.06)",
        border: "1px solid rgba(239,68,68,0.15)",
        borderRadius: 6,
        padding: "2px 8px",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "#ef4444",
      }}
    >
      <MdAttachMoney size={12} />
      No price — Set
    </button>
  );
}

/* ── Review Panel ─────────────────────────────────────────── */
function ReviewPanel({ req, onDone, onCancel }) {
  const [qtys, setQtys] = useState(() =>
    Object.fromEntries(
      (req.items || []).map((it) => [it.id, it.quantity?.toString() || ""]),
    ),
  );
  const [cannotSupply, setCannotSupply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!cannotSupply) {
      const invalid = (req.items || []).some(
        (it) => isNaN(Number(qtys[it.id])) || Number(qtys[it.id]) < 0,
      );
      if (invalid) return toast.error("Enter valid quantities for all items");
    }
    setSubmitting(true);
    try {
      await api.patch(`/icart/supply/${req.id}/review`, {
        items: (req.items || []).map((it) => ({
          id: it.id,
          suppliedQuantity: cannotSupply ? 0 : Number(qtys[it.id] || 0),
        })),
      });
      toast.success(
        cannotSupply ? "Submitted — 0 supplied" : "Review submitted!",
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
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Will submit 0 as supplied quantity for all items
        </div>
      ) : (
        (req.items || []).map((it) => (
          <div
            key={it.id}
            style={{
              background: "var(--bg-hover)",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {it.ingredient?.image ? (
                <img
                  src={it.ingredient.image}
                  alt=""
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "var(--bg-card)",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {it.ingredient?.name || "Item"}
                </div>
                <div
                  style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}
                >
                  Requested: {it.quantity?.toLocaleString()}
                  {it.ingredient?.unit || ""}
                </div>
              </div>
            </div>
            <input
              className="modal-input"
              type="number"
              min="0"
              style={{ marginBottom: 0 }}
              placeholder={`Qty to supply (of ${it.quantity?.toLocaleString()}${it.ingredient?.unit || ""})`}
              value={qtys[it.id] || ""}
              onChange={(e) =>
                setQtys((p) => ({ ...p, [it.id]: e.target.value }))
              }
            />
          </div>
        ))
      )}
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

/* ── Request Drawer ───────────────────────────────────────── */
function RequestDrawer({ req, profile, onClose, onRefresh }) {
  const [reviewing, setReviewing] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(true);
  if (!req) return null;

  const s = getS(req.status);
  const loc = req.cart?.location;
  const mapsUrl =
    loc?.latitude && loc?.longitude
      ? `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`
      : loc?.address
        ? `https://www.google.com/maps/search/${encodeURIComponent([loc.address, loc.city].filter(Boolean).join(", "))}`
        : null;

  const copyMaps = () => {
    if (!mapsUrl) return;
    navigator.clipboard
      .writeText(mapsUrl)
      .then(() => toast.success("Maps link copied!"))
      .catch(() => toast.error("Copy failed"));
  };

  const ship = async () => {
    setShipping(true);
    try {
      await api.post(`/icart/supply/${req.id}/ship`);
      toast.success("Marked as shipped");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setShipping(false);
    }
  };

  return (
    <Drawer
      isOpen={!!req}
      onClose={onClose}
      title={`#${req.id.slice(0, 8).toUpperCase()}`}
      description={req.cart?.serialNumber || ""}
      width={480}
    >
      {/* Status + date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Chip status={req.status} />
        <span
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <MdCalendarToday size={11} />
          {fmtDate(req.createdAt)}
        </span>
        {req.totalAmount > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--accent)",
            }}
          >
            ₦{Number(req.totalAmount).toLocaleString()}
          </span>
        )}
      </div>

      {/* Location */}
      {loc && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "10px 12px",
            background: "var(--bg-hover)",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <MdOutlineLocationOn
            size={15}
            style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--text-body)",
              }}
            >
              {loc.name}
            </div>
            {(loc.address || loc.city) && (
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {[loc.address, loc.city, loc.country]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
          </div>
          {mapsUrl && (
            <div style={{ display: "flex", gap: 4 }}>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in Maps"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "rgba(59,130,246,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <MdMap size={14} />
              </a>
              <button
                onClick={copyMaps}
                title="Copy link"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "rgba(59,130,246,0.1)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                  flexShrink: 0,
                }}
              >
                <MdContentCopy size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Requester */}
      {req.requester && (
        <div style={{ marginBottom: 16 }}>
          <div className="drawer_section_title" style={{ marginBottom: 8 }}>
            Requester
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}
          >
            {[
              { label: "Name", value: req.requester?.fullName },
              { label: "Phone", value: req.requester?.phone },
              { label: "Email", value: req.requester?.email },
            ]
              .filter((r) => r.value)
              .map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: "var(--bg-hover)",
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
                    {r.label}
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
                    {r.value}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Ingredients — collapsible */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setItemsOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0 0 10px",
            fontFamily: "inherit",
            width: "100%",
          }}
        >
          <span
            className="drawer_section_title"
            style={{ margin: 0, flex: 1, textAlign: "left" }}
          >
            Ingredients ({req.items?.length || 0})
          </span>
          {itemsOpen ? (
            <MdExpandLess size={15} style={{ color: "var(--text-muted)" }} />
          ) : (
            <MdExpandMore size={15} style={{ color: "var(--text-muted)" }} />
          )}
        </button>
        {itemsOpen &&
          (req.items || []).map((it, i) => {
            const ing = it.ingredient;
            return (
              <div
                key={it.id || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                {ing?.image ? (
                  <img
                    src={ing.image}
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
                      background: "var(--bg-hover)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MdOutlineInventory2
                      size={15}
                      style={{ color: "var(--text-muted)" }}
                    />
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
                    {ing?.name || "Item"}
                  </div>
                  <div
                    style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}
                  >
                    {it.quantity?.toLocaleString()}
                    {ing?.unit || ""}
                    {it.suppliedQuantity != null &&
                      ` · ✓ Supplied: ${it.suppliedQuantity.toLocaleString()}${ing?.unit || ""}`}
                  </div>
                </div>
                <InlinePrice
                  ingredientId={ing?.id || it.ingredientId}
                  stateId={profile?.state?.id}
                />
              </div>
            );
          })}
      </div>

      {/* Actions */}
      <div
        style={{
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {req.status === "PENDING" && !reviewing && (
          <button
            className="app_btn app_btn_confirm"
            style={{
              height: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={() => setReviewing(true)}
          >
            <MdCheck size={15} /> Review & Accept
          </button>
        )}
        {req.status === "ACCEPTED" && (
          <button
            className={`app_btn app_btn_confirm${shipping ? " btn_loading" : ""}`}
            style={{
              height: 40,
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={ship}
            disabled={shipping}
          >
            <span className="btn_text">
              <MdLocalShipping size={15} /> Mark as Shipped
            </span>
            {shipping && (
              <span className="btn_loader" style={{ width: 14, height: 14 }} />
            )}
          </button>
        )}
        {req.status === "SHIPPED" && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(168,85,247,0.07)",
              borderRadius: 10,
              fontSize: "0.78rem",
              color: "#a855f7",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            📦 Awaiting delivery confirmation from operator
          </div>
        )}
        {req.status === "DELIVERED" && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(34,197,94,0.07)",
              borderRadius: 10,
              fontSize: "0.78rem",
              color: "#16a34a",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <MdCheck size={15} /> Delivered
          </div>
        )}

        {reviewing && (
          <ReviewPanel
            req={req}
            onDone={() => {
              setReviewing(false);
              onRefresh();
              onClose();
            }}
            onCancel={() => setReviewing(false)}
          />
        )}
      </div>
    </Drawer>
  );
}

/* ── Minimal Request Card (iCart style) ──────────────────── */
function RequestCard({ req, onClick }) {
  const s = getS(req.status);
  const loc = req.cart?.location;
  const itemCount = req.items?.length || 0;
  const firstIng = req.items?.[0]?.ingredient;

  return (
    <div
      className="icart_item_card"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {/* Top: icon + status */}
      <div className="icart_item_top">
        <div className="icart_item_icon">
          {firstIng?.image ? (
            <img
              src={firstIng.image}
              alt=""
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                objectFit: "cover",
              }}
            />
          ) : (
            <PiTruck size={16} />
          )}
        </div>
        <Chip status={req.status} small />
      </div>

      {/* Request ID */}
      <div className="icart_item_serial" style={{ fontFamily: "monospace" }}>
        #{req.id.slice(0, 8).toUpperCase()}
      </div>

      {/* Meta rows */}
      <div className="icart_item_meta">
        <div className="icart_meta_row">
          <span className="icart_meta_key">Cart</span>
          <span
            className="icart_meta_val"
            style={{ fontFamily: "monospace", fontSize: "0.72rem" }}
          >
            {req.cart?.serialNumber ||
              req.cartId?.slice(0, 8).toUpperCase() ||
              "—"}
          </span>
        </div>
        <div className="icart_meta_row">
          <span className="icart_meta_key">Items</span>
          <span className="icart_meta_val">
            {itemCount > 0 ? (
              `${itemCount} ingredient${itemCount !== 1 ? "s" : ""}`
            ) : (
              <span className="icart_meta_muted">None</span>
            )}
          </span>
        </div>
        <div className="icart_meta_row">
          <span className="icart_meta_key">Location</span>
          <span className="icart_meta_val">
            {loc?.name ? (
              <span className="icart_location_val">
                <MdOutlineLocationOn size={11} />
                {loc.name}
              </span>
            ) : (
              <span className="icart_meta_muted">Not set</span>
            )}
          </span>
        </div>
        <div className="icart_meta_row">
          <span className="icart_meta_key">Date</span>
          <span className="icart_meta_val">{fmtDate(req.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Requests Tab ─────────────────────────────────────────── */
function RequestsTab({ requests, reqLoading, profile, onRefresh }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = requests.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !r.cart?.serialNumber?.toLowerCase().includes(q) &&
        !r.items?.some((it) =>
          it.ingredient?.name?.toLowerCase().includes(q),
        ) &&
        !r.requester?.fullName?.toLowerCase().includes(q)
      )
        return false;
    }
    if (dateFrom && new Date(r.createdAt) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.createdAt) > new Date(dateTo + "T23:59:59"))
      return false;
    return true;
  });

  const hasActiveFilters =
    filter !== "ALL" || search.trim() || dateFrom || dateTo;

  return (
    <div>
      {/* Status pills + controls */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
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
            </button>
          );
        })}
        <button
          onClick={() => setShowFilters((v) => !v)}
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            height: 30,
            padding: "0 12px",
            borderRadius: 8,
            border: `1px solid ${showFilters || hasActiveFilters ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
            background:
              showFilters || hasActiveFilters
                ? "var(--bg-active)"
                : "var(--bg-hover)",
            color:
              showFilters || hasActiveFilters
                ? "var(--accent)"
                : "var(--text-muted)",
            fontSize: "0.74rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <MdFilterList size={14} />
          {hasActiveFilters ? "Filters ●" : "Filters"}
        </button>
        <button
          onClick={onRefresh}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <MdRefresh size={14} />
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 8,
            padding: "12px 14px",
            background: "var(--bg-hover)",
            borderRadius: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ position: "relative" }}>
            <MdSearch
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="modal-input"
              style={{ paddingLeft: 30, marginBottom: 0, height: 36 }}
              placeholder="Search cart, ingredient, requester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
              >
                <MdClose size={13} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              From
            </label>
            <input
              type="date"
              className="modal-input"
              style={{ marginBottom: 0, height: 36, width: 140 }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              To
            </label>
            <input
              type="date"
              className="modal-input"
              style={{ marginBottom: 0, height: 36, width: 140 }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setFilter("ALL");
              }}
              style={{
                gridColumn: "1 / -1",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--accent)",
                fontSize: "0.74rem",
                fontWeight: 700,
                fontFamily: "inherit",
                textAlign: "left",
                padding: 0,
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {reqLoading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="icart_empty_state" style={{ padding: "40px 0" }}>
          <PiTruck size={28} style={{ opacity: 0.25 }} />
          <p className="icart_empty_title">
            {requests.length === 0
              ? "No supply requests yet"
              : "No requests match filters"}
          </p>
          <p className="icart_empty_sub">
            {requests.length === 0
              ? "Once approved, requests from iCart operators will appear here."
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="icart_grid">
          {filtered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              onClick={() => setSelected(req)}
            />
          ))}
        </div>
      )}

      <RequestDrawer
        req={selected}
        profile={profile}
        onClose={() => setSelected(null)}
        onRefresh={() => {
          onRefresh();
          setSelected(null);
        }}
      />
    </div>
  );
}

/* ── Prices Tab ───────────────────────────────────────────── */
function PricesTab({ profile }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const [ingredient, setIngredient] = useState(null);
  const [ingSearch, setIngSearch] = useState("");
  const [ingResults, setIngResults] = useState([]);
  const [ingSearching, setIngSearching] = useState(false);
  const [ingOpen, setIngOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const debRef = useRef(null);
  const wrapRef = useRef(null);

  const fetchPrices = useCallback(
    async (pg = page, q = search) => {
      setLoading(true);
      try {
        const params = { page: pg, limit: LIMIT };
        if (q.trim()) params.search = q.trim();
        if (profile?.state?.id) params.stateId = profile.state.id;
        const r = await api.get("/library/ingredient/supplier/my-prices", {
          params,
        });
        const d = r.data.data;
        setPrices(d?.data || []);
        setTotal(d?.total || 0);
        setTotalPages(d?.totalPages || 1);
      } catch {
        toast.error("Failed to load prices");
      } finally {
        setLoading(false);
      }
    },
    [page, search, profile?.state?.id],
  );

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const searchIngredients = (q) => {
    if (!q.trim()) {
      setIngResults([]);
      return;
    }
    clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setIngSearching(true);
      try {
        const r = await api.get(
          `/library/ingredient?search=${encodeURIComponent(q)}&limit=8`,
        );
        const d = r.data.data;
        setIngResults(Array.isArray(d) ? d : d?.ingredient || []);
      } catch {
        setIngResults([]);
      } finally {
        setIngSearching(false);
      }
    }, 300);
  };

  const save = async () => {
    if (!ingredient) return toast.error("Select an ingredient first");
    if (!price || Number(price) < 0) return toast.error("Enter a valid price");
    if (!profile?.state?.id) return toast.error("No state on your profile");
    setSaving(true);
    try {
      await api.post("/library/ingredient/supplier-price", {
        ingredientId: ingredient.id,
        stateId: profile.state.id,
        price: Number(price),
      });
      toast.success(`Price set for ${ingredient.name}`);
      setIngredient(null);
      setIngSearch("");
      setPrice("");
      setIngResults([]);
      fetchPrices(1, search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Set price form */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 800,
            color: "var(--text-heading)",
            marginBottom: 14,
          }}
        >
          Set / Update Ingredient Price
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 8,
            alignItems: "end",
          }}
        >
          <div ref={wrapRef} style={{ position: "relative" }}>
            <label className="modal-label">Ingredient</label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                height: 40,
                padding: "0 10px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 9,
              }}
            >
              {ingredient?.image ? (
                <img
                  src={ingredient.image}
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
                value={ingSearch}
                onChange={(e) => {
                  setIngSearch(e.target.value);
                  setIngredient(null);
                  setIngOpen(true);
                  searchIngredients(e.target.value);
                }}
                onFocus={() => setIngOpen(true)}
              />
              {(ingSearch || ingredient) && (
                <button
                  onClick={() => {
                    setIngredient(null);
                    setIngSearch("");
                    setIngResults([]);
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
            {ingOpen && ingSearch && (
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
                {ingSearching ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Searching…
                  </div>
                ) : ingResults.length === 0 ? (
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
                  ingResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIngredient(item);
                        setIngSearch(item.name);
                        setIngOpen(false);
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
                            width: 24,
                            height: 24,
                            borderRadius: 5,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 5,
                            background: "var(--bg-hover)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MdImage
                            size={11}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                      )}
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
                            marginLeft: "auto",
                          }}
                        >
                          {item.unit}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="modal-label">Price (₦)</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.78rem",
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
                min="0"
                style={{
                  paddingLeft: 22,
                  height: 40,
                  width: 120,
                  marginBottom: 0,
                }}
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </div>
          </div>
          <button
            className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
            style={{
              height: 40,
              padding: "0 18px",
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
            onClick={save}
            disabled={saving || !ingredient}
          >
            <span className="btn_text">
              <MdOutlinePriceChange size={14} /> Save
            </span>
            {saving && (
              <span className="btn_loader" style={{ width: 13, height: 13 }} />
            )}
          </button>
        </div>
        {profile?.state?.name && (
          <div
            style={{
              marginTop: 10,
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <MdOutlineLocationOn size={12} />
            Prices for {profile.state.name}
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <MdSearch
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="modal-input"
            style={{ paddingLeft: 30, marginBottom: 0, height: 36 }}
            placeholder="Search my prices…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchPrices(1, search)}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
                fetchPrices(1, "");
              }}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
              }}
            >
              <MdClose size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => fetchPrices(page, search)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-hover)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          <MdRefresh size={14} />
        </button>
      </div>

      {loading ? (
        <div className="drawer_loading">
          <div className="page_loader_spinner" />
        </div>
      ) : prices.length === 0 ? (
        <div className="icart_empty_state" style={{ padding: "40px 0" }}>
          <MdOutlinePriceChange size={28} style={{ opacity: 0.25 }} />
          <p className="icart_empty_title">No prices set yet</p>
          <p className="icart_empty_sub">
            Use the form above to add ingredient prices.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {prices.map((p) => {
              const ing = p.ingredient;
              return (
                <div
                  key={p.id}
                  className="icart_item_card"
                  style={{ padding: "14px 14px 12px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {ing?.image ? (
                      <img
                        src={ing.image}
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
                          background: "var(--bg-hover)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdImage
                          size={15}
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ing?.name || "Item"}
                      </div>
                      {ing?.unit && (
                        <div
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          per {ing.unit}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 900,
                      color: "#16a34a",
                    }}
                  >
                    ₦{fmt(p.price)}
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 32, padding: "0 14px", fontSize: "0.76rem" }}
                onClick={() => {
                  setPage((p) => p - 1);
                  fetchPrices(page - 1, search);
                }}
                disabled={page <= 1}
              >
                ‹ Prev
              </button>
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {page} / {totalPages} · {total} total
              </span>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 32, padding: "0 14px", fontSize: "0.76rem" }}
                onClick={() => {
                  setPage((p) => p + 1);
                  fetchPrices(page + 1, search);
                }}
                disabled={page >= totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
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
  const [tab, setTab] = useState("requests");

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
      setRequests(Array.isArray(d) ? d : d?.requests || []);
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
          <p className="welcome_message" style={{ marginBottom: 0 }}>
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

      {profile && (
        <>
          <div className="icart_sub_nav" style={{ marginBottom: 20 }}>
            <button
              className={`icart_sub_nav_btn ${tab === "requests" ? "icart_sub_nav_active" : ""}`}
              onClick={() => setTab("requests")}
            >
              Supply Requests
              {requests.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: "0.61rem",
                    fontWeight: 800,
                    opacity: 0.75,
                  }}
                >
                  {requests.length}
                </span>
              )}
            </button>
            <button
              className={`icart_sub_nav_btn ${tab === "prices" ? "icart_sub_nav_active" : ""}`}
              onClick={() => setTab("prices")}
            >
              My Prices
            </button>
          </div>
          {tab === "requests" && (
            <RequestsTab
              requests={requests}
              reqLoading={reqLoading}
              profile={profile}
              onRefresh={fetchReqs}
            />
          )}
          {tab === "prices" && <PricesTab profile={profile} />}
        </>
      )}
    </div>
  );
}
