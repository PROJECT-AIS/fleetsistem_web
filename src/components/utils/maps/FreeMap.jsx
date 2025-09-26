// components/FreeMap.jsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FreeMap = ({ vehicles }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: true,
      preferCanvas: true,
      updateWhenIdle: true,
    }).setView([-5.14, 119.43], 13);

    // SATELLITE LAYER - Esri World Imagery
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX",
        maxZoom: 18,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 4,
        detectRetina: true,
      }
    ).addTo(map);

    // Marker kendaraan pakai dp.png dari public
    const vehicleIcon = L.icon({
      iconUrl: "/assets/dp.png",
      iconSize: [78, 40],      // sesuai ukuran asli gambar
      iconAnchor: [39, 40],    // tengah bawah gambar
      popupAnchor: [0, -40],   // popup muncul di atas marker
    });

    vehicles.forEach((v, i) => {
      const marker = L.marker([v.lat, v.lng], { icon: vehicleIcon }).addTo(map);
      marker.bindPopup(`<b>${v.name}</b><br>Status: ${v.status}`);

      const paths = v.paths || v.path;
      const fallbackPaths = [
        [
          [v.lat, v.lng],
          [v.lat + 0.003, v.lng + 0.004],
          [v.lat + 0.006, v.lng + 0.001],
        ],
        [
          [v.lat - 0.002, v.lng - 0.003],
          [v.lat - 0.004, v.lng + 0.002],
        ],
      ];
      const multiPolyline = Array.isArray(paths) ? paths : fallbackPaths;
      const colors = ["#74CD25", "#00B4D8", "#F59E0B", "#EF4444", "#8B5CF6"];
      const color = colors[i % colors.length];
      L.polyline(multiPolyline, { color, weight: 3, opacity: 0.8 }).addTo(map);
    });

    mapRef.current = map;
  }, [vehicles]);

  return <div id="map" className="w-full h-[500px] rounded-lg" />;
};

export default FreeMap;