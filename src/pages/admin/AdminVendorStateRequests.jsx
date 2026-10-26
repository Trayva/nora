import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdCheck, MdClose } from "react-icons/md";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export default function AdminVendorStateRequests({ open, onClose, onReviewed }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/vendor/profile/state-requests", { params: { status: "PENDING" } });
      setRequests(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load state requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const review = async (id, status) => {
    setActingId(id);
    try {
      await api.patch(`/vendor/profile/state-requests/${id}`, { status });
      toast.success(status === "APPROVED" ? "State added to vendor" : "Request rejected");
      setRequests((prev) => prev.filter((r) => r.id !== id));
      onReviewed?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to review request");
    } finally {
      setActingId(null);
    }
  };

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title="Vendor State Requests"
      description="Approve to add the state to the vendor's supported states"
      width={520}
    >
      {loading ? (
        <div className="admin_empty"><p style={{ margin: 0, fontSize: "0.82rem" }}>Loading…</p></div>
      ) : requests.length === 0 ? (
        <div className="admin_empty">
          <p style={{ margin: 0, fontSize: "0.82rem" }}>No pending state requests.</p>
        </div>
      ) : (
        <div className="admin_drawer_list">
          {requests.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-heading)" }}>
                  {r.vendor?.businessName}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  Wants to add <b>{r.state?.name}</b>
                  {r.state?.country ? `, ${r.state.country}` : ""} · {fmtDate(r.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="app_btn app_btn_cancel"
                style={{ height: 32, padding: "0 10px" }}
                disabled={actingId === r.id}
                onClick={() => review(r.id, "REJECTED")}
              >
                <MdClose size={14} /> Reject
              </button>
              <button
                type="button"
                className="app_btn app_btn_confirm"
                style={{ height: 32, padding: "0 10px" }}
                disabled={actingId === r.id}
                onClick={() => review(r.id, "APPROVED")}
              >
                <MdCheck size={14} /> Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
