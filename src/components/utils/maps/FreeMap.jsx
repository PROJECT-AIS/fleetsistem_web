// components/FreeMap.jsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const FreeMap = ({ vehicles }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  // Init map sekali
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("map", {
      zoomControl: true,
      preferCanvas: true,
      updateWhenIdle: true,
      minZoom: 11,
      maxZoom: 17,
    }).setView([-5.14, 119.43], 13);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Tiles © Esri",
        maxZoom: 18,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 0,
        detectRetina: false,
        noWrap: true,
        tileSize: 512,
        zoomOffset: -1,
      }
    ).addTo(map);

    // Pastikan ukuran valid setelah mount
    setTimeout(() => map.invalidateSize(), 0);

    // Siapkan layer group untuk marker + polyline
    layerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;
  }, []);

  // Render ulang layer saat vehicles berubah
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const group = layerRef.current;
    group.clearLayers();

    const defaultIcon = L.icon({
      iconUrl: "/assets/dp.png",
      iconSize: [39, 20],
      iconAnchor: [19, 20],
      popupAnchor: [0, -20],
    });

    (vehicles || []).forEach((v, i) => {
      const marker = L.marker([v.lat, v.lng], { icon: defaultIcon });
      marker.bindPopup(`<b>${v.name ?? "Vehicle"}</b><br>Status: ${v.status ?? "-"}`);
      marker.addTo(group);

      const paths = v.paths || v.path;
      if (Array.isArray(paths) && paths.length) {
        const colors = ["#74CD25", "#00B4D8", "#F59E0B", "#EF4444", "#8B5CF6"];
        const color = colors[i % colors.length];
        L.polyline(paths, { color, weight: 3, opacity: 0.8 }).addTo(group);
      }
    });
  }, [vehicles]);

  return <div id="map" className="w-full h-[500px] rounded-lg" />;
};

export default FreeMap;