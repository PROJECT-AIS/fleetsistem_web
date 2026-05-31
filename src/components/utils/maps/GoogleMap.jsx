// components/GoogleMap.jsx
import React, {
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useState,
} from "react";
import {
  GoogleMap as GoogleMapComponent,
  useJsApiLoader,
  Marker,
  OverlayView,
  Polyline,
} from "@react-google-maps/api";
import {
  normalizeDeviceStatus,
  normalizeEquipmentOperationalStatus,
} from "../../../utils/statusUtils";

const GOOGLE_MAPS_API_KEY = "AIzaSyAcm-7sXCOMDgcP6YCH2cG_vWK4EfiP5ac";

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

// Default center (Makassar)
const defaultCenter = {
  lat: -5.1315,
  lng: 119.5,
};

const DEFAULT_MARKER_ICON_URL = "/assets/dp.png";
const deviceIconStates = ["on", "off", "loss"];
const equipmentIconStates = ["on", "off", "pasif"];
const markerIconUrls = deviceIconStates.flatMap((deviceState) =>
  equipmentIconStates.map(
    (equipmentState) =>
      `/assets/icon_mobil/device-${deviceState}-equipment-${equipmentState}.png`,
  ),
);

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

// Map options for satellite view with POI hidden
const mapOptions = {
  mapTypeId: "hybrid", // satellite with labels
  disableDefaultUI: false,
  zoomControl: true,
  scrollwheel: true,
  gestureHandling: "greedy",
  disableDoubleClickZoom: false,
  keyboardShortcuts: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  minZoom: 11,
  maxZoom: 18,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.attraction",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.government",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.medical",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.place_of_worship",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.school",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.sports_complex",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const GoogleMap = ({
  vehicles = [],
  selectedVehicle,
  onVehicleClick,
  onVehicleHover,
  onVehicleLeave,
}) => {
  const mapRef = useRef(null);
  const selectedVehicleIdRef = useRef(null);
  const callbacksRef = useRef({
    onVehicleClick,
    onVehicleHover,
    onVehicleLeave,
  });
  callbacksRef.current = { onVehicleClick, onVehicleHover, onVehicleLeave };

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const [zoom, setZoom] = useState(13);
  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setZoom(map.getZoom());
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleZoomChanged = useCallback(() => {
    if (mapRef.current) {
      setZoom(mapRef.current.getZoom());
    }
  }, []);

  // Center map on selected vehicle and FOLLOW it if it moves
  useEffect(() => {
    if (!mapRef.current) return;

    if (!selectedVehicle) {
      selectedVehicleIdRef.current = null;
      return;
    }

    const targetPosition = {
      lat: Number(selectedVehicle.lat),
      lng: Number(selectedVehicle.lng),
    };

    // panTo is smoother for moving objects than setCenter
    mapRef.current.panTo(targetPosition);

    const isNewSelection = selectedVehicleIdRef.current !== selectedVehicle.id;

    // Auto zoom only when a different vehicle is selected.
    if (isNewSelection && mapRef.current.getZoom() < 15) {
      mapRef.current.setZoom(15);
      setZoom(15);
    }

    selectedVehicleIdRef.current = selectedVehicle.id;
  }, [selectedVehicle]);

  // Cache for rotated icons
  const iconCache = useRef({});
  const baseIconsRef = useRef({});
  const [iconsLoadedCount, setIconsLoadedCount] = useState(0);

  // Pre-load base icons
  useEffect(() => {
    const assets = [DEFAULT_MARKER_ICON_URL, ...markerIconUrls];
    assets.forEach((url) => {
      if (baseIconsRef.current[url]) return;

      const img = new Image();
      img.src = url;
      img.onload = () => {
        baseIconsRef.current[url] = img;
        setIconsLoadedCount((prev) => prev + 1);
      };
    });
  }, []);

  // Helper to rotate the icon using canvas
  const buildMarkerArt = useCallback(
    (vehicle) => {
      const iconUrl = resolveVehicleMarkerIconUrl(vehicle);
      if (iconsLoadedCount === 0) return iconUrl || DEFAULT_MARKER_ICON_URL;

      const rawHeading = Math.round(Number(vehicle?.heading) || 0);
      const normalizedHeading = ((rawHeading % 360) + 360) % 360;
      const cacheKey = `${iconUrl}-${normalizedHeading}`;

      if (iconCache.current[cacheKey]) return iconCache.current[cacheKey];

      const baseImg = baseIconsRef.current[iconUrl];
      if (!baseImg) return iconUrl || DEFAULT_MARKER_ICON_URL;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const baseSize = { width: 72, height: 72, centerX: 36, centerY: 36 };
      const rotationAngle = (normalizedHeading + 90) % 360;
      const iconWidth = baseImg.naturalWidth || baseImg.width || baseSize.width;
      const iconHeight =
        baseImg.naturalHeight || baseImg.height || baseSize.height;

      canvas.width = baseSize.width;
      canvas.height = baseSize.height;

      ctx.save();
      ctx.translate(baseSize.centerX, baseSize.centerY);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(
        baseImg,
        -iconWidth / 2,
        -iconHeight / 2,
        iconWidth,
        iconHeight,
      );
      ctx.restore();

      const dataUrl = canvas.toDataURL();
      iconCache.current[cacheKey] = dataUrl;
      return dataUrl;
    },
    [iconsLoadedCount],
  );

  // Create marker icon
  const createMarkerIcon = useCallback(
    (vehicle, isSelected) => {
      if (!window.google) return null;

      const finalUrl = buildMarkerArt(vehicle);

      // Calculate zoom scale (Base zoom 15 = 1.0 scale)
      // Zoom levels usually range from 11-18. We'll make it scale reasonably.
      const baseZoom = 15;
      const markerSizeRatio = 0.6;
      const zoomScale = Math.max(
        0.4,
        Math.min(2.0, Math.pow(1.15, zoom - baseZoom)),
      );

      const baseSize = isSelected
        ? { w: 76, h: 76, anchorY: 38 }
        : { w: 68, h: 68, anchorY: 34 };
      const scaledW = baseSize.w * markerSizeRatio * zoomScale;
      const scaledH = baseSize.h * markerSizeRatio * zoomScale;

      return {
        url: finalUrl,
        scaledSize: new window.google.maps.Size(scaledW, scaledH),
        anchor: new window.google.maps.Point(
          scaledW / 2,
          baseSize.anchorY * markerSizeRatio * zoomScale,
        ),
      };
    },
    [buildMarkerArt, zoom],
  );

  // Handle marker click
  const handleMarkerClick = useCallback((vehicle) => {
    const cb = callbacksRef.current.onVehicleClick;
    if (cb) cb(vehicle);
  }, []);

  // Handle marker hover
  const handleMarkerMouseOver = useCallback((vehicle, event) => {
    const cb = callbacksRef.current.onVehicleHover;
    if (cb && event.domEvent) {
      const rect = event.domEvent.target.getBoundingClientRect();
      cb(vehicle, {
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, []);

  // Handle marker leave
  const handleMarkerMouseOut = useCallback(() => {
    const cb = callbacksRef.current.onVehicleLeave;
    if (cb) cb();
  }, []);

  // Polyline path for selected vehicle
  const polylinePath = useMemo(() => {
    if (!selectedVehicle?.path || selectedVehicle.path.length < 2) return [];
    return selectedVehicle.path.map((point) => ({
      lat: point[0],
      lng: point[1],
    }));
  }, [selectedVehicle]);

  // Polyline options
  const polylineOptions = useMemo(
    () => ({
      strokeColor: "#EF4444",
      strokeOpacity: 0.9,
      strokeWeight: 4,
    }),
    [],
  );

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-red-500">Error loading Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-white">Loading map...</p>
      </div>
    );
  }

  return (
    <GoogleMapComponent
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={zoom}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onZoomChanged={handleZoomChanged}
    >
      {/* 1. Draw all Trip Polylines first (Bottom Layer) */}
      {vehicles.map(
        (vehicle) =>
          vehicle.tripPath &&
          vehicle.tripPath.length > 1 &&
          vehicle.lastTripStatus === "On Trip" && (
            <Polyline
              key={`path-${vehicle.id}`}
              path={vehicle.tripPath}
              options={{
                strokeColor: "#74CD25",
                strokeOpacity: selectedVehicle?.id === vehicle.id ? 1.0 : 0.7,
                strokeWeight: selectedVehicle?.id === vehicle.id ? 6 : 4,
                clickable: false,
                zIndex: selectedVehicle?.id === vehicle.id ? 100 : 50,
                geodesic: true,
              }}
            />
          ),
      )}

      {/* 2. Draw all Vehicle Markers (Top Layer) */}
      {vehicles.map((vehicle) => {
        const isSelected = selectedVehicle?.id === vehicle.id;
        return (
          <React.Fragment key={`marker-${vehicle.id}`}>
            <Marker
              position={{ lat: vehicle.lat, lng: vehicle.lng }}
              icon={createMarkerIcon(vehicle, isSelected)}
              onClick={() => handleMarkerClick(vehicle)}
              onMouseOver={(e) => handleMarkerMouseOver(vehicle, e)}
              onMouseOut={handleMarkerMouseOut}
              zIndex={isSelected ? 1000 : 500}
            />
            {(() => {
              const isIdling = isVehiclePassive(vehicle);
              const isFuelTheft = vehicle.stolenActiveUntil && vehicle.stolenActiveUntil > Date.now();
              const isFuelAnomaly = vehicle.fuel?.anomaly == 1;
              const hasAlerts = isIdling || isFuelTheft || isFuelAnomaly;

              if (!hasAlerts) return null;

              let topInner = "border-b-[#f2c316]";
              let topOuter = "border-b-[#8d7406]";
              if (isIdling) {
                topInner = "border-b-[#f2c316]";
                topOuter = "border-b-[#8d7406]";
              } else if (isFuelTheft) {
                topInner = "border-b-[#ef4444]"; // red-500
                topOuter = "border-b-[#7f1d1d]"; // red-900
              } else if (isFuelAnomaly) {
                topInner = "border-b-[#f97316]"; // orange-500
                topOuter = "border-b-[#c2410c]"; // orange-700
              }

              return (
                <OverlayView
                  position={{ lat: vehicle.lat, lng: vehicle.lng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(width, height) => ({
                    x: -8,
                    y: 16,
                  })}
                >
                  <div className="pointer-events-none relative w-max drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] flex flex-col gap-1">
                    {/* Tail (Outer + Inner) */}
                    <div className={`absolute -top-[8px] left-[8px] h-0 w-0 border-b-[9px] border-r-[10px] border-r-transparent ${topOuter}`} />
                    <div className={`absolute -top-[7px] left-[9px] z-30 h-0 w-0 border-b-[8px] border-r-[8px] border-r-transparent ${topInner}`} />
                    
                    {isIdling && (
                      <div className="relative z-20 rounded-[6px] border border-[#8d7406] bg-[#f2c316] px-3 py-1">
                        <div className="whitespace-nowrap text-center text-[11px] font-extrabold leading-none tracking-[0.02em] text-[#5a4600]">
                          Idling
                        </div>
                      </div>
                    )}

                    {isFuelTheft && (
                      <div className="relative z-20 rounded-[6px] border border-[#7f1d1d] bg-[#ef4444] px-3 py-1">
                        <div className="whitespace-nowrap text-center text-[11px] font-extrabold leading-none tracking-[0.02em] text-white">
                          Fuel Theft
                        </div>
                      </div>
                    )}

                    {isFuelAnomaly && (
                      <div className="relative z-20 rounded-[6px] border border-[#c2410c] bg-[#f97316] px-3 py-1">
                        <div className="whitespace-nowrap text-center text-[11px] font-extrabold leading-none tracking-[0.02em] text-white">
                          Fuel Anomaly
                        </div>
                      </div>
                    )}
                  </div>
                </OverlayView>
              );
            })()}
          </React.Fragment>
        );
      })}

      {/* 3. Historical Path for Selected Vehicle */}
      {selectedVehicle &&
        selectedVehicle.lastTripStatus !== "On Trip" &&
        polylinePath.length > 1 && (
          <Polyline path={polylinePath} options={polylineOptions} />
        )}
    </GoogleMapComponent>
  );
};

export default GoogleMap;
