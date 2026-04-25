import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG } from '../../../config/mapConfig';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom vehicle icon
const createVehicleIcon = (isSelected, heading = 0) => {
    return L.divIcon({
        className: 'vehicle-marker-leaflet',
        html: `<div class="vehicle-icon-wrapper" style="
                   width: ${isSelected ? '50px' : '39px'}; 
                   height: ${isSelected ? '50px' : '20px'}; 
                   pointer-events: auto;
                   cursor: pointer;">
                 <img src="${isSelected ? '/assets/selected-vehicle.png' : '/assets/dp.png'}" 
                      style="width: 100%; 
                             height: 100%; 
                             transform: rotate(${heading}deg);
                             pointer-events: none;" />
               </div>`,
        iconSize: isSelected ? [50, 50] : [39, 20],
        iconAnchor: isSelected ? [25, 25] : [19.5, 10],
    });
};

// Component to handle map view changes
const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

// Individual vehicle marker component
const VehicleMarker = ({ vehicle, isSelected, onVehicleClick, onVehicleHover, onVehicleLeave }) => {
    const markerRef = useRef(null);

    useEffect(() => {
        const marker = markerRef.current;
        if (marker) {
            const element = marker.getElement();
            if (element) {
                // Add click handler directly to element to ensure it works
                const handleClick = (e) => {
                    e.stopPropagation();
                    console.log('Marker clicked:', vehicle.name);
                    if (onVehicleClick) onVehicleClick(vehicle);
                };

                const handleMouseEnter = (e) => {
                    const rect = element.getBoundingClientRect();
                    if (onVehicleHover) {
                        onVehicleHover(vehicle, {
                            x: rect.left + rect.width / 2,
                            y: rect.top
                        });
                    }
                };

                const handleMouseLeave = () => {
                    if (onVehicleLeave) onVehicleLeave();
                };

                element.addEventListener('click', handleClick);
                element.addEventListener('mouseenter', handleMouseEnter);
                element.addEventListener('mouseleave', handleMouseLeave);

                return () => {
                    element.removeEventListener('click', handleClick);
                    element.removeEventListener('mouseenter', handleMouseEnter);
                    element.removeEventListener('mouseleave', handleMouseLeave);
                };
            }
        }
    }, [vehicle, onVehicleClick, onVehicleHover, onVehicleLeave]);

    return (
        <Marker
            ref={markerRef}
            position={[vehicle.lat, vehicle.lng]}
            icon={createVehicleIcon(isSelected, vehicle.heading)}
        />
    );
};

const MapSatellite = ({
    vehicles = [],
    selectedVehicle,
    onVehicleClick,
    onVehicleHover,
    onVehicleLeave,
    center = [-5.135, 119.423], // [lat, lng] for Leaflet
    zoom = 12,
    className = '',
    style = {}
}) => {
    // Prepare polyline coordinates if selected vehicle has path
    const polylinePositions = selectedVehicle?.path?.length > 1
        ? selectedVehicle.path.map(point => [point[0], point[1]]) // [lat, lng]
        : [];

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className={`w-full h-full rounded-lg ${className}`}
            style={{ minHeight: '400px', ...style }}
            zoomControl={true}
        >
            {/* Google Maps Satellite Tiles via Proxy (no CORS issue) */}
            <TileLayer
                url={MAP_CONFIG.tileLayers.googleSatellite.url}
                attribution={MAP_CONFIG.tileLayers.googleSatellite.attribution}
                maxZoom={MAP_CONFIG.tileLayers.googleSatellite.maxZoom}
                tileSize={MAP_CONFIG.tileLayers.googleSatellite.tileSize}
            />

            <MapController center={center} zoom={zoom} />

            {/* Vehicle Markers */}
            {vehicles.map(vehicle => (
                <VehicleMarker
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedVehicle?.id === vehicle.id}
                    onVehicleClick={onVehicleClick}
                    onVehicleHover={onVehicleHover}
                    onVehicleLeave={onVehicleLeave}
                />
            ))}

            {/* Polyline for selected vehicle path */}
            {polylinePositions.length > 1 && (
                <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                        color: '#74CD25',
                        weight: 4,
                        opacity: 0.9
                    }}
                />
            )}
        </MapContainer>
    );
};

export default MapSatellite;
