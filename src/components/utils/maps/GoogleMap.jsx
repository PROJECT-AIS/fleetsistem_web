// components/GoogleMap.jsx
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleMap as GoogleMapComponent, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6myHzS10YXdcazAFalmXvDkrYCp5cLc8';

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

    const onLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
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
            }
        }
    }, [selectedVehicle]);

    // Create marker icon
    const createMarkerIcon = useCallback((isSelected, heading = 0) => {
        if (!window.google) return null;

        return {
            url: isSelected ? '/assets/selected-vehicle.png' : '/assets/dp.png',
            scaledSize: isSelected
                ? new window.google.maps.Size(50, 50)
                : new window.google.maps.Size(39, 20),
            anchor: isSelected
                ? new window.google.maps.Point(25, 25)
                : new window.google.maps.Point(19.5, 10),
            rotation: heading
        };
    }, []);

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
