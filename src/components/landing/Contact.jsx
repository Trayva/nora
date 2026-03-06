import { IoLocationOutline, IoMailOutline } from "react-icons/io5";
import { MdOutlinePhone } from "react-icons/md";

function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-inner">

        {/* Left */}
        <div className="contact-left">
          <h1 className="contact-heading">Contact Us</h1>
          <p className="contact-sub">
            Have a question or need more information? Submit your enquiry, and
            our team will get back to you promptly with the answers you need.
            We're here to help!
          </p>

          <div className="contact-info-list">
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <IoLocationOutline size={18} />
              </div>
              <p className="contact-info-text">
                Office 1703- Fahidi Heights-Alhamriya <br />
                Dubai-United Arab Emirates
              </p>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <IoMailOutline size={18} />
              </div>
              <a className="contact-info-text contact-link" href="mailto:support@trynora.net">
                support@trynora.net
              </a>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <MdOutlinePhone size={18} />
              </div>
              <a className="contact-info-text contact-link" href="tel:+2348012345678">
                +234 80 123 4567
              </a>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="contact-form-card">
          <div className="contact-form-fields">
            <div className="form-field">
              <label className="modal-label">Name</label>
              <input
                className="modal-input"
                type="text"
                placeholder="Jane Doe"
              />
            </div>
            <div className="form-field">
              <label className="modal-label">Email</label>
              <input
                className="modal-input"
                type="email"
                placeholder="your@email.com"
              />
            </div>
            <div className="form-field">
              <label className="modal-label">Phone Number</label>
              <input
                className="modal-input"
                type="tel"
                placeholder="+234 80 123 4567"
              />
            </div>
            <div className="form-field">
              <label className="modal-label">Message</label>
              <textarea
                className="modal-input contact-textarea"
                placeholder="Type your message here..."
                rows={5}
              />
            </div>

            <button
              className="app_btn app_btn_confirm"
              style={{ width: "100%", height: 50, marginTop: 8, fontSize: "0.9375rem" }}
            >
              Send Message
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Contact;