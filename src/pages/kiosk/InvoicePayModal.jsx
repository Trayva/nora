import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function InvoicePayModal({ invoice, application, onPaid, onClose }) {
  const [paying, setPaying] = useState(null);
  const [showMethods, setShowMethods] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const fmtAmt = (n) =>
    `${invoice.currency || "NGN"} ${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—";

  const statusColors = {
    PENDING: {
      bg: "rgba(234,179,8,0.1)",
      color: "#ca8a04",
      border: "rgba(234,179,8,0.25)",
    },
    PAID: {
      bg: "rgba(34,197,94,0.1)",
      color: "#16a34a",
      border: "rgba(34,197,94,0.25)",
    },
    OVERDUE: {
      bg: "rgba(239,68,68,0.1)",
      color: "#ef4444",
      border: "rgba(239,68,68,0.25)",
    },
    CANCELLED: {
      bg: "rgba(107,114,128,0.1)",
      color: "#6b7280",
      border: "rgba(107,114,128,0.25)",
    },
  };
  const sc = statusColors[invoice.status] || statusColors.PENDING;

  useEffect(() => {
    api
      .get("/finance/wallet")
      .then((r) => setWallet(r.data.data))
      .catch(() => { })
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={!paying ? onClose : undefined}
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
          width: "min(420px, 95vw)",
          background: "var(--bg-card)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 900,
                color: "var(--text-heading)",
              }}
            >
              Invoice #{invoice.id.slice(0, 8).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 800,
                padding: "2px 9px",
                borderRadius: 999,
                background: sc.bg,
                color: sc.color,
                border: `1px solid ${sc.border}`,
              }}
            >
              {invoice.status}
            </span>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Due {fmtDate(invoice.dueDate)}
            {application?.vendor?.businessName &&
              ` · ${application.vendor.businessName}`}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>
          <div
            style={{
              background: "var(--bg-hover)",
              borderRadius: 11,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: "8px 13px 6px",
                fontSize: "0.6rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--text-muted)",
              }}
            >
              Items
            </div>
            {invoice.items?.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "9px 13px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-body)",
                    }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginTop: 1,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                  >
                    × {item.quantity}
                  </div>
                  <div
                    style={{
                      fontSize: "0.84rem",
                      fontWeight: 800,
                      color: "var(--text-heading)",
                    }}
                  >
                    {fmtAmt(item.amount * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 13px",
                borderTop: "2px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                {fmtAmt(invoice.total)}
              </span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 7,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Created", value: fmtDate(invoice.createdAt) },
              { label: "Due Date", value: fmtDate(invoice.dueDate) },
              ...(invoice.paidAt
                ? [{ label: "Paid At", value: fmtDate(invoice.paidAt) }]
                : []),
              ...(invoice.paymentMethod
                ? [{ label: "Method", value: invoice.paymentMethod }]
                : []),
            ].map((m) => (
              <div
                key={m.label}
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
                  {m.label}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
          {invoice.status === "PENDING" && (
            <div
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 13px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Wallet Balance
              </div>
              {walletLoading ? (
                <div
                  className="skeleton_shimmer skeleton_rect"
                  style={{ width: "60px", height: "18px", borderRadius: 4 }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1rem",
                      fontWeight: 900,
                      color: sufficient ? "#16a34a" : "#ef4444",
                    }}
                  >
                    {fmtAmt(wallet?.balance || 0)}
                  </span>
                  {!sufficient && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "#ef4444",
                        fontWeight: 700,
                      }}
                    >
                      Insufficient
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "14px 20px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {invoice.status === "PENDING" &&
            (showMethods ? (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className={`app_btn app_btn_confirm${paying === "wallet" ? " btn_loading" : ""}`}
                    style={{
                      flex: 1,
                      height: 42,
                      position: "relative",
                      opacity: !sufficient && !walletLoading ? 0.5 : 1,
                    }}
                    onClick={() => handlePay("wallet")}
                    disabled={!!paying || (!sufficient && wallet !== null)}
                  >
                    <span className="btn_text">Pay with Wallet</span>
                    {paying === "wallet" && (
                      <span
                        className="btn_loader"
                        style={{ width: 14, height: 14 }}
                      />
                    )}
                  </button>
                  <button
                    className={`app_btn app_btn_confirm${paying === "online" ? " btn_loading" : ""}`}
                    style={{ flex: 1, height: 42, position: "relative" }}
                    onClick={() => handlePay("online")}
                    disabled={!!paying}
                  >
                    <span className="btn_text">Pay Online</span>
                    {paying === "online" && (
                      <span
                        className="btn_loader"
                        style={{ width: 14, height: 14 }}
                      />
                    )}
                  </button>
                </div>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ width: "100%", height: 42 }}
                  onClick={() => setShowMethods(false)}
                  disabled={!!paying}
                >
                  Cancel
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ flex: 1, height: 42 }}
                  onClick={onClose}
                  disabled={!!paying}
                >
                  Later
                </button>
                <button
                  className="app_btn app_btn_confirm"
                  style={{ flex: 2, height: 42 }}
                  onClick={() => setShowMethods(true)}
                >
                  Pay Now
                </button>
              </div>
            ))}
          {invoice.status !== "PENDING" && (
            <button
              className="app_btn app_btn_cancel"
              style={{ width: "100%", height: 42 }}
              onClick={onClose}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
