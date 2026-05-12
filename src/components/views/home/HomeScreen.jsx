import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  MapPin,
  Monitor,
  Power,
  Search,
  Truck,
  UserRound,
  WifiOff,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageLayout from "../../layout/PageLayout";
import GoogleMap from "../../utils/maps/GoogleMap";
import { influxService } from "../../../services/influxService";
import { dataTripService, alatService } from "../../../services/configService";
import { TOTAL_PRODUKSI } from "../../../data/vehicleData";
import { useMqttContext } from "../../../context/mqttContextValue";
import { useClickOutside } from "../../../hooks/useClickOutside";
import { resolveBackendUrl } from "../../../config/apiConfig";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));

const getFuelVolume = (vehicle) => {
  if (vehicle?.fuel?.volume_l != null) return Number(vehicle.fuel.volume_l).toFixed(1);
  if (vehicle?.fuelVolume != null) return Number(vehicle.fuelVolume).toFixed(1);
  if (vehicle?.fuelLevel != null) return Number(vehicle.fuelLevel).toFixed(0);
  return "0";
};

const statusCardBase =
  "flex h-full min-h-[96px] min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-[#2d2e32]/80 px-4 py-3 shadow-xl backdrop-blur-md transition-all hover:bg-[#2d2e32] hover:border-[#74CD25]/30";

const StatusItem = React.memo(({ icon, value, label, accent, note }) => (
  <div className={statusCardBase}>
    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 shadow-inner", accent.replace('text-', 'bg-').replace(']', ']/10'))}>
      {React.createElement(icon, {
        className: cn("h-6 w-6", accent),
        strokeWidth: 2.5,
      })}
    </div>
    <div className="min-w-0">
      <div className={cn("text-2xl font-black leading-none tracking-tighter", accent)}>{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </div>
      {note ? <div className="mt-1 text-[10px] font-bold leading-none text-[#ffca28] uppercase">{note}</div> : null}
    </div>
  </div>
));

const StatusPanel = React.memo(({ title, items }) => (
  <div className="min-w-0 flex-1 rounded-[2rem] bg-[#343538]/90 p-4 shadow-2xl border border-white/5 backdrop-blur-xl">
    <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="text-sm font-black tracking-[0.2em] text-[#74CD25] uppercase">{title}</h2>
    </div>
    <div className="grid auto-rows-fr grid-cols-2 gap-3 2xl:grid-cols-4">
      {items.map((item) => (
        <StatusItem key={item.label} {...item} />
      ))}
    </div>
  </div>
));

const ProductionBadge = React.memo(({ title, value }) => (
  <div className="relative h-[104px] w-48 overflow-hidden rounded-2xl border border-white/5 bg-[#2d2e32] shadow-xl group">
    <div className="absolute top-0 left-0 w-full h-1 bg-[#74CD25] opacity-50 group-hover:opacity-100 transition-opacity" />
    <div className="bg-white/5 px-4 py-2 text-[10px] font-black text-[#74CD25] uppercase tracking-[0.15em]">
      {title}
    </div>
    <div className="px-4 py-3 text-2xl font-black text-white tracking-tighter leading-none">
      {value}
    </div>
  </div>
));

const ProductionItem = React.memo(({ label, value, toneColor }) => (
  <div className="flex h-full min-h-[52px] min-w-0 items-center overflow-hidden rounded-full border border-[#74CD25]/20 bg-[#23373F]/90 shadow-lg shadow-black/20 transition-all hover:border-[#74CD25]/35">
    <div className="flex flex-1 items-center px-4 py-2 text-[11px] font-black text-[#E5F2DB] uppercase tracking-widest break-words leading-tight">
      {label}
    </div>
    <div className={cn("m-1 flex min-w-[82px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-black text-white shadow-md", toneColor)}>
      {formatNumber(value)}
    </div>
  </div>
));

const bottomCardShellClass =
  "pointer-events-auto h-[212px] min-w-0 overflow-hidden rounded-3xl border border-white/5 bg-[#2d2e32]/80 shadow-2xl backdrop-blur-xl";
const bottomCardHeaderClass = "bg-gradient-to-r from-[#4A8516] to-[#5FA81E] px-5 py-2.5 text-center";

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="z-[9999] rounded-xl border border-[#74CD25]/30 bg-[#242529]/95 px-3 py-2 shadow-xl">
      <div className="text-sm font-black text-[#7fff3f]">{payload[0].value} L</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  );
};

