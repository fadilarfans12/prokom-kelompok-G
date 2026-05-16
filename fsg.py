import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function AmbulanceApp() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const ambulanceMarker = useRef(null);

  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulated route (Jakarta-like coords)
  const route = [
    [-6.2000, 106.8166],
    [-6.2015, 106.8150],
    [-6.2030, 106.8130],
    [-6.2050, 106.8100],
    [-6.2080, 106.8070],
    [-6.2100, 106.8050],
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getPosition(t) {
    const seg = route.length - 1;
    const idx = Math.floor(t * seg);
    const localT = t * seg - idx;

    if (idx >= seg) return route[seg];

    const lat = lerp(route[idx][0], route[idx + 1][0], localT);
    const lng = lerp(route[idx][1], route[idx + 1][1], localT);

    return [lat, lng];
  }

  useEffect(() => {
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(route[0], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(mapInstance.current);

      ambulanceMarker.current = L.marker(route[0]).addTo(mapInstance.current);

      // traffic lights
      route.forEach((p, i) => {
        if (i !== 0 && i !== route.length - 1) {
          L.circleMarker(p, {
            radius: 6,
            color: "red",
            fillColor: "red",
            fillOpacity: 1,
          }).addTo(mapInstance.current);
        }
      });
    }
  }, []);

  useEffect(() => {
    let interval;

    if (active) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;

          const pos = getPosition(next / 100);

          ambulanceMarker.current.setLatLng(pos);

          // traffic logic: green ahead, red behind
          route.forEach((p, i) => {
            if (i !== 0 && i !== route.length - 1) {
              const marker = L.circleMarker(p);
              const distProgress = i / (route.length - 1);

              if (distProgress <= next / 100) {
                marker.setStyle({ color: "red", fillColor: "red" });
              } else {
                marker.setStyle({ color: "green", fillColor: "green" });
              }
            }
          });

          if (next >= 100) return 100;
          return next;
        });
      }, 200);
    }

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-3 bg-red-600 text-white font-bold flex justify-between">
        <span> Sistem Ambulans Real-Time</span>
        <button
          className="bg-white text-red-600 px-3 py-1 rounded"
          onClick={() => setActive(!active)}
        >
          {active ? "Stop" : "Start Emergency"}
        </button>
      </div>

      <div ref={mapRef} className="flex-1" />

      <div className="p-3 bg-gray-100 text-sm">
        Progress: {progress}% | Mode: {active ? "DARURAT" : "NORMAL"}
      </div>
    </div>
  );
}
