import React, { useState, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import IconBang from "/assets/Iconimage.png";
import PageLayout from "../../layout/PageLayout";
import FreeMap from '../../utils/maps/FreeMap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computeBearing } from "../../../utils/mapUtils";
import { GPS_PATH_DEFAULT, generateVehicleData, DASHBOARD_STATS } from "../../../data/vehicleData";

// Memoized StatCard
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

// Memoized VehicleTooltip
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

// Memoized Vehicle Charts
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

// Detail Row Component for expandable section
const DetailRow = React.memo(({ label, value, onEdit }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#5A5B5D] last:border-b-0">
    <div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="text-xs text-gray-400">{value}</div>
    </div>
    {onEdit && (
      <button
        className="text-sm text-[#74CD25] hover:text-[#8FE040] transition font-medium"
        onClick={onEdit}
      >
        Edit
      </button>
    )}
  </div>
));

// Memoized Sidebar Card with expandable detail
const VehicleSidebarCard = React.memo(({ vehicle, onClose, isExpanded, onToggleExpand }) => (
  <div className="rounded-xl shadow-lg overflow-hidden bg-[#4A4B4D]">
    <div className="bg-[#5A5B5D] px-5 py-3">
      <h3 className="text-lg font-bold text-white">Cars</h3>
    </div>
    <div className="p-5 relative">
      {/* Navigation Arrows */}
      <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-6 h-6 rounded-full bg-[#343538] text-gray-400 hover:text-white flex items-center justify-center shadow">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-6 h-6 rounded-full bg-[#343538] text-gray-400 hover:text-white flex items-center justify-center shadow">
        <ChevronRight className="w-4 h-4" />
      </button>

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

      {/* Expanded Detail Section */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-[#5A5B5D] pt-4">
          <DetailRow
            label="Nama Operator"
            value={vehicle.operatorName || "Pak Gun"}
            onEdit={() => console.log('Edit Nama Operator')}
          />
          <DetailRow
            label="ID Operator"
            value={vehicle.operatorId || "XXXXXX-1"}
            onEdit={() => console.log('Edit ID Operator')}
          />
          <DetailRow
            label="Jabatan"
            value={vehicle.jabatan || "Lorem Ipsum"}
            onEdit={() => console.log('Edit Jabatan')}
          />
          <DetailRow
            label="Divisi"
            value={vehicle.divisi || "Lorem Ipsum"}
            onEdit={() => console.log('Edit Divisi')}
          />
          <DetailRow
            label="Nomor Plat"
            value={vehicle.plateNumber || "Lorem Ipsum"}
            onEdit={() => console.log('Edit Nomor Plat')}
          />
        </div>
      </div>

      {/* Toggle Button */}
      <div className="flex justify-center mt-4">
        <button
          className="w-10 h-10 rounded-full bg-[#343538] text-[#74CD25] hover:bg-[#5A5B5D] transition flex items-center justify-center shadow"
          onClick={onToggleExpand}
          title={isExpanded ? "Tutup Detail" : "Lihat Detail"}
        >
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
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
  const gpsPath = useMemo(() => GPS_PATH_DEFAULT, []);

  const lastGps = gpsPath[gpsPath.length - 1];
  const prevGps = gpsPath[gpsPath.length - 2] || lastGps;
  const computedHeading = useMemo(() =>
    Math.round(computeBearing(prevGps[0], prevGps[1], lastGps[0], lastGps[1])),
    [prevGps, lastGps]
  );

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // Memoized vehicle data
  const vehicleData = useMemo(() =>
    generateVehicleData(lastGps, computedHeading, gpsPath),
    [lastGps, computedHeading, gpsPath]
  );

  const tripHistory = useMemo(() => gpsPath.map((point, idx) => ({
    id: idx + 1,
    location: `Lat: ${point[0].toFixed(6)}, Lng: ${point[1].toFixed(6)}`,
    time: `Titik #${idx + 1}`,
    status: "completed",
  })), [gpsPath]);

  // Stable callback handlers using useCallback
  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle(prev => {
      if (prev && prev.id === vehicle.id) {
        return null;
      }
      setIsDetailExpanded(false); // Reset expanded state when switching vehicles
      return vehicle;
    });
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
    setIsDetailExpanded(false); // Reset expanded state when closing
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsDetailExpanded(prev => !prev);
  }, []);

  return (
    <PageLayout className="p-6">
      <div className="flex gap-6">
        <div className="flex-1">
          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <StatCard icon={<CachedIcon />} value={DASHBOARD_STATS.total} label="Total" />
            </div>
            <div className="flex-1">
              <StatCard icon={<CachedIcon />} value={DASHBOARD_STATS.online} label="ON" />
            </div>
            <div className="flex-1">
              <StatCard icon={<CachedIcon />} value={DASHBOARD_STATS.offline} label="OFF" />
            </div>
            <div className="flex-1">
              <StatCard icon={<CachedIcon />} value={DASHBOARD_STATS.lossCoordinate} label="Loss Coordinate" />
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
              isExpanded={isDetailExpanded}
              onToggleExpand={handleToggleExpand}
            />
            <TripHistoryCard tripHistory={tripHistory} />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {hoveredVehicle && (
        <VehicleTooltip vehicle={hoveredVehicle} position={hoverPosition} />
      )}
    </PageLayout>
  );
};

export default HomeScreen;