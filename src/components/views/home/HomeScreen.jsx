import React, { useState, useCallback, useMemo, useEffect } from "react";
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
  MessageSquare,
  Send,
  Headset,
  Loader2,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageLayout from "../../layout/PageLayout";
import GoogleMap from "../../utils/maps/GoogleMap";
import {
  GPS_PATH_DEFAULT,
  STATUS_ALAT,
  STATUS_DEVICE,
  TOTAL_PRODUKSI,
  KONSUMSI_BBM,
} from "../../../data/vehicleData";
import { influxService } from "../../../services/influxService";
import { publishToTopic } from "../../../utils/mqttActions";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));

const getFuelVolume = (vehicle) => {
  if (vehicle?.fuel?.volume_l != null) return Number(vehicle.fuel.volume_l).toFixed(1);
  if (vehicle?.fuelVolume != null) return Number(vehicle.fuelVolume).toFixed(1);
  if (vehicle?.fuelLevel != null) return Number(vehicle.fuelLevel).toFixed(0);
  return "0";
};

const statusCardBase =
  "flex min-w-0 items-center gap-2 rounded-[16px] border border-white/80 bg-[#3a3b3f] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

const StatusItem = React.memo(({ icon, value, label, accent, note }) => (
  <div className={statusCardBase}>
    {React.createElement(icon, {
      className: cn("h-9 w-9 flex-shrink-0", accent),
      strokeWidth: 2.2,
    })}
    <div className="min-w-0">
      <div className={cn("text-[22px] font-black leading-none", accent)}>{value}</div>
      <div className={cn("text-[12px] font-bold leading-none", accent === "text-white" ? "text-white" : accent)}>
        {label}
      </div>
      {note ? <div className="mt-1 text-[11px] font-medium leading-none text-[#ffca28]">{note}</div> : null}
    </div>
  </div>
));

const StatusPanel = React.memo(({ title, items }) => (
  <div className="min-w-0 flex-1 rounded-[24px] bg-[#35363a]/94 p-3 shadow-[0_18px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm">
    <div className="mb-2 rounded-[18px] bg-[#39ff14] px-4 py-1.5 text-center text-[18px] font-black tracking-tight text-black">
      {title}
    </div>
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <StatusItem key={item.label} {...item} />
      ))}
    </div>
  </div>
));

const ProductionBadge = React.memo(({ title, value }) => (
  <div className="w-[148px] overflow-hidden rounded-[12px] bg-[#2c493d] shadow-lg">
    <div className="bg-[#1b2f27] px-3 py-1 text-[11px] font-bold text-[#4caf50] uppercase tracking-wider">
      {title}
    </div>
    <div className="px-3 py-2 text-[20px] font-black text-white leading-tight">
      {value}
    </div>
  </div>
));

