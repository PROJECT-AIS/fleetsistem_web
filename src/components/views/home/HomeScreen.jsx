import React, { useState, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, ChevronDown, Monitor, Wifi, WifiOff, MapPin, Construction, Power, Pause, Truck, Gauge } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import GoogleMap from '../../utils/maps/GoogleMap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computeBearing } from "../../../utils/mapUtils";
import {
  GPS_PATH_DEFAULT,
  generateVehicleData,
  STATUS_DEVICE,
  STATUS_ALAT,
  TOTAL_PRODUKSI,
  KONSUMSI_BBM
} from "../../../data/vehicleData";
import { useMqttContext } from "../../../context/MqttContext";

// Use the icon from assets
const ICON_IMAGE = "/assets/Iconimage.png";

/* ============================================
   STATUS CARD (refined to match screenshot)
   ============================================ */
const StatusCard = React.memo(({ iconType, value, label, colorClass }) => (
  <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/20 bg-transparent transition-all duration-200 hover:bg-white/5 h-full">
    <div className="flex-shrink-0">
      <img src={ICON_IMAGE} alt="icon" className={`w-10 h-8 object-contain ${colorClass}`} style={{ filter: colorClass === 'text-white' ? 'brightness(0) invert(1)' : colorClass === 'text-[#00FF00]' ? 'sepia(1) saturate(100) hue-rotate(90deg)' : colorClass === 'text-[#FFD700]' ? 'sepia(1) saturate(100) hue-rotate(20deg)' : 'sepia(1) saturate(100) hue-rotate(-30deg)' }} />
    </div>
    <div className="flex flex-col justify-center">
      <span className={`text-2xl font-extrabold leading-none ${colorClass}`}>{value}</span>
      <span className={`text-[20px] font-bold tracking-tight uppercase ${colorClass === 'text-white' ? 'text-white/70' : colorClass}`}>{label}</span>
    </div>
  </div>
));

/* ============================================
   STATUS DEVICE PANEL
   ============================================ */
const StatusDevicePanel = React.memo(({ stats }) => (
  <div className="flex-1 bg-[#232426] rounded-3xl p-4 shadow-2xl flex flex-col">
    <div className="flex justify-center -mt-8 mb-4">
      <span className="bg-[#00FF00] text-[#1E1F21] text-lg font-black px-8 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(0,255,0,0.3)]">
        Status Device
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
      <StatusCard value={stats.total} label="Total" colorClass="text-white" />
      <StatusCard value={stats.on} label="ON" colorClass="text-[#00FF00]" />
      <StatusCard value={stats.lossCoordinate} label="Loss Coordinate" colorClass="text-[#FFD700]" />
      <StatusCard value={stats.off} label="OFF" colorClass="text-[#FF0000]" />
    </div>
  </div>
));

/* ============================================
   STATUS ALAT PANEL
   ============================================ */
const StatusAlatPanel = React.memo(({ stats }) => (
  <div className="flex-1 bg-[#232426] rounded-3xl p-4 shadow-2xl flex flex-col">
    <div className="flex justify-center -mt-8 mb-4">
      <span className="bg-[#00FF00] text-[#1E1F21] text-lg font-black px-8 py-1.5 rounded-2xl shadow-[0_0_15px_rgba(0,255,0,0.3)]">
        Status Alat
      </span>
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
      <StatusCard value={stats.total} label="Total" colorClass="text-white" />
      <StatusCard value={stats.on} label="ON" colorClass="text-[#00FF00]" />
      <StatusCard value={stats.passive} label="Passive" colorClass="text-[#FFD700]" />
      <StatusCard value={stats.off} label="OFF" colorClass="text-[#FF0000]" />
    </div>
  </div>
));

/* ============================================
   TOTAL PRODUKSI + KONSUMSI BBM PANEL
   ============================================ */
