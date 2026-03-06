import img from "../../assets/who.png";

function WhoWeAre() {
  return (
    <section className="whoweare-section">
      <div className="whoweare-inner">

        {/* Left */}
        <div className="whoweare-left">
          <h2 className="whoweare-heading">Who we are</h2>
          <p className="whoweare-sub">
            Empowering business owners to scale smarter
          </p>
          <p className="whoweare-body">
            NORA is a technology-driven food infrastructure company reimagining
            how meals are created, delivered, and experienced. We build smart,
            delivery-focused mini kitchens that empower food entrepreneurs,
            streamline operations, and bring high-quality meals closer to every
            customer.
          </p>
          <p className="whoweare-body">
            We're solving today's biggest food-service challenges — high startup
            costs, limited delivery reach, and overwhelming demand for
            personalization — while engineering the future of "Prompt-to-Plate,"
            where anyone can request any meal and have it prepared autonomously
            through AI and robotics.
          </p>
          <div className="whoweare-btns">
            <button
              className="app_btn app_btn_confirm"
              style={{ height: 50, padding: "0 28px", fontSize: "0.9375rem" }}
            >
              Launch Your Concept
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
        <div className="whoweare-right">
          <img src={img} alt="Who we are" className="whoweare-img" />
        </div>

      </div>
    </section>
  );
}

export default WhoWeAre;