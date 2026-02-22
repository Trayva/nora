// // // // // import { useEffect, useRef } from "react";

// // // // // export default function Map({ markers, onMarkerClick, isOpened }) {
// // // // //   const mapRef = useRef(null);
// // // // //   const leafletLoaded = useRef(false);

// // // // //   useEffect(() => {
// // // // //     if (leafletLoaded.current) return;
// // // // //     leafletLoaded.current = true;

// // // // //     // Load Leaflet CSS
// // // // //     const link = document.createElement("link");
// // // // //     link.rel = "stylesheet";
// // // // //     link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
// // // // //     document.head.appendChild(link);

// // // // //     // Load Leaflet JS
// // // // //     const script = document.createElement("script");
// // // // //     script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
// // // // //     script.async = true;
// // // // //     script.onload = () => {
// // // // //       const L = window.L;

// // // // //       // Init map
// // // // //       const map = L.map(mapRef.current, { zoomControl: true });

// // // // //       // OSM tiles
// // // // //       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// // // // //         attribution: "",
// // // // //       }).addTo(map);

// // // // //       if (navigator.geolocation) {
// // // // //         navigator.geolocation.getCurrentPosition(
// // // // //           (pos) => {
// // // // //             const { latitude, longitude } = pos.coords;
// // // // //             map.setView([latitude, longitude], 14);

// // // // //             // optional: add "You are here" marker
// // // // //             L.marker([latitude, longitude])
// // // // //               .addTo(map)
// // // // //               .bindPopup("You are here")
// // // // //               .openPopup();
// // // // //           },
// // // // //           () => {
// // // // //             // fallback if denied
// // // // //             map.setView([25.1972, 55.2744], 12);
// // // // //           }
// // // // //         );
// // // // //       } else {
// // // // //         map.setView([25.1972, 55.2744], 12);
// // // // //       }

// // // // //       // Add markers with click handling
// // // // //       const markerGroup = L.featureGroup();
// // // // //       markers.forEach(({ id, lat, lng, label, color = "red" }) => {
// // // // //         const icon = new L.Icon({
// // // // //           iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
// // // // //           //   iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/marker-icon-${color}.png`,
// // // // //           shadowUrl:
// // // // //             "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// // // // //           iconSize: [25, 41],
// // // // //           iconAnchor: [12, 41],
// // // // //           popupAnchor: [1, -34],
// // // // //           shadowSize: [41, 41],
// // // // //         });
// // // // //         const marker = L.marker([lat, lng], { icon }).addTo(markerGroup);

// // // // //         marker.on("click", () => {
// // // // //           if (onMarkerClick) {
// // // // //             onMarkerClick({ id, lat, lng, label, color });
// // // // //           }
// // // // //         });
// // // // //       });

// // // // //       markerGroup.addTo(map);

// // // // //       // Fit map to markers
// // // // //       if (markers.length > 0) {
// // // // //         map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
// // // // //       } else {
// // // // //         map.setView([25.1972, 55.2744], 12); // fallback to Dubai
// // // // //       }

// // // // //       // ✅ responsive fix
// // // // //       setTimeout(() => {
// // // // //         map.invalidateSize();
// // // // //       }, 0);

// // // // //       window.addEventListener("resize", () => map.invalidateSize());
// // // // //     };

// // // // //     document.body.appendChild(script);
// // // // //   }, [markers, onMarkerClick]);

// // // // //   // 👇 whenever parent changes (isOpened, selected) → force resize
// // // // //   useEffect(() => {
// // // // //     if (mapRef.current && mapRef.current._leaflet_id) {
// // // // //       setTimeout(() => {
// // // // //         mapRef.current._leaflet_map.invalidateSize();
// // // // //       }, 300); // wait for CSS animation
// // // // //     }
// // // // //   }, [isOpened]);

// // // // //   return (
// // // // //     <div
// // // // //       ref={mapRef}
// // // // //       className="map-view"
// // // // //       style={{ width: "100%", height: "calc(100% - 20px)" }}
// // // // //     />
// // // // //   );
// // // // // }

// // // // import { useEffect, useRef } from "react";
// // // // import { getSlotColor } from "../../utils/string";

