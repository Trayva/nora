import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Col, Row } from "reactstrap";
import { MdOutlineKitchen, MdRestaurantMenu, MdLayers, MdSearch, MdAdd, MdSettings, MdChevronRight, MdAttachMoney, MdArrowForward } from "react-icons/md";
import { LuLibrary } from "react-icons/lu";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { getVendorConcepts, getMenuItemsByConcept, getMyVendor } from "../../../api/vendor";
import { getVendorIngredients, getVendorPreps } from "../../../api/library";
import { RecipeEditorModal, CreatePrepModal, IngredientMapModal } from "../../../components/Library/LibraryModals";
import "./Library.css";

const tabs = [
    { id: "ingredients", label: "Ingredients", icon: MdOutlineKitchen },
    { id: "preps", label: "Prep Items", icon: MdLayers },
    { id: "recipes", label: "Menu Recipes", icon: MdRestaurantMenu },
];

export default function LibraryIndex() {
    const [activeTab, setActiveTab] = useState("ingredients");
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [concepts, setConcepts] = useState([]);
    const [vendor, setVendor] = useState(null);
    const [preps, setPreps] = useState([]);
    const [showCreatePrep, setShowCreatePrep] = useState(false);
    const [showMapIng, setShowMapIng] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [vendorRes, conceptRes] = await Promise.all([
                getMyVendor(),
                getVendorConcepts()
            ]);
            setVendor(vendorRes.data);
            setConcepts(conceptRes.data || []);

            if (vendorRes.data) {
                const prepRes = await getVendorPreps(vendorRes.data.id);
                setPreps(prepRes.data || []);
            }
        } catch (err) {
            toast.error("Failed to load library data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading && !vendor) {
        return <div className="page_loader"><div className="page_loader_spinner" /></div>;
    }

    return (
        <div className="page_wrapper">
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <div className="d-flex align-items-center gap-2">
                        <LuLibrary size={24} className="" />
                        <h2 className="page_title_big m-0">Library</h2>
                    </div>
                    <p className="welcome_message">Manage your recipes, prep items, and ingredient costs</p>
                </div>
                <div className="d-flex gap-2">
                    {activeTab === 'ingredients' && (
                        <Button
                            variant="primary"
                            icon={<MdAdd size={20} />}
                            onClick={() => setShowMapIng(true)}
                        >
                            Map Ingredient
                        </Button>
                    )}
                    {activeTab === 'preps' && (
                        <Button
                            variant="primary"
                            icon={<MdAdd size={20} />}
                            onClick={() => setShowCreatePrep(true)}
                        >
                            New Prep Item
                        </Button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="library_tabs_wrapper">
                <div className="library_tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`library_tab_btn ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                <div className="library_search">
                    <Input
                        className="modal-input"
                        placeholder={`Search ${activeTab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    // left={<MdSearch size={20} className="opacity-50" />}
                    />
                </div>
            </div>

            <div className="library_content mt-4">
                {activeTab === "ingredients" && <IngredientsTab search={search} vendor={vendor} onRefresh={fetchData} />}
                {activeTab === "preps" && <PrepsTab search={search} vendor={vendor} preps={preps} onRefresh={fetchData} />}
                {activeTab === "recipes" && <RecipesTab search={search} concepts={concepts} vendor={vendor} onRefresh={fetchData} />}
            </div>

            <CreatePrepModal
                isOpen={showCreatePrep}
                onClose={() => setShowCreatePrep(false)}
                onSuccess={fetchData}
            />

            <IngredientMapModal
                isOpen={showMapIng}
                onClose={() => setShowMapIng(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}

function IngredientsTab({ search, vendor, onRefresh }) {
    const [mapped, setMapped] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMapped = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getVendorIngredients();
            setMapped(res.data || []);
        } catch {
            toast.error("Failed to load mapped ingredients");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMapped();
    }, [fetchMapped]);

    const filtered = mapped.filter(m =>
        m.ingredient?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {loading ? (
                <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>
            ) : filtered.length === 0 ? (
                <div className="library_placeholder_card">
                    <MdOutlineKitchen size={48} className="opacity-20 mb-3" />
                    <h5>No Ingredients Mapped</h5>
                    <p className=" small">Mapping ingredients allows you to track costs based on supplier prices.</p>
                </div>
            ) : (
                <div className="library_grid">
                    {filtered.map(m => (
                        <div key={m.id} className="library_card">
                            <div className="library_card_header">
                                <span className="library_card_id">#{m.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                {m.ingredient.image ? <img src={m.ingredient.image} alt="" className="vendor_logo_large" style={{ width: 48, height: 48 }} /> : <div className="vendor_logo_placeholder" style={{ width: 48, height: 48, fontSize: 16 }}>{m.ingredient.name[0]}</div>}
                                <div>
                                    <h4 className="m-0 fs-16">{m.ingredient.name}</h4>
                                    <div className=" fs-12">{m.ingredient.category}</div>
                                </div>
                            </div>

                            <div className="library_card_stats">
                                <div className="stat_item">
                                    <span className="stat_label">Current Price:</span>
                                    <span className="stat_value cost">₦{Number(m.price).toLocaleString()} / {m.ingredient.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PrepsTab({ search, vendor, preps, onRefresh }) {
    const [selectedPrep, setSelectedPrep] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    const filteredPreps = preps.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            {filteredPreps.length === 0 ? (
                <div className="library_placeholder_card">
                    <MdLayers size={48} className="opacity-20 mb-3" />
                    <h5>No Prep Items</h5>
                    <p className=" small">Create reusable components like base sauces or spice mixes.</p>
                </div>
            ) : (
                <div className="library_grid">
                    {filteredPreps.map(prep => (
                        <div key={prep.id} className="library_card" onClick={() => {
                            setSelectedPrep(prep);
                            setShowEditor(true);
                        }}>
                            <div className="library_card_header">
                                <span className="library_card_id">#{prep.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <h4 className="library_card_title">{prep.name}</h4>
                            <p className=" fs-12 mb-0 line-clamp-1">{prep.description || "No description"}</p>

                            <div className="library_card_stats">
                                <div className="stat_item">
                                    <span className="stat_label">Cost:</span>
                                    <span className="stat_value cost">₦{Number(prep.recipeCost).toLocaleString()}</span>
                                </div>
                                <div className="stat_item ms-auto">
                                    <span className="stat_label">Unit:</span>
                                    <span className="stat_value">{prep.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPrep && (
                <RecipeEditorModal
                    isOpen={showEditor}
                    onClose={() => setShowEditor(false)}
                    target={selectedPrep}
                    type="prep"
                    vendorId={vendor?.id}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
}

function RecipesTab({ search, concepts, vendor, onRefresh }) {
    const [selectedConcept, setSelectedConcept] = useState(concepts[0]?.id || "");
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showEditor, setShowEditor] = useState(false);

    const fetchMenuItems = useCallback(async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getMenuItemsByConcept(id);
            setMenuItems(res.data || []);
        } catch {
            toast.error("Failed to load recipes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (concepts.length > 0 && !selectedConcept) {
            setSelectedConcept(concepts[0].id);
        }
    }, [concepts, selectedConcept]);

    useEffect(() => {
        if (selectedConcept) {
            fetchMenuItems(selectedConcept);
        }
    }, [selectedConcept, fetchMenuItems]);

    const filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Concept selector stay same */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <span className="fs-14 fw-600 ">Select Concept:</span>
                <select
                    className="modal-input py-1 px-3 fs-14"
                    style={{ width: 'auto', minWidth: 200 }}
                    value={selectedConcept}
                    onChange={(e) => setSelectedConcept(e.target.value)}
                >
                    {concepts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="page_loader_spinner mx-auto" /></div>
            ) : filteredItems.length === 0 ? (
                <div className="library_placeholder_card" style={{ minHeight: 300 }}>
                    <MdRestaurantMenu size={40} className="opacity-20 mb-3" />
                    <h5>No Menu Items Found</h5>
                    <p className=" small">Once you add items to this concept's menu, they will appear here.</p>
                </div>
            ) : (
                <div className="library_grid">
                    {filteredItems.map(item => (
                        <div key={item.id} className="library_card">
                            <div className="library_card_header">
                                <span className="library_card_id">#{item.id.slice(0, 8).toUpperCase()}</span>
                                <div className="price_badge">
                                    <MdAttachMoney size={14} />
                                    <span>{Number(item.sellingPrice).toLocaleString()}</span>
                                </div>
                            </div>
                            <h4 className="library_card_title">{item.name}</h4>
                            <p className=" fs-12 mb-0 line-clamp-1">{item.description}</p>

                            <div className="library_card_stats">
                                <div className="stat_item">
                                    <span className="stat_label">Cost:</span>
                                    <span className="stat_value cost">₦{Number(item.recipeCost).toLocaleString()}</span>
                                </div>
                                <div className="stat_item ms-auto">
                                    <span className="stat_label">Margin:</span>
                                    <span className="stat_value">
                                        {item.sellingPrice > 0 ? (((item.sellingPrice - item.recipeCost) / item.sellingPrice) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-100 mt-2"
                                size="sm"
                                onClick={() => {
                                    setSelectedItem(item);
                                    setShowEditor(true);
                                }}
                            >
                                <MdSettings size={16} className="me-2" />
                                Manage Recipe
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {selectedItem && (
                <RecipeEditorModal
                    isOpen={showEditor}
                    onClose={() => setShowEditor(false)}
                    target={selectedItem}
                    type="menu"
                    vendorId={vendor?.id}
                    onSuccess={() => {
                        onRefresh();
                        fetchMenuItems(selectedConcept);
                    }}
                />
            )}
        </div>
    );
}
