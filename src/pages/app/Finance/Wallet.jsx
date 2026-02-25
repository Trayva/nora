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
import { MdSecurity, MdAccountBalance, MdHistory, MdReceipt } from "react-icons/md";
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

    // Modal states
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
        } catch (err) {
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
                <h1 className="page_title_big">My Wallet</h1>
                <p className="welcome_message">Manage your funds, transactions, and settlement settings.</p>
            </div>

            <div className="finance_grid">
                <div className="main_section">
                    <WalletCard
                        balance={wallet?.balance}
                        currency={wallet?.currency}
                        onTopup={() => setShowTopup(true)}
                        onWithdraw={() => setShowWithdraw(true)}
                    />

                    <div className="section_card">
                        <h2 className="section_title">
                            <MdHistory size={24} color="var(--accent)" />
                            Transaction History
                        </h2>
                        <TransactionList
                            transactions={transactions}
                            currency={wallet?.currency}
                        />
                    </div>
                </div>

                <div className="sidebar_section">
                    <div className="section_card mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="section_title m-0">
                                <MdReceipt size={22} color="var(--accent)" />
                                Quick Invoices
                            </h2>
                            <button
                                className="view_all_link"
                                onClick={() => navigate("/app/finance/invoices")}
                            >
                                View All
                            </button>
                        </div>
                        <div className="quick_invoice_list">
                            {invoices.slice(0, 3).map(inv => (
                                <div
                                    key={inv.id}
                                    className="quick_invoice_item"
                                    onClick={() => navigate(`/app/finance/invoices?open_id=${inv.id}`)}
                                >
                                    <div className="quick_inv_main">
                                        <div className="quick_inv_info">
                                            <span className="quick_inv_id">#{inv.id.slice(0, 8).toUpperCase()}</span>
                                            <span className="quick_inv_date">Due {new Date(inv.dueDate).toLocaleDateString()}</span>
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
                                <div className="text-center py-2 muted fs-13">No pending invoices</div>
                            )}
                        </div>
                    </div>

                    <div className="section_card mb-4">
                        <h2 className="section_title">
                            <MdAccountBalance size={22} color="var(--accent)" />
                            Settlement
                        </h2>
                        <div className="settings_item">
                            <div className="settlement_box">
                                <div className="settlement_header">Bank Account</div>
                                <div className="settlement_value">
                                    {wallet?.bankName || "Not Set"}
                                </div>
                                <div className="settlement_value">
                                    {wallet?.bankAccount || "****"}
                                </div>
                            </div>
                            <button
                                className="app_btn app_btn_cancel w-100"
                                onClick={() => setShowSettlement(true)}
                            >
                                Update Account
                            </button>
                        </div>
                    </div>

                    <div className="section_card">
                        <h2 className="section_title">
                            <MdSecurity size={22} color="var(--accent)" />
                            Security
                        </h2>
                        <div className="settings_item">
                            <div className="pin_status_box">
                                <span className="settlement_header">Transaction Pin</span>
                                <span className={`badge ${wallet?.transactionPin ? "email_badge_verified" : "email_badge_unverified"}`}>
                                    {wallet?.transactionPin ? "Active" : "Not Set"}
                                </span>
                            </div>
                            <button
                                className="app_btn app_btn_cancel w-100"
                                onClick={() => setShowPin(true)}
                            >
                                {wallet?.transactionPin ? "Change Pin" : "Set Pin"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
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
