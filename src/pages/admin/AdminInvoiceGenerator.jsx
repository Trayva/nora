import { useState } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuPrinter } from "react-icons/lu";
import Drawer from "../../components/Drawer";

const DEFAULT_COMPANY = {
  name: "NORA AI Ltd",
  address: "50 Ebitu Ukiwe Street, Jabi, Abuja",
  email: "contact@trynora.net",
  socials: "@trynora · in/trynora · x.com/trynora",
};

const EMPTY_ITEM = {
  title: "",
  description: "",
  quantity: 1,
  amount: "",
};

function generateReceiptHTML(inv) {
  const items = inv.items || [];
  const na = (v) => (v != null && v !== "" ? v : "—");
  const cur = (inv.currency || "NGN").toUpperCase();
  const isPaid = inv.status === "PAID";
  const statusLabel = isPaid ? "✓  PAID" : inv.status;

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1),
    0
  );
  const total = Math.max(0, subtotal - Number(inv.discount || 0));
  const isDepositPaid = inv.depositStatus === "paid";
  const finalTotal = isDepositPaid && Number(inv.deposit || 0) > 0 ? Math.max(0, total - Number(inv.deposit)) : total;



  const itemRows = items
    .map(
      (item) =>
        `<tr>
      <td class="td-main">
        <span class="item-title">${item.title || "—"}</span>
        ${item.description ? `<span class="item-sub">${item.description}</span>` : ""}
      </td>
      <td class="td-c">${Number(item.quantity || 1).toLocaleString()}</td>
      <td class="td-r">${cur} ${Number(item.amount || 0).toLocaleString()}</td>
      <td class="td-r td-strong">${cur} ${Number((item.amount || 0) * (item.quantity || 1)).toLocaleString()}</td>
    </tr>`
    )
    .join("");

  const discountRow =
    Number(inv.discount || 0) > 0
      ? `<tr><td colspan="3" class="td-r" style="color:#22c55e;font-size:12px;padding:6px 12px">Discount</td>
       <td class="td-r" style="color:#22c55e;font-size:12px;padding:6px 12px;font-weight:700">− ${cur} ${Number(inv.discount).toLocaleString()}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt · ${inv.companyName} · ${inv.id.toUpperCase()}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  /* Reset */
  *{margin:0;padding:0;box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}

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

  /* Page shell */
  .page{padding:48px 52px 44px;position:relative}

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

  /* Header */
  .header{
    display:flex;justify-content:space-between;align-items:flex-start;
    padding-bottom:24px;
    border-bottom:1px solid var(--border);
    margin-bottom:28px;
  }

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

  /* Receipt meta */
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

  /* Accent bar */
  .accent-bar{
    height:2px;
    background:linear-gradient(90deg,var(--accent),rgba(203,108,220,0));
    border-radius:999px;
    margin-bottom:28px;
  }

  /* Party cards */
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

  /* Meta strip */
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

  /* Items table */
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

  /* Total box */
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

  /* Footer */
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
      <div class="logo-wordmark">${inv.companyName}<span class="dot"></span></div>
      <div class="logo-tagline">Sustainable Urban Mobility</div>
      <div class="logo-address">${inv.companyAddress}</div>
      <div class="logo-socials">
        <span>${inv.companyEmail}</span><span class="sep">·</span>
        <span>${inv.companySocials}</span>
      </div>
    </div>
    <div class="receipt-meta">
      <div class="receipt-eyebrow">Payment Receipt</div>
      <div class="receipt-num">#${inv.id.toUpperCase()}</div>
      <div class="receipt-issued">Issued ${new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</div>
      <div class="status-chip ${isPaid ? "chip-paid" : "chip-pending"}">${statusLabel}</div>
    </div>
  </div>

  <div class="accent-bar"></div>

  <!-- Party cards -->
  <div class="party-row">
    <div class="party-card pc-customer">
      <div class="party-eyebrow">Customer</div>
      <div class="party-field"><div class="party-key">Name</div><div class="party-val bold">${na(inv.customerName)}</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">${na(inv.customerEmail)}</div></div>
      <div class="party-field"><div class="party-key">Phone</div><div class="party-val">${na(inv.customerPhone)}</div></div>
    </div>
    <div class="party-card pc-company">
      <div class="party-eyebrow">Issuing Company</div>
      <div class="party-field"><div class="party-key">Company</div><div class="party-val bold">${inv.companyName}</div></div>
      <div class="party-field"><div class="party-key">Address</div><div class="party-val small">${inv.companyAddress}</div></div>
      <div class="party-field"><div class="party-key">Email</div><div class="party-val">${inv.companyEmail}</div></div>
      <div class="party-field"><div class="party-key">Socials</div><div class="party-val small">${inv.companySocials}</div></div>
    </div>
    <div class="party-card pc-kiosk">
      <div class="party-eyebrow">Kiosk Reference</div>
      <div class="party-field"><div class="party-key">Context</div><div class="party-val bold">${na(inv.kioskContext)}</div></div>
      <div class="party-field"><div class="party-key">Reference</div><div class="party-val">${na(inv.kioskRef)}</div></div>
      <div class="party-field"><div class="party-key">Invoice No.</div><div class="party-val">#${inv.id.toUpperCase()}</div></div>
      ${inv.paymentReference ? `<div class="party-field"><div class="party-key">Pay Ref</div><div class="party-val small" style="word-break:break-all;font-size:9.5px">${inv.paymentReference}</div></div>` : ""}
    </div>
  </div>

  <!-- Meta strip -->
  <div class="meta-strip">
    <div class="meta-cell"><div class="meta-key">Issue Date</div><div class="meta-val">${new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div></div>
    <div class="meta-cell"><div class="meta-key">Due Date</div><div class="meta-val">${new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div></div>
    ${inv.status === "PAID" ? `<div class="meta-cell"><div class="meta-key">Paid On</div><div class="meta-val">${new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div></div>` : ""}
    ${inv.paymentMethod ? `<div class="meta-cell"><div class="meta-key">Method</div><div class="meta-val">${inv.paymentMethod.toUpperCase()}</div></div>` : ""}
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
        ${Number(inv.deposit || 0) > 0 ? `
          <tr>
            <td colspan="3" class="td-r" style="color:var(--ink-sub);font-size:12px;padding:6px 12px">Deposit (${isDepositPaid ? "Paid" : "Required"})</td>
            <td class="td-r td-strong" style="font-size:12px;padding:6px 12px;font-weight:700">${cur} ${Number(inv.deposit).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="3" class="td-r" style="color:var(--ink-sub);font-size:12px;padding:6px 12px">Remaining Balance</td>
            <td class="td-r td-strong" style="font-size:12px;padding:6px 12px;font-weight:700">${cur} ${Number(total - inv.deposit).toLocaleString()}</td>
          </tr>
        ` : ""}
      </tbody>
    </table>
  </div>

  <!-- Total -->
  <div class="total-box">
    <div class="total-label">${isDepositPaid && Number(inv.deposit || 0) > 0 ? "Remaining Balance Due" : "Total Amount"}</div>
    <div class="total-amount">${cur} ${Number(finalTotal).toLocaleString()}</div>
  </div>



  ${inv.terms ? `
  <div style="margin-top: 24px; margin-bottom: 28px; padding-top: 16px; border-top: 1px dashed var(--border)">
    <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--ink-muted); margin-bottom: 4px; letter-spacing: 0.1em">Terms & Conditions</div>
    <div style="font-size: 11px; color: var(--ink-sub); line-height: 1.45; white-space: pre-wrap">${inv.terms}</div>
  </div>
  ` : ""}


  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">
      <strong>${inv.companyName}</strong> · ${inv.companyAddress}<br/>
      Sustainable Urban Mobility · ${inv.companyEmail}<br/>
      This is an official receipt — please retain for your records.
    </div>
    <div class="footer-right">
      <div class="footer-mono">Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
      <div class="footer-mono">Ref: <span class="hl">${inv.paymentReference || inv.id}</span></div>
    </div>
  </div>

</div>
</body>
</html>`;
}

