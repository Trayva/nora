import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function NotFound() {
  const glitchRef = useRef(null);

  // Randomly trigger glitch animation
  useEffect(() => {
    const el = glitchRef.current;
    if (!el) return;

    const glitch = () => {
      el.classList.add("glitching");
      setTimeout(() => el.classList.remove("glitching"), 600);
    };

    glitch(); // trigger once on mount
    const interval = setInterval(glitch, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .nf-page {
          min-height: 100vh;
          background-color: #0a0a0a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
            font-family: "DM Sans", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
        }

        /* Subtle radial glow behind the 404 */
        .nf-page::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -60%);
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(203, 108, 220, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Big 404 number */
        .nf-number {
          font-size: clamp(7rem, 22vw, 11rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -4px;
          color: transparent;
          -webkit-text-stroke: 2px #2b2e33;
          position: relative;
          user-select: none;
        }

        /* Glitch pseudo layers */
        .nf-number::before,
        .nf-number::after {
          content: '404';
          position: absolute;
          inset: 0;
          opacity: 0;
        }
        .nf-number::before {
          -webkit-text-stroke: 2px #CB6CDC;
          color: transparent;
        }
        .nf-number::after {
          -webkit-text-stroke: 2px #6cdccb;
          color: transparent;
        }

        /* Glitch animation triggers */
        .nf-number.glitching {
          animation: nf-shake 0.6s ease;
        }
        .nf-number.glitching::before {
          opacity: 1;
          animation: nf-glitch-a 0.6s steps(1) forwards;
        }
        .nf-number.glitching::after {
          opacity: 1;
          animation: nf-glitch-b 0.6s steps(1) forwards;
        }

        @keyframes nf-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-3px); }
          40%       { transform: translateX(3px); }
          60%       { transform: translateX(-2px); }
          80%       { transform: translateX(2px); }
        }

        @keyframes nf-glitch-a {
          0%   { clip-path: inset(0 0 85% 0); transform: translateX(-4px); }
          20%  { clip-path: inset(40% 0 40% 0); transform: translateX(4px); }
          40%  { clip-path: inset(70% 0 10% 0); transform: translateX(-3px); }
          60%  { clip-path: inset(20% 0 60% 0); transform: translateX(3px); }
          80%  { clip-path: inset(55% 0 25% 0); transform: translateX(-2px); }
          100% { opacity: 0; }
        }

        @keyframes nf-glitch-b {
          0%   { clip-path: inset(60% 0 10% 0); transform: translateX(4px); }
          20%  { clip-path: inset(10% 0 70% 0); transform: translateX(-3px); }
          40%  { clip-path: inset(80% 0 5% 0);  transform: translateX(3px); }
          60%  { clip-path: inset(30% 0 50% 0); transform: translateX(-4px); }
          80%  { clip-path: inset(5% 0 80% 0);  transform: translateX(2px); }
          100% { opacity: 0; }
        }

        /* Divider line */
        .nf-divider {
          width: 48px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #CB6CDC, transparent);
          margin: 28px auto 24px;
          border-radius: 99px;
        }

        /* Heading */
        .nf-title {
          font-size: 1.15rem;
          font-weight: 600;
          color: #e8e8e8;
          margin: 0 0 10px;
          letter-spacing: 0.01em;
        }

        /* Subtext */
        .nf-sub {
          font-size: 0.82rem;
          color: #555;
          margin: 0 0 36px;
          line-height: 1.6;
          max-width: 260px;
        }

        /* Go Home button — matches .app_btn */
        .nf-btn {
          display: inline-block;
          background-color: #CB6CDC;
          color: white;
          font-weight: bold;
          font-size: 0.875rem;
          padding: 14px 36px;
          border-radius: 10px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.15s ease;
          position: relative;
        }

        .nf-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }

        .nf-btn:active {
          transform: translateY(0);
          opacity: 1;
        }

        /* Floating dots decoration */
        .nf-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .nf-dot {
          position: absolute;
          border-radius: 50%;
          background: #CB6CDC;
          opacity: 0.18;
          animation: nf-float linear infinite;
        }

        @keyframes nf-float {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          10%  { opacity: 0.18; }
          90%  { opacity: 0.18; }
          100% { transform: translateY(-100vh) scale(0.6); opacity: 0; }
        }
      `}</style>

      <div className="nf-page">
        {/* Floating particles */}
        <div className="nf-dots" aria-hidden="true">
          {[
            { left: "12%", size: 4, duration: "9s", delay: "0s" },
            { left: "28%", size: 3, duration: "13s", delay: "2s" },
            { left: "47%", size: 5, duration: "11s", delay: "1s" },
            { left: "63%", size: 3, duration: "14s", delay: "3.5s" },
            { left: "80%", size: 4, duration: "10s", delay: "0.5s" },
            { left: "91%", size: 2, duration: "12s", delay: "2.5s" },
            { left: "6%", size: 3, duration: "15s", delay: "4s" },
          ].map((d, i) => (
            <div
              key={i}
              className="nf-dot"
              style={{
                left: d.left,
                bottom: "-10px",
                width: d.size,
                height: d.size,
                animationDuration: d.duration,
                animationDelay: d.delay,
              }}
            />
          ))}
        </div>

        {/* Glitching 404 */}
        <div className="nf-number" ref={glitchRef} aria-label="404">
          404
        </div>

        <div className="nf-divider" />

        <h2 className="nf-title">Page Not Found</h2>
        <p className="nf-sub">
          This page doesn't exist or may have been moved.
        </p>

        <Link to="/app" className="nf-btn">
          Go Home
        </Link>
      </div>
    </>
  );
}
