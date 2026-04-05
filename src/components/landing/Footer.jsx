import { useNavigate } from "react-router-dom";
import {
  BsFacebook,
  BsInstagram,
  BsLinkedin,
  BsTwitterX,
  BsYoutube,
} from "react-icons/bs";
import { useAuth } from "../../contexts/AuthContext";
import { getDefaultRoute, getPrimaryRole } from "../../utils/AuthHelpers";

const scrollTo = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

function Footer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Role-aware navigation for platform links.
   * - Logged in + already has the matching role → send to their default route
   * - Logged in + different role → send to the requested app path directly
   * - Not logged in → register with ?role= so registration pre-selects the role
   */
  const handleRoleLink = (appPath, targetRole) => {
    if (user) {
      const primaryRole = getPrimaryRole(user);
      // If they already are this role, go to their natural home
      // Otherwise go to the specific page (they may have multiple roles)
      if (primaryRole === targetRole.toUpperCase()) {
        navigate(getDefaultRoute(user));
      } else {
        navigate(appPath);
      }
    } else {
      navigate(`/auth/register?role=${targetRole}`);
    }
  };

  return (
    <>
      {/* CTA Band */}
      <section className="footer-cta" id="solutions">
        <div className="footer-cta-inner">
          <h1 className="footer-cta-heading">
            Ready to Scale or Own?
          </h1>
          <p className="footer-cta-sub">
            Whether you're a food brand looking to expand or an individual ready to
            own a QSR outlet, Nora AI provides the platform to make it happen.
          </p>
          <div className="d-flex gap-10 mobile-column">
            <button className="footer-cta-btn" onClick={() => scrollTo("how")}>
              Partner as a Brand
            </button>
            <button className="footer-cta-btn" onClick={() => scrollTo("how")}>
              Own a Franchise
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-main">
        <div className="footer-inner">
          {/* Brand */}
          <div className="footer-col">
            <span className="footer-logo">nora</span>
            <p className="footer-tagline">
              Empowering business owners to scale smarter and faster.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter">
                <BsTwitterX size={16} />
              </a>
              <a href="#" aria-label="Facebook">
                <BsFacebook size={16} />
              </a>
              <a href="#" aria-label="Instagram">
                <BsInstagram size={16} />
              </a>
              <a href="#" aria-label="YouTube">
                <BsYoutube size={16} />
              </a>
              <a href="#" aria-label="LinkedIn">
                <BsLinkedin size={16} />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="footer-col">
            <span className="footer-col-heading">Platform</span>
            <button
              className="footer-link-btn"
              onClick={() => handleRoleLink("/app/supplier", "supplier")}
            >
              Become a Supplier
            </button>
            <button
              className="footer-link-btn"
              onClick={() => handleRoleLink("/app/operator", "operator")}
            >
              Become an Operator
            </button>
            <button
              className="footer-link-btn"
              onClick={() => handleRoleLink("/app/business", "vendor")}
            >
              Vendor Application
            </button>
            <a href="#">Careers</a>
          </div>

          {/* Support */}
          <div className="footer-col">
            <span className="footer-col-heading">Support</span>
            <a href="#">Help Center</a>
            <button
              className="footer-link-btn"
              onClick={() => scrollTo("contact")}
            >
              Contact Us
            </button>
            <a href="#">Warranty</a>
            <a href="#">Locations</a>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <span className="footer-col-heading">Contact</span>
            <p className="footer-address">
              Office 1703- Fahidi Heights-Alhamriya
              <br />
              Dubai-United Arab Emirates
            </p>
            <a href="mailto:support@trynora.net">support@trynora.net</a>
            <a href="tel:+2348012345678">+234 80 123 4567</a>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} nora.</span>
          <div className="footer-legal">
            <a href="/legal/privacy-policy">Privacy Policy</a>
            <a href="/legal/terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;
