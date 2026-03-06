import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input from "../Input";
import Button from "../Button";
import { toast } from "react-toastify";
import { addSupplierPrice, reviewSupplyRequest, shipSupplyRequest, getSupplyRequestById } from "../../api/supply";
import { getAllIngredients } from "../../api/library";
import { MdClose, MdCloudUpload, MdSearch, MdInventory } from "react-icons/md";

export const PriceModal = ({ isOpen, onClose, ingredient, onSuccess, stateId }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        price: "",
        validFrom: "",
        validTo: ""
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({ price: "", validFrom: "", validTo: "" });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.price) return toast.error("Price is required");

        setLoading(true);
        try {
            await addSupplierPrice({
                ingredientId: ingredient.id,
                price: Number(formData.price),
                validFrom: formData.validFrom || null,
                validTo: formData.validTo || null,
                stateId
            });
            toast.success("Price added successfully");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to add price");
        } finally {
            setLoading(false);
        }
    };

    if (!ingredient) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Set Price for ${ingredient.name}`}>
            <form onSubmit={handleSubmit} className="app_form">
                <div className="mb-3">
                    <Input
                        label="Price (₦)"
                        type="number"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(val) => setFormData({ ...formData, price: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                        required
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <Input
                            label="Valid From"
                            type="date"
                            value={formData.validFrom}
                            onChange={(val) => setFormData({ ...formData, validFrom: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <Input
                            label="Valid To"
                            type="date"
                            value={formData.validTo}
                            onChange={(val) => setFormData({ ...formData, validTo: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <Button type="submit" className="app_btn app_btn_confirm w-100" loading={loading}>
                        Save Price
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export const RequestDetailModal = ({ isOpen, onClose, request, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fullRequest, setFullRequest] = useState(null);
    const [suppliedQuantities, setSuppliedQuantities] = useState({});

    useEffect(() => {
        if (request?.id && isOpen) {
            const fetchFullRequest = async () => {
                setFetching(true);
                try {
                    const res = await getSupplyRequestById(request.id);
                    const data = res.data || res;
                    setFullRequest(data);

                    const initial = {};
                    (data.items || []).forEach(item => {
                        initial[item.ingredientId] = item.quantity;
                    });
                    setSuppliedQuantities(initial);
                } catch (err) {
                    toast.error("Failed to fetch request details");
                    console.error(err);
                } finally {
                    setFetching(false);
                }
            };
            fetchFullRequest();
        } else {
            setFullRequest(null);
            setSuppliedQuantities({});
        }
    }, [request?.id, isOpen]);

    const handleReview = async () => {
        if (!data) return;
        setLoading(true);
        try {
            const items = [];
            for (const item of data.items) {
                items.push({
                    ingredientId: item.ingredientId,
                    suppliedQuantity: Number(suppliedQuantities[item.ingredientId])
                });
            }
            await reviewSupplyRequest(data.id, { items });
            toast.success("Request reviewed");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err.response);
            toast.error("Failed to review request");
        } finally {
            setLoading(false);
        }
    };

    const handleShip = async () => {
        if (!data) return;
        setLoading(true);
        try {
            await shipSupplyRequest(data.id);
            toast.success("Request marked as shipped");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to ship request");
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    const data = fullRequest || request;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Supply Request #${data.id.slice(0, 8).toUpperCase()}`}>
            {fetching ? (
                <div className="text-center py-5">
                    <div className="page_loader_spinner mx-auto" style={{ width: 40, height: 40 }} />
                </div>
            ) : (
                <div className="request_details">
                    <div className="mb-4">
                        <span className="badge email_badge_verified mb-2">{data.status}</span>
                        <p className="fs-14 text-muted">From: {data.requester?.name}</p>
                    </div>

                    <div className="request_items_list">
                        <h4 className="fs-16 mb-3">Requested Items</h4>
                        {data?.items?.map(item => (
                            <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 p-2 bg-hover rounded-8">
                                <div>
                                    <div className="fw-500">{item.ingredient?.name}</div>
                                    <div className="fs-12 text-muted">Requested: {item.quantity} units</div>
                                </div>
                                <div style={{ width: 100 }}>
                                    <Input
                                        type="number"
                                        value={suppliedQuantities[item.ingredientId]}
                                        onChange={(val) => setSuppliedQuantities({ ...suppliedQuantities, [item.ingredientId]: val })}
                                        className="modal-input py-1 text-center"
                                        disabled={data.status !== 'PENDING'}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 d-flex gap-2">
                        {data.status === 'PENDING' && (
                            <Button onClick={handleReview} className="app_btn app_btn_confirm flex-grow-1" loading={loading}>
                                Review & Accept
                            </Button>
                        )}
                        {data.status === 'SUPPLIER_REVIEWED' && (
                            <Button onClick={handleShip} className="app_btn app_btn_confirm flex-grow-1" loading={loading}>
                                Mark as Shipped
                            </Button>
                        )}
                        <Button onClick={onClose} className="app_btn_cancel flex-grow-1">
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export const UpdateSupplierModal = ({ isOpen, onClose, supplier, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: supplier?.businessName || "",
        businessRegDoc: null,
        brandLogo: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // await updateSupplier(formData);
            toast.success("Profile updated");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Supplier Profile">
            <form onSubmit={handleSubmit} className="app_form">
                <div className="mb-3">
                    <Input
                        label="Business Name"
                        value={formData.businessName}
                        onChange={(val) => setFormData({ ...formData, businessName: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                    />
                </div>
                <div className="mt-4">
                    <Button type="submit" className="app_btn app_btn_confirm w-100" loading={loading}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export const AddPriceModal = ({ isOpen, onClose, onSuccess, stateId }) => {
    const [step, setStep] = useState(1); // 1: Search, 2: Set Price
    const [search, setSearch] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [formData, setFormData] = useState({
        price: "",
        validFrom: "",
        validTo: ""
    });

    useEffect(() => {
        if (step === 1 && search.trim()) {
            const delayDebounceFn = setTimeout(() => {
                handleSearch();
            }, 500);

            return () => clearTimeout(delayDebounceFn);
        } else if (!search.trim()) {
            setIngredients([]);
        }
    }, [search, step]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await getAllIngredients(1, 10, search);
            setIngredients(res.data.data || []);
        } catch (err) {
            toast.error("Failed to fetch ingredients");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectIngredient = (ing) => {
        setSelectedIngredient(ing);
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addSupplierPrice({
                ingredientId: selectedIngredient.id,
                price: Number(formData.price),
                validFrom: formData.validFrom || null,
                validTo: formData.validTo || null,
                stateId
            });
            toast.success("Price added successfully");
            onSuccess();
            onClose();
            setStep(1);
            setSearch("");
            setIngredients([]);
        } catch (err) {
            toast.error("Failed to add price");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { onClose(); setStep(1); }} title={step === 1 ? "Search Ingredient" : `Set Price for ${selectedIngredient?.name}`}>
            {step === 1 ? (
                <div>
                    <form onSubmit={handleSearch} className="mb-4">
                        <Input
                            placeholder="Type ingredient name..."
                            value={search}
                            onChange={(val) => setSearch(val)}
                            className="modal-input"
                            icon={<MdSearch onClick={handleSearch} style={{ cursor: 'pointer' }} />}
                        />
                    </form>

                    {loading ? (
                        <div className="text-center py-4"><div className="page_loader_spinner mx-auto" style={{ width: 30, height: 30 }} /></div>
                    ) : (
                        <div className="search_results" style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {ingredients.map(ing => (
                                <div key={ing.id} className="d-flex align-items-center gap-3 p-2 bg-hover rounded-8 mb-2 cursor-pointer" onClick={() => handleSelectIngredient(ing)}>
                                    {ing.image ? (
                                        <img src={ing.image} alt={ing.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MdInventory opacity={0.3} size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <div className="fw-500">{ing.name}</div>
                                        <div className="fs-12 text-muted">{ing.category}</div>
                                    </div>
                                </div>
                            ))}
                            {ingredients.length === 0 && search && !loading && (
                                <div className="text-center py-4 text-muted fs-14">No ingredients found</div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="app_form">
                    <div className="mb-3">
                        <Input
                            label="Price (₦)"
                            type="number"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(val) => setFormData({ ...formData, price: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                            required
                        />
                    </div>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Input
                                label="Valid From"
                                type="date"
                                value={formData.validFrom}
                                onChange={(val) => setFormData({ ...formData, validFrom: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <Input
                                label="Valid To"
                                type="date"
                                value={formData.validTo}
                                onChange={(val) => setFormData({ ...formData, validTo: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                            />
                        </div>
                    </div>
                    <div className="mt-4 d-flex gap-2">
                        <Button type="button" className="app_btn_cancel flex-grow-1" onClick={() => setStep(1)}>
                            Back
                        </Button>
                        <Button type="submit" className="app_btn app_btn_confirm flex-grow-1" loading={loading}>
                            Save Price
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
};
