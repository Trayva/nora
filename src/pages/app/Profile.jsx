import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../../api/account";
import avatar from "../../assets/profile.png";
import moment from "moment";
import { MdOutlineCalendarToday, MdOutlinePhone } from "react-icons/md";
import { LuPenLine } from "react-icons/lu";
import Modal from "../../components/Modal";
import ButtonLoader from "../../components/ButtonLoader";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    image: null,
  });

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data.data);
      // Pre-fill form with existing profile values
      setFormData({
        fullName: data.data.fullName || "",
        phone: data.data.phone || "",
        image: null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      // Use FormData because the endpoint accepts file uploads
      const payload = new FormData();
      if (formData.fullName) payload.append("fullName", formData.fullName);
      if (formData.phone) payload.append("phone", formData.phone);
      if (formData.image) payload.append("image", formData.image);

      await updateProfile(payload);
      await fetchProfile(); // Refresh profile data
      setOpen(false);
    } catch (err) {
      setSubmitError(err.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <div className="page_wrapper profile_div">
        <div className="profile_pic_div">
          <img
            src={!profile.image ? avatar : profile.image}
            alt=""
            className="profile_pic shadow-sm"
          />
        </div>
        <div>
          <h2 className="profile_header">
            {profile.fullName || "Qwerty Kwerty"}
          </h2>
          <p className="profile_email">{profile.email}</p>
          <div className="phone_email">
            <div className="profile_phone_date_icon_div">
              <div className="profile_phone_date_icon">
                <MdOutlinePhone />
              </div>
              <p className="m-0">{profile.phone}</p>
            </div>
            <div className="profile_phone_date_icon_div">
              <div className="profile_phone_date_icon">
                <MdOutlineCalendarToday />
              </div>
              <p className="m-0">
                Joined{" "}
                {moment(profile?.createdAt?.created_at).format("MMM, YYYY")}
              </p>
            </div>
          </div>
          <div className="status_badge_div">
            <span
              className={`email_badge ${profile.emailVerified ? "email_badge_verified" : "email_badge_unverified"}`}
            >
              {profile.emailVerified
                ? "Email  • ✓ Verified"
                : "Email  • ✗ Not Verified"}
            </span>
            <span
              className={`email_badge ${profile.phoneVerified ? "email_badge_verified" : "email_badge_unverified"}`}
            >
              {profile.phoneVerified
                ? "Phone  • ✓ Verified"
                : "Phone  • ✗ Not Verified"}
            </span>
          </div>
        </div>

        {/* Edit button opens modal */}
        <div
          className="profile_phone_date_icon edit_profile_button"
          onClick={() => setOpen(true)}
          style={{ cursor: "pointer" }}
        >
          <LuPenLine />
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit Profile"
        description="Update your profile information"
      >
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Full Name</label>
            <input
              className="modal-input"
              type="text"
              name="fullName"
              placeholder="Yasir Hassan"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="modal-label">Phone</label>
            <input
              className="modal-input"
              type="text"
              name="phone"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="modal-label">Profile Image</label>
            <input
              className="modal-input"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          {submitError && (
            <p style={{ color: "red", fontSize: "0.875rem" }}>{submitError}</p>
          )}

          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              <span className="btn_text text-white">Save</span>

              {submitting && <ButtonLoader />}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Profile;
