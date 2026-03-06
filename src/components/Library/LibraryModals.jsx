import { useState, useEffect, useCallback } from "react";
import Modal from "../Modal";
import Button from "../Button";
import Input from "../Input";
import { MdAdd, MdDelete, MdSearch, MdRestaurantMenu, MdLayers, MdOutlineKitchen, MdSave, MdCalculate } from "react-icons/md";
import { toast } from "react-toastify";
import {
    addRecipeStep,
    updateRecipeStep,
    deleteRecipeStep,
    getAllIngredients,
    getVendorPreps,
    calculateMenuCost,
    calculatePrepCost,
    createPrepItem,
    getVendorIngredients,
    mapVendorIngredient,
    getSupplierPrices
} from "../../api/library";

export function RecipeEditorModal({ isOpen, onClose, target, type = "menu", vendorId, onSuccess }) {
    const [steps, setSteps] = useState(target?.menuRecipes || target?.prepRecipes || []);
    const [loading, setLoading] = useState(false);
    const [addingStep, setAddingStep] = useState(false);
    const [calculatedPrice, setCalculatedPrice] = useState(target?.recipeCost || 0);

    const fetchCost = useCallback(async () => {
        if (!target?.id) return;
        try {
            const res = type === "menu" ? await calculateMenuCost(target.id) : await calculatePrepCost(target.id);
            setCalculatedPrice(res.data?.cost || 0);
        } catch (err) {
            console.error("Calculation failed", err);
        }
    }, [target?.id, type]);

    useEffect(() => {
        if (target) {
            setSteps(target.menuRecipes || target.prepRecipes || []);
            setCalculatedPrice(target.recipeCost || 0);
            fetchCost();
        }
    }, [target, fetchCost]);

    // For adding new step
    const [newItemType, setNewItemType] = useState("ingredient");
    const [newSearch, setNewSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [instruction, setInstruction] = useState("");

    useEffect(() => {
        if (target) {
            setSteps(target.menuRecipes || target.prepRecipes || []);
        }
    }, [target]);

    const handleSearch = async (val) => {
        setNewSearch(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            if (newItemType === "ingredient") {
                const res = await getAllIngredients();

                setSearchResults((res.data?.data || []).filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
            } else {
                const res = await getVendorPreps(vendorId);
                setSearchResults((res.data || []).filter(i => i.name.toLowerCase().includes(val.toLowerCase())));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddStep = async () => {
        if (!selectedItem || !quantity) return;
        setLoading(true);
        try {
            const payload = {
                [type === "menu" ? "menuItemId" : "prepItemId"]: target.id,
                type: newItemType,
                itemId: selectedItem.id,
                quantity: parseFloat(quantity),
                instruction
            };
            await addRecipeStep(payload);
            toast.success("Step added");
            setAddingStep(false);
            setSelectedItem(null);
            setQuantity("");
            setInstruction("");
            setNewSearch("");
            setSearchResults([]);
            await fetchCost();
            onSuccess();
        } catch (err) {
            toast.error("Failed to add step");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStep = async (id) => {
        if (!window.confirm("Delete this step?")) return;
        try {
            await deleteRecipeStep(id);
            toast.success("Step deleted");
            await fetchCost();
            onSuccess();
        } catch {
            toast.error("Failed to delete step");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={target ? `Recipe: ${target.name}` : "Manage Recipe"}
            description="Build your recipe block-by-block using ingredients or prep items."
            size="lg"
        >
            <div className="modal-body">
                {/* Current Steps */}
                <div className="recipe_steps_list">
                    {steps.length === 0 && !addingStep && (
                        <div className="text-center py-5 opacity-50">
                            <MdRestaurantMenu size={40} className="mb-2" />
                            <p>No steps added yet. Start by adding an ingredient or prep item.</p>
                        </div>
                    )}

                    {steps.map((step, idx) => (
                        <div key={step.id} className="recipe_step_block">
                            <div className="step_number">{idx + 1}</div>
                            <div className="step_content">
                                <div className="d-flex justify-content-between">
                                    <span className="step_item_name">
                                        {step.type === 'ingredient' ? step.ingredient?.name : step.prepRef?.name}
                                    </span>
                                    <span className="step_qty text-accent">{step.quantity} {step.type === 'ingredient' ? step.ingredient?.unit : step.prepRef?.unit}</span>
                                </div>
                                <p className="step_instruction mb-0">{step.instruction || "No instructions"}</p>
                            </div>
                            <button className="btn_icon_delete ms-3" onClick={() => handleDeleteStep(step.id)}>
                                <MdDelete size={18} />
                            </button>
                        </div>
                    ))}
                </div>

                {addingStep ? (
                    <div className="new_step_form mt-4 p-3 rounded-12 border bg-hover">
                        <h6 className="mb-3 d-flex align-items-center gap-2">
                            <MdAdd /> New Recipe Block
                        </h6>

                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="modal-label">Item Type</label>
                                <select
                                    className="modal-input"
                                    value={newItemType}
                                    onChange={(e) => {
                                        setNewItemType(e.target.value);
                                        setSelectedItem(null);
                                        setSearchResults([]);
                                        setNewSearch("");
                                    }}
                                >
                                    <option value="ingredient">Ingredient</option>
                                    <option value="prep">Prep Item</option>
                                </select>
                            </div>
                            <div className="col-md-8 position-relative">
                                <label className="modal-label">Search {newItemType === 'ingredient' ? 'Ingredients' : 'Preps'}</label>
                                <Input
                                    className="modal-input"
                                    placeholder="Type to search..."
                                    value={selectedItem ? selectedItem.name : newSearch}
                                    onChange={handleSearch}
                                    disabled={!!selectedItem}
                                    right={selectedItem && (
                                        <button className="btn-close me-2" onClick={() => setSelectedItem(null)} style={{ fontSize: 10 }} />
                                    )}
                                />
                                {searchResults.length > 0 && !selectedItem && (
                                    <div className="search_results_dropdown">
                                        {searchResults.map(item => (
                                            <div key={item.id} className="search_result_item" onClick={() => setSelectedItem(item)}>
                                                {item.image ? <img src={item.image} alt="" /> : <div className="result_icon"><MdOutlineKitchen /></div>}
                                                <span>{item.name} ({item.unit})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-4">
                                <label className="modal-label">Quantity</label>
                                <Input
                                    className="modal-input"
                                    type="number"
                                    placeholder="e.g. 0.5"
                                    value={quantity}
                                    onChange={setQuantity}
                                />
                            </div>
                            <div className="col-md-8">
                                <label className="modal-label">Instructions</label>
                                <Input
                                    className="modal-input"
                                    placeholder="e.g. Chop finely and add to pot"
                                    value={instruction}
                                    onChange={setInstruction}
                                />
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1" onClick={() => setAddingStep(false)}>Cancel</Button>
                            <Button variant="primary" className="flex-1" onClick={handleAddStep} disabled={loading || !selectedItem || !quantity}>
                                {loading ? "Adding..." : "Add to Recipe"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button variant="outline" className="w-100 mt-4 border-dashed" onClick={() => setAddingStep(true)}>
                        <MdAdd size={20} className="me-2" />
                        Add Step
                    </Button>
                )}
            </div>

            <div className="modal-footer d-flex justify-content-between align-items-center">
                <div className="text-accent fw-700">
                    <MdCalculate className="me-1" />
                    Estimate Cost: ₦{Number(calculatedPrice).toLocaleString()}
                </div>
                <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
        </Modal>
    );
}

export function IngredientMapModal({ isOpen, onClose, onSuccess }) {
    const [ingredients, setIngredients] = useState([]);
    const [mapped, setMapped] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIng, setSelectedIng] = useState(null);
    const [supplierPrices, setSupplierPrices] = useState([]);
    const [selectedPrice, setSelectedPrice] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ingRes, mapRes] = await Promise.all([
                getAllIngredients(),
                getVendorIngredients()
            ]);
            setIngredients(ingRes?.data?.data || []);
            setMapped(mapRes?.data?.data || []);
        } catch (err) {
            toast.error("Failed to load ingredients");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, fetchData]);

    const handleSelectIngredient = async (ing) => {
        setSelectedIng(ing);
        try {
            const res = await getSupplierPrices(ing.id);
            setSupplierPrices(res.data || []);
        } catch {
            toast.error("Failed to load supplier prices");
        }
    };

    const handleMap = async () => {
        if (!selectedIng || !selectedPrice) return;
        setLoading(true);
        try {
            await mapVendorIngredient({
                ingredientId: selectedIng.id,
                supplierPriceId: selectedPrice.id
            });
            toast.success("Ingredient mapped successfully");
            setSelectedIng(null);
            setSelectedPrice(null);
            fetchData();
            onSuccess();
        } catch (err) {
            toast.error("Failed to map ingredient");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Map Ingredients" size="lg">
            <div className="modal-body">
                <div className="row">
                    <div className="col-md-6 border-end">
                        <label className="modal-label">Platform Ingredients</label>
                        <div className="ing_list_scroll mt-2">
                            {ingredients?.map(ing => {
                                const isMapped = mapped.find(m => m.ingredientId === ing.id);
                                return (
                                    <div
                                        key={ing.id}
                                        className={`ing_selectable_item ${selectedIng?.id === ing.id ? 'active' : ''} ${isMapped ? 'mapped' : ''}`}
                                        onClick={() => handleSelectIngredient(ing)}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            {ing.image ? <img src={ing.image} alt="" /> : <div className="result_icon small"><MdOutlineKitchen /></div>}
                                            <div className="flex-1">
                                                <div className="fw-600 fs-13">{ing.name}</div>
                                                <div className=" fs-11">{ing.category} • {ing.unit}</div>
                                            </div>
                                            {isMapped && <span className="badge email_badge_verified fs-10">Mapped</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="modal-label">Supplier Prices for {selectedIng?.name || '...'}</label>
                        {!selectedIng ? (
                            <div className="text-center py-5 opacity-50">
                                <MdOutlineKitchen size={40} className="mb-2" />
                                <p>Select an ingredient to view supplier prices.</p>
                            </div>
                        ) : supplierPrices.length === 0 ? (
                            <div className="text-center py-5 opacity-50">
                                <p>No supplier prices found for this ingredient.</p>
                            </div>
                        ) : (
                            <div className="ing_list_scroll mt-2">
                                {supplierPrices.map(price => (
                                    <div
                                        key={price.id}
                                        className={`ing_selectable_item ${selectedPrice?.id === price.id ? 'active' : ''}`}
                                        onClick={() => setSelectedPrice(price)}
                                    >
                                        <div className="fw-600 fs-13">₦ {Number(price.price).toLocaleString()}</div>
                                        <div className=" fs-11">{price.supplier?.name || 'Trayva Supplier'}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedPrice && (
                            <div className="mt-4 p-3 bg-hover rounded-12 border">
                                <div className="fs-12  mb-1">Mapping Summary:</div>
                                <div className="fw-700">{selectedIng.name}</div>
                                <div className="text-accent fw-700">@ ₦{Number(selectedPrice.price).toLocaleString()} / {selectedIng.unit}</div>
                                <Button
                                    variant="primary"
                                    className="w-100 mt-3"
                                    onClick={handleMap}
                                    disabled={loading}
                                >
                                    {loading ? "Mapping..." : "Confirm Mapping"}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

export function CreatePrepModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createPrepItem({ name, unit, description });
            toast.success("Prep item created!");
            setName("");
            setUnit("");
            setDescription("");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to create prep item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Prep Item">
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-field mb-3">
                        <label className="modal-label">Prep Item Name</label>
                        <Input
                            className="modal-input"
                            placeholder="e.g. Tomato Base Sauce"
                            value={name}
                            onChange={setName}
                            required
                        />
                    </div>
                    <div className="form-field mb-3">
                        <label className="modal-label">Unit of Measure</label>
                        <Input
                            className="modal-input"
                            placeholder="e.g. Litres, KG, Portions"
                            value={unit}
                            onChange={setUnit}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label className="modal-label">Description (Optional)</label>
                        <Input
                            className="modal-input"
                            placeholder="Briefly describe what this prep is for"
                            value={description}
                            onChange={setDescription}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={loading}>{loading ? "Create Prep Item" : "Create Prep Item"}</Button>
                </div>
            </form>
        </Modal>
    );
}
