import { useNavigate } from "react-router-dom";
import img from "../../assets/kiosk11.png";
import Button from "../Button";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-inner">
        {/* Left */}
        <div className="hero-left">
          <h2 className="hero-heading">
            Scale Food Brands. <br />
            Empower New Owners.
          </h2>
          <p className="hero-paragraph">
            Nora AI is the platform where food brands expand through structured
            franchising — enabling individuals to own and operate QSR outlets
            using standardized infrastructure and digital control.
          </p>
          <div className="hero-btns">
            <button
              className="app_btn app_btn_confirm"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
              onClick={() => navigate("/auth/register?role=VENDOR")}
            >
              Partner as a Brand
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
              onClick={() => navigate("/auth/register?role=CUSTOMER")}
            >
              Own a Franchise
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="hero-right">
          <div className="hero-img-wrapper">
            <div className="hero-bg-blobs"></div>
            <div className="hero-glass">
              <img src={img} alt="Nora Smart Kitchen" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