const getInitialForm = () => ({
  id: "NORA-" + Math.floor(100000 + Math.random() * 900000),
  createdAt: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  currency: "NGN",
  status: "PAID",
  paymentMethod: "bank_transfer",
  paymentReference: "",
  discount: "",
  deposit: "",
  depositStatus: "paid",
  terms: "",



  customerName: "",
  customerEmail: "",
  customerPhone: "",

  companyName: DEFAULT_COMPANY.name,
  companyAddress: DEFAULT_COMPANY.address,
  companyEmail: DEFAULT_COMPANY.email,
  companySocials: DEFAULT_COMPANY.socials,

  kioskContext: "Franchise Application",
  kioskRef: "Kiosk Unit Ref",

  items: [{ ...EMPTY_ITEM }],
});

export default function AdminInvoiceGenerator({ isOpen, onClose }) {
  const [form, setForm] = useState(getInitialForm());

  const handleField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  const handleItem = (index, key, val) => {
    setForm((p) => {
      const copy = [...p.items];
      copy[index] = { ...copy[index], [key]: val };
      return { ...p, items: copy };
    });
  };

  const addItem = () => {
    setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (index) => {
    if (form.items.length === 1) {
      toast.warn("Invoice must have at least 1 item");
      return;
    }
    setForm((p) => ({
      ...p,
      items: p.items.filter((_, idx) => idx !== index),
    }));
  };

  const handlePrint = (e) => {
    e.preventDefault();

    if (!form.customerName.trim()) {
      return toast.error("Customer Name is required");
    }
    if (form.items.some((item) => !item.title.trim() || !item.amount)) {
      return toast.error("Each line item must have a title and amount");
    }

    const html = generateReceiptHTML(form);
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Please allow pop-ups to print the receipt");
      return;
    }
    win.document.write(html);
    win.document.close();

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      win.focus();
      win.print();
    };
    win.onload = doPrint;
    setTimeout(doPrint, 800);
    toast.success("Print job sent successfully!");
  };

  const resetForm = () => {
    setForm(getInitialForm());
    toast.info("Invoice form reset");
  };

  // Calculates subtotal dynamically
  const subtotal = form.items.reduce(
    (sum, item) => sum + (Number(item.amount || 0) * Number(item.quantity || 1)),
    0
  );
  const total = Math.max(0, subtotal - Number(form.discount || 0));
  const showSubtractedTotal = form.depositStatus === "paid" && Number(form.deposit || 0) > 0;
  const finalFormTotal = showSubtractedTotal ? Math.max(0, total - Number(form.deposit)) : total;



  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Ad-Hoc Invoice Generator"
      description="Create and print invoices on the fly (frontend only)"
      width={540}
    >
      <form onSubmit={handlePrint} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Invoice configuration */}
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Invoice Settings
          </h3>
          <div className="admin_form_grid" style={{ marginBottom: 10 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Invoice Ref #</label>
              <input
                className="modal-input"
                value={form.id}
                onChange={(e) => handleField("id", e.target.value)}
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Currency</label>
              <input
                className="modal-input"
                placeholder="e.g. NGN"
                value={form.currency}
                onChange={(e) => handleField("currency", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="admin_form_grid" style={{ marginBottom: 10 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Issue Date</label>
              <input
                className="modal-input"
                type="date"
                value={form.createdAt}
                onChange={(e) => handleField("createdAt", e.target.value)}
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Due Date</label>
              <input
                className="modal-input"
                type="date"
                value={form.dueDate}
                onChange={(e) => handleField("dueDate", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="admin_form_grid">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Status</label>
              <select
                className="modal-input"
                value={form.status}
                onChange={(e) => handleField("status", e.target.value)}
              >
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="UNPAID">UNPAID</option>
              </select>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Payment Method</label>
              <select
                className="modal-input"
                value={form.paymentMethod}
                onChange={(e) => handleField("paymentMethod", e.target.value)}
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Customer Info
          </h3>
          <div className="form-field" style={{ marginBottom: 10 }}>
            <label className="modal-label">Customer Name *</label>
            <input
              className="modal-input"
              placeholder="e.g. John Doe"
              value={form.customerName}
              onChange={(e) => handleField("customerName", e.target.value)}
              required
            />
          </div>
          <div className="admin_form_grid">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Email</label>
              <input
                className="modal-input"
                type="email"
                placeholder="e.g. john@doe.com"
                value={form.customerEmail}
                onChange={(e) => handleField("customerEmail", e.target.value)}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Phone</label>
              <input
                className="modal-input"
                placeholder="e.g. +234..."
                value={form.customerPhone}
                onChange={(e) => handleField("customerPhone", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Company info */}
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Issuing Company Info
          </h3>
          <div className="form-field" style={{ marginBottom: 10 }}>
            <label className="modal-label">Company Name</label>
            <input
              className="modal-input"
              value={form.companyName}
              onChange={(e) => handleField("companyName", e.target.value)}
              required
            />
          </div>
          <div className="form-field" style={{ marginBottom: 10 }}>
            <label className="modal-label">Address</label>
            <input
              className="modal-input"
              value={form.companyAddress}
              onChange={(e) => handleField("companyAddress", e.target.value)}
              required
            />
          </div>
          <div className="admin_form_grid">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Email</label>
              <input
                className="modal-input"
                value={form.companyEmail}
                onChange={(e) => handleField("companyEmail", e.target.value)}
                required
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Socials</label>
              <input
                className="modal-input"
                value={form.companySocials}
                onChange={(e) => handleField("companySocials", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* References */}
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
          <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>
            Kiosk / Reference Info
          </h3>
          <div className="admin_form_grid">
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Context</label>
              <input
                className="modal-input"
                value={form.kioskContext}
                onChange={(e) => handleField("kioskContext", e.target.value)}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Reference ID</label>
              <input
                className="modal-input"
                value={form.kioskRef}
                onChange={(e) => handleField("kioskRef", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
              Line Items
            </h3>
            <button
              type="button"
              onClick={addItem}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <LuPlus size={13} /> Add Item
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {form.items.map((item, index) => (
              <div
                key={index}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Item #{index + 1}
                  </span>
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="biz_icon_btn biz_icon_btn_danger"
                      onClick={() => removeItem(index)}
                      style={{ width: 22, height: 22 }}
                    >
                      <LuTrash2 size={11} />
                    </button>
                  )}
                </div>

                <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Title *</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Technology Fee"
                      value={item.title}
                      onChange={(e) => handleItem(index, "title", e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Unit Price *</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 50000"
                      value={item.amount}
                      onChange={(e) => handleItem(index, "amount", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="admin_form_grid">
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Quantity</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => handleItem(index, "quantity", parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Description</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Monthly Charge"
                      value={item.description}
                      onChange={(e) => handleItem(index, "description", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="admin_form_grid_3" style={{ marginBottom: 10 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Discount Amount</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 5000"
                  value={form.discount}
                  onChange={(e) => handleField("discount", e.target.value)}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Deposit Amount</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  placeholder="e.g. 20000"
                  value={form.deposit}
                  onChange={(e) => handleField("deposit", e.target.value)}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Deposit Status</label>
                <select
                  className="modal-input"
                  value={form.depositStatus}
                  onChange={(e) => handleField("depositStatus", e.target.value)}
                >
                  <option value="paid">Paid</option>
                  <option value="required">Required</option>
                </select>
              </div>
            </div>


            <div className="form-field" style={{ marginBottom: 10 }}>
              <label className="modal-label">Terms & Conditions</label>
              <textarea
                className="modal-input"
                style={{ height: 60, resize: "vertical", padding: 8 }}
                placeholder="Enter invoice terms and conditions..."
                value={form.terms}
                onChange={(e) => handleField("terms", e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Subtotal: {form.currency} {subtotal.toLocaleString()}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>
                {showSubtractedTotal ? "Remaining Due: " : "Total: "}
                {form.currency} {finalFormTotal.toLocaleString()}
              </div>
            </div>

          </div>

        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, paddingTop: 10 }}>
          <button
            className="app_btn app_btn_cancel"
            type="button"
            onClick={resetForm}
            style={{ flex: 1, height: 44 }}
          >
            Reset Form
          </button>
          <button
            className="app_btn app_btn_confirm"
            type="submit"
            style={{ flex: 2, height: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <LuPrinter size={16} /> Print Receipt
          </button>
        </div>
      </form>
    </Drawer>
  );
}
