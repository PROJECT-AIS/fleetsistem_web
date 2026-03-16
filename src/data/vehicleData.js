/**
 * Vehicle dummy data for development
 * This should be replaced with actual API calls in production
 */

// GPS path data for vehicle tracking
export const GPS_PATH_DEFAULT = [
  [-5.132132, 119.500958],
  [-5.133734, 119.504865],
  [-5.135291, 119.506632],
  [-5.136228, 119.507596],
  [-5.137361, 119.511503],
  [-5.137361, 119.51211],
  [-5.137482, 119.51541],
  [-5.138291, 119.517625],
  [-5.139099, 119.519506],
  [-5.14089, 119.520986],
  [-5.141706, 119.521623],
];

// Default fuel consumption data
export const DEFAULT_FUEL_DATA = [
  { time: '00:00', value: 20 },
  { time: '10:00', value: 35 },
  { time: '12:00', value: 30 },
  { time: '13:00', value: 40 },
  { time: '14:00', value: 25 },
];

// Default weekly fuel data
export const DEFAULT_WEEKLY_FUEL = [
  { day: 'Sen', value: 30 },
  { day: 'Sel', value: 40 },
  { day: 'Rab', value: 35 },
  { day: 'Kam', value: 50 },
  { day: 'Jum', value: 45 },
  { day: 'Sab', value: 38 },
  { day: 'Min', value: 42 },
];

// ========== NEW DASHBOARD DUMMY DATA ==========

// Status Device stats
export const STATUS_DEVICE = {
  total: 25,
  on: 15,
  lossCoordinate: 5,
  off: 5,
};

// Status Alat stats
export const STATUS_ALAT = {
  total: 25,
  on: 15,
  passive: 5,
  off: 5,
};

// Total Produksi items
export const TOTAL_PRODUKSI = [
  { label: 'OB - Disposal', value: 10000 },
  { label: 'LIM ORE - Stockpile', value: 10000 },
  { label: 'LIM ORE - Barge', value: 10000 },
  { label: 'SAP ORE - Stockpile', value: 10000 },
  { label: 'SAP ORE - Barge', value: 10000 },
];

// Konsumsi BBM
export const KONSUMSI_BBM = 30000;

/**
 * Generate vehicle data with dynamic position
 * @param {Array} lastGps - Last GPS position [lat, lng]
 * @param {number} heading - Computed heading in degrees
 * @param {Array} gpsPath - Full GPS path array
 * @returns {Array} Array of vehicle objects
 */
