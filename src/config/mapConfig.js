/**
 * Map configuration constants
 */

export const MAP_CONFIG = {
  // Default center point (Makassar, Indonesia)
  defaultCenter: [-5.14, 119.43],
  defaultZoom: 13,
  
  // Zoom limits
  minZoom: 11,
  maxZoom: 17,
  
  // Tile layer URLs
  tileLayers: {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles © Esri',
      maxZoom: 18,
    },
    labels: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 19,
      opacity: 0.8,
    },
    osm: {
      urls: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      attribution: '© OpenStreetMap contributors',
      tileSize: 256,
    },
  },
  
  // Polyline styles
  polylineStyle: {
    color: '#74CD25',
    weight: 4,
    opacity: 0.9,
  },
  
  // Marker icon sizes
  markerSize: {
    default: [39, 20],
    selected: [50, 50],
  },
};

export default MAP_CONFIG;
