import icons from "../../assets/icons";

const features = [
  {
    color: "info",
    title: "Save Time",
    description:
      "No more driving around looking for parking. Reserve in advance and go straight to your spot.",
    icon: icons.clock,
  },
  {
    color: "success",
    title: "Guaranteed Spot",
    description:
      "Your reserved spot is secured with smart locks. No one else can take it.",
    icon: icons.shield,
  },
  {
    color: "success-2",
    title: "Easy to Use",
    description:
      "Simple app interface. Find, reserve, and pay for parking in just a few taps.",

    icon: icons.phone,
  },
  {
    color: "warn",
    title: "Best Locations",
    description:
      "Premium parking spots in malls, business districts, and popular destinations across UAE.",

    icon: icons.marker,
  },
];

function Why(props) {
  return (
    <div id="why">
      <div className="responsive-container justify-center align-center d-flex flex-column">
        <h1 className="text-center text-black fs-36">Why Choose Parkvation?</h1>
        <br />
        <p className="text-center text-dark-grey">
          Join thousands of UAE drivers who have made parking stress-free with
          Parkvation.
        </p>
        <br />
        <br />
        <div className="d-flex gap-20 flex-wrap">
          {features.map((_, idx) => (
            <div
              style={{ borderRadius: 2 }}
              key={idx}
              className="flex-1 card stat-card"
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  marginBottom: 20,
                  padding: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                className={`d-flex justify-center align-center status ${_.color}-light`}
              >
                {_.icon}
              </div>
              <h2 className="text-black text-centerr fs-18">{_.title}</h2>
              <br />
              <p className="text-dark-grey f-300 text-centerr">
                {_.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Why;