export function generateVehicleData(lastGps, heading, gpsPath) {
  return [
    {
      id: 1,
      lat: lastGps[0],
      lng: lastGps[1],
      status: "online",
      type: "excavator",
      name: "Excavator D",
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=150&h=100&fit=crop",
      lastLocation: "Site A",
      fuelLevel: 85,
      distance: "2.5 KM",
      time: "08:30",
      heading: heading,
      path: gpsPath,
      operatorName: "Pak Gun",
      operatorId: "OP-001",
      jabatan: "Senior Operator",
      divisi: "Heavy Equipment",
      plateNumber: "DD 1234 AB",
      fuelData: DEFAULT_FUEL_DATA,
      weeklyFuel: DEFAULT_WEEKLY_FUEL,
    },
    {
      id: 2,
      lat: -5.145,
      lng: 119.433,
      status: "online",
      type: "dump_truck",
      name: "Dump Truck C",
      image: "https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?q=80&w=1548&auto=format&fit=crop",
      lastLocation: "Site B",
      fuelLevel: 92,
      distance: "1.8 KM",
      time: "09:15",
      heading: 240,
      operatorName: "Pak Budi",
      operatorId: "OP-002",
      jabatan: "Driver",
      divisi: "Transportation",
      plateNumber: "DD 5678 CD",
      fuelData: [
        { time: '00:00', value: 15 },
        { time: '10:00', value: 28 },
        { time: '12:00', value: 25 },
        { time: '13:00', value: 32 },
        { time: '14:00', value: 20 },
      ],
      weeklyFuel: [
        { day: 'Sen', value: 25 },
        { day: 'Sel', value: 32 },
        { day: 'Rab', value: 28 },
        { day: 'Kam', value: 40 },
        { day: 'Jum', value: 38 },
        { day: 'Sab', value: 30 },
        { day: 'Min', value: 35 },
      ],
    },
    {
      id: 3,
      lat: -5.125,
      lng: 119.413,
      status: "offline",
      type: "dump_truck",
      name: "Dump Truck A",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1740&auto=format&fit=crop",
      lastLocation: "Site C",
      fuelLevel: 45,
      distance: "5.2 KM",
      time: "07:45",
      heading: 130,
      operatorName: "Pak Andi",
      operatorId: "OP-003",
      jabatan: "Driver",
      divisi: "Transportation",
      plateNumber: "DD 9012 EF",
      fuelData: [
        { time: '00:00', value: 10 },
        { time: '10:00', value: 18 },
        { time: '12:00', value: 15 },
        { time: '13:00', value: 22 },
        { time: '14:00', value: 12 },
      ],
      weeklyFuel: [
        { day: 'Sen', value: 12 },
        { day: 'Sel', value: 18 },
        { day: 'Rab', value: 15 },
        { day: 'Kam', value: 20 },
        { day: 'Jum', value: 17 },
        { day: 'Sab', value: 14 },
        { day: 'Min', value: 19 },
      ],
    },
    {
      id: 4,
      lat: -5.155,
      lng: 119.443,
      status: "online",
      type: "car",
      name: "Vehicle 004",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=150&h=100&fit=crop",
      lastLocation: "Site D",
      fuelLevel: 78,
      distance: "3.1 KM",
      time: "08:00",
      heading: 20,
      operatorName: "Pak Dedi",
      operatorId: "OP-004",
      jabatan: "Supervisor",
      divisi: "Management",
      plateNumber: "DD 3456 GH",
      fuelData: [
        { time: '00:00', value: 25 },
        { time: '10:00', value: 30 },
        { time: '12:00', value: 28 },
        { time: '13:00', value: 35 },
        { time: '14:00', value: 27 },
      ],
      weeklyFuel: [
        { day: 'Sen', value: 28 },
        { day: 'Sel', value: 33 },
        { day: 'Rab', value: 29 },
        { day: 'Kam', value: 36 },
        { day: 'Jum', value: 32 },
        { day: 'Sab', value: 27 },
        { day: 'Min', value: 31 },
      ],
    },
    {
      id: 5,
      lat: -5.165,
      lng: 119.453,
      status: "online",
      type: "truck",
      name: "Vehicle 005",
      image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=928&auto=format&fit=crop",
      lastLocation: "Site E",
      fuelLevel: 67,
      distance: "4.3 KM",
      time: "08:45",
      heading: 310,
      operatorName: "Pak Eko",
      operatorId: "OP-005",
      jabatan: "Driver",
      divisi: "Logistics",
      plateNumber: "DD 7890 IJ",
      fuelData: [
        { time: '00:00', value: 18 },
        { time: '10:00', value: 22 },
        { time: '12:00', value: 20 },
        { time: '13:00', value: 26 },
        { time: '14:00', value: 19 },
      ],
      weeklyFuel: [
        { day: 'Sen', value: 20 },
        { day: 'Sel', value: 25 },
        { day: 'Rab', value: 22 },
        { day: 'Kam', value: 28 },
        { day: 'Jum', value: 24 },
        { day: 'Sab', value: 21 },
        { day: 'Min', value: 23 },
      ],
    },
  ];
}

// Dashboard stats data (legacy - kept for compatibility)
export const DASHBOARD_STATS = {
  total: 25,
  online: 15,
  offline: 5,
  lossCoordinate: 5,
};

export default {
  GPS_PATH_DEFAULT,
  DEFAULT_FUEL_DATA,
  DEFAULT_WEEKLY_FUEL,
  generateVehicleData,
  DASHBOARD_STATS,
  STATUS_DEVICE,
  STATUS_ALAT,
  TOTAL_PRODUKSI,
  KONSUMSI_BBM,
};
