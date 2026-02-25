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
import { getWallet, getTransactions } from "../../../api/finance";
import { MdSecurity, MdAccountBalance, MdHistory } from "react-icons/md";
import { toast } from "react-toastify";

export default function Wallet() {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showTopup, setShowTopup] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [showSettlement, setShowSettlement] = useState(false);

    const fetchData = async () => {
        try {
            const [walletRes, transRes] = await Promise.all([
                getWallet(),
                getTransactions(),
            ]);
            setWallet(walletRes.data);
            setTransactions(transRes.data || []);
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