// // // // export default function Map({
// // // //   markers,
// // // //   onMarkerClick,
// // // //   isOpened,
// // // //   selected,
// // // //   region,
// // // // }) {
// // // //   const mapContainerRef = useRef(null);
// // // //   const mapInstanceRef = useRef(null);
// // // //   const leafletLoaded = useRef(false);

// // // //   useEffect(() => {
// // // //     if (leafletLoaded.current) return;
// // // //     leafletLoaded.current = true;

// // // //     // Load Leaflet CSS
// // // //     const link = document.createElement("link");
// // // //     link.rel = "stylesheet";
// // // //     link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
// // // //     document.head.appendChild(link);

// // // //     // Load Leaflet JS
// // // //     const script = document.createElement("script");
// // // //     script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
// // // //     script.async = true;
// // // //     script.onload = () => {
// // // //       const L = window.L;

// // // //       // Init map
// // // //       const map = L.map(mapContainerRef.current, { zoomControl: true });
// // // //       mapInstanceRef.current = map; // ✅ save instance

// // // //       // OSM tiles
// // // //       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// // // //         attribution: "",
// // // //       }).addTo(map);

// // // //       // Add markers
// // // //       const markerGroup = L.featureGroup();
// // // //       markers.forEach(({ id, latitude, longitude, ...props }) => {
// // // //         const color = getSlotColor(props.totalSlots, props.availableSlots);
// // // //         const icon = new L.Icon({
// // // //           iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
// // // //           shadowUrl:
// // // //             "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// // // //           iconSize: [25, 41],
// // // //           iconAnchor: [12, 41],
// // // //           popupAnchor: [1, -34],
// // // //           shadowSize: [41, 41],
// // // //         });
// // // //         const marker = L.marker([latitude, longitude], { icon }).addTo(
// // // //           markerGroup
// // // //         );

// // // //         marker.on("click", () => {
// // // //           if (onMarkerClick) {
// // // //             onMarkerClick({ id, latitude, longitude, color, ...props });
// // // //           }
// // // //         });
// // // //       });

// // // //       markerGroup.addTo(map);

// // // //       if (region?.latitude && region?.longitude) {
// // // //         map.setView([region.latitude, region.longitude], region.zoom || 13);
// // // //       } else if (markers.length > 0) {
// // // //         map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
// // // //       } else {
// // // //         // fallback location if no region + no markers
// // // //         map.setView([25.1972, 55.2744], 12);
// // // //       }

// // // //       // if (markers.length > 0) {
// // // //       //   map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
// // // //       // } else {
// // // //       //   map.setView([25.1972, 55.2744], 12);
// // // //       // }
// // // //     };

// // // //     document.body.appendChild(script);
// // // //   }, [markers, onMarkerClick]);

// // // //   // ✅ Handle container size changes (like `isOpened` or `selected`)
// // // //   useEffect(() => {
// // // //     if (mapInstanceRef.current) {
// // // //       setTimeout(() => {
// // // //         mapInstanceRef.current.invalidateSize();
// // // //       }, 300); // wait for CSS transitions
// // // //     }
// // // //   }, [isOpened, selected]);

// // // //   return (
// // // //     <div
// // // //       ref={mapContainerRef}
// // // //       style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
// // // //     />
// // // //   );
// // // // }

// // // import { useEffect, useRef } from "react";
// // // import { getSlotColor } from "../../utils/string";

// // // export default function Map({
// // //   markers,
// // //   onMarkerClick,
// // //   isOpened,
// // //   selected,
// // //   region = { latitude: null, longitude: null, zoom: 13 },
// // // }) {
// // //   const mapContainerRef = useRef(null);
// // //   const mapInstanceRef = useRef(null);
// // //   const leafletLoaded = useRef(false);

// // //   useEffect(() => {
// // //     if (leafletLoaded.current) return;
// // //     leafletLoaded.current = true;

// // //     // Load Leaflet CSS
// // //     const link = document.createElement("link");
// // //     link.rel = "stylesheet";
// // //     link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
// // //     document.head.appendChild(link);

