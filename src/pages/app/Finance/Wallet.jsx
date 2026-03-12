import { useState, useEffect } from "react";
import "./Wallet.css";
import WalletCard from "../../../components/Finance/WalletCard";
import TransactionList from "../../../components/Finance/TransactionList";
import {
  TopupModal,
  WithdrawModal,
  PinModal,
  SettlementModal,
} from "../../../components/Finance/WalletModals";
import { getWallet, getTransactions, getInvoices } from "../../../api/finance";
import {
  MdSecurity,
  MdAccountBalance,
  MdHistory,
  MdReceipt,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

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

function StatusBadge({ status }) {
  const s = statusColors[status] || statusColors.PENDING;
  return (
    <span
      className="quick_inv_status"
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

export default function Wallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);

  const fetchData = async () => {
    try {
      const [walletRes, transRes, invRes] = await Promise.all([
        getWallet(),
        getTransactions(),
        getInvoices(null, null, null, true),
      ]);
      setWallet(walletRes.data);
      setTransactions(transRes.data || []);
      setInvoices(invRes.data || []);
    } catch {
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page_loader">
        <div className="page_loader_spinner" />
      </div>
    );
  }

  return (
    <div className="page_wrapper">
      <div className="mb-4">
        <h2 className="page_title_big m-0">Wallet</h2>
        <p className="welcome_message">
          Manage your funds, transactions, and settlement settings.
        </p>
      </div>

      <div className="finance_grid">
        {/* ── Left column ── */}
        <div className="main_section">
          <WalletCard
            balance={wallet?.balance}
            currency={wallet?.currency}
            onTopup={() => setShowTopup(true)}
            onWithdraw={() => setShowWithdraw(true)}
          />

          <div className="section_card">
            <div className="wallet_section_header">
              <h2 className="section_title">
                <MdHistory size={20} color="var(--accent)" />
                Transaction History
              </h2>
              <span className="wallet_tx_count">
                {transactions.length} transactions
              </span>
            </div>
            <TransactionList
              transactions={transactions}
              currency={wallet?.currency}
            />
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="sidebar_section">
          {/* Quick Invoices */}
          <div className="section_card mb-4">
            <div className="wallet_section_header">
              <h2 className="section_title" style={{ margin: 0 }}>
                <MdReceipt size={20} color="var(--accent)" />
                Quick Invoices
              </h2>
              <button
                className="view_all_link"
                onClick={() => navigate("/app/invoices")}
              >
                View All
              </button>
            </div>
            <div className="quick_invoice_list">
              {invoices.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  className="quick_invoice_item"
                  onClick={() => navigate(`/app/invoices?open_id=${inv.id}`)}
                >
                  <div className="quick_inv_main">
                    <div className="quick_inv_info">
                      <span className="quick_inv_id">
                        #{inv.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="quick_inv_date">
                        Due {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="quick_inv_side">
                      <div className="quick_inv_amount">
                        {inv.currency} {Number(inv.total).toLocaleString()}
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="wallet_empty" style={{ padding: "16px 0" }}>
                  <p>No pending invoices</p>
                </div>
              )}
            </div>
          </div>

          {/* Settlement */}
          <div className="section_card mb-4">
            <h2 className="section_title">
              <MdAccountBalance size={20} color="var(--accent)" />
              Settlement
            </h2>
            <div className="wallet_info_block">
              <div className="wallet_info_row">
                <span className="wallet_info_label">Bank</span>
                <span className="wallet_info_value">
                  {wallet?.bankName || "—"}
                </span>
              </div>
              <div className="wallet_info_row">
                <span className="wallet_info_label">Account</span>
                <span className="wallet_info_value">
                  {wallet?.bankAccount || "Not set"}
                </span>
              </div>
            </div>
            <button
              className="app_btn app_btn_cancel w-100"
              style={{ marginTop: 12 }}
              onClick={() => setShowSettlement(true)}
            >
              Update Account
            </button>
          </div>

          {/* Security */}
          <div className="section_card">
            <h2 className="section_title">
              <MdSecurity size={20} color="var(--accent)" />
              Security
            </h2>
            <div className="wallet_info_block">
              <div className="wallet_info_row">
                <span className="wallet_info_label">Transaction PIN</span>
                <span className="wallet_pin_status">
                  {wallet?.transactionPin ? (
                    <>
                      <MdCheckCircle size={14} style={{ color: "#22c55e" }} />{" "}
                      Active
                    </>
                  ) : (
                    <>
                      <MdCancel size={14} style={{ color: "#ef4444" }} /> Not
                      set
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              className="app_btn app_btn_cancel w-100"
              style={{ marginTop: 12 }}
              onClick={() => setShowPin(true)}
            >
              {wallet?.transactionPin ? "Change PIN" : "Set PIN"}
            </button>
          </div>
        </div>
      </div>

      <TopupModal
        isOpen={showTopup}
        onClose={() => setShowTopup(false)}
        onSuccess={fetchData}
      />
      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        onSuccess={fetchData}
        balance={wallet?.balance}
      />
      <PinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        hasPin={!!wallet?.transactionPin}
        onSuccess={fetchData}
      />
      <SettlementModal
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
