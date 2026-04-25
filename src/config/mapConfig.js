/**
 * Map configuration constants
 */

export const GOOGLE_MAPS_API_KEY = 'AIzaSyAcm-7sXCOMDgcP6YCH2cG_vWK4EfiP5ac';

export const MAP_CONFIG = {
  // Default center point (Makassar, Indonesia)
  defaultCenter: [-5.14, 119.43],
  defaultZoom: 13,
  
  // Zoom limits
  minZoom: 11,
  maxZoom: 17,
  
  // Tile layer URLs
  tileLayers: {
    // Google Maps Satellite via proxy (bypasses CORS)
    googleSatellite: {
      url: `/google-tiles/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m1!1e1!2m3!1e0!2sm!3i772536552!3m17!2sen!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmapSatellite!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2zcy50OjJ8cy5lOmx8cC52Om9mZixzLnQ6MzN8cC52Om9mZixzLnQ6Mzd8cC52Om9mZixzLnQ6MzR8cC52Om9mZixzLnQ6MzZ8cC52Om9mZixzLnQ6Mzh8cC52Om9mZixzLnQ6MzV8cC52Om9mZixzLnQ6Mzl8cC52Om9mZixzLnQ6NHxzLmU6bC5pfHAudjpvZmY!4e0!5m2!1e3!5f2&key=${GOOGLE_MAPS_API_KEY}`,
      attribution: '© Google Maps',
      maxZoom: 20,
      tileSize: 256,
    },
    // ESRI Fallback
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
