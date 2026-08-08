import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  normalizeDeviceStatus,
  normalizeEquipmentOperationalStatus,
} from "../../../utils/statusUtils";

const DEFAULT_MARKER_ICON_URL = "/assets/dp.png";

const normalizeDeviceIconState = (value) => {
  const normalized = normalizeDeviceStatus(value, "offline");
  if (normalized === "loss") return "loss";
  return normalized === "online" ? "on" : "off";
};

const normalizeEquipmentIconState = (value) => {
  const normalized = normalizeEquipmentOperationalStatus(value, "online");
  if (normalized === "pasif") return "pasif";
  return normalized === "online" ? "on" : "off";
};

const resolveVehicleMarkerIconUrl = (vehicle) => {
  const deviceState = normalizeDeviceIconState(
    vehicle?.deviceStatus || vehicle?.status,
  );
  const equipmentState = normalizeEquipmentIconState(vehicle?.equipmentStatus);

  return `/assets/icon_mobil/device-${deviceState}-equipment-${equipmentState}.png`;
};

const isVehiclePassive = (vehicle) =>
  normalizeEquipmentOperationalStatus(vehicle?.equipmentStatus, "online") ===
  "pasif";

// Map center controller component
const MapController = ({ selectedVehicle }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedVehicle) {
      map.flyTo([selectedVehicle.lat, selectedVehicle.lng], 15, { animate: true });
    }
  }, [selectedVehicle, map]);
  
  return null;
};

// Custom Marker component to handle rotation and custom icon
const RotatedMarker = ({ vehicle, isSelected, onClick, onMouseOver, onMouseOut }) => {
  const iconUrl = resolveVehicleMarkerIconUrl(vehicle);
  const heading = Math.round(Number(vehicle?.heading) || 0);

  const size = isSelected ? 76 : 68;

  // Custom DivIcon that uses standard HTML to rotate the image.
  const iconHtml = `<div style="transform: rotate(${heading}deg); transform-origin: center; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
      <img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='${DEFAULT_MARKER_ICON_URL}'" />
    </div>`;

  const customIcon = L.divIcon({
    html: iconHtml,
    className: 'custom-rotated-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  return (
    <Marker 
      position={[vehicle.lat, vehicle.lng]} 
      icon={customIcon}
      eventHandlers={{
        click: () => onClick && onClick(vehicle),
        mouseover: (e) => {
           if (onMouseOver && e.originalEvent) {
             const rect = e.originalEvent.target.getBoundingClientRect();
             onMouseOver(vehicle, { x: rect.left + rect.width / 2, y: rect.top });
           }
        },
        mouseout: () => onMouseOut && onMouseOut()
      }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
    </Marker>
  );
};

const AlertOverlay = ({ vehicle }) => {
  const isIdling = isVehiclePassive(vehicle);
  const isFuelTheft = vehicle.stolenActiveUntil && vehicle.stolenActiveUntil > Date.now();
  const isFuelAnomaly = vehicle.fuel?.anomaly == 1;
  const hasAlerts = isIdling || isFuelTheft || isFuelAnomaly;

  if (!hasAlerts) return null;

  let topInner = "border-b-[#f2c316]";
  let topOuter = "border-b-[#8d7406]";
  let bgColor = "bg-[#f2c316]";
  let borderColor = "border-[#8d7406]";
  let textColor = "text-[#5a4600]";
  let alertText = "Idling";

  if (isFuelTheft) {
    topInner = "border-b-[#ef4444]";
    topOuter = "border-b-[#7f1d1d]";
    bgColor = "bg-[#ef4444]";
    borderColor = "border-[#7f1d1d]";
    textColor = "text-white";
    alertText = "Fuel Theft";
  } else if (isFuelAnomaly) {
    topInner = "border-b-[#f97316]";
    topOuter = "border-b-[#c2410c]";
    bgColor = "bg-[#f97316]";
    borderColor = "border-[#c2410c]";
    textColor = "text-white";
    alertText = "Fuel Anomaly";
  }

  const html = `
    <div style="pointer-events: none; position: relative; width: max-content; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); display: flex; flex-direction: column; gap: 4px;">
      <div style="position: absolute; top: -8px; left: 8px; width: 0; height: 0; border-bottom: 9px solid; border-right: 10px solid transparent; border-bottom-color: ${topOuter.split('[')[1].split(']')[0]};"></div>
      <div style="position: absolute; top: -7px; left: 9px; z-index: 30; width: 0; height: 0; border-bottom: 8px solid; border-right: 8px solid transparent; border-bottom-color: ${topInner.split('[')[1].split(']')[0]};"></div>
      <div style="position: relative; z-index: 20; border-radius: 6px; border: 1px solid ${borderColor.split('[')[1].split(']')[0]}; background-color: ${bgColor.split('[')[1].split(']')[0]}; padding: 4px 12px;">
        <div style="white-space: nowrap; text-align: center; font-size: 11px; font-weight: 800; line-height: 1; letter-spacing: 0.02em; color: ${textColor.split('[')[1] ? textColor.split('[')[1].split(']')[0] : 'white'};">
          ${alertText}
        </div>
      </div>
    </div>
  `;

  const alertIcon = L.divIcon({
    html: html,
    className: 'custom-alert-marker',
    iconSize: [0, 0],
    iconAnchor: [-8, -16], // Offset from center
  });

  return (
    <Marker position={[vehicle.lat, vehicle.lng]} icon={alertIcon} zIndexOffset={2000} interactive={false} />
  );
};

const LeafletMap = ({
  vehicles = [],
  selectedVehicle,
  onVehicleClick,
  onVehicleHover,
  onVehicleLeave,
}) => {
  const defaultCenter = [-5.1315, 119.5];

  const polylinePath = useMemo(() => {
    if (!selectedVehicle?.path || selectedVehicle.path.length < 2) return [];
    return selectedVehicle.path.map((point) => [point[0], point[1]]);
  }, [selectedVehicle]);

  return (
    <div style={{ width: "100%", height: "100%", borderRadius: "0.5rem", overflow: 'hidden' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        style={{ width: "100%", height: "100%", zIndex: 1 }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Raffi Fadlika"
          maxZoom={18}
        />
        
        <MapController selectedVehicle={selectedVehicle} />

        {/* Polylines for trip path */}
        {vehicles.map((vehicle) => 
          vehicle.tripPath && 
          vehicle.tripPath.length > 1 && 
          vehicle.lastTripStatus === "On Trip" && (
            <Polyline
              key={`path-${vehicle.id}`}
              positions={vehicle.tripPath.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: "#74CD25",
                opacity: selectedVehicle?.id === vehicle.id ? 1.0 : 0.7,
                weight: selectedVehicle?.id === vehicle.id ? 6 : 4,
              }}
            />
          )
        )}

        {/* Selected Vehicle Path */}
        {selectedVehicle &&
          selectedVehicle.lastTripStatus !== "On Trip" &&
          polylinePath.length > 1 && (
            <Polyline 
              positions={polylinePath} 
              pathOptions={{
                color: "#EF4444",
                opacity: 0.9,
                weight: 4,
              }} 
            />
          )
        }

        {/* Markers */}
        {vehicles.map((vehicle) => {
          const isSelected = selectedVehicle?.id === vehicle.id;
          return (
            <React.Fragment key={`marker-wrapper-${vehicle.id}`}>
              <RotatedMarker
                vehicle={vehicle}
                isSelected={isSelected}
                onClick={onVehicleClick}
                onMouseOver={onVehicleHover}
                onMouseOut={onVehicleLeave}
              />
              <AlertOverlay vehicle={vehicle} />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
