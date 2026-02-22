import { useEffect, useState, useCallback } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
const API_KEY = process.env.REACT_APP_MAP_API_KEY;

// A small inner component which listens for click on the map and places a marker
const MapClickListener = ({ onClick }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;

    // eslint-disable-next-line
    const listener = map.addListener("click", (e) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onClick({ lat, lng });
    });

    // return () => {
    //   google.maps.event.removeListener(listener);
    // };

    // eslint-disable-next-line
  }, [map, onClick]);

  return null;
};

export const MapPicker = ({
  defaultLocation,
  defaultZoom = 16,
  onLocationSelected,
  mapStyle,
}) => {
  // local state for picked location
  const [pickedLocation, setPickedLocation] = useState(null);

  // Optionally, if no defaultLocation is passed, you might want to fetch user's current location
  useEffect(() => {
    if (!defaultLocation) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setPickedLocation({ latitude, longitude });
          },
          (err) => {
            console.warn("Could not get user location:", err);
          }
        );
      }
    } else {
      // If defaultLocation is passed, we can use it as initial picked
      setPickedLocation(defaultLocation);
    }
  }, [defaultLocation]);

  const handleMapClick = useCallback(
    (loc) => {
      setPickedLocation(loc);
      if (onLocationSelected) {
        onLocationSelected(loc);
      }
    },
    [onLocationSelected]
  );

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ width: "100%", height: "100%", position: "relative" }}>
        {/* <div
          style={{
            position: "absolute",
            top: 10,
            zIndex: 1,
            left: 10,
            width: "calc(100% - 20px)",
          }}
        >
          <GooglePlacesAutocomplete
            onPlaceSelected={(data) => onLocationSelected(data.coordinates)}
          />
        </div> */}
        <Map
          style={mapStyle ?? { width: "100%", height: "100%" }}
          defaultZoom={defaultZoom}
          defaultCenter={
            pickedLocation ?? defaultLocation ?? { lat: 0, lng: 0 }
          }
          disableDefaultUI={true}
          zoomControl={true}
          mapTypeControl={false}
          scaleControl={false}
          streetViewControl={false}
          rotateControl={true}
          fullscreenControl={true}
          gestureHandling={"greedy"}
        >
          {/* Listener to handle clicks */}
          <MapClickListener onClick={handleMapClick} />

          {/* Marker at the picked location */}
          {pickedLocation && <Marker position={pickedLocation} />}
        </Map>
      </div>
    </APIProvider>
  );
};
