import { useState, useEffect, useCallback } from "react";
import { getMyVendor, getVendorConcepts, getMenuItemsByConcept, deleteMenuItem, updateConceptStatus } from "../../../api/vendor";
import VendorRegistration from "./VendorRegistration";
import "./Vendor.css";
import { MdStorefront, MdLayers, MdRestaurantMenu, MdEdit, MdAdd, MdArrowForward, MdDelete } from "react-icons/md";
import Button from "../../../components/Button";
import { ConceptModal, MenuItemModal, RecipeModal, UpdateVendorModal } from "../../../components/Vendor/VendorModals";
import { toast } from "react-toastify";

const VendorProfile = ({ vendor, onUpdate }) => {
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    return (
        <div className="section_card">
            <div className="vendor_profile_header">
                {vendor.brandLogo ? (
                    <img src={vendor.brandLogo} alt="Logo" className="vendor_logo_large" />
                ) : (
                    <div className="vendor_logo_placeholder">
                        {vendor.businessName.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h2 className="mb-1">{vendor.businessName}</h2>
                    <p className=" mb-3">{vendor.brandTagline || "No tagline set"}</p>
                    <div className="d-flex gap-3 align-items-center">
                        <span className="badge email_badge_verified">{vendor.membershipStatus}</span>
                        <div className="d-flex align-items-center gap-2">
                            <span className="fs-12 ">Brand Color:</span>
                            <span style={{
                                width: 24,
                                height: 24,
                                borderRadius: '6px',
                                background: vendor.brandColor || '#6366f1',
                                border: '2px solid var(--border)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} title="Brand Color"></span>
                        </div>
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
                        <span className="settlement_header d-block mb-1">Business ID</span>
                        <span className="settlement_value fs-14">#{vendor.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
                <div className="col-md-6 mb-3">
                    <div className="settings_item p-3 bg-hover rounded-12">
                        <span className="settlement_header d-block mb-1">Registration Doc</span>
                        <span className="settlement_value fs-14">{vendor.businessRegDoc ? "Verified Document Uploaded" : "Not Provided"}</span>
                    </div>
                </div>
            </div>

            <UpdateVendorModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                vendor={vendor}
                onSuccess={onUpdate}
            />
        </div>
    );
};

const VendorConcepts = ({ onRefresh }) => {
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchConcepts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getVendorConcepts();
            setConcepts(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleToggleStatus = async (e, concept) => {
        e.stopPropagation();
        const newStatus = concept.status === "ACTIVE" ? "DROPPED" : "ACTIVE";
        try {
            await updateConceptStatus(concept.id, newStatus);
            toast.success(`Concept marked as ${newStatus}`);
            fetchConcepts();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    useEffect(() => {
        fetchConcepts();
    }, [fetchConcepts]);

    if (loading) return <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="section_title m-0">Food Concepts</h3>
                <Button onClick={() => setShowModal(true)}>
                    <MdAdd size={20} className="me-1" />
                    New Concept
                </Button>
            </div>

            {concepts.length === 0 ? (
                <div className="vendor_empty_state">
                    <div className="vendor_empty_icon"><MdLayers /></div>
                    <h3>No Concepts Yet</h3>
                    <p className="">Create your first food concept to start selling.</p>
                </div>
            ) : (
                <div className="concept_grid">
                    {concepts.map(concept => (
                        <div key={concept.id} className="concept_card">
                            <div className="concept_banner">
                                {concept.banner ? <img src={concept.banner} alt={concept.name} /> : <MdLayers size={40} opacity={0.2} />}
                            </div>
                            <div className="concept_content">
                                <div className="concept_name">{concept.name}</div>
                                <div className="concept_meta">
                                    <span>{concept.origin}</span>
                                    <span>•</span>
                                    <span>{concept.serveTo}</span>
                                </div>
                                <div className="mt-3 d-flex justify-content-between align-items-center">
                                    <button
                                        className={`badge ${concept.status === 'ACTIVE' ? 'email_badge_verified' : 'email_badge_unverified'} border-0 cursor-pointer`}
                                        onClick={(e) => handleToggleStatus(e, concept)}
                                        title="Click to toggle status"
                                    >
                                        {concept.status}
                                    </button>
                                    <MdArrowForward className="" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConceptModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={fetchConcepts}
            />
        </div>
    );
};

const VendorMenu = () => {
    const [concepts, setConcepts] = useState([]);
    const [selectedConcept, setSelectedConcept] = useState("");
    const [menuItems, setMenuItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [showRecipeModal, setShowRecipeModal] = useState(false);

    const fetchMenuItems = useCallback(async (conceptId) => {
        if (!conceptId) return;
        setLoadingItems(true);
        try {
            const res = await getMenuItemsByConcept(conceptId);
            setMenuItems(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingItems(false);
        }
    }, []);

    const handleDeleteMenuItem = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this menu item?")) return;

        try {
            await deleteMenuItem(id);
            toast.success("Menu item deleted");
            fetchMenuItems(selectedConcept);
        } catch (err) {
            toast.error("Failed to delete item");
        }
    };

    useEffect(() => {
        getVendorConcepts().then(res => {
            setConcepts(res.data || []);
            if (res.data?.length > 0) {
                const firstId = res.data[0].id;
                setSelectedConcept(firstId);
                fetchMenuItems(firstId);
            }
        });
    }, [fetchMenuItems]);

    const handleConceptChange = (e) => {
        const id = e.target.value;
        setSelectedConcept(id);
        fetchMenuItems(id);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <h3 className="section_title m-0">Digital Menu</h3>
                    {concepts.length > 0 && (
                        <select
                            className="modal-input py-1 px-3 fs-14"
                            style={{ width: 'auto' }}
                            value={selectedConcept}
                            onChange={handleConceptChange}
                        >
                            {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                </div>
                <Button onClick={() => setShowModal(true)} disabled={!selectedConcept}>
                    <MdAdd size={20} className="me-1" />
                    Add Menu Item
                </Button>
            </div>

            {loadingItems ? (
                <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>
            ) : menuItems.length === 0 ? (
                <div className="vendor_empty_state">
                    <div className="vendor_empty_icon"><MdRestaurantMenu /></div>
                    <h3>Menu is Empty</h3>
                    <p className="">Once you select a concept, you can manage its menu items here.</p>
                </div>
            ) : (
                <div className="menu_grid">
                    {menuItems.map(item => (
                        <div
                            key={item.id}
                            className="menu_card position-relative"
                            onClick={() => {
                                setSelectedMenuItem(item);
                                setShowRecipeModal(true);
                            }}
                        >
                            <button
                                className="btn_icon_delete position-absolute"
                                style={{ top: 10, right: 10, zIndex: 1 }}
                                onClick={(e) => handleDeleteMenuItem(e, item.id)}
                            >
                                <MdDelete size={16} />
                            </button>
                            {item.image ? (
                                <img src={item.image} alt={item.name} className="menu_img" />
                            ) : (
                                <div className="menu_img bg-hover d-flex align-items-center justify-content-center">
                                    <MdStorefront opacity={0.3} />
                                </div>
                            )}
                            <div className="menu_details">
                                <div className="menu_name">{item.name}</div>
                                <div className="menu_price">₦ {Number(item.sellingPrice).toLocaleString()}</div>
                                <p className="fs-12  mb-0 mt-1 line-clamp-1">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <MenuItemModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                conceptId={selectedConcept}
                onSuccess={() => fetchMenuItems(selectedConcept)}
            />

            <RecipeModal
                isOpen={showRecipeModal}
                onClose={() => setShowRecipeModal(false)}
                menuItem={selectedMenuItem}
                onSuccess={() => fetchMenuItems(selectedConcept).then(() => {
                    // Update the selected item reference after fetch
                    const updated = menuItems.find(i => i.id === selectedMenuItem.id);
                    if (updated) setSelectedMenuItem(updated);
                })}
            />
        </div>
    );
};

export default function VendorIndex() {
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");

    const fetchVendor = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyVendor();
            setVendor(res.data);
        } catch (err) {
            setVendor(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVendor();
    }, [fetchVendor]);

    if (loading) {
        return (
            <div className="page_loader">
                <div className="page_loader_spinner" />
            </div>
        );
    }

    if (!vendor) {
        return <VendorRegistration onSuccess={fetchVendor} />;
    }

    return (
        <div className="vendor_page">
            <div className="mb-4 d-flex justify-content-between align-items-end">
                <div>
                    <h1 className="page_title_big">Vendor Central</h1>
                    <p className="welcome_message">Manage your business profile, food concepts, and digital menus.</p>
                </div>
            </div>

            <div className="vendor_tabs">
                <button
                    className={`vendor_tab ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    <MdStorefront size={18} className="me-2" />
                    Profile
                </button>
                <button
                    className={`vendor_tab ${activeTab === "concepts" ? "active" : ""}`}
                    onClick={() => setActiveTab("concepts")}
                >
                    <MdLayers size={18} className="me-2" />
                    Concepts
                </button>
                <button
                    className={`vendor_tab ${activeTab === "menu" ? "active" : ""}`}
                    onClick={() => setActiveTab("menu")}
                >
                    <MdRestaurantMenu size={18} className="me-2" />
                    Menu
                </button>
            </div>

            <div className="vendor_content">
                {activeTab === "profile" && <VendorProfile vendor={vendor} onUpdate={fetchVendor} />}
                {activeTab === "concepts" && <VendorConcepts onRefresh={fetchVendor} />}
                {activeTab === "menu" && <VendorMenu />}
            </div>
        </div>
    );
}
