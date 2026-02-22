import "../../css/elearning.css";

function ScreenShot(props) {
  return (
    <div className="shot">
      <div className="shot-browser-header">
        <div className="shot-traffic-lights">
          <div className="shot-dot shot-red"></div>
          <div className="shot-dot shot-yellow"></div>
          <div className="shot-dot shot-green"></div>
        </div>

        <div
          style={{
            marginLeft: "12px",
            width: "28px",
            height: "28px",
            backgroundColor: "#ddd",
            borderRadius: "4px",
          }}
        ></div>

        <div style={{ display: "flex", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "#ddd",
              borderRadius: "4px",
            }}
          ></div>
          <div
            style={{
              width: "24px",
              height: "24px",
              backgroundColor: "#ddd",
              borderRadius: "4px",
            }}
          ></div>
        </div>

        <div
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "#ddd",
            borderRadius: "4px",
            marginLeft: "auto",
          }}
        ></div>

        <div className="shot-url-bar">🔒 trayva.io</div>
      </div>

      <div className="shot-container">
        <div className="shot-sidebar">
          <div className="shot-user-profile">
            <div className="shot-avatar">YA</div>
            <div>
              <div className="shot-user-name">Yoan Almeida</div>
            </div>
          </div>

          <div className="shot-search-box">
            <span className="shot-search-icon">🔍</span>
            <span>Search</span>
          </div>

          <div className="shot-menu-item">
            <span className="shot-menu-icon">🔔</span>
            <span>Activity</span>
          </div>

          <div className="shot-menu-item shot-active">
            <span className="shot-menu-icon">📋</span>
            <span>eLearning</span>
          </div>

          <div className="shot-menu-item">
            <span className="shot-menu-icon">📦</span>
            <span>Orders</span>
          </div>

          <div className="shot-menu-item">
            <span className="shot-menu-icon">💬</span>
            <span>Requests</span>
          </div>

          <div className="shot-menu-item">
            <span className="shot-menu-icon">👤</span>
            <span>Profile</span>
          </div>

          <div className="shot-menu-item">
            <span className="shot-menu-icon">⚙️</span>
            <span>Settings</span>
          </div>
        </div>

        <div className="shot-main-content">
          <div className="shot-header">
            <h1 className="shot-title">Watch Tutorials</h1>
            <p className="shot-subtitle">
              View iCart menus and watch tutorials on meal preparations
            </p>
          </div>

          <div className="shot-tabs">
            <div className="shot-tab shot-active">Recent</div>
            <div className="shot-tab">Product</div>
            <div className="shot-tab">Design</div>
          </div>

          <div className="shot-courses-grid">
            <div className="shot-course-card">
              <div className="shot-course-image"></div>
              <div className="shot-course-content">
                <div className="shot-course-status shot-status-published">
                  <span className="shot-status-dot"></span>
                  Published
                </div>
                <h3 className="shot-course-title">Quick Rice</h3>
                <p className="shot-course-description">
                  Master the art of preparing authentic rice dishes with
                  professional techniques and traditional methods...
                </p>
              </div>
            </div>

            <div className="shot-course-card">
              <div className="shot-course-image"></div>
              <div className="shot-course-content">
                <div className="shot-course-status shot-status-archived">
                  <span className="shot-status-dot"></span>
                  Archived
                </div>
                <h3 className="shot-course-title">Masa</h3>
                <p className="shot-course-description">
                  Transform your culinary skills by learning the secrets of masa
                  preparation and traditional Latin American cooking...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScreenShot;
