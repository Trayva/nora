import { useState, useEffect } from "react";
import Modal from "../Modal";
import Input from "../Input";
import Button from "../Button";
import { toast } from "react-toastify";
import { createConcept, createMenuItem, addMenuRecipe, deleteMenuRecipe, updateBusiness } from "../../api/vendor";
import { MdCloudUpload, MdDelete } from "react-icons/md";

/**
 * Modal to create a new Food Concept
 */
export function ConceptModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        origin: "",
        serveTo: "",
        description: "",
        banner: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createConcept(formData);
            toast.success("Concept created successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create concept");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Concept"
            description="Define a new food concept/brand for your business."
        >
            <form onSubmit={handleSubmit} className="p-3">
                <div className="mb-3">
                    <Input
                        label="Concept Name"
                        placeholder="e.g. Pasta Bliss"
                        value={formData.name}
                        onChange={(val) => setFormData({ ...formData, name: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                        required
                    />
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <Input
                            label="Origin"
                            placeholder="e.g. Italian"
                            value={formData.origin}
                            onChange={(val) => setFormData({ ...formData, origin: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                            required
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <Input
                            label="Serve To"
                            placeholder="e.g. Students"
                            value={formData.serveTo}
                            onChange={(val) => setFormData({ ...formData, serveTo: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                            required
                        />
                    </div>
                </div>
                <div className="mb-3">
                    <Input
                        label="Description"
                        textarea
                        rows={3}
                        placeholder="What is this concept about?"
                        value={formData.description}
                        onChange={(val) => setFormData({ ...formData, description: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                    />
                </div>
                <div className="mb-4">
                    <label className="modal-label">Banner Image</label>
                    <div className="file_upload_box">
                        <input
                            type="file"
                            id="banner"
                            className="d-none"
                            onChange={(e) => setFormData({ ...formData, banner: e.target.files[0] })}
                        />
                        <label htmlFor="banner" className="file_upload_label">
                            <MdCloudUpload size={24} />
                            <span>{formData.banner?.name || "Upload Banner Image"}</span>
                        </label>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button type="button" className="app_btn_cancel flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={loading}>Create Concept</Button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Modal to create/edit Menu Items
 */
export function MenuItemModal({ isOpen, onClose, conceptId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        conceptId,
        name: "",
        description: "",
        image: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createMenuItem({ ...formData, conceptId });
            toast.success("Menu item added!");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add menu item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Menu Item"
            description="Add a new dish to your concept's menu."
        >
            <form onSubmit={handleSubmit} className="p-3">
                <div className="mb-3">
                    <Input
                        label="Item Name"
                        placeholder="e.g. Spicy Penne Arrabbiata"
                        value={formData.name}
                        onChange={(val) => setFormData({ ...formData, name: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                        required
                    />
                </div>
                <div className="mb-3">
                    <Input
                        label="Description"
                        textarea
                        rows={2}
                        placeholder="Briefly describe the dish"
                        value={formData.description}
                        onChange={(val) => setFormData({ ...formData, description: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                    />
                </div>
                <div className="mb-4">
                    <label className="modal-label">Item Image</label>
                    <div className="file_upload_box">
                        <input
                            type="file"
                            id="itemImage"
                            className="d-none"
                            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                        />
                        <label htmlFor="itemImage" className="file_upload_label">
                            <MdCloudUpload size={24} />
                            <span>{formData.image?.name || "Upload Dish Image"}</span>
                        </label>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button type="button" className="app_btn_cancel flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={loading}>Add to Menu</Button>
                </div>
            </form>
        </Modal>
    );
}

/**
 * Modal to manage Recipe Steps for a Menu Item
 */
export function RecipeModal({ isOpen, onClose, menuItem, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "ingredient",
        itemId: "",
        quantity: 0,
        instruction: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addMenuRecipe(menuItem.id, formData);
            toast.success("Recipe step added!");
            onSuccess();
            setFormData({ type: "ingredient", itemId: "", quantity: 0, instruction: "" });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add step");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Manage Recipe: ${menuItem?.name}`}
            description="Add ingredients and preparation steps for this menu item."
            width="600px"
        >
            <div className="p-3">
                <form onSubmit={handleSubmit} className="mb-4 p-3 bg-hover rounded-12">
                    <h4 className="fs-14 mb-3">Add New Step</h4>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <Input
                                label="Step Type"
                                select
                                options={[
                                    { label: "Ingredient", value: "ingredient" },
                                    { label: "Preparation", value: "prep" }
                                ]}
                                value={formData.type}
                                onChange={(val) => setFormData({ ...formData, type: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <Input
                                label="Item/Prep ID"
                                placeholder="ID of ingredient/prep"
                                value={formData.itemId}
                                onChange={(val) => setFormData({ ...formData, itemId: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                                required
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <Input
                                label="Quantity"
                                type="number"
                                step="0.01"
                                value={formData.quantity}
                                onChange={(val) => setFormData({ ...formData, quantity: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                                required
                            />
                        </div>
                        <div className="col-md-8 mb-3">
                            <Input
                                label="Special Instruction"
                                placeholder="e.g. Finely chopped"
                                value={formData.instruction}
                                onChange={(val) => setFormData({ ...formData, instruction: val })}
                                labelClassName="modal-label"
                                className="modal-input"
                            />
                        </div>
                    </div>
                    <Button type="submit" loading={loading} className="w-100">Add Step</Button>
                </form>

                <div className="recipe_steps_list">
                    <h4 className="fs-14 mb-3">Current Steps</h4>
                    {menuItem?.menuRecipes?.length > 0 ? (
                        menuItem.menuRecipes.map((step, idx) => (
                            <div key={step.id || idx} className="d-flex justify-content-between align-items-center p-2 mb-2 bg-hover rounded-8">
                                <div className="flex-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className={`badge ${step.type === 'ingredient' ? 'email_badge_verified' : 'bg-info'} `} style={{ fontSize: '10px' }}>
                                            {step.type}
                                        </span>
                                        <span className="fs-13 fw-700">{step.quantity} units</span>
                                    </div>
                                    <p className="fs-12 text-muted mb-0">{step.instruction || "No instructions"}</p>
                                </div>
                                <button
                                    className="btn_icon_delete ms-2"
                                    onClick={async () => {
                                        if (window.confirm("Delete this recipe step?")) {
                                            try {
                                                await deleteMenuRecipe(step.id);
                                                toast.success("Step removed");
                                                onSuccess();
                                            } catch (err) {
                                                toast.error("Failed to delete step");
                                            }
                                        }
                                    }}
                                >
                                    <MdDelete size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted py-3 fs-13">No steps added yet.</p>
                    )}
                </div>

                <div className="mt-4 pt-3 border-top">
                    <Button className="w-100 app_btn_cancel" onClick={onClose}>Done</Button>
                </div>
            </div>
        </Modal>
    );
}

/**
 * Modal to update Vendor Business Profile
 */
export function UpdateVendorModal({ isOpen, onClose, vendor, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: vendor?.businessName || "",
        brandTagline: vendor?.brandTagline || vendor?.branding?.tagline || "",
        brandColor: vendor?.brandColor || vendor?.branding?.color || "#6366f1",
        businessRegDoc: null,
        brandLogo: null
    });
    useEffect(() => {
        if (vendor) {
            setFormData({
                businessName: vendor.businessName || "",
                brandTagline: vendor.brandTagline || vendor?.branding?.tagline || "",
                brandColor: vendor.brandColor || vendor?.branding?.color || "#6366f1",
                businessRegDoc: null,
                brandLogo: null
            });
        }
    }, [vendor]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateBusiness(formData);
            toast.success("Business updated successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Business Profile"
            description="Modify your brand details and business information."
        >
            <form onSubmit={handleSubmit} className="p-3">
                <div className="mb-3">
                    <Input
                        label="Business Name"
                        value={formData.businessName}
                        onChange={(val) => setFormData({ ...formData, businessName: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                        required
                    />
                </div>
                <div className="mb-3">
                    <Input
                        label="Brand Tagline"
                        value={formData.brandTagline}
                        onChange={(val) => setFormData({ ...formData, brandTagline: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                    />
                </div>
                <div className="mb-3">
                    <Input
                        label="Brand Color"
                        type="color"
                        value={formData.brandColor}
                        onChange={(val) => setFormData({ ...formData, brandColor: val })}
                        labelClassName="modal-label"
                        className="modal-input"
                        containerStyle={{ height: '50px' }}
                    />
                </div>
                <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                        <label className="modal-label">Business Reg. Document</label>
                        <div className="file_upload_box">
                            <input
                                type="file"
                                id="updateRegDoc"
                                className="d-none"
                                onChange={(e) => setFormData({ ...formData, businessRegDoc: e.target.files[0] })}
                            />
                            <label htmlFor="updateRegDoc" className="file_upload_label">
                                <MdCloudUpload size={20} />
                                <span className="text-truncate">{formData.businessRegDoc?.name || "Replace Doc"}</span>
                            </label>
                        </div>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="modal-label">Brand Logo</label>
                        <div className="file_upload_box">
                            <input
                                type="file"
                                id="updateLogo"
                                className="d-none"
                                onChange={(e) => setFormData({ ...formData, brandLogo: e.target.files[0] })}
                            />
                            <label htmlFor="updateLogo" className="file_upload_label">
                                <MdCloudUpload size={20} />
                                <span className="text-truncate">{formData.brandLogo?.name || "Replace Logo"}</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button type="button" className="app_btn_cancel flex-1" onClick={onClose}>Cancel</Button>
                    <Button type="submit" className="flex-1" loading={loading}>Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
}
