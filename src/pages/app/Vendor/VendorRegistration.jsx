import { useState } from "react";
import { toast } from "react-toastify";
import { registerBusiness } from "../../../api/vendor";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import { MdStorefront, MdCloudUpload } from "react-icons/md";

export default function VendorRegistration({ onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        businessName: "",
        brandTagline: "",
        brandColor: "#6366f1",
        businessRegDoc: null,
        brandLogo: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.businessName) return toast.error("Business name is required");

        setLoading(true);
        try {
            await registerBusiness(formData);
            toast.success("Business registered successfully!");
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vendor_reg_container">
            <br />
            <br />
            <div className="vendor_reg_card">
                <div className="text-center mb-4">
                    <div className="vendor_empty_icon">
                        <MdStorefront />
                    </div>
                    <h2 className="page_title_big">Register Your Business</h2>
                    <p className="welcome_message">Join Nora as a vendor and start managing your concepts and menus.</p>
                </div>

                <form onSubmit={handleSubmit} className="app_form">
                    <div className="mb-3">
                        <Input
                            label="Business Name"
                            placeholder="Entet your business name"
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
                            placeholder="A short tagline for your brand"
                            value={formData.brandTagline}
                            onChange={(val) => setFormData({ ...formData, brandTagline: val })}
                            labelClassName="modal-label"
                            className="modal-input"
                        />
                    </div>

                    <div className="mb-4">
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
                                    id="regDoc"
                                    className="d-none"
                                    onChange={(e) => setFormData({ ...formData, businessRegDoc: e.target.files[0] })}
                                />
                                <label style={{ display: "flex", gap: 10, alignItems: "center" }} htmlFor="regDoc" className="file_upload_label">
                                    <MdCloudUpload size={24} />
                                    <span>{formData.businessRegDoc?.name || "Upload Document"}</span>
                                </label>
                            </div>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="modal-label">Brand Logo</label>
                            <div className="file_upload_box">
                                <input
                                    type="file"
                                    id="brandLogo"
                                    className="d-none"
                                    onChange={(e) => setFormData({ ...formData, brandLogo: e.target.files[0] })}
                                />
                                <label style={{ display: "flex", gap: 10, alignItems: "center" }} htmlFor="brandLogo" className="file_upload_label">
                                    <MdCloudUpload size={24} />
                                    <span>{formData.brandLogo?.name || "Upload Logo"}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className={`app_btn app_btn_confirm w-100 ${loading ? "btn_loading" : ""}`}
                        loading={loading}
                    >
                        Register Business
                    </Button>
                </form>
            </div>
        </div>
    );
}
