import React, { useState, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import IconBang from "/assets/Iconimage.png";
import PageLayout from "../../layout/PageLayout";
import GoogleMap from '../../utils/maps/GoogleMap';
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
// Custom tooltip component for charts
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#2A2B2D] border border-[#74CD25] rounded-lg px-4 py-3 shadow-xl">
        <p className="text-[#74CD25] font-bold text-lg mb-1">{payload[0].value} L</p>
        <p className="text-gray-300 text-sm">{label}</p>
      </div>
    );
  }
  return null;
};

const VehicleCharts = React.memo(({ fuelData, weeklyFuel }) => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    {/* Volume Bahan Bakar Realtime */}
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: "#4A4B4D" }}>
      <div className="bg-[#5A5B5D] px-5 py-3">
        <h3 className="text-lg font-bold text-white">Volume Bahan Bakar Realtime</h3>
      </div>
      <div className="p-5">
        <div className="text-sm text-gray-400 mb-2">Kamis, 29/05/2025</div>
        <div className="h-32 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 10 }} />
              <YAxis hide />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#74CD25', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ fill: "#74CD25", r: 4 }} activeDot={{ r: 6, fill: "#74CD25", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* Konsumsi Bahan Bakar */}
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: "#4A4B4D" }}>
      <div className="bg-[#5A5B5D] px-5 py-3">
        <h3 className="text-lg font-bold text-white">Konsumsi Bahan Bakar</h3>
      </div>
      <div className="p-5">
        <div className="text-sm text-gray-400 mb-2">Per Minggu</div>
        <div className="h-32 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={weeklyFuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" tick={{ fill: "#aaa", fontSize: 10 }} />
              <YAxis hide />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#74CD25', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ fill: "#74CD25", r: 4 }} activeDot={{ r: 6, fill: "#74CD25", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
const VehicleSidebarCard = React.memo(({ vehicle, onClose, isExpanded, onToggleExpand, onPrev, onNext, canGoPrev, canGoNext }) => (
  <div className="rounded-xl shadow-lg overflow-visible bg-[#4A4B4D] relative">
    {/* Header with Close Button */}
    <div className="bg-[#5A5B5D] px-5 py-3 flex items-center justify-between rounded-t-xl">
      <h3 className="text-lg font-bold text-white">Cars</h3>
      <button
        className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
        onClick={onClose}
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="p-5">
      {/* Navigation Arrows - Positioned outside the card */}
      <button
        className={`absolute -left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10 ${canGoPrev
          ? 'bg-gradient-to-r from-[#74CD25] to-[#5fa01c] text-white hover:shadow-[0_0_15px_rgba(116,205,37,0.5)] hover:scale-110 cursor-pointer'
          : 'bg-[#343538] text-gray-600 cursor-not-allowed opacity-50'
          }`}
        onClick={onPrev}
        disabled={!canGoPrev}
        title="Previous Vehicle"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        className={`absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10 ${canGoNext
          ? 'bg-gradient-to-r from-[#74CD25] to-[#5fa01c] text-white hover:shadow-[0_0_15px_rgba(116,205,37,0.5)] hover:scale-110 cursor-pointer'
          : 'bg-[#343538] text-gray-600 cursor-not-allowed opacity-50'
          }`}
        onClick={onNext}
        disabled={!canGoNext}
        title="Next Vehicle"
      >
        <ChevronRight className="w-5 h-5" />
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
        </div>
      </div>

      {/* Expanded Detail Section */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-[#5A5B5D] pt-4">
          <DetailRow
            label="Nama Operator"
            value={vehicle.operatorName || "Pak Gun"}
          />
          <DetailRow
            label="ID Operator"
            value={vehicle.operatorId || "XXXXXX-1"}
          />
          <DetailRow
            label="Jabatan"
            value={vehicle.jabatan || "Lorem Ipsum"}
          />
          <DetailRow
            label="Divisi"
            value={vehicle.divisi || "Lorem Ipsum"}
          />
          <DetailRow
            label="Nomor Plat"
            value={vehicle.plateNumber || "Lorem Ipsum"}
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

  // Navigation handlers for cycling through vehicles
  const currentVehicleIndex = useMemo(() => {
    if (!selectedVehicle) return -1;
    return vehicleData.findIndex(v => v.id === selectedVehicle.id);
  }, [selectedVehicle, vehicleData]);

  const handlePrevVehicle = useCallback(() => {
    if (currentVehicleIndex > 0) {
      setSelectedVehicle(vehicleData[currentVehicleIndex - 1]);
      setIsDetailExpanded(false);
    }
  }, [currentVehicleIndex, vehicleData]);

  const handleNextVehicle = useCallback(() => {
    if (currentVehicleIndex < vehicleData.length - 1) {
      setSelectedVehicle(vehicleData[currentVehicleIndex + 1]);
      setIsDetailExpanded(false);
    }
  }, [currentVehicleIndex, vehicleData]);

  const canGoPrev = currentVehicleIndex > 0;
  const canGoNext = currentVehicleIndex < vehicleData.length - 1 && currentVehicleIndex >= 0;

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
              <GoogleMap
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
              onPrev={handlePrevVehicle}
              onNext={handleNextVehicle}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
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