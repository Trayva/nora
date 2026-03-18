import { useNavigate } from "react-router-dom";
import img from "../../assets/icart11.png";
import Button from "../Button";

function Hero() {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-inner">
        {/* Left */}
        <div className="hero-left">
          <h2 className="hero-heading">
            Nora Smart Kitchen <br />
            Built for Growth
          </h2>
          <p className="hero-paragraph">
            Complete smart kitchen ecosystem with management platform,
            surveillance, supply chain integration, and operator training.
            Deploy in days, not months.
          </p>
          <div className="hero-btns">
            <button
              className="app_btn app_btn_confirm"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
              onClick={() => navigate("/app")}
            >
              Get Started Now!
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="hero-right">
          {/* <div className="hero-blob" /> */}
          {/* <div className="hero-img-float">
            <img src={img} alt="Nora Smart Kitchen" />
          </div> */}

          <div className="hero-img-wrapper">
            <div className="hero-bg-blobs"></div>
            <div className="hero-glass">
              <img src={img} alt="" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