const ProduksiPanel = React.memo(({ produksiItems, konsumsi }) => (
  <div className="flex gap-4 flex-1 bg-[#E5E7EB] rounded-3xl p-4 text-[#1E1F21] relative overflow-hidden shadow-2xl">
    {/* Top Right Icons */}
    {/* <div className="absolute top-2 right-4 flex items-center gap-3">
       <Truck className="w-7 h-7 text-[#00FF00] fill-current" />
       <Gauge className="w-7 h-7 text-[#00FF00]" />
    </div> */}

    <div className="flex-1 flex flex-col gap-3">
      <div className="flex justify-start">
        <span className="bg-[#1E1F21] text-white text-base font-black px-6 py-1.5 rounded-xl">
          Total produksi
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {produksiItems.map((item, idx) => {
          let valueColor = "bg-[#00FF00]";
          if (item.label.includes("OB")) valueColor = "bg-[#FFBC00]";
          if (item.label.includes("LIM ORE")) valueColor = "bg-[#D92D20]";
          
          return (
            <div key={idx} className="flex items-center">
              <div className="bg-[#1E1F21] text-white text-[11px] font-bold px-4 py-1.5 rounded-l-full flex-1">
                {item.label}
              </div>
              <div className={`${valueColor} text-white text-base font-black px-4 py-1 rounded-r-full min-w-[80px] text-center shadow-inner`}>
                {item.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    <div className="flex flex-col items-center justify-center gap-3 min-w-[130px] pl-3 border-l border-gray-300">
      <div className="flex flex-col items-center">
        <span className="text-sm font-black uppercase text-center leading-tight">Konsumsi<br/>BBM</span>
        <div className="bg-[#00FF00] text-[#1E1F21] text-xl font-black px-3 py-2 rounded-xl mt-2 shadow-lg w-full text-center">
          {konsumsi.toLocaleString()} L
        </div>
      </div>
      <div className="mt-1 text-center">
        <span className="text-[11px] font-black uppercase tracking-tight leading-tight">Real-time<br/>harian</span>
      </div>
    </div>
  </div>
));

/* ============================================
   VEHICLE TOOLTIP (on hover)
   ============================================ */
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

/* ============================================
   CUSTOM CHART TOOLTIP
   ============================================ */
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

/* ============================================
   VEHICLE CHARTS (below map when selected)
   ============================================ */
const VehicleCharts = React.memo(({ fuelData, weeklyFuel }) => (
  <div className="grid grid-cols-2 gap-4 mt-4">
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: "#4A4B4D" }}>
      <div className="bg-[#5A5B5D] px-5 py-3">
        <h3 className="text-lg font-bold text-white">Volume Bahan Bakar Realtime</h3>
      </div>
      <div className="p-5">
        <div className="text-sm text-gray-400 mb-2">Kamis, 29/05/2025</div>
        <div className="h-40 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={fuelData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 10 }} axisLine={{ stroke: '#666' }} tickLine={{ stroke: '#666' }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 10 }} axisLine={{ stroke: '#666' }} tickLine={{ stroke: '#666' }} width={35} unit=" L" />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#74CD25', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ fill: "#74CD25", r: 4 }} activeDot={{ r: 6, fill: "#74CD25", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: "#4A4B4D" }}>
      <div className="bg-[#5A5B5D] px-5 py-3">
        <h3 className="text-lg font-bold text-white">Konsumsi Bahan Bakar</h3>
      </div>
      <div className="p-5">
        <div className="text-sm text-gray-400 mb-2">Per Minggu</div>
        <div className="h-40 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weeklyFuel} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" tick={{ fill: "#aaa", fontSize: 10 }} axisLine={{ stroke: '#666' }} tickLine={{ stroke: '#666' }} />
              <YAxis tick={{ fill: "#aaa", fontSize: 10 }} axisLine={{ stroke: '#666' }} tickLine={{ stroke: '#666' }} width={35} unit=" L" />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#74CD25', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Line type="monotone" dataKey="value" stroke="#74CD25" strokeWidth={3} dot={{ fill: "#74CD25", r: 4 }} activeDot={{ r: 6, fill: "#74CD25", stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
));

/* ============================================
   DETAIL ROW
   ============================================ */
const DetailRow = React.memo(({ label, value, onEdit }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#5A5B5D] last:border-b-0">
    <div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="text-xs text-gray-400">{value}</div>
    </div>
    {onEdit && (
      <button className="text-sm text-[#74CD25] hover:text-[#8FE040] transition font-medium" onClick={onEdit}>
        Edit
      </button>
    )}
  </div>
));

/* ============================================
   VEHICLE SIDEBAR CARD (right side when selected)
   ============================================ */
const VehicleSidebarCard = React.memo(({ vehicle, onClose, isExpanded, onToggleExpand, onPrev, onNext, canGoPrev, canGoNext }) => (
  <div className="rounded-xl shadow-lg overflow-visible bg-[#4A4B4D] relative">
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
          <div className="text-lg font-bold text-white mb-1">{Math.round(vehicle.speed || 0)} KM/H</div>
          <div className="text-xs text-gray-400 mb-3">Speed</div>
          <div className="text-lg font-bold text-white mb-1">{vehicle.fuelLevel || 0}%</div>
          <div className="text-xs text-gray-400 mb-3">Fuel Level</div>
          <div className="text-lg font-bold text-white mb-1">{vehicle.fuel && vehicle.fuel.volume_l ? vehicle.fuel.volume_l.toFixed(1) : 0} L</div>
          <div className="text-xs text-gray-400">Fuel Volume</div>
        </div>
        <div className="relative">
          <img src={vehicle.image} alt={vehicle.name} className="w-28 h-24 object-cover rounded-lg shadow-md" loading="lazy" />
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-[#5A5B5D] pt-4">
          <DetailRow label="Nama Operator" value={vehicle.operatorName || "Pak Gun"} />
          <DetailRow label="ID Operator" value={vehicle.operatorId || "XXXXXX-1"} />
          <DetailRow label="Jabatan" value={vehicle.jabatan || "Lorem Ipsum"} />
          <DetailRow label="Divisi" value={vehicle.divisi || "Lorem Ipsum"} />
          <DetailRow label="Nomor Plat" value={vehicle.plateNumber || "Lorem Ipsum"} />
        </div>
      </div>

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

/* ============================================
   TRIP HISTORY CARD
   ============================================ */
const TripHistoryCard = React.memo(({ tripHistory, isDetailExpanded }) => {
  // Show 8 items when collapsed, only last 1 when expanded
  const visibleTrips = isDetailExpanded
    ? tripHistory.slice(-1)
    : tripHistory.slice(-8);

  return (
    <div className="rounded-xl shadow-lg overflow-hidden bg-[#4A4B4D]">
      <div className="bg-[#5A5B5D] px-5 py-3">
        <h3 className="text-lg font-bold text-white">Last Trip</h3>
      </div>
      <div className="p-5">
        <div className="space-y-3 overflow-y-auto pr-1">
          {visibleTrips.map((trip, idx) => (
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
  );
});

/* ============================================
   MAIN HOME SCREEN
   ============================================ */
const HomeScreen = () => {
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

  const { vehicles: liveVehicles } = useMqttContext();

  const vehicleData = useMemo(() => {
    const dummy = generateVehicleData(lastGps, computedHeading, gpsPath);
    const result = [...dummy];

    liveVehicles.forEach(live => {
      const index = result.findIndex(d =>
        String(d.id).toLowerCase() === String(live.id).toLowerCase() ||
        String(d.plateNumber).toLowerCase() === String(live.plateNumber).toLowerCase()
      );

      if (index !== -1) {
        result[index] = { ...result[index], ...live };
      } else {
        result.push({ ...live, image: live.image || dummy[0].image });
      }
    });

    return result;
  }, [liveVehicles, lastGps, computedHeading, gpsPath]);

  const tripHistory = useMemo(() => gpsPath.map((point, idx) => ({
    id: idx + 1,
    location: `Lat: ${point[0].toFixed(6)}, Lng: ${point[1].toFixed(6)}`,
    time: `Titik #${idx + 1}`,
    status: "completed",
  })), [gpsPath]);

  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle(prev => {
      if (prev && prev.id === vehicle.id) return null;
      setIsDetailExpanded(false);
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
    setIsDetailExpanded(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsDetailExpanded(prev => !prev);
  }, []);

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
      {/* ========== NEW: Status Panels Header ========== */}
      <div className="flex gap-4 mb-6 items-stretch">
        <StatusDevicePanel stats={STATUS_DEVICE} />
        <StatusAlatPanel stats={STATUS_ALAT} />
        <ProduksiPanel produksiItems={TOTAL_PRODUKSI} konsumsi={KONSUMSI_BBM} />
      </div>

      {/* ========== ORIGINAL: Map + Sidebar Layout ========== */}
      <div className="flex gap-6 items-stretch">
        <div className="flex-1">
          {/* Map */}
          <div
            className="rounded-[30px] p-6 mb-4"
            style={{ backgroundColor: "#232426" }}
          >
            <div className={selectedVehicle ? "h-[500px] rounded-[20px] overflow-hidden transition-all duration-500" : "h-[600px] rounded-[20px] overflow-hidden transition-all duration-500 w-full"}>
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
          <div key={selectedVehicle.id} className="w-80 flex flex-col gap-4 animate-fade-in-right relative">
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
            <TripHistoryCard tripHistory={tripHistory} isDetailExpanded={isDetailExpanded} />
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