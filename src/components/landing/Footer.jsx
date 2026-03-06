import {
  BsFacebook,
  BsInstagram,
  BsLinkedin,
  BsTwitterX,
  BsYoutube,
} from "react-icons/bs";

function Footer() {
  return (
    <>
      {/* CTA Band */}
      <section className="footer-cta">
        <div className="footer-cta-inner">
          <h1 className="footer-cta-heading">
            Ready to Transform Your Operations?
          </h1>
          <p className="footer-cta-sub">
            Join industry leaders using nora to streamline operations, reduce
            costs, and scale confidently.
          </p>
          <button className="footer-cta-btn">
            Explore Solutions
          </button>
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
              <a href="#" aria-label="Twitter"><BsTwitterX size={16} /></a>
              <a href="#" aria-label="Facebook"><BsFacebook size={16} /></a>
              <a href="#" aria-label="Instagram"><BsInstagram size={16} /></a>
              <a href="#" aria-label="YouTube"><BsYoutube size={16} /></a>
              <a href="#" aria-label="LinkedIn"><BsLinkedin size={16} /></a>
            </div>
          </div>

          {/* Platform */}
          <div className="footer-col">
            <span className="footer-col-heading">Platform</span>
            <a href="#">Marketplace</a>
            <a href="#">Become an Operator</a>
            <a href="#">Vendor Application</a>
            <a href="#">Careers</a>
          </div>

          {/* Support */}
          <div className="footer-col">
            <span className="footer-col-heading">Support</span>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
            <a href="#">Warranty</a>
            <a href="#">Locations</a>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <span className="footer-col-heading">Contact</span>
            <p className="footer-address">
              Office 1703- Fahidi Heights-Alhamriya<br />
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
            <a href="/legal/privacy-policy">Privacy & Legal</a>
            <a href="/legal/terms">Terms of Service</a>
            <a href="/news">News</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;