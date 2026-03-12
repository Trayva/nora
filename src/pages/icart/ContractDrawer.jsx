import { MdCircle, MdReceiptLong, MdCalendarToday } from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import Drawer from "../../components/Drawer";

const appStatusColors = {
  SUBMITTED: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  APPROVED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  REJECTED: {
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

const invStatusColors = {
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

function Badge({ status, colors }) {
  const s = colors[status] || Object.values(colors)[0];
  return (
    <span
      className="icart_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={6} />
      {status}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ContractDrawer({ contract, onClose }) {
  if (!contract) return null;

  const invoice = contract.invoiceDetails?.[0];
  const hasCarts = contract.carts?.length > 0;

  return (
    <Drawer
      isOpen={!!contract}
      onClose={onClose}
      title="Contract Application"
      width={500}
    >
      <div className="drawer_content">
        {/* Hero */}
        <div className="contract_drawer_hero">
          <div className="contract_drawer_hero_left">
            <span className="contract_drawer_id">
              #{contract.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="contract_drawer_date">
              <MdCalendarToday size={11} />
              Submitted {formatDate(contract.createdAt)}
            </span>
          </div>
          <Badge status={contract.status} colors={appStatusColors} />
        </div>

        {/* Meta grid */}
        <div className="contract_meta_grid">
          <div className="contract_meta_item">
            <span className="contract_meta_label">Type</span>
            <span className="contract_meta_value">{contract.type}</span>
          </div>
          <div className="contract_meta_item">
            <span className="contract_meta_label">iCarts Ordered</span>
            <span className="contract_meta_value">
              {contract.numberOfCarts}
            </span>
          </div>
          <div className="contract_meta_item">
            <span className="contract_meta_label">Contract Start</span>
            <span className="contract_meta_value">
              {formatDate(contract.contractStartDate)}
            </span>
          </div>
          <div className="contract_meta_item">
            <span className="contract_meta_label">Contract Status</span>
            <span className="contract_meta_value">
              {contract.contractStatus || "—"}
            </span>
          </div>
          {contract.nextInvoiceAt && (
            <div className="contract_meta_item">
              <span className="contract_meta_label">Next Invoice</span>
              <span className="contract_meta_value">
                {formatDate(contract.nextInvoiceAt)}
              </span>
            </div>
          )}
        </div>

        {/* Invoice */}
        {invoice && (
          <div className="contract_section">
            <div className="contract_section_header">
              <MdReceiptLong size={15} color="var(--accent)" />
              <span className="contract_section_title">Invoice</span>
              <Badge status={invoice.status} colors={invStatusColors} />
            </div>

            <div className="contract_invoice_block">
              {invoice.items?.map((item, i) => (
                <div key={i} className="contract_invoice_item">
                  <div className="contract_invoice_item_info">
                    <span className="contract_invoice_item_title">
                      {item.title}
                    </span>
                    <span className="contract_invoice_item_desc">
                      {item.description}
                    </span>
                  </div>
                  <div className="contract_invoice_item_right">
                    <span className="contract_invoice_item_qty">
                      × {item.quantity}
                    </span>
                    <span className="contract_invoice_item_amount">
                      {Number(item.amount * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              <div className="contract_invoice_total">
                <span className="contract_invoice_total_label">Total</span>
                <span className="contract_invoice_total_amount">
                  {Number(invoice.total).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="contract_invoice_meta_row">
              <span className="contract_meta_label">Due Date</span>
              <span className="contract_meta_value">
                {formatDate(invoice.dueDate)}
              </span>
            </div>
          </div>
        )}

        {/* Assigned carts */}
        <div className="contract_section">
          <div className="contract_section_header">
            <LuShoppingCart size={14} color="var(--accent)" />
            <span className="contract_section_title">Assigned iCarts</span>
            <span className="contract_section_count">
              {contract.carts?.length || 0}
            </span>
          </div>

          {hasCarts ? (
            <div className="drawer_items_list">
              {contract.carts.map((cart) => (
                <div key={cart.id} className="drawer_item_row">
                  <div className="drawer_item_img drawer_item_img_placeholder">
                    <LuShoppingCart size={14} />
                  </div>
                  <div className="drawer_item_info">
                    <span
                      className="concept_item_name"
                      style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    >
                      {cart.serialNumber}
                    </span>
                    <span className="concept_item_desc">{cart.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <span
                      className={`icart_indicator ${cart.isOnline ? "icart_ind_on" : "icart_ind_off"}`}
                      style={{ fontSize: "0.65rem", padding: "2px 7px" }}
                    >
                      {cart.isOnline ? "Online" : "Offline"}
                    </span>
                    <span
                      className={`icart_indicator ${cart.isLocked ? "icart_ind_locked" : "icart_ind_unlocked"}`}
                      style={{ fontSize: "0.65rem", padding: "2px 7px" }}
                    >
                      {cart.isLocked ? "Locked" : "Unlocked"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="contract_empty_carts">
              <LuShoppingCart size={22} style={{ opacity: 0.25 }} />
              <span>No iCarts assigned yet</span>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
