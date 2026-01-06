import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MapCN = ({
    vehicles = [],
    selectedVehicle,
    onVehicleClick,
    onVehicleHover,
    onVehicleLeave,
    center = [119.423, -5.135], // [lng, lat]
    zoom = 12,
    className = '',
    style = {}
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef({});

    // Initialize map once
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    'osm': {
                        type: 'raster',
                        tiles: [
                            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors'
                    }
                },
                layers: [
                    {
                        id: 'osm-layer',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 19
                    }
                ],
                glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
            },
            center: center,
            zoom: zoom
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-left');

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update markers
    useEffect(() => {
        if (!map.current) return;

        // Clear all existing markers
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        // Create markers for each vehicle
        vehicles.forEach(vehicle => {
            const isSelected = selectedVehicle && selectedVehicle.id === vehicle.id;

            // Create marker element
            const el = document.createElement('div');
            el.className = 'vehicle-marker-cn';
            el.style.cssText = 'cursor: pointer; z-index: 10;';

            const img = document.createElement('img');
            img.src = isSelected ? '/assets/selected-vehicle.png' : '/assets/dp.png';
            img.style.cssText = `
        width: ${isSelected ? '50px' : '39px'};
        height: ${isSelected ? '50px' : '20px'};
        transform: rotate(${vehicle.heading || 0}deg);
        pointer-events: none;
      `;
            el.appendChild(img);

            // Bind events directly with vehicle data captured in closure
            el.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Marker clicked:', vehicle.name);
                if (onVehicleClick) {
                    onVehicleClick(vehicle);
                }
            };

            el.onmouseenter = function () {
                const rect = el.getBoundingClientRect();
                if (onVehicleHover) {
                    onVehicleHover(vehicle, {
                        x: rect.left + rect.width / 2,
                        y: rect.top
                    });
                }
            };

            el.onmouseleave = function () {
                if (onVehicleLeave) {
                    onVehicleLeave();
                }
            };

            // Create and add marker
            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat([vehicle.lng, vehicle.lat])
                .addTo(map.current);

            markersRef.current[vehicle.id] = marker;
        });
    }, [vehicles, selectedVehicle, onVehicleClick, onVehicleHover, onVehicleLeave]);

    // Draw polyline for selected vehicle
    useEffect(() => {
        if (!map.current) return;

        const drawRoute = () => {
            // Remove existing route
            try {
                if (map.current.getLayer('route-line')) {
                    map.current.removeLayer('route-line');
                }
                if (map.current.getSource('route')) {
                    map.current.removeSource('route');
                }
            } catch (e) {
                // Ignore errors if layer/source doesn't exist
            }

            // Add route if vehicle is selected and has path
            if (selectedVehicle && Array.isArray(selectedVehicle.path) && selectedVehicle.path.length > 1) {
                const coordinates = selectedVehicle.path.map(point => [point[1], point[0]]);

                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }
                });

                map.current.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#74CD25',
                        'line-width': 4,
                        'line-opacity': 0.9
                    }
                });
            }
        };

        if (map.current.isStyleLoaded()) {
            drawRoute();
        } else {
            map.current.once('load', drawRoute);
        }
    }, [selectedVehicle]);

    return (
        <div
            ref={mapContainer}
            className={`w-full h-full rounded-lg ${className}`}
            style={{ minHeight: '400px', ...style }}
        />
    );
};

export default MapCN;