// // //     // Load Leaflet JS
// // //     const script = document.createElement("script");
// // //     script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
// // //     script.async = true;
// // //     script.onload = () => {
// // //       const L = window.L;

// // //       // Init map
// // //       const map = L.map(mapContainerRef.current, { zoomControl: true });
// // //       mapInstanceRef.current = map;

// // //       // OSM tiles
// // //       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// // //         attribution: "",
// // //       }).addTo(map);

// // //       // Marker group (stations, parking spots, etc.)
// // //       const markerGroup = L.featureGroup();

// // //       markers.forEach(({ id, latitude, longitude, ...props }) => {
// // //         const color = getSlotColor(props.totalSlots, props.availableSlots);
// // //         const icon = new L.Icon({
// // //           iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
// // //           shadowUrl:
// // //             "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// // //           iconSize: [25, 41],
// // //           iconAnchor: [12, 41],
// // //           popupAnchor: [1, -34],
// // //           shadowSize: [41, 41],
// // //         });

// // //         const marker = L.marker([latitude, longitude], { icon }).addTo(
// // //           markerGroup
// // //         );

// // //         marker.on("click", () => {
// // //           if (onMarkerClick) {
// // //             onMarkerClick({ id, latitude, longitude, color, ...props });
// // //           }
// // //         });
// // //       });

// // //       // ✅ Add user location marker if region provided
// // //       if (region?.latitude && region?.longitude) {
// // //         const userIcon = new L.Icon({
// // //           iconUrl:
// // //             "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
// // //           shadowUrl:
// // //             "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// // //           iconSize: [25, 41],
// // //           iconAnchor: [12, 41],
// // //           popupAnchor: [1, -34],
// // //           shadowSize: [41, 41],
// // //         });

// // //         const userMarker = L.marker([region.latitude, region.longitude], {
// // //           icon: userIcon,
// // //         }).bindPopup("You are here");

// // //         markerGroup.addLayer(userMarker);
// // //       }

// // //       markerGroup.addTo(map);

// // //       // ✅ Centering logic
// // //       if (region?.latitude && region?.longitude) {
// // //         map.setView([region.latitude, region.longitude], region.zoom || 13);
// // //       } else if (markers.length > 0) {
// // //         map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
// // //       } else {
// // //         map.setView([25.1972, 55.2744], 12); // fallback default
// // //       }
// // //     };

// // //     document.body.appendChild(script);
// // //   }, [markers, onMarkerClick, region]);

// // //   // ✅ Handle container size changes (like `isOpened` or `selected`)
// // //   useEffect(() => {
// // //     if (mapInstanceRef.current) {
// // //       setTimeout(() => {
// // //         mapInstanceRef.current.invalidateSize();
// // //       }, 300);
// // //     }
// // //   }, [isOpened, selected]);

// // //   return (
// // //     <div
// // //       ref={mapContainerRef}
// // //       style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
// // //     />
// // //   );
// // // }

// // import { useEffect, useRef } from "react";
// // import { getSlotColor } from "../../utils/string";

// // export default function Map({
// //   markers,
// //   onMarkerClick,
// //   isOpened,
// //   selected,
// //   region = { latitude: null, longitude: null, zoom: 13 },
// // }) {
// //   const mapContainerRef = useRef(null);
// //   const mapInstanceRef = useRef(null);
// //   const markerGroupRef = useRef(null);
// //   const leafletLoaded = useRef(false);

// //   // Load Leaflet once
// //   useEffect(() => {
// //     if (leafletLoaded.current) return;
// //     leafletLoaded.current = true;

// //     // Load CSS
// //     const link = document.createElement("link");
// //     link.rel = "stylesheet";
// //     link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
// //     document.head.appendChild(link);

// //     // Load JS
// //     const script = document.createElement("script");
// //     script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
// //     script.async = true;
// //     script.onload = () => {
// //       const L = window.L;

// //       const map = L.map(mapContainerRef.current, { zoomControl: true });
// //       mapInstanceRef.current = map;

// //       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// //         attribution: "",
// //       }).addTo(map);

// //       markerGroupRef.current = L.featureGroup().addTo(map);
// //     };

// //     document.body.appendChild(script);
// //   }, []);

