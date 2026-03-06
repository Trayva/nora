import { useState, useEffect } from "react";

export function useUserLocation({ initial }) {
  const [location, setLocation] = useState({
    latitude: initial?.latitude,
    longitude: initial?.longitude,
    area: initial?.area,
    address: initial?.address,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      if (!initial?.latitude)
        setLocation({
          latitude: 25.2048,
          longitude: 55.2708,
          area: "Dubai, UAE.",
        });
      return;
    }

    if (!initial)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            setLocation({
              latitude,
              longitude,
              address: data.display_name || "Unknown location",
              area:
                data.name ||
                data.address?.suburb ||
                data.address?.neighbourhood ||
                "Unknown area",
            });
          } catch (err) {
            setError("Failed to fetch location name.");
            if (!initial?.latitude)
              setLocation({
                latitude: 25.2048,
                longitude: 55.2708,
                area: "Dubai, UAE.",
              });
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          if (!initial.latitude)
            setLocation({
              latitude: 25.2048,
              longitude: 55.2708,
              area: "Dubai, UAE.",
            });
          setError(err.message);
          setLoading(false);
        }
      );

    // eslint-disable-next-line
  }, []);

  // useEffect(() => {
  //   if (initial?.latitude) {
  //     setLocation({
  //       latitude: initial?.latitude,
  //       longitude: initial?.longitude,
  //       area: initial?.area,
  //       address: initial?.address,
  //     });
  //   }
  // }, [initial]);

  return { ...location, loading, error, setLocation };
}