const ChatOverlay = ({ selectedVehicle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatType, setChatType] = useState("broadcast"); // broadcast | device

  useEffect(() => {
    if (selectedVehicle) setChatType("device");
    else setChatType("broadcast");
  }, [selectedVehicle]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    setIsSending(true);

    try {
      const topic = chatType === "broadcast" 
        ? "fms/chat" 
        : `fms/${selectedVehicle?.vehicleId || selectedVehicle?.idFms || selectedVehicle?.id}/chat`;
      
      const payload = {
        message: message.trim(),
        sender: "Web Admin",
        timestamp: new Date().toISOString(),
        type: chatType
      };

      await publishToTopic(topic, payload);
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to send chat:", error);
      alert("Gagal mengirim pesan chat");
    } finally {
      setIsSending(false);
    }
  };

  const bottomClass = selectedVehicle ? "bottom-[260px]" : "bottom-6";

  return (
    <div className={cn("absolute left-6 z-[60] transition-all duration-500", bottomClass)}>
      {isOpen ? (
        <div className="mb-4 w-80 overflow-hidden rounded-[24px] border border-white/20 bg-[#2d2e32]/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#39ff14]/20 text-[#39ff14]">
                <Headset className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Chat Operator</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setChatType("broadcast")}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                chatType === "broadcast" ? "bg-[#39ff14] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              BROADCAST
            </button>
            <button
              onClick={() => {
                if (!selectedVehicle) {
                  alert("Silakan pilih kendaraan di peta terlebih dahulu untuk mengirim pesan spesifik.");
                  return;
                }
                setChatType("device");
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                chatType === "device" ? "bg-[#39ff14] text-black" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              SPECIFIC DEVICE
            </button>
          </div>

          {chatType === "device" && selectedVehicle && (
            <div className="mb-3 rounded-lg bg-[#39ff14]/10 px-3 py-2 border border-[#39ff14]/20">
              <div className="text-[10px] text-[#39ff14] font-bold uppercase">Target Device</div>
              <div className="text-xs text-white font-medium">{selectedVehicle.noPlat || selectedVehicle.idFms}</div>
            </div>
          )}

          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan ke operator..."
              className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-gray-500 focus:border-[#39ff14]/50 focus:outline-none transition-all pointer-events-auto"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={isSending || !message.trim()}
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#39ff14] text-black shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale pointer-events-auto"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-[#35363a]/90 text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95 pointer-events-auto",
          isOpen && "border-[#39ff14] bg-black text-[#39ff14]"
        )}
      >
        <MessageSquare className="h-6 w-6 transition-transform group-hover:rotate-12" />
      </button>
    </div>
  );
};
const ProductionItem = React.memo(({ label, value, tone }) => (
  <div className="flex min-w-[200px] flex-1 overflow-hidden rounded-full bg-[#21362c] shadow-md">
    <div className="flex flex-1 items-center justify-center bg-[#2f3d37] px-3 py-1.5 text-center text-[13px] font-extrabold text-white">
      {label}
    </div>
    <div
      className={cn(
        "flex min-w-[92px] items-center justify-center px-3 py-1.5 text-[13px] font-black text-white",
        tone
      )}
    >
      {formatNumber(value)}
    </div>
  </div>
));

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
    const showResults = searchTerm.trim().length > 0;
    const visibleResults = results.slice(0, 6);

    return (
      <div className="w-full max-w-[360px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
          <input
            type="text"
            placeholder="Cari kendaraan berdasarkan vehicle_id..."
            className="w-full rounded-[18px] border border-white/15 bg-[#2f3134]/92 py-3 pl-10 pr-11 text-sm font-medium text-white shadow-[0_14px_28px_rgba(0,0,0,0.22)] outline-none transition focus:border-[#7fff3f] focus:ring-2 focus:ring-[#7fff3f]/20"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={onKeyDown}
          />
          {searchTerm ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 rounded-full p-1.5 text-white/65 transition hover:bg-white/10 hover:text-white"
              onClick={onClear}
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {showResults ? (
          <div className="mt-2 overflow-hidden rounded-[20px] border border-white/12 bg-[#2f3134]/95 shadow-[0_18px_32px_rgba(0,0,0,0.24)] backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/60">
              <span>Hasil Pencarian</span>
              <span>{results.length} kendaraan</span>
            </div>

            <div className="max-h-64 overflow-y-auto">
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
                      onClick={() => onSelectVehicle(vehicle)}
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
  <div className="h-[212px] min-w-0 rounded-[20px] bg-[#3a3b3f]/70 shadow-[0_16px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm">
    <div className="rounded-t-[20px] bg-[#7c7c7c] px-5 py-3 text-center text-[17px] font-extrabold leading-tight text-white">
      {title}
    </div>
    <div className="flex h-[156px] flex-col p-4">
      <div className="mb-2 text-xs font-medium text-white/65">{subtitle}</div>
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
  <div className="h-[212px] min-w-0 overflow-hidden rounded-[20px] bg-[#3a3b3f]/70 shadow-[0_16px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm">
    <div className="rounded-t-[20px] bg-[#7c7c7c] px-5 py-3 text-center text-[17px] font-extrabold leading-tight text-white">
      Last Trip
    </div>
    <div className="h-[156px] space-y-4 overflow-hidden p-5">
      {tripHistory.slice(-4).map((trip) => (
        <div key={trip.id} className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8CFF2A]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-bold text-white">{trip.location}</div>
            <div className="text-xs text-white/70">{trip.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

const DetailRow = React.memo(({ label, value, icon }) => (
  <div className="flex items-start gap-3 border-b border-white/10 py-3 last:border-b-0">
    {React.createElement(icon, {
      className: "mt-0.5 h-4 w-4 flex-shrink-0 text-white/70",
    })}
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-[0.08em] text-white/55">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
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
        "pointer-events-auto absolute bottom-4 right-4 z-20 w-[346px] overflow-hidden rounded-[22px] bg-[#3a3b3f]/70 shadow-[0_18px_38px_rgba(0,0,0,0.28)] backdrop-blur-md transition-all duration-300",
        isExpanded ? "min-h-[378px]" : "h-[214px]"
      )}
    >
      <div className="flex items-center justify-between bg-[#7c7c7c] px-5 py-2">
        <div className="text-[18px] font-extrabold text-white">Cars</div>
        <div className="flex items-center gap-1">
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

      <button
        className={cn(
          "absolute left-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-[#4b4c50] shadow transition",
          canGoPrev ? "hover:scale-105 hover:bg-white" : "cursor-not-allowed opacity-40"
        )}
        onClick={onPrev}
        disabled={!canGoPrev}
        title="Previous vehicle"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <button
        className={cn(
          "absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/85 p-1.5 text-[#4b4c50] shadow transition",
          canGoNext ? "hover:scale-105 hover:bg-white" : "cursor-not-allowed opacity-40"
        )}
        onClick={onNext}
        disabled={!canGoNext}
        title="Next vehicle"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="px-10 py-4">
        <div className="mb-3 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[18px] font-black text-[#7fff3f]">{vehicle.name}</div>
            <div className="mt-3 text-[24px] font-black leading-none text-white">{Math.round(vehicle.speed || 0)} KM/H</div>
            <div className="text-sm text-white/70">Speed</div>
          </div>
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="h-[78px] w-[98px] rounded-[14px] object-cover shadow-lg"
            loading="lazy"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <div className="text-[20px] font-black leading-none text-white">{vehicle.distance || "0 KM"}</div>
            <div className="text-sm text-white/70">Jarak</div>
          </div>
          <div>
            <div className="text-[20px] font-black leading-none text-white">{getFuelVolume(vehicle)} L</div>
            <div className="text-sm text-white/70">Kapasitas</div>
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
          <DetailRow label="ID Operator" value={vehicle.operatorId || "-"} icon={UserRound} />
          <DetailRow label="Nomor Plat" value={vehicle.plateNumber || "-"} icon={Truck} />
          <DetailRow label="Lokasi Terakhir" value={vehicle.lastLocation || "-"} icon={MapPin} />
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
  const gpsPath = useMemo(() => GPS_PATH_DEFAULT, []);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [influxSummary, setInfluxSummary] = useState(null);
  const [influxVehicles, setInfluxVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const hasInfluxVehicles = influxVehicles.length > 0;

  useEffect(() => {
    if (!loading && hasInfluxVehicles && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, hasInfluxVehicles, hasAnimated]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [summaryRes, vehiclesRes] = await Promise.all([
        influxService.getSummary(),
        influxService.getVehicles()
      ]);
      setInfluxSummary(summaryRes.data);
      
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
    if (influxVehicles.length === 0) return [];
    return influxVehicles.map(v => ({
      ...v,
      image: '/assets/selected-vehicle.png',
      name: v.name || v.id,
      plateNumber: v.plateNumber || v.id,
    }));
  }, [influxVehicles]);

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

  const currentVehicle = useMemo(() => {
    if (!selectedVehicle) return null;
    return filteredVehicleData.find((v) => v.id === selectedVehicle.id)
      || vehicleData.find((v) => v.id === selectedVehicle.id)
      || selectedVehicle;
  }, [selectedVehicle, filteredVehicleData, vehicleData]);

  const tripHistory = useMemo(
    () =>
      gpsPath.map((point, idx) => ({
        id: idx + 1,
        location: `Lat: ${point[0].toFixed(5)}, Lng: ${point[1].toFixed(5)}`,
        time: `Titik #${idx + 1}`,
      })),
    [gpsPath]
  );

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

  const deviceItems = useMemo(
    () => [
      { icon: Power, value: influxSummary?.status_device?.on || STATUS_DEVICE.on, label: "ON", accent: "text-[#39ff14]" },
      {
        icon: AlertTriangle,
        value: influxSummary?.status_device?.lossCoordinate || STATUS_DEVICE.lossCoordinate,
        label: "Loss Coordinate",
        accent: "text-[#ffc107]",
      },
      { icon: WifiOff, value: influxSummary?.status_device?.off || STATUS_DEVICE.off, label: "OFF", accent: "text-[#ff3131]" },
      { icon: Monitor, value: influxSummary?.status_device?.total || STATUS_DEVICE.total, label: "Total", accent: "text-white" },
    ],
    [influxSummary]
  );

  const equipmentItems = useMemo(
    () => [
      { icon: Truck, value: influxSummary?.status_alat?.on || STATUS_ALAT.on, label: "ON", accent: "text-[#39ff14]" },
      { icon: Truck, value: influxSummary?.status_alat?.passive || STATUS_ALAT.passive, label: "Passive", accent: "text-[#ffc107]" },
      { icon: Truck, value: influxSummary?.status_alat?.off || STATUS_ALAT.off, label: "OFF", accent: "text-[#ff3131]" },
      { icon: Truck, value: influxSummary?.status_alat?.total || STATUS_ALAT.total, label: "Total", accent: "text-white" },
    ],
    [influxSummary]
  );

  const produksiItems = useMemo(
    () => {
      const base = (influxSummary?.produksi_items && influxSummary.produksi_items.length > 0) ? influxSummary.produksi_items : TOTAL_PRODUKSI;
      return base.map((item) => ({
        ...item,
        tone: item.label.includes("OB")
          ? "bg-[#f5b40d]"
          : item.label.includes("SAP")
            ? "bg-[#30c948]"
            : "bg-[#dc1a23]",
      }));
    },
    [influxSummary]
  );

  const bottomCardsPadding = selectedVehicle ? "pr-[360px]" : "";

  return (
    <PageLayout className="p-6">
      {/* <div className="rounded-[34px] bg-[#e8f1f6] p-2 shadow-[0_16px_42px_rgba(0,0,0,0.18)]"> */}
        <div className="relative h-[calc(100vh-100px)] min-h-[640px] max-h-[780px] overflow-hidden rounded-[28px] border-[4px] border-white/90 bg-[#b9dced]">
          <div className="absolute inset-0">
            <GoogleMap
              vehicles={filteredVehicleData}
              selectedVehicle={selectedVehicle}
              onVehicleClick={handleVehicleClick}
              onVehicleHover={handleVehicleHover}
              onVehicleLeave={handleVehicleLeave}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02)_22%,rgba(255,255,255,0.12)_100%)]" />

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
                  <div className="flex flex-wrap gap-3">
                    {produksiItems.map((item) => (
                      <ProductionItem key={item.label} label={item.label} value={item.value} tone={item.tone} />
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
                  <LastTripCard tripHistory={tripHistory} />
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
          
          <ChatOverlay selectedVehicle={selectedVehicle} />
        </div>
      {/* </div> */}

      {hoveredVehicle ? <VehicleTooltip vehicle={hoveredVehicle} position={hoverPosition} /> : null}
    </PageLayout>
  );
};

export default HomeScreen;
