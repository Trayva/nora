import { useState, useEffect, useCallback } from "react";
import { getSupplier, getSupplyRequests, getMyPrices } from "../../../api/supply";
import { getAllIngredients } from "../../../api/library";
import SupplierRegistration from "./SupplierRegistration";
import "./Supplier.css";
import { MdStorefront, MdAttachMoney, MdLocalShipping, MdEdit, MdSearch, MdInventory, MdAdd } from "react-icons/md";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { PriceModal, RequestDetailModal, UpdateSupplierModal, AddPriceModal } from "../../../components/Supplier/SupplierModals";
import { PiTruck } from "react-icons/pi";
import SelectState from "../../../components/SelectState";

const SupplierProfile = ({ supplier, onUpdate }) => {
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    return (
        <div className="section_card">
            <div className="supplier_profile_header">
                {supplier.brandLogo ? (
                    <img src={supplier.brandLogo} alt="Logo" className="supplier_logo_large" />
                ) : (
                    <div className="supplier_logo_placeholder">
                        {supplier.businessName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h2 className="mb-1">{supplier.businessName}</h2>
                    <div className="d-flex gap-3 align-items-center">
                        <span className="badge email_badge_verified">{supplier.membershipStatus}</span>
                        <span className="fs-12 text-muted2">ID: #{supplier.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
                <div className="ms-auto">
                    <Button className="app_btn_cancel" onClick={() => setShowUpdateModal(true)}>
                        <MdEdit size={18} className="me-2" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-md-6 mb-3">
                    <div className="settings_item p-3 bg-hover rounded-12">
                        <span className="settlement_header d-block mb-1">Membership Expiry</span>
                        <span className="settlement_value fs-14">
                            {supplier.membershipExpiry ? new Date(supplier.membershipExpiry).toLocaleDateString() : "Lifetime"}
                        </span>
                    </div>
                </div>
                <div className="col-md-6 mb-3">
                    <div className="settings_item p-3 bg-hover rounded-12">
                        <span className="settlement_header d-block mb-1">Registration Doc</span>
                        <span className="settlement_value fs-14">{supplier.businessRegDoc ? "Verified Document Uploaded" : "Not Provided"}</span>
                    </div>
                </div>
            </div>

            <UpdateSupplierModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                supplier={supplier}
                onSuccess={onUpdate}
            />
        </div>
    );
};

const SupplierPrices = ({ state }) => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const fetchPrices = useCallback(async (searchQuery = "") => {
        setLoading(true);
        try {
            const res = await getMyPrices(1, 25, searchQuery, state);
            setPrices(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPrices(search);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search, fetchPrices, state]);

    return (
        <div>
            <div style={{ justifyContent: "space-between", }} className="d-flex flex-column flex-md-row justify-between align-items-start align-items-md-center gap-3 mb-4">
                <h3 className="section_title m-0">My Active Prices</h3>
                <div className="d-flex flex-column flex-sm-row gap-2 w-md-auto">
                    <div className="ingredient_search_p mb-0">
                        <Input
                            placeholder="Search my prices..."
                            value={search}
                            onChange={(val) => setSearch(val)}
                            className="modal-input"
                            icon={<MdSearch />}
                        />
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="flex-shrink-0">
                        <MdAdd size={20} className="me-1" />
                        Add New Price
                    </Button>
                </div>
            </div>

            {loading && prices.length === 0 ? (
                <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>
            ) : prices.length === 0 ? (
                <div className="vendor_empty_state">
                    <div className="vendor_empty_icon">
                        {search ? <MdSearch /> : <MdAttachMoney />}
                    </div>
                    <h3>{search ? "No Results Found" : "No Prices Set"}</h3>
                    <p>{search ? `We couldn't find any prices matching "${search}"` : "Submit your first ingredient price to start receiving requests."}</p>
                </div>
            ) : (
                <div className="ingredient_grid">
                    {prices.map(item => (
                        <div key={item.id} className="ingredient_card" onClick={() => {
                            setSelectedPrice(item);
                            setShowEditModal(true);
                        }}>
                            {item.ingredient?.image ? (
                                <img src={item.ingredient.image} alt={item.ingredient.name} className="ingredient_img_small" />
                            ) : (
                                <div className="ingredient_img_small d-flex align-items-center justify-content-center">
                                    <MdInventory opacity={0.3} size={24} />
                                </div>
                            )}
                            <div className="flex-grow-1">
                                <div className="fw-600">{item.ingredient?.name}</div>
                                <div className="fs-12 text-muted2">{item.ingredient?.category}</div>
                            </div>
                            <div className="text-end">
                                <div className="fw-700 color-accent">₦ {item.price.toLocaleString()}</div>
                                <div className="fs-10 text-muted2">VALID UNTIL {item.validTo ? new Date(item.validTo).toLocaleDateString() : "INF"}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="text-center py-3 w-100">
                            <div className="page_loader_spinner mx-auto" style={{ width: 20, height: 20 }} />
                        </div>
                    )}
                </div>
            )}

            <AddPriceModal
                stateId={state}
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => fetchPrices(search)}
            />

            <PriceModal
                stateId={state}
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                ingredient={selectedPrice?.ingredient}
                onSuccess={() => fetchPrices(search)}
            />
        </div>
    );
};

const SupplierRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSupplyRequests();
            setRequests(res.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    if (loading) return <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>;

    return (
        <div>
            <h3 className="section_title mb-4">Supply Requests</h3>
            {requests.length === 0 ? (
                <div className="vendor_empty_state">
                    <div className="vendor_empty_icon"><MdLocalShipping /></div>
                    <h3>No Requests Yet</h3>
                    <p>When vendors request supplies from you, they will appear here.</p>
                </div>
            ) : (
                <div className="request_grid">
                    {requests.map(req => (
                        <div key={req.id} className="request_card" onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailModal(true);
                        }}>
                            <div className="request_header">
                                <div>
                                    <div className="request_id">#{req.id.slice(0, 8).toUpperCase()}</div>
                                    <div className="request_meta">From: {req.requester.name}</div>
                                </div>
                                <span className={`badge ${req.status === 'PENDING' ? 'email_badge_unverified' : 'email_badge_verified'}`}>
                                    {req.status}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between align-items-end mt-3">
                                <div className="fs-12 text-muted2">
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </div>
                                <div className="request_amount">
                                    ₦ {req.totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <RequestDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                request={selectedRequest}
                onSuccess={fetchRequests}
            />
        </div>
    );
};

export default function SupplierIndex() {
    const [state, setState] = useState(null);
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const fetchSupplier = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getSupplier();
            setSupplier(res.data);
        } catch (err) {
            setSupplier(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSupplier();
    }, [fetchSupplier]);

    if (loading) {
        return (
            <div className="page_loader">
                <div className="page_loader_spinner" />
            </div>
        );
    }

    if (!supplier) {
        return <SupplierRegistration onSuccess={fetchSupplier} />;
    }

    return (
        <div className="supplier_page">
            <div style={{ justifyContent: "space-between" }} className="mb-4 d-flex flex-column flex-md-row justify-between align-items-start align-items-md-end gap-3">
                <div>
                    <h1 className="page_title_big">Supplier Central</h1>
                    <p className="welcome_message">Manage your supply profile, set ingredient prices, and fulfill requests.</p>
                </div>
                <SelectState label='' value={state} onChange={setState} />

            </div>

            <div className="supplier_tabs">
                <button
                    className={`supplier_tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    <MdStorefront size={18} className="me-2" />
                    Profile
                </button>
                <button
                    className={`supplier_tab ${activeTab === "prices" ? "active" : ""}`}
                    onClick={() => setActiveTab("prices")}
                >
                    <MdAttachMoney size={18} className="me-2" />
                    Prices
                </button>
                <button
                    className={`supplier_tab ${activeTab === "requests" ? "active" : ""}`}
                    onClick={() => setActiveTab("requests")}
                >
                    <PiTruck size={18} className="me-2" />
                    Requests
                </button>
            </div>

            <div className="supplier_content">
                {activeTab === "profile" && <SupplierProfile supplier={supplier} onUpdate={fetchSupplier} />}
                {activeTab === "prices" && <SupplierPrices state={state} />}
                {activeTab === "requests" && <SupplierRequests />}
            </div>
        </div>
    );
}
