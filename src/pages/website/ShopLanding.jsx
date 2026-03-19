import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdArrowForward, MdOutlineReceiptLong } from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

const BURGER_IMG =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=85&auto=format&fit=crop";

export default function ShopLanding() {
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  const handleShop = () => {
    setLocating(true);
    const go = (lat, lng) =>
      navigate(lat && lng ? `/shop?lat=${lat}&lng=${lng}` : "/shop");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => go(pos.coords.latitude, pos.coords.longitude),
        () => go(),
        { timeout: 4000 },
      );
    } else {
      go();
    }
  };

  return (
    <section
      style={{
        background: "var(--bg-main)",
        transition: "background-color 0.2s",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes noraPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes noraSpin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes noraFloat { 0%,100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-14px) rotate(2deg); } }
        @keyframes noraGlow  { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.06); } }
        @keyframes noraFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 860px) {
          .shop-hero-inner { flex-direction: column !important; padding: 60px 24px 48px !important; gap: 48px !important; }
          .shop-hero-right { width: 100% !important; max-width: 360px !important; margin: 0 auto !important; }
          .shop-hero-img-wrap { height: 300px !important; }
        }
        @media (max-width: 480px) {
          .shop-hero-inner { padding: 48px 20px 40px !important; }
          .shop-hero-img-wrap { height: 240px !important; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="shop-hero-inner"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 60,
            padding: "80px 0 60px",
          }}
        >
          {/* ── Left: copy ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Live badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 999,
                marginBottom: 28,
                animation: "noraFadeUp 0.5s ease both",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#16a34a",
                  animation: "noraPulse 2s infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.04em",
                }}
              >
                iCarts open near you
              </span>
            </div>

            {/* Heading */}
            <h2
              style={{
                fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)",
                fontWeight: 900,
                color: "var(--text-heading)",
                margin: "0 0 18px",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                animation: "noraFadeUp 0.55s ease 0.05s both",
              }}
            >
              Street food,
              <br />
              ordered{" "}
              <span style={{ color: "var(--accent)" }}>
                fresh
                <br />& fast.
              </span>
            </h2>

            {/* Subtext */}
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                margin: "0 0 36px",
                maxWidth: 400,
                animation: "noraFadeUp 0.55s ease 0.1s both",
              }}
            >
              Browse menus from iCart vendors near you, pick your favourites,
              and get them delivered — no fuss.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                animation: "noraFadeUp 0.55s ease 0.15s both",
              }}
            >
              <button
                onClick={handleShop}
                disabled={locating}
                className="app_btn app_btn_confirm"
                style={{
                  height: 50,
                  padding: "0 28px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  fontSize: "0.95rem",
                  fontWeight: 800,
                }}
              >
                {locating ? (
                  <>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "noraSpin 0.7s linear infinite",
                      }}
                    />
                    Finding carts…
                  </>
                ) : (
                  <>
                    <LuShoppingCart size={18} />
                    Order Now
                    <MdArrowForward size={16} />
                  </>
                )}
              </button>

              <button
                onClick={() => navigate("/shop/order")}
                style={{
                  height: 50,
                  padding: "0 22px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--text-muted)",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <MdOutlineReceiptLong size={17} />
                Track an Order
              </button>
            </div>
          </div>

          {/* ── Right: burger image ── */}
          <div
            className="shop-hero-right"
            style={{
              flexShrink: 0,
              width: 460,
              position: "relative",
              animation: "noraFadeUp 0.65s ease 0.1s both",
            }}
          >
            {/* Glow blob behind image */}
            <div
              style={{
                position: "absolute",
                inset: -40,
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(203,108,220,0.18) 0%, transparent 70%)",
                animation: "noraGlow 5s ease-in-out infinite",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Image container */}
            <div
              className="shop-hero-img-wrap"
              style={{
                position: "relative",
                zIndex: 1,
                height: 420,
                borderRadius: 28,
                overflow: "hidden",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)",
                animation: "noraFloat 6s ease-in-out infinite",
              }}
            >
              <img
                src={BURGER_IMG}
                alt="Gourmet burger"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                }}
              />

              {/* Subtle gradient overlay at bottom */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "40%",
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
                  pointerEvents: "none",
                }}
              />

              {/* Floating price tag */}
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 999,
                }}
              >
                <span style={{ fontSize: "0.8rem" }}>🔥</span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  Fresh from nearby iCarts
                </span>
              </div>
            </div>

            {/* Floating badge — top right */}
            <div
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                zIndex: 2,
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                animation: "noraFloat 5s ease-in-out 1s infinite",
              }}
            >
              <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>🛵</span>
              <span
                style={{
                  fontSize: "0.55rem",
                  fontWeight: 800,
                  color: "var(--accent)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginTop: 3,
                }}
              >
                Fast
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom divider */}
      <div style={{ borderBottom: "1px solid var(--border)" }} />
    </section>
  );
}
