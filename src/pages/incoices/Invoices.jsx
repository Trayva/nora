import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { MdSearch, MdReceiptLong, MdDownload, MdCheck } from "react-icons/md";
import { LuX } from "react-icons/lu";
import "./Invoice.css";
import { useLocation, useSearchParams } from "react-router-dom";

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

const STATUS_FILTERS = ["ALL", "PENDING", "PAID", "OVERDUE", "CANCELLED"];

function StatusBadge({ status }) {
  const s = statusColors[status] || statusColors.PENDING;
  return (
    <span
      className="invoice_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount, currency) {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

/* ── PDF Receipt Generator ── */
function generateReceiptHTML(invoice) {
  const items = invoice.items || [];
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${item.title || "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${invoice.currency} ${Number(item.amount || 0).toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:700;">${invoice.currency} ${Number((item.amount || 0) * item.quantity).toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt #${invoice.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 48px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #16a34a; }
    .brand { font-size: 28px; font-weight: 900; color: #16a34a; letter-spacing: -0.5px; }
    .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .receipt-label { text-align: right; }
    .receipt-id { font-size: 22px; font-weight: 800; color: #1a1a1a; }
    .paid-badge { display: inline-block; margin-top: 6px; padding: 4px 14px; background: #dcfce7; color: #16a34a; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; border: 1px solid #bbf7d0; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .meta-box { background: #f9fafb; border-radius: 8px; padding: 12px 16px; border: 1px solid #f0f0f0; }
    .meta-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .meta-value { font-size: 14px; font-weight: 700; color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #f9fafb; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #e5e7eb; }
    th:not(:first-child) { text-align: center; }
    th:last-child { text-align: right; }
    .total-row { background: #f0fdf4; }
    .total-row td { padding: 12px; font-size: 16px; font-weight: 900; color: #16a34a; border-top: 2px solid #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NORA</div>
      <div class="brand-sub">iCart Food Infrastructure</div>
    </div>
    <div class="receipt-label">
      <div class="receipt-id">Invoice #${invoice.id.slice(0, 8).toUpperCase()}</div>
      <div class="paid-badge">✓ PAID</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Issue Date</div>
      <div class="meta-value">${formatDate(invoice.createdAt)}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Due Date</div>
      <div class="meta-value">${formatDate(invoice.dueDate)}</div>
    </div>
    ${
      invoice.paidAt
        ? `
    <div class="meta-box">
      <div class="meta-label">Paid On</div>
      <div class="meta-value">${formatDate(invoice.paidAt)}</div>
    </div>`
        : ""
    }
    ${
      invoice.paymentMethod
        ? `
    <div class="meta-box">
      <div class="meta-label">Payment Method</div>
      <div class="meta-value">${invoice.paymentMethod}</div>
    </div>`
        : ""
    }
    <div class="meta-box">
      <div class="meta-label">Currency</div>
      <div class="meta-value">${invoice.currency}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="3" style="text-align:right;padding:12px;">Total</td>
        <td style="text-align:right;padding:12px;">${formatAmount(invoice.total, invoice.currency)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    This is an official payment receipt · Generated by NORA iCart Platform · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
  </div>
</body>
</html>`;
}

function downloadReceipt(invoice) {
  const html = generateReceiptHTML(invoice);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${invoice.id.slice(0, 8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Receipt downloaded");
}

/* ── Invoice Detail Modal ── */
function InvoiceModal({ invoice, onClose, onPay }) {
  const [paying, setPaying] = useState(null);
  const [showMethods, setShowMethods] = useState(false);
  const [itemPage, setItemPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const items = invoice.items || [];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const pagedItems = items.slice(
    itemPage * ITEMS_PER_PAGE,
    (itemPage + 1) * ITEMS_PER_PAGE,
  );

  const handlePay = async (method) => {
    setPaying(method);
    setShowMethods(false);
    await onPay(method, invoice, setPaying);
  };

  return (
    <Modal
      isOpen={true}
      onClose={paying ? undefined : onClose}
      title={`Invoice #${invoice.id.slice(0, 8).toUpperCase()}`}
      description={`Due ${formatDate(invoice.dueDate)}`}
    >
      <div className="modal-body">
        {/* Status + currency + download */}
        <div
          className="invoice_modal_status_row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <StatusBadge status={invoice.status} />
          <span className="invoice_modal_currency">{invoice.currency}</span>
          {invoice.status === "PAID" && (
            <button
              onClick={() => downloadReceipt(invoice)}
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 30,
                padding: "0 12px",
                borderRadius: 7,
                border: "1px solid rgba(34,197,94,0.3)",
                background: "rgba(34,197,94,0.08)",
                color: "#16a34a",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.74rem",
                fontWeight: 700,
              }}
            >
              <MdDownload size={14} /> Download Receipt
            </button>
          )}
        </div>

        {/* Items — paginated */}
        <div className="invoice_items">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span className="invoice_section_label">Items</span>
            {totalPages > 1 && (
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                }}
              >
                {itemPage + 1} / {totalPages}
              </span>
            )}
          </div>

          {pagedItems.map((item, i) => (
            <div key={i} className="invoice_item_row">
              <div className="invoice_item_info">
                <span className="invoice_item_title">{item.title}</span>
                {item.description && (
                  <span className="invoice_item_desc">{item.description}</span>
                )}
              </div>
              <div className="invoice_item_right">
                <span className="invoice_item_qty">× {item.quantity}</span>
                <span className="invoice_item_amount">
                  {formatAmount(item.amount * item.quantity, invoice.currency)}
                </span>
              </div>
            </div>
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                marginTop: 10,
              }}
            >
              <button
                onClick={() => setItemPage((p) => Math.max(0, p - 1))}
                disabled={itemPage === 0}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  opacity: itemPage === 0 ? 0.4 : 1,
                }}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setItemPage(i)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${itemPage === i ? "var(--accent)" : "var(--border)"}`,
                    background:
                      itemPage === i ? "var(--bg-active)" : "var(--bg-hover)",
                    color:
                      itemPage === i ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setItemPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={itemPage === totalPages - 1}
                style={{
                  height: 28,
                  padding: "0 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  opacity: itemPage === totalPages - 1 ? 0.4 : 1,
                }}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="invoice_meta_grid">
          {[
            { label: "Created", value: formatDate(invoice.createdAt) },
            { label: "Due Date", value: formatDate(invoice.dueDate) },
            ...(invoice.paidAt
              ? [{ label: "Paid At", value: formatDate(invoice.paidAt) }]
              : []),
            ...(invoice.paymentMethod
              ? [{ label: "Method", value: invoice.paymentMethod }]
              : []),
          ].map((m) => (
            <div key={m.label} className="invoice_meta_item">
              <span className="icart_meta_label">{m.label}</span>
              <span className="icart_meta_value">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="icart_card_total">
          <span className="icart_total_label">Total</span>
          <span className="icart_total_amount">
            {formatAmount(invoice.total, invoice.currency)}
          </span>
        </div>

        {/* Payment actions */}
        {invoice.status === "PENDING" && (
          <div
            className="modal-footer"
            style={{ flexDirection: "column", gap: 10 }}
          >
            {showMethods ? (
              <>
                <div className="invoice_method_btns">
                  <button
                    className={`app_btn app_btn_confirm ${paying === "wallet" ? "btn_loading" : ""}`}
                    style={{ flex: 1, height: 42, position: "relative" }}
                    onClick={() => handlePay("wallet")}
                    disabled={!!paying}
                  >
                    <span className="btn_text">Pay with Wallet</span>
                    {paying === "wallet" && (
                      <span
                        className="btn_loader"
                        style={{ width: 18, height: 18 }}
                      />
                    )}
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${paying === "online" ? "btn_loading" : ""}`}
                    style={{ flex: 1, height: 42, position: "relative" }}
                    onClick={() => handlePay("online")}
                    disabled={!!paying}
                  >
                    <span className="btn_text">Pay Online</span>
                    {paying === "online" && (
                      <span
                        className="btn_loader"
                        style={{ width: 18, height: 18 }}
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
              <button
                className="app_btn app_btn_confirm"
                style={{ width: "100%", height: 42 }}
                onClick={() => setShowMethods(true)}
              >
                Pay Now
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ── Main Page ── */
export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get("open_id");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/finance/invoice");
      const list = res.data.data || [];
      setInvoices(list);
      if (openId) {
        const inv = list.find((i) => i.id === openId);
        if (inv) {
          setSelected(inv);
          window.history.replaceState({}, "", "/app/invoices");
        }
      } else if (location.state?.openLatest && list.length > 0) {
        setSelected(list[0]);
      }
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [location.state]);

  const filtered = useMemo(
    () =>
      invoices.filter((inv) => {
        if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !inv.id.toLowerCase().includes(q) &&
            !(inv.items || []).some((it) => it.title?.toLowerCase().includes(q))
          )
            return false;
        }
        if (dateFrom && new Date(inv.dueDate) < new Date(dateFrom))
          return false;
        if (dateTo && new Date(inv.dueDate) > new Date(dateTo)) return false;
        return true;
      }),
    [invoices, search, statusFilter, dateFrom, dateTo],
  );

  const hasActiveFilters =
    search || statusFilter !== "ALL" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setDateFrom("");
    setDateTo("");
  };

  const handlePay = async (method, invoice, setPaying) => {
    try {
      const res = await api.get(`/finance/invoice/${invoice.id}/pay`, {
        params: { method, shouldRedirect: false },
      });
      const paymentLink = res.data?.data?.paymentLink;
      if (method === "online" && paymentLink) {
        window.open(paymentLink, "_blank");
        toast.success("Payment page opened");
      } else {
        toast.success("Payment successful!");
        await fetchInvoices();
        const updated = await api.get("/finance/invoice");
        const fresh = updated.data.data.find((i) => i.id === invoice.id);
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Invoices</h2>
      <p className="welcome_message">View and pay your outstanding invoices</p>

      {/* Filter bar */}
      <div className="invoice_filter_bar">
        <div className="invoice_search_wrap">
          <MdSearch size={15} className="invoice_search_icon" />
          <input
            className="invoice_search_input"
            placeholder="Search by ID or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="invoice_search_clear"
              onClick={() => setSearch("")}
            >
              <LuX size={12} />
            </button>
          )}
        </div>
        <div className="invoice_date_wrap">
          <label className="invoice_date_label">From</label>
          <input
            type="date"
            className="invoice_date_input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="invoice_date_wrap">
          <label className="invoice_date_label">To</label>
          <input
            type="date"
            className="invoice_date_input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <button className="invoice_clear_btn" onClick={clearFilters}>
            <LuX size={12} /> Clear
          </button>
        )}
      </div>

      {/* Status pills */}
      <div className="invoice_status_pills">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`invoice_status_pill ${statusFilter === s ? "invoice_status_pill_active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            {s !== "ALL" && (
              <span className="invoice_pill_count">
                {invoices.filter((i) => i.status === s).length}
              </span>
            )}
          </button>
        ))}
        <span className="invoice_result_count">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="invoices_empty">
          <MdReceiptLong size={28} style={{ opacity: 0.3, marginBottom: 6 }} />
          <p>
            {hasActiveFilters
              ? "No invoices match your filters."
              : "No invoices found."}
          </p>
          {hasActiveFilters && (
            <button
              className="invoice_clear_btn"
              style={{ margin: "8px auto 0" }}
              onClick={clearFilters}
            >
              <LuX size={12} /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="invoices_list">
          {filtered.map((invoice) => (
            <div
              className="invoice_card"
              key={invoice.id}
              onClick={() => setSelected(invoice)}
            >
              <div className="invoice_card_row">
                <div className="invoice_card_left">
                  <div className="invoice_id_row">
                    <span className="invoice_id">
                      #{invoice.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={invoice.status} />
                    {invoice.status === "PAID" && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: "#16a34a",
                        }}
                      >
                        <MdCheck size={11} /> Receipt
                      </span>
                    )}
                  </div>
                  <span className="invoice_date">
                    Due {formatDate(invoice.dueDate)}
                  </span>
                </div>
                <div className="invoice_card_right">
                  <span className="invoice_total">
                    {formatAmount(invoice.total, invoice.currency)}
                  </span>
                  <span className="invoice_chevron">›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <InvoiceModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onPay={handlePay}
        />
      )}
    </div>
  );
}
