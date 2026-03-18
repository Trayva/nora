import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import { useNavigate } from "react-router-dom";

import img1 from "../../assets/icart11.png";
import img2 from "../../assets/cc.jpg";
import img3 from "../../assets/bb.jpg";
import img4 from "../../assets/aa.jpg";

function Love() {
  const navigate = useNavigate();

  const slides = [
    {
      img: img1,
      title: "Smart Modular Mini Kitchens",
      body: "Fully equipped, ready to operate, and located closer to your customers. Reduce setup time and costs while maximizing efficiency.",
    },
    {
      img: img1,
      title: "Operations Manager",
      body: "Centralized dashboard for monitoring all kiosks, performance metrics, and operational efficiency.",
    },
    {
      img: img4,
      title: "E-Learning Platform",
      body: "Train operators efficiently with our comprehensive online platform. Document and optimize your cooking instructions once.",
    },
    {
      img: img3,
      title: "Food Costing Software",
      body: "Automatically calculate computer-generated pricing for each recipe. Improve profitability with data-driven insights.",
    },
    {
      img: img2,
      title: "Built-In Ordering & Delivery",
      body: "Integrated network reduces waiting time and speeds up customer satisfaction. Kitchens closer to customers mean faster deliveries.",
    },
  ];

  return (
    <section className="love-section" id="how">
      <div className="love-inner">
        {/* Left */}
        <div className="love-left">
          <span className="accent-label">Built for growth</span>
          <h1 className="love-heading">Why Restaurant Owners Love NORA</h1>
          <p className="love-body">
            NORA removes the biggest barriers to growth by giving restaurant
            owners instant access to fully equipped, delivery-optimized mini
            kitchens — without the cost or complexity of setting up a new
            location. Your brand expands faster, with lower risk and higher
            margins.
          </p>
          <p className="love-body">
            Our standardized kiosks streamline operations, reduce delays, and
            free your dine-in staff from delivery pressure. Every order is
            tracked, supported, and optimized through our integrated digital
            platform — from inventory to raw-material supply to customer
            delivery.
          </p>
          <p className="love-body">
            Restaurant owners choose NORA because it lets them do what they do
            best: create great food while we handle space, logistics, tech, and
            scale. Faster service, wider reach, lower overhead — and a smarter
            way to grow.
          </p>
          <div className="love-btns">
            <button
              className="app_btn app_btn_confirm"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
              onClick={() => navigate("/auth/register")}
            >
              Launch Your Concept
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Right — Swiper */}
        <div className="love-right">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            spaceBetween={16}
            slidesPerView={2}
            breakpoints={{
              0: { slidesPerView: 1 },
              600: { slidesPerView: 1.3 },
              900: { slidesPerView: 2 },
            }}
            style={{ width: "100%", paddingBottom: "8px" }}
          >
            {slides.map((slide, i) => (
              <SwiperSlide key={i}>
                <div className="love-card">
                  <img
                    src={slide.img}
                    alt={slide.title}
                    className="love-card-img"
                  />
                  <div className="love-card-body">
                    <h2 className="love-card-title">{slide.title}</h2>
                    <p className="love-card-text">{slide.body}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

export default Love;