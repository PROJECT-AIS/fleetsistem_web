// components/FreeMap.jsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from '../../../config/mapConfig';

// Pre-create icons ONCE outside component to avoid re-creation
const defaultIcon = L.icon({
  iconUrl: '/assets/dp.png',
  iconSize: [39, 20],
  iconAnchor: [19.5, 10],
});

const selectedIcon = L.icon({
  iconUrl: '/assets/selected-vehicle.png',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

const FreeMap = ({
  vehicles,
  selectedVehicle,
  onVehicleClick,
  onVehicleHover,
  onVehicleLeave
}) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersMapRef = useRef(new Map()); // Store markers by vehicle id
  const hoveredIdRef = useRef(null);

  // Store callbacks in refs
  const callbacksRef = useRef({ onVehicleClick, onVehicleHover, onVehicleLeave });
  callbacksRef.current = { onVehicleClick, onVehicleHover, onVehicleLeave };

  // Init map once
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
      MAP_CONFIG.tileLayers.googleSatellite.url,
      {
        attribution: MAP_CONFIG.tileLayers.googleSatellite.attribution,
        maxZoom: MAP_CONFIG.tileLayers.googleSatellite.maxZoom,
        tileSize: MAP_CONFIG.tileLayers.googleSatellite.tileSize,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 0,
        detectRetina: false,
        noWrap: true,
      }
    ).addTo(map);

    setTimeout(() => map.invalidateSize(), 0);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  // Update markers only when vehicles or selectedVehicle changes
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    const group = layerRef.current;
    group.clearLayers();
    markersMapRef.current.clear();

    (vehicles || []).forEach((v) => {
      const isSelected = selectedVehicle?.id === v.id;
      const marker = L.marker([v.lat, v.lng], {
        icon: isSelected ? selectedIcon : defaultIcon,
        rotationAngle: v.heading || 0
      });

      // Click handler
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const cb = callbacksRef.current.onVehicleClick;
        if (cb) cb(v);
      });

      // Hover - only call if not already hovered on this vehicle
      marker.on('mouseover', (e) => {
        if (hoveredIdRef.current === v.id) return; // Already hovering, skip
        hoveredIdRef.current = v.id;

        const cb = callbacksRef.current.onVehicleHover;
        if (cb) {
          const el = e.target.getElement();
          if (el) {
            const rect = el.getBoundingClientRect();
            cb(v, { x: rect.left + rect.width / 2, y: rect.top });
          }
        }
      });

      marker.on('mouseout', () => {
        hoveredIdRef.current = null;
        const cb = callbacksRef.current.onVehicleLeave;
        if (cb) cb();
      });

      marker.addTo(group);
      markersMapRef.current.set(v.id, marker);

      // Draw path for selected vehicle
      if (isSelected && v.path && v.path.length > 0) {
        L.polyline(v.path, {
          color: '#EF4444',
          weight: 4,
          opacity: 0.9
        }).addTo(group);
      }
    });
  }, [vehicles, selectedVehicle]);

  return <div id="map" className="w-full h-full rounded-lg" />;
};

export default FreeMap;