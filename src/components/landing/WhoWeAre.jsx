import img from "../../assets/who.png";

function WhoWeAre() {
  return (
    <section className="whoweare-section">
      <div className="whoweare-inner">
        {/* Left */}
        <div className="whoweare-left">
          <h2 className="whoweare-heading">What We Do</h2>
          <p className="whoweare-sub">
            Nora AI is a franchise enablement platform built to simplify and
            scale food business expansion.
          </p>
          <p className="whoweare-body">
            We connect established food brands with a new generation of
            operators and investors, providing the infrastructure, systems, and
            oversight required to run efficient, standardized QSR outlets.
          </p>
          <p className="whoweare-body">
            Our approach removes the traditional barriers to franchising —
            making expansion faster for brands and ownership accessible to more
            people.
          </p>
          {/* <div className="whoweare-btns">
            <button
              className="app_btn app_btn_confirm"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
            >
              Partner as a Brand
            </button>
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
            >
              Own a Franchise
            </button>
          </div> */}
        </div>

        {/* Right */}
        <div className="whoweare-right">
          <img src={img} alt="What we do" className="whoweare-img" />
        </div>
      </div>
    </section>
  );
}

export default WhoWeAre;