// //   // Update markers & center when `markers` or `region` change
// //   useEffect(() => {
// //     if (!mapInstanceRef.current || !markerGroupRef.current) return;
// //     const L = window.L;

// //     const map = mapInstanceRef.current;
// //     const markerGroup = markerGroupRef.current;

// //     // Clear previous markers
// //     markerGroup.clearLayers();

// //     // Add data markers
// //     markers.forEach(({ id, latitude, longitude, ...props }) => {
// //       const color = getSlotColor(props.totalSlots, props.availableSlots);
// //       const icon = new L.Icon({
// //         iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
// //         shadowUrl:
// //           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// //         iconSize: [25, 41],
// //         iconAnchor: [12, 41],
// //         popupAnchor: [1, -34],
// //         shadowSize: [41, 41],
// //       });

// //       const marker = L.marker([latitude, longitude], { icon }).addTo(
// //         markerGroup
// //       );

// //       marker.on("click", () => {
// //         if (onMarkerClick) {
// //           onMarkerClick({ id, latitude, longitude, color, ...props });
// //         }
// //       });
// //     });

// //     // Add user marker if region provided
// //     if (region?.latitude && region?.longitude) {
// //       const userIcon = new L.Icon({
// //         iconUrl:
// //           "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
// //         shadowUrl:
// //           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// //         iconSize: [25, 41],
// //         iconAnchor: [12, 41],
// //         popupAnchor: [1, -34],
// //         shadowSize: [41, 41],
// //       });

// //       const userMarker = L.marker([region.latitude, region.longitude], {
// //         icon: userIcon,
// //       }).bindPopup("You are here");

// //       markerGroup.addLayer(userMarker);
// //     }

// //     // Center logic
// //     if (region?.latitude && region?.longitude) {
// //       map.setView([region.latitude, region.longitude], region.zoom || 13);
// //     } else if (markers.length > 0) {
// //       map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
// //     } else {
// //       map.setView([25.1972, 55.2744], 12);
// //     }
// //   }, [markers, region, onMarkerClick]);

// //   // Resize on container state changes
// //   useEffect(() => {
// //     if (mapInstanceRef.current) {
// //       setTimeout(() => {
// //         mapInstanceRef.current.invalidateSize();
// //       }, 300);
// //     }
// //   }, [isOpened, selected]);

// //   return (
// //     <div
// //       ref={mapContainerRef}
// //       style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
// //     />
// //   );
// // }

// import { useEffect, useRef } from "react";
// import { getSlotColor } from "../../utils/string";

// export default function Map({
//   markers,
//   onMarkerClick,
//   isOpened,
//   selected,
//   region = { latitude: null, longitude: null, zoom: 13 },
// }) {
//   const mapContainerRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const markerGroupRef = useRef(null);
//   const leafletLoaded = useRef(false);

//   // Load Leaflet once
//   useEffect(() => {
//     if (leafletLoaded.current) return;
//     leafletLoaded.current = true;

//     // Load CSS
//     const link = document.createElement("link");
//     link.rel = "stylesheet";
//     link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
//     document.head.appendChild(link);

//     // Load JS
//     const script = document.createElement("script");
//     script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
//     script.async = true;
//     script.onload = () => {
//       const L = window.L;

//       const map = L.map(mapContainerRef.current, { zoomControl: true });
//       mapInstanceRef.current = map;

//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "",
//       }).addTo(map);

//       markerGroupRef.current = L.featureGroup().addTo(map);

//       // ✅ Important: force Leaflet to recalc size
//       setTimeout(() => {
//         map.invalidateSize();
//       }, 0);
//     };

//     document.body.appendChild(script);
//   }, []);

//   // Update markers & center when `markers` or `region` change
//   useEffect(() => {
//     if (!mapInstanceRef.current || !markerGroupRef.current) return;
//     const L = window.L;

//     const map = mapInstanceRef.current;
//     const markerGroup = markerGroupRef.current;

//     markerGroup.clearLayers();

