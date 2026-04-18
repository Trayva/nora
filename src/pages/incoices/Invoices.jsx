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
function getLoggedInUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("trayva-auth") || "{}");
    return auth.user || null;
  } catch {
    return null;
  }
}

function invoiceContext(invoice) {
  if (invoice.supplyRequestId)
    return {
      type: "Supply Request",
      ref: "#" + invoice.supplyRequestId.slice(0, 8).toUpperCase(),
    };
  if (invoice.KioskVendorApplicationId)
    return {
      type: "Vendor Application",
      ref: "#" + invoice.KioskVendorApplicationId.slice(0, 8).toUpperCase(),
    };
  if (invoice.contractApplicationId)
    return {
      type: "Contract Application",
      ref: "#" + invoice.contractApplicationId.slice(0, 8).toUpperCase(),
    };
  if (invoice.conceptRentalApplicationId)
    return {
      type: "Concept Rental",
      ref: "#" + invoice.conceptRentalApplicationId.slice(0, 8).toUpperCase(),
    };
  if (invoice.kioskId)
    return {
      type: "Kiosk",
      ref: "#" + invoice.kioskId.slice(0, 8).toUpperCase(),
    };
  return { type: "General", ref: "—" };
}

function generateReceiptHTML(invoice) {
  const items = invoice.items || [];
  const user = getLoggedInUser();
  const ctx = invoiceContext(invoice);
  const na = (v) => (v != null && v !== "" ? v : "—");
  const cur = (invoice.currency || "NGN").toUpperCase();
  const isPaid = invoice.status === "PAID";
  const statusLabel = isPaid ? "✓  PAID" : invoice.status;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
      <td class="td-main">
        <span class="item-title">${item.title || "—"}</span>
        ${item.description ? `<span class="item-sub">${item.description}</span>` : ""}
      </td>
      <td class="td-c">${item.quantity.toLocaleString()}</td>
      <td class="td-r">${cur} ${Number(item.amount || 0).toLocaleString()}</td>
      <td class="td-r td-strong">${cur} ${Number((item.amount || 0) * item.quantity).toLocaleString()}</td>
    </tr>`,
    )
    .join("");

  const discountRow =
    invoice.discount > 0
      ? `<tr><td colspan="3" class="td-r" style="color:#22c55e;font-size:12px;padding:6px 12px">Discount</td>
       <td class="td-r" style="color:#22c55e;font-size:12px;padding:6px 12px;font-weight:700">− ${cur} ${Number(invoice.discount).toLocaleString()}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt · NORA AI · ${invoice.id.slice(0, 8).toUpperCase()}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  /* ── Reset ── */
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* ── Tokens — mirrors your CSS vars ── */
  :root{
    --ink:#0a0a0a;
    --ink-sub:#444444;
    --ink-muted:#777777;
    --bg:#ffffff;
    --bg-card:#f5f5f5;
    --bg-hover:#e8e8e8;
    --border:#e0e0e0;
    --accent:#cb6cdc;
    --accent-bg:rgba(203,108,220,0.08);
    --accent-border:rgba(203,108,220,0.25);
    --green:#16a34a;
    --green-bg:rgba(34,197,94,0.08);
    --green-border:rgba(34,197,94,0.2);
    --blue:#2563eb;
    --blue-bg:rgba(37,99,235,0.07);
    --amber:#ca8a04;
    --amber-bg:rgba(234,179,8,0.08);
    --amber-border:rgba(234,179,8,0.25);
  }

  body{
    font-family:'DM Sans',sans-serif;
    background:var(--bg);
    color:var(--ink);
    max-width:800px;
    margin:0 auto;
    padding:0;
    font-size:13px;
    line-height:1.5;
  }

  /* ── Page shell ── */
  .page{padding:48px 52px 44px;position:relative}

  /* Subtle diagonal grid watermark */
  .page::after{
    content:'';
    position:fixed;inset:0;
    background-image:
      linear-gradient(rgba(203,108,220,.04) 1px,transparent 1px),
      linear-gradient(90deg,rgba(203,108,220,.04) 1px,transparent 1px);
    background-size:32px 32px;
    pointer-events:none;z-index:0;
  }
  .page>*{position:relative;z-index:1}

  /* ── Header ── */
  .header{
    display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:24px;
    border-bottom:1px solid var(--border);
    margin-bottom:28px;
  }

  /* Logo: wordmark + accent dot */
  .logo-block{}
  .logo-wordmark{
    display:flex;align-items:center;gap:0;
    font-family:'DM Sans',sans-serif;
    font-size:22px;font-weight:700;
    color:var(--ink);letter-spacing:-0.02em;line-height:1;
  }
  .logo-wordmark .dot{
    display:inline-block;
    width:7px;height:7px;
    border-radius:50%;
    background:var(--accent);
    margin-left:2px;
    margin-bottom:12px;
    flex-shrink:0;
  }
  .logo-tagline{
    font-size:9.5px;font-weight:500;
    color:var(--accent);
    letter-spacing:0.16em;text-transform:uppercase;
    margin-top:5px;
  }
  .logo-address{
    font-size:10px;font-weight:400;
    color:var(--ink-muted);
    margin-top:4px;line-height:1.5;
  }
  .logo-socials{
    display:flex;gap:10px;margin-top:5px;flex-wrap:wrap;
  }
  .logo-socials span{
    font-size:9.5px;font-weight:500;
    color:var(--ink-muted);letter-spacing:0.04em;
  }
  .logo-socials .sep{color:var(--border)}

  /* Receipt meta — right side */
  .receipt-meta{text-align:right}
  .receipt-eyebrow{
    font-size:9px;font-weight:600;
    letter-spacing:0.2em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:6px;
  }
  .receipt-num{
    font-family:'DM Mono',monospace;
    font-size:18px;font-weight:500;
    color:var(--ink);letter-spacing:0.02em;line-height:1;
  }
  .receipt-issued{
    font-size:10px;color:var(--ink-muted);
    margin-top:5px;font-weight:400;
  }
  .status-chip{
    display:inline-block;margin-top:9px;
    padding:4px 14px;border-radius:999px;
    font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;
  }
  .chip-paid{background:var(--green-bg);color:var(--green);border:1px solid var(--green-border)}
  .chip-pending{background:var(--amber-bg);color:var(--amber);border:1px solid var(--amber-border)}

  /* ── Accent bar under header ── */
  .accent-bar{
    height:2px;
    background:linear-gradient(90deg,var(--accent),rgba(203,108,220,0));
    border-radius:999px;
    margin-bottom:28px;
  }

  /* ── Party cards ── */
  .party-row{
    display:grid;grid-template-columns:repeat(3,1fr);
    gap:1px;
    background:var(--border);
    border:1px solid var(--border);
    border-radius:14px;overflow:hidden;
    margin-bottom:24px;
  }
  .party-card{
    background:var(--bg-card);
    padding:18px 16px;
    position:relative;
  }
  .party-card::before{
    content:'';position:absolute;
    top:0;left:0;right:0;height:2px;
  }
  .party-card.pc-customer::before{background:var(--blue)}
  .party-card.pc-company::before{background:var(--accent)}
  .party-card.pc-kiosk::before{background:var(--amber)}

  .party-eyebrow{
    font-size:8.5px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:12px;
  }
  .party-field{margin-bottom:8px}
  .party-field:last-child{margin-bottom:0}
  .party-key{
    font-size:8.5px;font-weight:600;
    letter-spacing:0.1em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:2px;
  }
  .party-val{
    font-size:12.5px;font-weight:500;
    color:var(--ink);word-break:break-word;line-height:1.35;
  }
  .party-val.bold{font-weight:700}
  .party-val.small{font-size:10.5px;color:var(--ink-sub)}

  /* ── Meta strip ── */
  .meta-strip{
    display:flex;flex-wrap:wrap;
    border:1px solid var(--border);
    border-radius:10px;overflow:hidden;
    margin-bottom:24px;
  }
  .meta-cell{
    flex:1;min-width:100px;
    padding:11px 14px;
    background:var(--bg);
    border-right:1px solid var(--border);
  }
  .meta-cell:last-child{border-right:none}
  .meta-key{
    font-size:8px;font-weight:600;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);margin-bottom:3px;
  }
  .meta-val{
    font-size:12.5px;font-weight:600;
    color:var(--ink);
    font-family:'DM Mono',monospace;
  }

  /* ── Items table ── */
  .items-wrap{margin-bottom:8px}
  table{width:100%;border-collapse:collapse}
  thead tr{border-bottom:1.5px solid var(--ink)}
  th{
    padding:8px 12px;
    font-size:8px;font-weight:700;
    letter-spacing:0.18em;text-transform:uppercase;
    color:var(--ink-muted);text-align:left;
  }
  th:not(:first-child){text-align:center}
  th:last-child{text-align:right}
  tbody tr{border-bottom:1px solid var(--border)}
  tbody tr:last-child{border-bottom:none}
  td{padding:12px;vertical-align:top}
  .td-main{text-align:left}
  .td-c{text-align:center;color:var(--ink-sub);font-size:12.5px}
  .td-r{text-align:right;color:var(--ink-sub);font-size:12.5px}
  .td-strong{font-weight:700;color:var(--ink)!important}
  .item-title{display:block;font-size:13px;font-weight:600;color:var(--ink)}
  .item-sub{display:block;font-size:10px;color:var(--ink-muted);margin-top:2px;font-style:italic}

  /* ── Total box ── */
  .total-box{
    display:flex;justify-content:space-between;align-items:center;
    background:var(--accent-bg);
    border:1px solid var(--accent-border);
    border-radius:10px;
    padding:14px 18px;
    margin-top:8px;margin-bottom:32px;
  }
  .total-label{
    font-size:10px;font-weight:600;
    letter-spacing:0.14em;text-transform:uppercase;
    color:var(--accent);
  }
  .total-amount{
    font-family:'DM Mono',monospace;
    font-size:22px;font-weight:500;
    color:var(--accent);letter-spacing:-0.01em;
  }

  /* ── Footer ── */
  .footer{
    display:flex;justify-content:space-between;align-items:flex-end;
    border-top:1px solid var(--border);
    padding-top:18px;
  }
  .footer-left{font-size:9.5px;color:var(--ink-muted);line-height:1.8}
  .footer-left strong{color:var(--ink-sub);font-weight:600}
  .footer-right{text-align:right}
  .footer-mono{
    font-family:'DM Mono',monospace;
    font-size:8.5px;color:var(--ink-muted);letter-spacing:0.06em;
    line-height:1.8;
  }
  .footer-mono .hl{color:var(--accent)}

  @media print{
    body{margin:0}
    .page{padding:28px 36px}
    @page{size:A4;margin:10mm}
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-block">
      <div class="logo-wordmark">NORA AI<span class="dot"></span></div>
      <div class="logo-tagline">Sustainable Urban Mobility</div>
      <div class="logo-address">50 Ebitu Ukiwe Street, Jabi, Abuja</div>
      <div class="logo-socials">
        <span>@noraai</span><span class="sep">·</span>
        <span>in/nora-ai</span><span class="sep">·</span>
        <span>x.com/noraai</span><span class="sep">·</span>
        <span>hello@nora.io</span>
      </div>
    </div>
    <div class="receipt-meta">
      <div class="receipt-eyebrow">Payment Receipt</div>
      <div class="receipt-num">#${invoice.id.slice(0, 8).toUpperCase()}</div>
      <div class="receipt-issued">Issued ${new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
      <div class="status-chip ${isPaid ? "chip-paid" : "chip-pending"}">${statusLabel}</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- Party cards -->
  <div class="party-row">
    <div class="party-card pc-customer">
      <div class="party-eyebrow">Customer</div>
      <div class="party-field"><div class="party-key">Name</div><div class="party-val bold">${na(user?.fullName || user?.name)}</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">${na(user?.email)}</div></div>
      <div class="party-field"><div class="party-key">Phone</div><div class="party-val">${na(user?.phone)}</div></div>
    </div>
    <div class="party-card pc-company">
      <div class="party-eyebrow">Issuing Company</div>
      <div class="party-field"><div class="party-key">Company</div><div class="party-val bold">NORA AI Ltd</div></div>
      <div class="party-field"><div class="party-key">Address</div><div class="party-val small">50 Ebitu Ukiwe St, Jabi, Abuja</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">hello@nora.io</div></div>
      <div class="party-field"><div class="party-key">Socials</div><div class="party-val small">@noraai · in/nora-ai · x.com/noraai</div></div>
    </div>
    <div class="party-card pc-kiosk">
      <div class="party-eyebrow">Kiosk Reference</div>
      <div class="party-field"><div class="party-key">Context</div><div class="party-val bold">${ctx.type}</div></div>
      <div class="party-field"><div class="party-key">Reference</div><div class="party-val">${ctx.ref}</div></div>
      <div class="party-field"><div class="party-key">Invoice No.</div><div class="party-val">#${invoice.id.slice(0, 8).toUpperCase()}</div></div>
      ${invoice.paymentReference ? `<div class="party-field"><div class="party-key">Pay Ref</div><div class="party-val small" style="word-break:break-all;font-size:9.5px">${invoice.paymentReference}</div></div>` : ""}
    </div>
  </div>

  <!-- Meta strip -->
  <div class="meta-strip">
    <div class="meta-cell"><div class="meta-key">Issue Date</div><div class="meta-val">${formatDate(invoice.createdAt)}</div></div>
    <div class="meta-cell"><div class="meta-key">Due Date</div><div class="meta-val">${formatDate(invoice.dueDate)}</div></div>
    ${invoice.paidAt ? `<div class="meta-cell"><div class="meta-key">Paid On</div><div class="meta-val">${formatDate(invoice.paidAt)}</div></div>` : ""}
    ${invoice.paymentMethod ? `<div class="meta-cell"><div class="meta-key">Method</div><div class="meta-val">${invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1)}</div></div>` : ""}
    <div class="meta-cell"><div class="meta-key">Currency</div><div class="meta-val">${cur}</div></div>
  </div>

  <!-- Line items -->
  <div class="items-wrap">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${discountRow}
      </tbody>
    </table>
  </div>

  <!-- Total -->
  <div class="total-box">
    <div class="total-label">Total Amount</div>
    <div class="total-amount">${cur} ${Number(invoice.total).toLocaleString()}</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>NORA AI Ltd</strong> · 50 Ebitu Ukiwe Street, Jabi, Abuja<br/>
      Sustainable Urban Mobility · hello@nora.io<br/>
      This is an official receipt — please retain for your records.
    </div>
    <div class="footer-right">
      <div class="footer-mono">Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
      <div class="footer-mono">Ref: <span class="hl">${invoice.paymentReference || invoice.id}</span></div>
    </div>
  </div>

</div>
</body>
</html>`;
}

function downloadReceipt(invoice) {
  const html = generateReceiptHTML(invoice);
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Please allow pop-ups to download the receipt");
    return;
  }
  win.document.write(html);
  win.document.close();
  // Use only one trigger — onload if available, otherwise a single timeout fallback
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
  };
  win.onload = doPrint;
  setTimeout(doPrint, 800);
  toast.success("Receipt ready — select 'Save as PDF' in the print dialog");
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
              <span className="kiosk_meta_label">{m.label}</span>
              <span className="kiosk_meta_value">{m.value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="kiosk_card_total">
          <span className="kiosk_total_label">Total</span>
          <span className="kiosk_total_amount">
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
        <h2 className="page_title_big m-0">Invoices</h2>
        <p className="welcome_message">View and pay your outstanding invoices</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 40 }}>
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="invoice_card"
                style={{ height: 74, padding: "16px", background: "var(--bg-card)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton_shimmer skeleton_text"
                      style={{ width: "30%", height: 14, marginBottom: 8 }}
                    />
                    <div className="skeleton_shimmer skeleton_text" style={{ width: "20%", height: 10 }} />
                  </div>
                  <div className="skeleton_shimmer skeleton_text" style={{ width: "80px", height: 16 }} />
                </div>
              </div>
            ))}
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
