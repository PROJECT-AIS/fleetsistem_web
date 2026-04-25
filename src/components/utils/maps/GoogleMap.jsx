// components/GoogleMap.jsx
import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { GoogleMap as GoogleMapComponent, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAcm-7sXCOMDgcP6YCH2cG_vWK4EfiP5ac';

// Map container style
const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.5rem'
};

// Default center (Makassar)
const defaultCenter = {
    lat: -5.14,
    lng: 119.43
};

// Map options for satellite view with POI hidden
const mapOptions = {
    mapTypeId: 'hybrid', // satellite with labels
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    minZoom: 11,
    maxZoom: 18,
    styles: [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.attraction',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.government',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.medical',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.place_of_worship',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.school',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'poi.sports_complex',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
        }
    ]
};

const GoogleMap = ({
    vehicles = [],
    selectedVehicle,
    onVehicleClick,
    onVehicleHover,
    onVehicleLeave
}) => {
    const mapRef = useRef(null);
    const callbacksRef = useRef({ onVehicleClick, onVehicleHover, onVehicleLeave });
    callbacksRef.current = { onVehicleClick, onVehicleHover, onVehicleLeave };

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
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

    // Center map on selected vehicle with smooth animation
    useEffect(() => {
        if (mapRef.current && selectedVehicle) {
            const targetPosition = {
                lat: selectedVehicle.lat,
                lng: selectedVehicle.lng
            };

            // Smoothly pan to the selected vehicle
            mapRef.current.panTo(targetPosition);

            // Optionally zoom in a bit when selecting
            const currentZoom = mapRef.current.getZoom();
            if (currentZoom < 15) {
                mapRef.current.setZoom(15);
                setZoom(15);
            }
        }
    }, [selectedVehicle]);

    // Cache for rotated icons
    const iconCache = useRef({});
    const baseIconsRef = useRef({});
    const [iconsLoadedCount, setIconsLoadedCount] = useState(0);

    // Pre-load base icons
    useEffect(() => {
        const assets = ['/assets/dp.png', '/assets/selected-vehicle.png'];
        assets.forEach(url => {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                baseIconsRef.current[url] = img;
                setIconsLoadedCount(prev => prev + 1);
            };
        });
    }, []);

    // Helper to rotate the icon using canvas
    const getRotatedIcon = useCallback((url, heading = 0) => {
        if (iconsLoadedCount === 0) return url;

        const normalizedHeading = Math.round(heading || 0);
        // Offset: dp.png faces West/Left. Rotate +90 for North.
        const rotationAngle = (normalizedHeading + 90) % 360;

        const cacheKey = `${url}-${normalizedHeading}`;
        if (iconCache.current[cacheKey]) return iconCache.current[cacheKey];

        const baseImg = baseIconsRef.current[url];
        if (baseImg) {
            const size = url.includes('selected') ? { width: 50, height: 50 } : { width: 39, height: 20 };
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const maxDim = 75; // Increased to prevent clipping during rotation
            canvas.width = maxDim;
            canvas.height = maxDim;

            ctx.translate(maxDim / 2, maxDim / 2);
            ctx.rotate((rotationAngle * Math.PI) / 180);
            ctx.drawImage(baseImg, -size.width / 2, -size.height / 2, size.width, size.height);

            const dataUrl = canvas.toDataURL();
            iconCache.current[cacheKey] = dataUrl;
            return dataUrl;
        }

        return url;
    }, [iconsLoadedCount]); // Re-create when icons load

    // Create marker icon
    const createMarkerIcon = useCallback((isSelected, heading = 0) => {
        if (!window.google) return null;

        const iconUrl = isSelected ? '/assets/selected-vehicle.png' : '/assets/dp.png';
        const finalUrl = getRotatedIcon(iconUrl, heading);

        // Calculate zoom scale (Base zoom 15 = 1.0 scale)
        // Zoom levels usually range from 11-18. We'll make it scale reasonably.
        const baseZoom = 15;
        const zoomScale = Math.max(0.4, Math.min(2.0, Math.pow(1.15, zoom - baseZoom)));

        // Restore original visual sizes scaled by zoom
        const baseSize = isSelected ? { w: 80, h: 80  } : { w: 69, h: 69 };
        const scaledW = baseSize.w * zoomScale;
        const scaledH = baseSize.h * zoomScale;

        return {
            url: finalUrl,
            scaledSize: new window.google.maps.Size(scaledW, scaledH),
            anchor: new window.google.maps.Point(scaledW / 2, scaledH / 2),
        };
    }, [getRotatedIcon, zoom]);

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
                y: rect.top
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
        return selectedVehicle.path.map(point => ({
            lat: point[0],
            lng: point[1]
        }));
    }, [selectedVehicle]);

    // Polyline options
    const polylineOptions = useMemo(() => ({
        strokeColor: '#EF4444',
        strokeOpacity: 0.9,
        strokeWeight: 4,
    }), []);

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
            zoom={13}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onZoomChanged={handleZoomChanged}
        >
            {/* Vehicle Markers */}
            {vehicles.map((vehicle) => {
                const isSelected = selectedVehicle?.id === vehicle.id;
                return (
                    <Marker
                        key={vehicle.id}
                        position={{ lat: vehicle.lat, lng: vehicle.lng }}
                        icon={createMarkerIcon(isSelected, vehicle.heading)}
                        onClick={() => handleMarkerClick(vehicle)}
                        onMouseOver={(e) => handleMarkerMouseOver(vehicle, e)}
                        onMouseOut={handleMarkerMouseOut}
                    />
                );
            })}

            {/* Polyline for selected vehicle path */}
            {polylinePath.length > 1 && (
                <Polyline
                    path={polylinePath}
                    options={polylineOptions}
                />
            )}
        </GoogleMapComponent>
    );
};

export default GoogleMap;
