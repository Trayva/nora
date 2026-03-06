// Icons.jsx
import "../../css/stripe-icons.css";

/** Search & Find — map + pin + magnifier */
export const SearchFindIcon = () => (
  <svg
    className="ss-ico"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Search & Find"
  >
    <style>{`.ss-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ss-draw 1.2s ease forwards}`}</style>

    {/* Map card */}
    <rect
      x="20"
      y="20"
      width="120"
      height="100"
      rx="12"
      className="ss-stroke ss-draw"
      pathLength="1"
    />

    {/* Map squiggle route */}
    <path
      d="M32 92 C 60 70, 70 76, 92 60 S 118 42, 130 56"
      className="ss-stroke ss-draw"
      pathLength="1"
    />

    {/* Pin */}
    <path
      d="M80 54 a14 14 0 1 1 28 0 c0 14 -14 28 -14 28 s-14 -14 -14 -28z"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <circle
      cx="94"
      cy="54"
      r="5"
      className="ss-stroke ss-draw"
      pathLength="1"
    />

    {/* Magnifier */}
    <circle
      cx="140"
      cy="140"
      r="22"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <line
      x1="154"
      y1="154"
      x2="176"
      y2="176"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
  </svg>
);

/** Reserve & Pay — credit card + tick */
export const ReservePayIcon = () => (
  <svg
    className="ss-ico"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Reserve & Pay"
  >
    <style>{`.ss-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ss-draw 1.2s ease forwards}`}</style>

    {/* Card */}
    <rect
      x="26"
      y="46"
      width="148"
      height="96"
      rx="12"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <rect
      x="26"
      y="66"
      width="148"
      height="16"
      rx="2"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <rect
      x="42"
      y="96"
      width="46"
      height="10"
      rx="2"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <rect
      x="94"
      y="96"
      width="26"
      height="10"
      rx="2"
      className="ss-stroke ss-draw"
      pathLength="1"
    />

    {/* Reserve checkmark badge */}
    <circle
      cx="150"
      cy="142"
      r="24"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <path
      d="M140 142 l7 7 l13 -15"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
  </svg>
);

/** Arrive & Park — parking sign + car + lock */
export const ArriveParkIcon = () => (
  <svg
    className="ss-ico"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Arrive & Park"
  >
    <style>{`.ss-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:ss-draw 1.2s ease forwards}`}</style>

    {/* Parking sign */}
    <rect
      x="24"
      y="24"
      width="80"
      height="100"
      rx="10"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <path
      d="M48 54 h20 a14 14 0 0 1 0 28 h-20 z M68 68"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <line
      x1="64"
      y1="124"
      x2="64"
      y2="168"
      className="ss-stroke ss-draw"
      pathLength="1"
    />

    {/* Car */}
    <path
      d="M104 124 h52 l10 16 v18 h-72 v-18 z"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <circle
      cx="120"
      cy="160"
      r="8"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <circle
      cx="152"
      cy="160"
      r="8"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <path d="M114 140 h32" className="ss-stroke ss-draw" pathLength="1" />

    {/* Smart lock */}
    <rect
      x="150"
      y="50"
      width="26"
      height="32"
      rx="6"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
    <path
      d="M163 50 v-8 a10 10 0 0 0 -20 0 v8"
      className="ss-stroke ss-draw"
      pathLength="1"
    />
  </svg>
);
