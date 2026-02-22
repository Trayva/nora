import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { getSlotColor } from "../../utils/string";

const API_KEY = process.env.REACT_APP_MAP_API_KEY;
// eslint-disable-next-line
const mapStyles = [
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7c93a3" }, { lightness: "-10" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a0a4a5" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#62838e" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry.fill",
    stylers: [{ color: "#dde3e3" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3f4a5a" }, { weight: "0.30" }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "poi.attraction",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.business",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.government",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.place_of_worship",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.school",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.sports_complex",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [{ saturation: "-100" }, { visibility: "on" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#bbcacf" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ lightness: "0" }, { color: "#bbcacf" }, { weight: "0.50" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a9b4b8" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#a3c7df" }],
  },
];

const CustomMarker = ({ position, station, onClick, _color }) => {
  const color =
    _color || getSlotColor(station.totalSlots, station.availableSlots);
  const img = `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`;
  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div className="relative d-flex justify-center align-center flex-column">
        <img
          src={img}
          alt={station.name}
          className="w-6 h-10"
          style={{
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))",
          }}
        />
        {_color ? (
          <div style={{ padding: 10 }} className="card">
            <span className="text-black fs-10 f-600">You are here!</span>
          </div>
        ) : null}
      </div>
    </AdvancedMarker>
  );
};

const GoogleMap = ({
  zoom = 13,
  stations = [],
  isOpened,
  center = { lat: 25.2048, lng: 55.2708 },
  onSelect,
}) => {
  return (
    <div
      style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
    >
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultZoom={zoom}
          defaultCenter={center}
          mapId={process.env.REACT_APP_MAP_ID}
          style={{ width: "100%", height: "100%" }}
          //   styles={mapStyles}
          disableDefaultUI={true}
          zoomControl={true}
          mapTypeControl={false}
          scaleControl={false}
          streetViewControl={false}
          rotateControl={true}
          fullscreenControl={true}
          gestureHandling={"greedy"}
        >
          {stations.map((station, index) => {
            return (
              <CustomMarker
                key={index}
                station={station}
                position={{ lat: station.latitude, lng: station.longitude }}
                onClick={() => {
                  if (typeof onSelect === "function") onSelect(station);
                }}
              />
            );
          })}
          <CustomMarker
            _color="blue"
            position={center}
            station={{ name: "You are here!" }}
          />
        </Map>
      </APIProvider>
    </div>
  );
};

export default GoogleMap;