//     markers.forEach(({ id, latitude, longitude, ...props }) => {
//       const color = getSlotColor(props.totalSlots, props.availableSlots);
//       const icon = new L.Icon({
//         iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
//         shadowUrl:
//           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//         iconSize: [25, 41],
//         iconAnchor: [12, 41],
//         popupAnchor: [1, -34],
//         shadowSize: [41, 41],
//       });

//       const marker = L.marker([latitude, longitude], { icon }).addTo(
//         markerGroup
//       );

//       marker.on("click", () => {
//         if (onMarkerClick) {
//           onMarkerClick({ id, latitude, longitude, color, ...props });
//         }
//       });
//     });

//     if (region?.latitude && region?.longitude) {
//       const userIcon = new L.Icon({
//         iconUrl:
//           "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
//         shadowUrl:
//           "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
//         iconSize: [25, 41],
//         iconAnchor: [12, 41],
//         popupAnchor: [1, -34],
//         shadowSize: [41, 41],
//       });

//       const userMarker = L.marker([region.latitude, region.longitude], {
//         icon: userIcon,
//       }).bindPopup("You are here");

//       markerGroup.addLayer(userMarker);
//     }

//     if (region?.latitude && region?.longitude) {
//       map.setView([region.latitude, region.longitude], region.zoom || 13);
//     } else if (markers.length > 0) {
//       map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
//     } else {
//       map.setView([25.1972, 55.2744], 12);
//     }

//     // ✅ Also force resize when markers/region change
//     setTimeout(() => {
//       map.invalidateSize();
//     }, 0);
//   }, [markers, region, markerGroupRef.current, mapInstanceRef.current]);

//   // Resize on container state changes
//   useEffect(() => {
//     if (mapInstanceRef.current) {
//       setTimeout(() => {
//         mapInstanceRef.current.invalidateSize();
//       }, 300);
//     }
//   }, [isOpened, selected]);

//   return (
//     <div
//       ref={mapContainerRef}
//       style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
//     />
//   );
// }

import { useEffect, useRef } from "react";
import { getSlotColor } from "../../utils/string";

export default function Map({
  markers,
  onMarkerClick,
  isOpened,
  selected,
  region = { latitude: null, longitude: null, zoom: 13 },
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);
  const leafletLoaded = useRef(false);

  // Load Leaflet once
  useEffect(() => {
    if (leafletLoaded.current) return;
    leafletLoaded.current = true;

    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet/dist/leaflet.css";
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      const L = window.L;

      const map = L.map(mapContainerRef.current, { zoomControl: true });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "",
      }).addTo(map);

      markerGroupRef.current = L.featureGroup().addTo(map);

      // ✅ Important: force Leaflet to recalc size
      setTimeout(() => {
        map.invalidateSize();
      }, 0);
    };

    document.body.appendChild(script);
  }, []);

  // Update markers & center when `markers` or `region` change
  useEffect(() => {
    if (!markers?.length) return;
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    const L = window.L;

    const map = mapInstanceRef.current;
    const markerGroup = markerGroupRef.current;

    markerGroup.clearLayers();

    markers.forEach(({ id, latitude, longitude, ...props }) => {
      const color = getSlotColor(props.totalSlots, props.availableSlots);
      const icon = new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker([latitude, longitude], { icon }).addTo(
        markerGroup
      );

      marker.on("click", () => {
        if (onMarkerClick) {
          onMarkerClick({ id, latitude, longitude, color, ...props });
        }
      });
    });

    if (region?.latitude && region?.longitude) {
      const userIcon = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const userMarker = L.marker([region.latitude, region.longitude], {
        icon: userIcon,
      }).bindPopup("You are here");

      markerGroup.addLayer(userMarker);
    }

    if (region?.latitude && region?.longitude) {
      map.setView([region.latitude, region.longitude], region.zoom || 13);
    } else if (markers.length > 0) {
      map.fitBounds(markerGroup.getBounds(), { padding: [50, 50] });
    } else {
      map.setView([25.1972, 55.2744], 12);
    }

    // ✅ Also force resize when markers/region change
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, [markers, region, onMarkerClick]);

  // Resize on container state changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isOpened, selected]);

  console.log(markers, region);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: `calc(100% - ${isOpened ? 45 : 20}px)` }}
    />
  );
}