const VehicleSearchPanel = React.memo(
  ({
    searchTerm,
    onSearchChange,
    onClear,
    onKeyDown,
    results,
    onSelectVehicle,
    selectedVehicleId,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const inputRef = useRef(null);
    const panelRef = useClickOutside(() => {
      setIsExpanded(false);
      onClear();
    }, isExpanded);
    const showResults = searchTerm.trim().length > 0;
    const visibleResults = results.slice(0, 6);

    useEffect(() => {
      if (isExpanded) {
        inputRef.current?.focus();
      }
    }, [isExpanded]);

    const handleSelectVehicle = useCallback((vehicle) => {
      onSelectVehicle(vehicle);
      setIsExpanded(false);
      onClear();
    }, [onClear, onSelectVehicle]);

    const handleInputKeyDown = useCallback((event) => {
      onKeyDown(event);
      if (event.key === "Escape") {
        setIsExpanded(false);
        onClear();
      }
      if (event.key === "Enter") {
        setIsExpanded(false);
        onClear();
      }
    }, [onClear, onKeyDown]);

    if (!isExpanded) {
      return (
        <div ref={panelRef} className="relative">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#2d2e32]/90 text-white/75 shadow-2xl transition-all hover:border-[#74CD25]/40 hover:text-white hover:shadow-[#74CD25]/20"
            onClick={() => setIsExpanded(true)}
            title="Cari kendaraan"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div ref={panelRef} className="w-full max-w-[360px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari kendaraan berdasarkan vehicle_id..."
            className="w-full rounded-xl border border-white/10 bg-[#2d2e32]/90 py-3 pl-10 pr-4 text-xs font-bold text-white shadow-2xl outline-none transition-all focus:border-[#74CD25] focus:ring-4 focus:ring-[#74CD25]/10 placeholder:text-gray-600"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>

        {showResults ? (
          <div className="mt-2 overflow-hidden rounded-2xl border border-white/5 bg-[#1e1f22]/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-[#74CD25] bg-white/5">
              <span>Search Results</span>
              <span>{results.length} Units</span>
            </div>

            <div>
              {visibleResults.length > 0 ? (
                visibleResults.map((vehicle) => {
                  const isSelected = selectedVehicleId === vehicle.id;

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-3 border-t border-white/8 px-4 py-3 text-left transition",
                        isSelected ? "bg-[#7fff3f]/18" : "hover:bg-white/8"
                      )}
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-white">{vehicle.id}</div>
                        <div className="mt-1 text-xs text-white/55">{vehicle.idFms || "No device ID"}</div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
                          vehicle.status === "online"
                            ? "bg-[#39ff14]/20 text-[#8CFF2A]"
                            : "bg-red-500/20 text-red-200"
                        )}
                      >
                        {vehicle.status}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="border-t border-white/8 px-4 py-5 text-sm text-white/60">
                  Kendaraan dengan vehicle_id tersebut belum ditemukan.
                </div>
              )}
            </div>

            {results.length > visibleResults.length ? (
              <div className="border-t border-white/8 px-4 py-2 text-xs text-white/45">
                Menampilkan {visibleResults.length} hasil teratas.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);

const BottomChartCard = React.memo(({ title, subtitle, data, xKey, hasAnimated }) => (
  <div
    className={cn(bottomCardShellClass, "group transition-all hover:border-[#74CD25]/20")}
    onWheel={(event) => event.stopPropagation()}
  >
    <div className={bottomCardHeaderClass}>
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white">{title}</h3>
    </div>
    <div className="flex h-[156px] flex-col p-4">
      <div className="mb-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">{subtitle}</div>
      <div className="relative min-h-0 flex-1 pointer-events-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#5b5c60" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: "#d4d4d8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#d4d4d8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomChartTooltip />} trigger="axis" isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#7fff3f"
              strokeWidth={2}
              dot={{ fill: "#7fff3f", r: 2.5 }}
              activeDot={{ fill: "#7fff3f", r: 4 }}
              isAnimationActive={!hasAnimated}
              animationDuration={hasAnimated ? 0 : 1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
));

const LastTripCard = React.memo(({ tripHistory }) => (
  <div className={bottomCardShellClass} onWheel={(event) => event.stopPropagation()}>
    <div className={bottomCardHeaderClass}>
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white">Last Trip</h3>
    </div>
    <div
      className="h-[156px] space-y-3 overflow-hidden p-4 custom-scrollbar overflow-y-auto"
      onWheel={(event) => event.stopPropagation()}
    >
      {tripHistory.length > 0 ? (
        tripHistory.map((trip) => (
          <div key={trip.id} className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8CFF2A]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-bold text-white">{trip.location}</div>
              <div className="text-xs text-white/70">{trip.time}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-white/30 uppercase tracking-widest font-black">
          No Trip History
        </div>
      )}
    </div>
  </div>
));

const DetailRow = React.memo(({ label, value, icon }) => (
  <div className="flex items-start gap-3 border-b border-white/5 py-2.5 last:border-b-0">
    <div className="mt-0.5 p-1.5 rounded-lg bg-white/5">
        {React.createElement(icon, {
          className: "h-3.5 w-3.5 text-[#74CD25]",
        })}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">{label}</div>
      <div className="text-sm font-black text-white tracking-tight">{value}</div>
    </div>
  </div>
));

const VehicleInfoCard = React.memo(
  ({
    vehicle,
    isExpanded,
    onToggleExpand,
    onClose,
    onPrev,
    onNext,
    canGoPrev,
    canGoNext,
  }) => (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-4 right-4 z-20 w-[360px] overflow-hidden rounded-3xl bg-[#1e1f22]/95 border border-white/10 shadow-2xl backdrop-blur-xl transition-all",
        isExpanded ? "max-h-[80vh]" : "h-[220px]"
      )}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-[#4A8516] to-[#5FA81E] px-6 py-3">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-white">Tactical Unit Data</div>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              "rounded-full p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white",
              canGoPrev ? "" : "opacity-30 cursor-not-allowed"
            )}
            onClick={onPrev}
            disabled={!canGoPrev}
            title="Previous vehicle"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className={cn(
              "rounded-full p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white",
              canGoNext ? "" : "opacity-30 cursor-not-allowed"
            )}
            onClick={onNext}
            disabled={!canGoNext}
            title="Next vehicle"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            className="rounded-full p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
            onClick={onToggleExpand}
            title={isExpanded ? "Hide detail" : "Show detail"}
          >
            <ChevronUp className={cn("h-5 w-5 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
          </button>
          <button
            className="rounded-full p-1.5 text-white/85 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            title="Close vehicle panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="mb-6 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xl font-black text-[#74CD25] uppercase tracking-tight">{vehicle.name}</div>
            <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-black leading-none text-white tracking-tighter">{Math.round(vehicle.speed || 0)}</span>
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">KM/H</span>
            </div>
            <div className="text-[10px] font-black text-[#74CD25]/60 uppercase tracking-[0.2em] mt-1">Velocity Vector</div>
          </div>
          <div className="relative group">
            <img
                src={vehicle.image}
                alt={vehicle.name}
                className="h-20 w-24 rounded-xl object-cover border border-white/10 relative z-10 shadow-lg"
                loading="lazy"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xl font-black leading-none text-white tracking-tight">{vehicle.distance || "0 KM"}</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Distance</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-xl font-black leading-none text-white tracking-tight">{getFuelVolume(vehicle)} L</div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Fuel Capacity</div>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-[320px] pt-4 opacity-100" : "max-h-0 pt-0 opacity-0"
          )}
        >
          <DetailRow label="ID Alat" value={vehicle.idFms || `FMS-${vehicle.id}`} icon={Truck} />
          <DetailRow label="Nama Operator" value={vehicle.operatorName || "-"} icon={UserRound} />
          <DetailRow label="Nomor Unit" value={vehicle.unitNumber || "-"} icon={Truck} />
          <DetailRow label="ID Operator" value={vehicle.operatorId || "-"} icon={UserRound} />
          <DetailRow label="Status Trip" value={vehicle.lastTripStatus || "End Trip"} icon={MapPin} />
        </div>
      </div>
    </div>
  )
);

const VehicleTooltip = React.memo(({ vehicle, position }) => {
  const cardWidth = 184;
  const cardHeight = 78;
  const markerAnchorY = 34;

  return (
    <div
      className="fixed z-[1000] pointer-events-none"
      style={{
        left: position.x - cardWidth / 2,
        top: position.y - cardHeight + markerAnchorY - 82,
        width: cardWidth,
      }}
    >
      <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
        <img src={vehicle.image} alt={vehicle.name} className="h-[44px] w-full object-cover" loading="lazy" />
        <div className="relative p-2.5 pb-5">
          <div className="truncate text-[13px] font-bold text-black">{vehicle.name}</div>
          <div className="text-[11px] text-gray-500">{vehicle.plateNumber || "No. Plat"}</div>
          <span
            className={cn(
              "absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow",
              vehicle.status === "online" ? "bg-[#74CD25]" : "bg-red-500"
            )}
          >
            {vehicle.status === "online" ? "Online" : "Offline"}
          </span>
        </div>
        <div className="absolute left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-white" />
      </div>
    </div>
  );
});

const HomeScreen = () => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [influxSummary, setInfluxSummary] = useState(null);
  const [influxVehicles, setInfluxVehicles] = useState([]);
  const [registeredAlat, setRegisteredAlat] = useState([]);
  const [tripEntries, setTripEntries] = useState([]);
  const [realTripHistory, setRealTripHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const hasInfluxVehicles = influxVehicles.length > 0;
  const { rawVehicles } = useMqttContext();

  useEffect(() => {
    if (!loading && hasInfluxVehicles && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, hasInfluxVehicles, hasAnimated]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [summaryRes, vehiclesRes, alatRes, tripRes] = await Promise.all([
        influxService.getSummary(),
        influxService.getVehicles(),
        alatService.getAll(),
        dataTripService.getAll(),
      ]);

      setInfluxSummary(summaryRes.data);

      if ((alatRes.data?.success || alatRes.data?.ok) && Array.isArray(alatRes.data.data)) {
        setRegisteredAlat(alatRes.data.data);
      }
      setTripEntries(tripRes.data?.ok && Array.isArray(tripRes.data.data) ? tripRes.data.data : []);

      // Preserve existing fuel data when updating vehicles
      setInfluxVehicles(prev => {
        const incoming = vehiclesRes.data || [];
        return incoming.map(newV => {
          const existing = prev.find(p => p.id === newV.id);
          return {
            ...newV,
            fuelData: existing?.fuelData || [],
            weeklyFuel: existing?.weeklyFuel || []
          };
        });
      });
    } catch (error) {
      console.error("Error fetching influx data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // refresh every 10s for more "live" feel
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const vehicleData = useMemo(() => {
    return influxVehicles
      .map(v => {
        const registration = registeredAlat.find(a => a.idFms === v.id);
        const mqttVehicle = rawVehicles[v.id];
        const useLiveGps = mqttVehicle?.gpsValid === true;

        return {
          ...v,
          lat: useLiveGps ? mqttVehicle.lat : v.lat,
          lng: useLiveGps ? mqttVehicle.lng : v.lng,
          speed: mqttVehicle?.speed ?? v.speed,
          heading: mqttVehicle?.heading ?? v.heading,
          status: mqttVehicle?.status || v.status,
          tripPath: mqttVehicle?.tripPath || v.tripPath || [],
          lastTripStatus: mqttVehicle?.lastTripStatus || v.lastTripStatus || "End Trip",
          tripCount: mqttVehicle?.tripCount ?? v.tripCount ?? 0,
          statusTrip: mqttVehicle?.operator_input?.status_trip || v.statusTrip || "-",
          image: registration?.gambar ? resolveBackendUrl(registration.gambar) : '/assets/selected-vehicle.png',
          name: registration?.noUnit || v.name || v.id,
          unitNumber: registration?.noUnit || "-",
          plateNumber: registration?.noPlat || v.plateNumber || v.id,
        };
      });
  }, [influxVehicles, rawVehicles, registeredAlat]);

  const normalizedVehicleSearch = vehicleSearch.trim().toLowerCase();

  const filteredVehicleData = useMemo(() => {
    if (!normalizedVehicleSearch) return vehicleData;

    return vehicleData.filter((vehicle) =>
      String(vehicle.id || "").toLowerCase().includes(normalizedVehicleSearch)
    );
  }, [vehicleData, normalizedVehicleSearch]);

  // Fetch fuel charts when a vehicle is selected and keep it updated
  useEffect(() => {
    if (!selectedVehicle?.id) return;

    const fetchFuelData = async () => {
      try {
        const [realtimeRes, weeklyRes] = await Promise.all([
          influxService.getFuelRealtime(selectedVehicle.id),
          influxService.getFuelWeekly(selectedVehicle.id)
        ]);

        setInfluxVehicles(prev => prev.map(v => {
          if (v.id !== selectedVehicle.id) return v;
          return {
            ...v,
            // Only update if we got real data, otherwise keep previous
            fuelData: (realtimeRes.data && realtimeRes.data.length > 0) ? realtimeRes.data : v.fuelData,
            weeklyFuel: (weeklyRes.data && weeklyRes.data.length > 0) ? weeklyRes.data : v.weeklyFuel,
          };
        }));
      } catch (error) {
        console.error("Error fetching fuel charts:", error);
        // Don't clear data on error — keep showing last known data
      }
    };

    fetchFuelData();
    const interval = setInterval(fetchFuelData, 60000); // Poll fuel every 1 minute
    return () => clearInterval(interval);
  }, [selectedVehicle?.id]);

  // Fetch real trip history for the selected vehicle
  useEffect(() => {
    if (!selectedVehicle?.id) {
      setRealTripHistory([]);
      return;
    }
    const filtered = tripEntries
      .filter((trip) => trip.idAlat === selectedVehicle.id)
      .slice(0, 4)
      .map((trip) => {
        // Fix for 1970 timestamps: use createdAt if waktu is invalid
        const rawTime = trip.waktuFinish || trip.waktuStart;
        const isInvalid = !rawTime || rawTime.startsWith('1970');
        const displayTime = isInvalid ? trip.createdAt : rawTime;

        return {
          id: trip.id,
          location: trip.lokasiFinish || trip.lokasiStart || "Unknown Location",
          time: displayTime || "-",
        };
      });
    setRealTripHistory(filtered);
  }, [selectedVehicle?.id, tripEntries]);

  const currentVehicle = useMemo(() => {
    if (!selectedVehicle) return null;
    return filteredVehicleData.find((v) => v.id === selectedVehicle.id)
      || vehicleData.find((v) => v.id === selectedVehicle.id)
      || selectedVehicle;
  }, [selectedVehicle, filteredVehicleData, vehicleData]);

  const handleVehicleClick = useCallback((vehicle) => {
    setSelectedVehicle((prev) => {
      if (prev?.id === vehicle.id) {
        setIsDetailExpanded(false);
        return null;
      }

      setIsDetailExpanded(false);
      return vehicle;
    });
  }, []);

  const handleVehicleSearchSelect = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    setHoveredVehicle(null);
    setIsDetailExpanded(false);
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
    setIsDetailExpanded((prev) => !prev);
  }, []);

  const currentVehicleIndex = useMemo(() => {
    if (!selectedVehicle) return -1;
    return filteredVehicleData.findIndex((vehicle) => vehicle.id === selectedVehicle.id);
  }, [selectedVehicle, filteredVehicleData]);

  const handlePrevVehicle = useCallback(() => {
    if (currentVehicleIndex > 0) {
      setSelectedVehicle(filteredVehicleData[currentVehicleIndex - 1]);
      setIsDetailExpanded(false);
    }
  }, [currentVehicleIndex, filteredVehicleData]);

  const handleNextVehicle = useCallback(() => {
    if (currentVehicleIndex >= 0 && currentVehicleIndex < filteredVehicleData.length - 1) {
      setSelectedVehicle(filteredVehicleData[currentVehicleIndex + 1]);
      setIsDetailExpanded(false);
    }
  }, [currentVehicleIndex, filteredVehicleData]);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      setVehicleSearch("");
      return;
    }

    if (event.key === "Enter" && filteredVehicleData.length > 0) {
      handleVehicleSearchSelect(filteredVehicleData[0]);
    }
  }, [filteredVehicleData, handleVehicleSearchSelect]);

  useEffect(() => {
    if (!selectedVehicle) return;

    const selectedStillVisible = filteredVehicleData.some((vehicle) => vehicle.id === selectedVehicle.id);
    if (!selectedStillVisible) {
      setSelectedVehicle(null);
      setIsDetailExpanded(false);
    }
  }, [filteredVehicleData, selectedVehicle]);

  useEffect(() => {
    if (!hoveredVehicle) return;

    const hoveredStillVisible = filteredVehicleData.some((vehicle) => vehicle.id === hoveredVehicle.id);
    if (!hoveredStillVisible) {
      setHoveredVehicle(null);
    }
  }, [filteredVehicleData, hoveredVehicle]);

  const canGoPrev = currentVehicleIndex > 0;
  const canGoNext = currentVehicleIndex >= 0 && currentVehicleIndex < filteredVehicleData.length - 1;

  const deviceItems = useMemo(() => {
    const vehiclesList = Object.values(rawVehicles);
    const onCount = vehiclesList.filter(v => v.status === 'online').length;
    const offCount = vehiclesList.filter(v => v.status === 'offline').length;
    const lossCount = vehiclesList.filter(v => v.gpsValid === false).length;
    
    return [
      { icon: Power, value: onCount, label: "ON", accent: "text-[#39ff14]" },
      { icon: AlertTriangle, value: lossCount, label: "Loss Coordinate", accent: "text-[#ffc107]" },
      { icon: WifiOff, value: offCount, label: "OFF", accent: "text-[#ff3131]" },
      { icon: Monitor, value: vehiclesList.length, label: "Total", accent: "text-white" },
    ];
  }, [rawVehicles]);

  const equipmentItems = useMemo(() => {
    const vehiclesList = Object.values(rawVehicles);
    const onCount = vehiclesList.filter(v => v.vehicle?.engine_on === true).length;
    const passiveCount = vehiclesList.filter(v => v.vehicle?.engine_on === true && v.vehicle?.moving === false).length;
    const offCount = vehiclesList.filter(v => v.vehicle?.engine_on === false).length;
    
    return [
      { icon: Truck, value: onCount, label: "ON", accent: "text-[#39ff14]" },
      { icon: Truck, value: passiveCount, label: "Passive", accent: "text-[#ffc107]" },
      { icon: Truck, value: offCount, label: "OFF", accent: "text-[#ff3131]" },
      { icon: Truck, value: vehiclesList.length, label: "Total", accent: "text-white" },
    ];
  }, [rawVehicles]);

  const produksiItems = useMemo(
    () => {
      const base = TOTAL_PRODUKSI.map(template => {
        const realData = influxSummary?.produksi_items?.find(item => item.label === template.label);
        return {
          ...template,
          value: realData ? realData.value : 0
        };
      });

      return base.map((item) => ({
        ...item,
        toneColor: item.label.includes("OB")
          ? "bg-[#9C7A20]"
          : item.label.includes("SAP")
            ? "bg-[#5FA81E]"
            : "bg-[#8B3538]",
      }));
    },
    [influxSummary]
  );

  const bottomCardsPadding = selectedVehicle ? "pr-[376px]" : "";

  return (
    <PageLayout noScroll={true} className="p-4">
      <div className="relative flex-1 overflow-hidden rounded-[2.5rem] border-[1px] border-white/10 bg-[#1a1b1e] shadow-2xl">
        <div className="absolute inset-0">
          <GoogleMap
            vehicles={filteredVehicleData}
            selectedVehicle={currentVehicle}
            onVehicleClick={handleVehicleClick}
            onVehicleHover={handleVehicleHover}
            onVehicleLeave={handleVehicleLeave}
          />
        </div>

        <div className="pointer-events-none relative z-10 flex h-full flex-col p-4">
          <div className="pointer-events-auto">
            <div className="flex gap-3">
              <StatusPanel title="DEVICE STATUS" items={deviceItems} />
              <StatusPanel title="EQUIPMENT STATUS" items={equipmentItems} />
            </div>

            <div className="mt-2 flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <ProductionBadge title="Total Produksi" value={influxSummary?.total_produksi || "0"} />
                <ProductionBadge title="Konsumsi BBM" value={`${formatNumber(influxSummary?.konsumsi_bbm || 0)} L`} />
              </div>

              <div className="min-w-0 flex flex-1 flex-col gap-1 pt-1">
                <div className="grid max-h-[162px] grid-cols-[repeat(auto-fit,minmax(160px,1fr))] auto-rows-fr gap-3 overflow-y-auto pr-1 custom-scrollbar">
                  {produksiItems.map((item) => (
                    <ProductionItem key={item.label} label={item.label} value={item.value} toneColor={item.toneColor} />
                  ))}
                </div>

                <div className="flex justify-end">
                  <VehicleSearchPanel
                    searchTerm={vehicleSearch}
                    onSearchChange={setVehicleSearch}
                    onClear={() => setVehicleSearch("")}
                    onKeyDown={handleSearchKeyDown}
                    results={filteredVehicleData}
                    onSelectVehicle={handleVehicleSearchSelect}
                    selectedVehicleId={selectedVehicle?.id}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {currentVehicle ? (
            <div className={cn("pointer-events-none transition-all duration-300", bottomCardsPadding)}>
              <div className="grid grid-cols-3 gap-4">
                <BottomChartCard
                  title="Volume Bahan Bakar Realtime"
                  subtitle="Liter (L)"
                  data={currentVehicle.fuelData || []}
                  xKey="time"
                  hasAnimated={hasAnimated}
                />
                <BottomChartCard
                  title="Konsumsi Bahan Bakar"
                  subtitle="Liter (L)"
                  data={currentVehicle.weeklyFuel || []}
                  xKey="day"
                  hasAnimated={hasAnimated}
                />
                <LastTripCard tripHistory={realTripHistory} />
              </div>
            </div>
          ) : null}
        </div>

        {currentVehicle ? (
          <VehicleInfoCard
            vehicle={currentVehicle}
            isExpanded={isDetailExpanded}
            onToggleExpand={handleToggleExpand}
            onClose={handleCloseVehicle}
            onPrev={handlePrevVehicle}
            onNext={handleNextVehicle}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
          />
        ) : null}

        {hoveredVehicle ? <VehicleTooltip vehicle={hoveredVehicle} position={hoverPosition} /> : null}
      </div>
    </PageLayout>
  );
};

export default HomeScreen;
