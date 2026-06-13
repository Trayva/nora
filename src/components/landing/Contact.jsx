import { useState, useEffect, useRef } from "react";
import { IoLocationOutline, IoMailOutline } from "react-icons/io5";
import { MdOutlinePhone, MdOutlineSend } from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../api/axios";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const INITIAL = { name: "", email: "", phone: "", message: "" };

const INFO = [
  {
    icon: IoLocationOutline,
    label: "Address",
    text: "Office 1703 – Fahidi Heights, Alhamriya\nDubai, United Arab Emirates. \n50 Ebitu Ukiwe Street, Jabi, Abuja",
    href: null,
  },
  {
    icon: IoMailOutline,
    label: "Email",
    text: "support@trynora.net",
    href: "mailto:support@trynora.net",
  },
  {
    icon: MdOutlinePhone,
    label: "Phone",
    text: "+234 80 123 4567",
    href: "tel:+2348012345678",
  },
];

function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("lp-visible"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim() || !form.phone.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.phone.length < 10) {
      toast.error("Please enter a valid phone number with country code.");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = form.phone
        ? form.phone.startsWith("+") ? form.phone : `+${form.phone}`
        : undefined;
      await api.post("/support", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: formattedPhone,
        message: form.message.trim(),
      });
      toast.success("Message sent! We'll get back to you shortly.");
      setForm(INITIAL);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lp-contact-section" id="contact">
      <div className="lp-inner lp-two-col lp-two-col-contact" ref={ref}>

        {/* Left */}
        <div className="lp-contact-left lp-reveal lp-reveal-left">
          <div className="lp-eyebrow">Get In Touch</div>
          <h2 className="lp-heading">Contact Us</h2>
          <p className="lp-body">
            Have a question or need more information? Submit your enquiry and
            our team will get back to you promptly. We're here to help!
          </p>

          <div className="lp-contact-info">
            {INFO.map(({ icon: Icon, label, text, href }) => (
              <div key={label} className="lp-contact-info-row">
                <div className="lp-contact-info-icon">
                  <Icon size={18} />
                </div>
                <div className="lp-contact-info-body">
                  <span className="lp-contact-info-label">{label}</span>
                  {href ? (
                    <a className="lp-contact-info-val lp-contact-link" href={href}>
                      {text}
                    </a>
                  ) : (
                    <span className="lp-contact-info-val">{text}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="lp-contact-form-card lp-reveal lp-reveal-right">
          <form onSubmit={handleSubmit} className="lp-contact-form">
            <div className="lp-contact-form-row">
              <div className="lp-contact-field">
                <label className="lp-contact-label">Name *</label>
                <input
                  className="lp-contact-input"
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={set("name")}
                  disabled={loading}
                  required
                />
              </div>
              <div className="lp-contact-field">
                <label className="lp-contact-label">Email *</label>
                <input
                  className="lp-contact-input"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={set("email")}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="lp-contact-field">
              <label className="lp-contact-label">Phone Number *</label>
              <div className="register_phone_wrapper">
                <PhoneInput
                  country="ae"
                  value={form.phone}
                  onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                  enableSearch
                  searchPlaceholder="Search country..."
                  disableSearchIcon
                  disabled={loading}
                />
              </div>
            </div>

            <div className="lp-contact-field">
              <label className="lp-contact-label">Message *</label>
              <textarea
                className="lp-contact-input lp-contact-textarea"
                placeholder="Type your message here..."
                rows={5}
                value={form.message}
                onChange={set("message")}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className={`lp-contact-submit ${loading ? "btn_loading" : ""}`}
              disabled={loading}
            >
              <span className="btn_text">
                <MdOutlineSend size={18} />
                Send Message
              </span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}

export default Contact;