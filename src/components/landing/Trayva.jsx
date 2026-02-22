import img from "../../assets/icart4.png";

function Trayva() {
  return (
    <section className="trayva-section">
      <div className="trayva-inner">

        {/* Header */}
        <span className="accent-label">Enterprise reinvention</span>
        <h1 className="trayva-heading">
          Built for Speed. Designed for Growth.
        </h1>
        <p className="trayva-intro">
          NORA brings instant scalability to modern food businesses — giving you
          a smart, delivery-ready kitchen that opens new locations in days, not
          months. Our kiosk system removes operational friction, reduces
          overhead, and unlocks faster, more reliable service across all your
          channels.
        </p>

        {/* Showcase */}
        <div className="trayva-showcase">

          {/* Left stats */}
          <div className="trayva-left">
            <div className="trayva-stat">
              <h2 className="trayva-stat-value">100%</h2>
              <p className="trayva-stat-label">Solar Powered Kiosk</p>
            </div>
            <div className="trayva-stat">
              <h2 className="trayva-stat-value">Digital</h2>
              <p className="trayva-stat-label">Supply Chain. Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="trayva-stat">
              <h2 className="trayva-stat-value">Smart</h2>
              <p className="trayva-stat-label">
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Consectetur sint atque deserunt. Labore, error voluptates.
              </p>
            </div>
          </div>

          {/* Right card */}
          <div className="trayva-right">
            <img src={img} alt="NORA Kiosk" className="trayva-img" />
            <div className="trayva-card-overlay">
              <h2 className="trayva-card-title">Sample Text</h2>
              <p className="trayva-card-body">
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Consectetur sint atque deserunt. Labore, error voluptates.
                Lorem ipsum dolor sit amet consectetur.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Trayva;