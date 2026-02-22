import icons from "../../assets/icons";

const steps = [
  {
    color: "warn",
    svg: icons.search,
    title: "Search & Find",
    description:
      "Enter your destination and see all available parking spots in real-time with prices and ratings.",
  },
  {
    svg: icons.clock,
    color: "success-2",
    title: "Reserve & Pay",
    description:
      "Select your preferred time slot, choose your spot, and pay securely through the app.",
  },
  {
    svg: icons.lock,
    color: "success",
    title: "Lock Spot",
    description:
      "Lock your spot before arriving to ensure it's reserved and waiting for you.",
  },
  {
    svg: icons.shield,
    color: "info",
    title: "Arrive & Park",
    description:
      "Your spot is secured with smart locks. Simply arrive and your reserved space will be ready.",
  },
];

function How(props) {
  return (
    <div id="how" className="responsive-container">
      <h1 className="text-center text-black fs-36">How Parkvation Works</h1>
      <br />
      <p className="text-center text-dark-grey">
        Reserve your parking spot in just 4 simple steps. No more circling
        around looking for parking.
      </p>
      <br />
      <br className="hide-mobile" />
      <br className="hide-mobile" />
      <br className="hide-mobile" />
      <br className="hide-mobile" />
      <div className="d-flex how-cards gap-20">
        {steps.map((_, idx) => (
          <div
            className="how-card"
            style={{ marginTop: 60 * idx, position: "relative" }}
            key={idx}
          >
            <div
              style={{
                backgroundColor: "transparent",
                borderColor: "var(--neutral-medium-gray)",
                borderRadius: 0,
                borderWidth: 0,
              }}
              className={`shadow status ${_.color}-light icon d-flex justify-center align-center`}
            >
              {_.svg}
            </div>
            <br />
            <h1
              style={{ top: `-${30 * (!idx ? 1 : (idx + 1) * 0.6)}%` }}
              className="text-light-grey water-mark"
            >
              {idx + 1}
            </h1>
            <div className="card stat-card" style={{ borderRadius: 2 }}>
              <h2 className="fs-18 text-black">{_.title}</h2>
              <br />
              <p className="text-dark-grey f-300 text-centerr">
                {_.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default How;
