import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Menu, Users, Clock, Car, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IconBang from "/assets/Iconimage.png";
import SideBar from "../../utils/sidebar/SideBar";
import Header from '../../utils/Header';
import FreeMap from '../../utils/maps/FreeMap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Util: hitung bearing (derajat 0-360) dari dua titik lat/lng
function computeBearing(fromLat, fromLng, toLat, toLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const phi1 = toRad(fromLat);
  const phi2 = toRad(toLat);
  const dLambda = toRad(toLng - fromLng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda) - Math.sin(phi1) * Math.sin(phi2);
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;
  return brng;
}

// Memoized StatCard - defined outside HomeScreen
const StatCard = React.memo(({ icon, value, label }) => (
  <div
    className="p-4 rounded-lg flex items-center space-x-3"
    style={{ backgroundColor: "#343538" }}
  >
    <div className="p-2 rounded">
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  </div>
));

// Cached icon component to prevent re-renders
const CachedIcon = React.memo(() => (
  <img src={IconBang} alt="Bang" className="w-10 h-10" />
));

// Memoized VehicleTooltip - defined outside HomeScreen
const VehicleTooltip = React.memo(({ vehicle, position }) => {
  const cardWidth = 220;
  const cardHeight = 100;
  const markerAnchorY = 41;
  return (
    <div
      className="fixed z-[1000] pointer-events-none"
      style={{
        left: position.x - cardWidth / 2,
        top: position.y - cardHeight + markerAnchorY - 100,
        width: cardWidth,
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden relative pointer-events-none">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="w-full h-[60px] object-cover rounded-t-xl bg-gray-200 pointer-events-none"
          loading="lazy"
        />
        <div className="p-3 pb-6 pointer-events-none">
          <div className="font-bold text-black text-sm">{vehicle.name}</div>
          <div className="text-xs text-gray-500 mb-1">No. Plat</div>
          <span className={`absolute right-3 bottom-3 px-3 py-0.5 rounded-full ${vehicle.status === 'online' ? 'bg-[#74CD25] text-white' : 'bg-red-500 text-white'} text-white font-semibold shadow text-xs pointer-events-none`}>
            {vehicle.status === "online" ? "Online" : "Offline"}
          </span>
        </div>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white pointer-events-none"></div>
      </div>
    </div>
  );
});

const VehicleCharts = React.memo(({ fuelData, weeklyFuel }) => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div className="rounded-lg p-4" style={{ backgroundColor: "#343538" }}>
      <h3 className="text-lg font-semibold mb-2">Volume Bahan Bakar Realtime</h3>
      <div className="text-sm text-gray-400">Kamis, 29/05/2025</div>
      <div className="mt-4 h-32 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={fuelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 10 }} />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ r: 4, fill: "#74CD25" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="rounded-lg p-4" style={{ backgroundColor: "#343538" }}>
      <h3 className="text-lg font-semibold mb-2">Konsumsi Bahan Bakar</h3>
      <div className="text-sm text-gray-400">Per Minggu</div>
      <div className="mt-4 h-32 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={weeklyFuel}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="day" tick={{ fill: "#aaa", fontSize: 10 }} />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ r: 4, fill: "#74CD25" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
));

// Memoized Sidebar Card
const VehicleSidebarCard = React.memo(({ vehicle, onClose, onDetail }) => (
  <div className="rounded-xl shadow-lg overflow-hidden bg-[#4A4B4D]">
    <div className="bg-[#5A5B5D] px-5 py-3">
      <h3 className="text-lg font-bold text-white">Cars</h3>
    </div>
    <div className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <div className="text-xl font-bold text-[#74CD25] mb-3">{vehicle.name}</div>
          <div className="text-lg font-bold text-white mb-1">135 KM/H</div>
          <div className="text-xs text-gray-400 mb-3">Speed</div>
          <div className="text-lg font-bold text-white mb-1">486 KM</div>
          <div className="text-xs text-gray-400 mb-3">Jarak</div>
          <div className="text-lg font-bold text-white mb-1">20 L</div>
          <div className="text-xs text-gray-400">Kapasitas</div>
        </div>
        <div className="relative">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-28 h-24 object-cover rounded-lg shadow-md"
            loading="lazy"
          />
          <button
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition flex items-center justify-center"
            onClick={onClose}
            title="Tutup"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button
          className="text-sm text-gray-300 hover:text-white transition underline"
          onClick={onDetail}
        >
          Detail
        </button>
      </div>
    </div>
  </div>
));

// Memoized Trip History Card
const TripHistoryCard = React.memo(({ tripHistory }) => (
  <div className="rounded-xl shadow-lg overflow-hidden bg-[#4A4B4D]">
    <div className="bg-[#5A5B5D] px-5 py-3">
      <h3 className="text-lg font-bold text-white">Last Trip</h3>
    </div>
    <div className="p-5">
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {tripHistory.map((trip, idx) => (
          <div key={trip.id + idx} className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#74CD25] flex-shrink-0"></div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{trip.location}</div>
              <div className="text-xs text-gray-400">{trip.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

const HomeScreen = () => {
  // GPS path data - memoized
  const gpsPath = useMemo(() => [
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
  ], []);

  const lastGps = gpsPath[gpsPath.length - 1];
  const prevGps = gpsPath[gpsPath.length - 2] || lastGps;
  const computedHeading = useMemo(() =>
    Math.round(computeBearing(prevGps[0], prevGps[1], lastGps[0], lastGps[1])),
    [prevGps, lastGps]
  );

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Memoized vehicle data
  const vehicleData = useMemo(() => [
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
      heading: computedHeading,
      path: gpsPath,
      fuelData: [
        { time: '00:00', value: 20 },
        { time: '10:00', value: 35 },
        { time: '12:00', value: 30 },
        { time: '13:00', value: 40 },
        { time: '14:00', value: 25 },
      ],
      weeklyFuel: [
        { day: 'Sen', value: 30 },
        { day: 'Sel', value: 40 },
        { day: 'Rab', value: 35 },
        { day: 'Kam', value: 50 },
        { day: 'Jum', value: 45 },
        { day: 'Sab', value: 38 },
        { day: 'Min', value: 42 },
      ],
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
  ], [lastGps, computedHeading, gpsPath]);

  const tripHistory = useMemo(() => gpsPath.map((point, idx) => ({
    id: idx + 1,
    location: `Lat: ${point[0].toFixed(6)}, Lng: ${point[1].toFixed(6)}`,
    time: `Titik #${idx + 1}`,
    status: "completed",
  })), [gpsPath]);

  const stats = useMemo(() => ({
    total: 25,
    online: 15,
    offline: 5,
    lossCoordinate: 5,
  }), []);

  // Stable callback handlers using useCallback
  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle(prev =>
      prev && prev.id === vehicle.id ? null : vehicle
    );
  }, []);

  const handleVehicleHover = useCallback((vehicle, position) => {
    setHoveredVehicle(vehicle);
    setHoverPosition(position);
  }, []);

  const handleVehicleLeave = useCallback(() => {
    setHoveredVehicle(null);
  }, []);

  const handleCloseVehicle = useCallback(() => {
    setSelectedVehicle(null);
  }, []);

  const handleDetailClick = useCallback(() => {
    if (selectedVehicle) {
      navigate(`/vehicle/${selectedVehicle.id}`);
    }
  }, [selectedVehicle, navigate]);

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#1E1F22" }}
    >
      <Header />

      <div className="flex">
        <SideBar />

        <div className="flex-1 p-6">
          <div className="flex gap-6">
            <div className="flex-1">
              {/* Stats */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <StatCard icon={<CachedIcon />} value={stats.total} label="Total" />
                </div>
                <div className="flex-1">
                  <StatCard icon={<CachedIcon />} value={stats.online} label="ON" />
                </div>
                <div className="flex-1">
                  <StatCard icon={<CachedIcon />} value={stats.offline} label="OFF" />
                </div>
                <div className="flex-1">
                  <StatCard icon={<CachedIcon />} value={stats.lossCoordinate} label="Loss Coordinate" />
                </div>
              </div>

              {/* Map */}
              <div
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: "#343538" }}
              >
                <div className={selectedVehicle ? "h-[500px] rounded overflow-hidden transition-all duration-500" : "h-[600px] rounded overflow-hidden transition-all duration-500 w-full"}>
                  <FreeMap
                    vehicles={vehicleData}
                    selectedVehicle={selectedVehicle}
                    onVehicleClick={handleVehicleClick}
                    onVehicleHover={handleVehicleHover}
                    onVehicleLeave={handleVehicleLeave}
                  />
                </div>
                {selectedVehicle && (
                  <VehicleCharts
                    fuelData={selectedVehicle.fuelData}
                    weeklyFuel={selectedVehicle.weeklyFuel}
                  />
                )}
              </div>
            </div>

            {/* Sidebar */}
            {selectedVehicle && (
              <div key={selectedVehicle.id} className="w-80 space-y-4 animate-fade-in-right relative">
                <VehicleSidebarCard
                  vehicle={selectedVehicle}
                  onClose={handleCloseVehicle}
                  onDetail={handleDetailClick}
                />
                <TripHistoryCard tripHistory={tripHistory} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredVehicle && (
        <VehicleTooltip vehicle={hoveredVehicle} position={hoverPosition} />
      )}

      <style>{`
        .animate-fade-in-right {
          animation: fadeInRight 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;