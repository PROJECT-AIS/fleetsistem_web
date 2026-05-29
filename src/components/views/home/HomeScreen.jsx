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
  Route,
  Map,
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
import { normalizeDeviceStatus, normalizeEquipmentDisplayStatus } from "../../../utils/statusUtils";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));

const formatClockTime = (value) => {
  if (value == null) return "-";

  const normalized = String(value).trim();
  if (!normalized || normalized === "-") return "-";

  const isoMatch = normalized.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];

  const plainTimeMatch = normalized.match(/\b(\d{2}:\d{2}:\d{2})\b/);
  if (plainTimeMatch) return plainTimeMatch[1];

  return normalized;
};

const formatDistance = (vehicle) => {
  const rawDistance =
    vehicle?.distance ??
    vehicle?.tripDistance ??
    vehicle?.distanceKm ??
    vehicle?.distance_km;

  if (rawDistance == null || rawDistance === "") return "-";
  if (typeof rawDistance === "number") {
    return `${rawDistance % 1 === 0 ? rawDistance : rawDistance.toFixed(1)} KM`;
  }

  const normalized = String(rawDistance).trim();
  if (!normalized || normalized === "-") return "-";
  if (/km/i.test(normalized)) return normalized;

  const numeric = Number(normalized);
  return Number.isNaN(numeric)
    ? normalized
    : `${numeric % 1 === 0 ? numeric : numeric.toFixed(1)} KM`;
};

const formatFuelCapacity = (vehicle) => {
  const rawCapacity =
    vehicle?.fuelCapacity ??
    vehicle?.kapasitasTangki ??
    vehicle?.tankCapacity;

  if (rawCapacity == null || rawCapacity === "") return "-";
  if (typeof rawCapacity === "number") return `${formatNumber(rawCapacity)} L`;

  const normalized = String(rawCapacity).trim();
  if (!normalized || normalized === "-") return "-";
  if (/\bl\b/i.test(normalized)) return normalized;

  const numeric = Number(normalized);
  return Number.isNaN(numeric) ? normalized : `${formatNumber(numeric)} L`;
};

const cardTitleClass = "text-[14px] font-extrabold tracking-[0.03em]";
const metaLabelClass = "text-[10px] font-semibold uppercase tracking-[0.08em]";
const primaryValueClass = "font-extrabold leading-none tracking-tight";
const contentValueClass = "font-bold tracking-tight";
const helperTextClass = "text-[11px] font-medium";
const subtleTextClass = "text-[10px] font-medium";
const statusPanelTitleClass = "text-[clamp(1rem,1.28vw,1.4rem)] font-bold leading-none tracking-[0.03em] text-[#59ff00] text-center mb-3";
const statusItemLabelClass = "block overflow-hidden text-clip whitespace-nowrap text-[clamp(0.72rem,0.84vw,0.9rem)] font-semibold leading-none text-white";
const statusItemValueClass = "min-w-[20px] text-right text-[clamp(1.2rem,1.45vw,1.7rem)] font-extrabold leading-none tracking-tight text-[#f2f7f1]";

const getStatusIconBlockClass = (accent) => {
  if (accent === "text-[#39ff14]") return "bg-[#39ff14]/16";
  if (accent === "text-[#ffc107]") return "bg-[#ffc107]/16";
  if (accent === "text-[#ff5f57]") return "bg-[#ff5f57]/16";
  if (accent === "text-white") return "bg-white/14";
  return "bg-white/12";
};

const getStatusLabelClass = (label) => {
  if (label.length >= 10) return "text-[0.66rem] md:text-[0.7rem] xl:text-[0.74rem]";
  if (label.length >= 8) return "text-[0.7rem] md:text-[0.74rem] xl:text-[0.8rem]";
  return "";
};

const statusCardBase =
  "pointer-events-auto flex h-[42px] min-h-[42px] min-w-0 overflow-hidden rounded-[1.05rem] border border-white/90 bg-[#383a3f] shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.24)]";

const StatusItem = React.memo(({ icon, value, label, accent, note }) => (
  <div className={statusCardBase}>
    <div className={cn("flex h-full w-[38px] shrink-0 items-center justify-center border-r border-white/10 px-1.5", getStatusIconBlockClass(accent))}>
      {React.createElement(icon, {
        className: cn("h-3.5 w-3.5", accent),
        strokeWidth: 2.5,
      })}
    </div>
    <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 px-2 py-0.5">
      <div className="min-w-0">
        <div className={cn(statusItemLabelClass, getStatusLabelClass(label))}>{label}</div>
        {note ? <div className="mt-0.5 text-[8px] font-medium text-white/60">{note}</div> : null}
      </div>
      <div className={statusItemValueClass}>{value}</div>
    </div>
  </div>
));

const StatusPanel = React.memo(({ title, items }) => (
  <div className="pointer-events-auto min-w-0 flex-1 rounded-[1.85rem] border border-white/16 bg-[rgba(56,58,63,0.96)] px-3 py-2.5 shadow-[0_18px_38px_rgba(0,0,0,0.26)] backdrop-blur-md">
    <div className="mb-1.5 px-1">
        <h2 className={statusPanelTitleClass}>{title}</h2>
    </div>
    <div className="grid auto-rows-fr gap-1 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatusItem key={item.label} {...item} />
      ))}
    </div>
  </div>
));

const ProductionBadge = React.memo(({ title, value }) => (
  <div className="pointer-events-auto flex h-[76px] w-56 flex-col justify-center rounded-2xl border border-white/8 bg-[#2a2b30] px-4 shadow-xl">
    <div className={cn(metaLabelClass, "text-[#74CD25]")}>
      {title}
    </div>
    <div className={cn("mt-2 truncate text-[26px] text-white", primaryValueClass)}>
      {value}
    </div>
  </div>
));

const ProductionItem = React.memo(({ label, value, toneColor, className }) => (
  <div className={cn("flex h-full min-h-[42px] min-w-0 items-center overflow-hidden rounded-[1.35rem] border border-white/8 bg-[#2c3238] shadow-lg shadow-black/15 transition-all hover:border-[#74CD25]/25", className)}>
    <div className={cn("flex flex-1 items-center overflow-hidden pl-4 pr-3 py-1.5 text-[#dce3d2] whitespace-nowrap", metaLabelClass)}>
      {label}
    </div>
    <div className={cn("m-1 flex h-[32px] min-w-[72px] shrink-0 items-center justify-center rounded-[0.95rem] px-3 text-sm text-white shadow-md", primaryValueClass, toneColor)}>
      {formatNumber(value)}
    </div>
  </div>
));

const bottomCardShellClass =
  "pointer-events-auto h-[196px] min-w-0 overflow-hidden rounded-3xl bg-[rgba(43,45,50,0.6)] shadow-2xl backdrop-blur-[3px]";
const bottomCardHeaderClass =
  "flex h-10 items-center justify-center bg-[#72757b] px-5";
const equipmentCardHeaderClass =
  "flex h-10 items-center justify-between bg-[#72757b] px-5";
const bottomCardTitleClass = `${cardTitleClass} text-white`;

const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="z-[9999] rounded-xl border border-[#74CD25]/30 bg-[#242529]/95 px-3 py-2 shadow-xl">
      <div className={cn("text-sm text-[#7fff3f]", primaryValueClass)}>{payload[0].value} L</div>
      <div className={cn(subtleTextClass, "text-white/70")}>{label}</div>
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
            className="w-full rounded-xl border border-white/10 bg-[#2d2e32]/90 py-3 pl-10 pr-4 text-xs font-semibold text-white shadow-2xl outline-none transition-all focus:border-[#74CD25] focus:ring-4 focus:ring-[#74CD25]/10 placeholder:text-gray-600"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        </div>

        {showResults ? (
          <div className="mt-2 overflow-hidden rounded-2xl border border-white/5 bg-[#1e1f22]/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between bg-white/5 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74CD25]">
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
                        <div className={cn("truncate text-sm text-white", contentValueClass)}>{vehicle.id}</div>
                        <div className={cn("mt-1 text-xs text-white/55", helperTextClass)}>{vehicle.idFms || "No device ID"}</div>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
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
                <div className={cn("border-t border-white/8 px-4 py-5 text-sm text-white/60", helperTextClass)}>
                  Kendaraan dengan vehicle_id tersebut belum ditemukan.
                </div>
              )}
            </div>

            {results.length > visibleResults.length ? (
              <div className={cn("border-t border-white/8 px-4 py-2 text-xs text-white/45", subtleTextClass)}>
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
    className={cn(bottomCardShellClass, "group flex flex-col transition-all hover:border-[#74CD25]/20")}
    onWheel={(event) => event.stopPropagation()}
  >
    <div className={bottomCardHeaderClass}>
        <h3 className={bottomCardTitleClass}>{title}</h3>
    </div>
    <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-2.5 pt-1.5">
      <div className={cn("mb-0 text-gray-500", metaLabelClass)}>{subtitle}</div>
      <div className="pointer-events-auto min-h-0 flex-1 pt-1">
        <div className="h-full w-full px-1 pb-1 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, left: 2, bottom: 2 }}>
              <CartesianGrid stroke="#5b5c60" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fill: "#d4d4d8", fontSize: 10 }} axisLine={false} tickLine={false} height={18} />
              <YAxis tick={{ fill: "#d4d4d8", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
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
  </div>
));

const TripRow = React.memo(({ trip }) => {
  const [liveDuration, setLiveDuration] = useState(() => {
    if (trip.isLive && trip.startTime) {
      const diffSecs = Math.max(0, Math.floor((Date.now() - trip.startTime) / 1000));
      const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const seconds = String(diffSecs % 60).padStart(2, '0');
      return `Durasi ${hours}:${minutes}:${seconds}`;
    }
    return "";
  });

  useEffect(() => {
    if (trip.isLive && trip.startTime) {
      const updateDuration = () => {
        const diffSecs = Math.max(0, Math.floor((Date.now() - trip.startTime) / 1000));
        const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
        const seconds = String(diffSecs % 60).padStart(2, '0');
        setLiveDuration(`Durasi ${hours}:${minutes}:${seconds}`);
      };
      
      updateDuration();
      const interval = setInterval(updateDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [trip.isLive, trip.startTime]);

  const durationText = trip.isLive ? liveDuration : trip.duration;

  return (
    <div className="flex items-start gap-2.5">
      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#8CFF2A]" />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-xs text-white", contentValueClass)}>
          {trip.route} {trip.isLive && <span className="ml-1 text-[10px] font-semibold text-[#74CD25]">(Live)</span>}
        </div>
        <div className={cn("mt-0.5 text-white/65", helperTextClass)}>{durationText || "Durasi -"}</div>
        <div className={cn("mt-0.5 text-white/45", subtleTextClass)}>{trip.time}</div>
      </div>
    </div>
  );
});

const TripInfoCard = React.memo(({ tripHistory }) => (
  <div className={bottomCardShellClass} onWheel={(event) => event.stopPropagation()}>
    <div className={bottomCardHeaderClass}>
      <h3 className={bottomCardTitleClass}>Info Trip</h3>
    </div>
    <div
      className="h-[136px] space-y-2.5 overflow-hidden p-3.5 custom-scrollbar overflow-y-auto"
      onWheel={(event) => event.stopPropagation()}
    >
      {tripHistory.length > 0 ? (
        tripHistory.map((trip) => (
          <TripRow key={trip.id} trip={trip} />
        ))
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-semibold text-white/30">
          Belum Ada Info Trip
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
      <div className={cn(metaLabelClass, "text-gray-500")}>{label}</div>
      <div className={cn("text-sm text-white", contentValueClass)}>{value}</div>
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
  }) => {
    const tripStatus = vehicle.statusTrip || vehicle.lastTripStatus || "-";

    return (
        <div
        className={cn(
          "pointer-events-auto absolute bottom-4 right-4 z-20 w-[360px] overflow-hidden rounded-3xl bg-[rgba(35,37,42,0.6)] shadow-2xl backdrop-blur-[3px] transition-all",
          isExpanded ? "max-h-[80vh]" : "h-[196px]"
        )}
      >
        <div className={cn("flex items-center justify-between", equipmentCardHeaderClass)}>
          <div className={bottomCardTitleClass}>Equipment</div>
          <div className="flex items-center gap-1">
            <button
              className={cn(
                "rounded-full p-1 text-white/85 transition hover:bg-white/10 hover:text-white",
                canGoPrev ? "" : "opacity-30 cursor-not-allowed"
              )}
              onClick={onPrev}
              disabled={!canGoPrev}
              title="Previous vehicle"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              className={cn(
                "rounded-full p-1 text-white/85 transition hover:bg-white/10 hover:text-white",
                canGoNext ? "" : "opacity-30 cursor-not-allowed"
              )}
              onClick={onNext}
              disabled={!canGoNext}
              title="Next vehicle"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="rounded-full p-1 text-white/85 transition hover:bg-white/10 hover:text-white"
              onClick={onToggleExpand}
              title={isExpanded ? "Hide detail" : "Show detail"}
            >
              <ChevronUp className={cn("h-4 w-4 transition-transform duration-300", isExpanded ? "rotate-180" : "")} />
            </button>
            <button
              className="rounded-full p-1 text-white/85 transition hover:bg-white/10 hover:text-white"
              onClick={onClose}
              title="Close vehicle panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className={cn("truncate text-lg uppercase text-[#74CD25]", primaryValueClass)}>{vehicle.name}</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className={cn("text-[42px] text-white", primaryValueClass)}>{Math.round(vehicle.speed || 0)}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">KM/H</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="h-[60px] w-20 rounded-xl border border-white/10 object-cover shadow-lg"
                loading="lazy"
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-white/8 pt-2">
            <div className="min-w-0">
              <div className={cn(metaLabelClass, "text-gray-500")}>Distance</div>
              <div className={cn("truncate text-[20px] text-white", contentValueClass)}>
                {formatDistance(vehicle)}
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className={cn(metaLabelClass, "text-gray-500")}>Fuel Capacity</div>
              <div className={cn("truncate text-[20px] text-white", contentValueClass)}>
                {formatFuelCapacity(vehicle)}
              </div>
            </div>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              isExpanded ? "max-h-[450px] pt-4 opacity-100" : "max-h-0 pt-0 opacity-0"
            )}
          >
            <DetailRow label="ID Alat" value={vehicle.idFms || `FMS-${vehicle.id}`} icon={Truck} />
            <DetailRow label="Nama Operator" value={vehicle.operatorName || "-"} icon={UserRound} />
            <DetailRow label="Nomor Unit" value={vehicle.unitNumber || vehicle.plateNumber || "-"} icon={Truck} />
            <DetailRow label="ID Operator" value={vehicle.operatorId || "-"} icon={UserRound} />
            <DetailRow label="Status Trip" value={tripStatus} icon={MapPin} />
            <DetailRow 
              label="Geofence" 
              value={vehicle.lastTripStatus === "On Trip" ? `${vehicle.lokasiAwal || "-"} - ${vehicle.lokasiAkhir || "-"}` : (vehicle.geofenceName || "-")} 
              icon={Map} 
            />
          </div>
        </div>
      </div>
    );
  }
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
          <div className={cn("truncate text-[13px] text-black", contentValueClass)}>{vehicle.name}</div>
          <div className={cn("text-gray-500", helperTextClass)}>{vehicle.plateNumber || "No. Plat"}</div>
          <span
            className={cn(
              "absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white shadow",
              vehicle.deviceStatus === "online"
                ? "bg-[#74CD25]"
                : vehicle.deviceStatus === "loss"
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
          >
            {vehicle.deviceStatus === "online" ? "Online" : vehicle.deviceStatus === "loss" ? "Loss" : "Offline"}
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

  const registeredVehicleIds = useMemo(
    () =>
      new Set(
        registeredAlat
          .map((item) => String(item.idFms || "").trim())
          .filter(Boolean)
      ),
    [registeredAlat]
  );

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
      .filter((vehicle) => registeredVehicleIds.has(String(vehicle.id || "").trim()))
      .map(v => {
        const registration = registeredAlat.find(a => a.idFms === v.id);
        const mqttVehicle = rawVehicles[v.id];
        const useLiveGps = mqttVehicle?.gpsValid === true;

        let mappedLokasiAwal = mqttVehicle?.lokasiAwal || "-";
        
        if ((mqttVehicle?.statusTrip === "On Trip" || v.statusTrip === "On Trip") && v.id) {
            if (mqttVehicle?.lastCompletedTripLocation && mqttVehicle.lastCompletedTripLocation !== "-") {
                mappedLokasiAwal = mqttVehicle.lastCompletedTripLocation;
            } else {
                const previousTrip = tripEntries.find(t => t.idAlat === v.id);
                if (previousTrip && previousTrip.lokasiFinish && previousTrip.lokasiFinish !== "-") {
                    mappedLokasiAwal = previousTrip.lokasiFinish;
                }
            }
        }

        return {
          ...v,
          lat: useLiveGps ? mqttVehicle.lat : v.lat,
          lng: useLiveGps ? mqttVehicle.lng : v.lng,
          speed: mqttVehicle?.speed ?? v.speed,
          heading: mqttVehicle?.heading ?? v.heading,
          status: normalizeDeviceStatus(mqttVehicle?.status || v.status, "offline"),
          deviceStatus: mqttVehicle?.deviceStatus || normalizeDeviceStatus(mqttVehicle?.gpsValid === false ? "loss" : (mqttVehicle?.status || v.status), "offline"),
          equipmentStatus: normalizeEquipmentDisplayStatus(mqttVehicle?.equipmentStatus || registration?.status || "online"),
          tripPath: mqttVehicle?.tripPath || v.tripPath || [],
          lastTripStatus: mqttVehicle?.lastTripStatus || v.lastTripStatus || "End Trip",
          tripCount: mqttVehicle?.tripCount ?? v.tripCount ?? 0,
          statusTrip: mqttVehicle?.statusTrip || mqttVehicle?.operator_input?.status_trip || v.statusTrip || "-",
          operatorName: mqttVehicle?.operatorName || v.operatorName || "-",
          operatorId: mqttVehicle?.operatorId || v.operatorId || "-",
          distance: mqttVehicle?.distance ?? mqttVehicle?.tripDistance ?? mqttVehicle?.distanceKm ?? v.distance ?? v.tripDistance ?? v.distanceKm ?? "-",
          fuelCapacity: registration?.kapasitasTangki ?? mqttVehicle?.fuelCapacity ?? mqttVehicle?.kapasitasTangki ?? v.fuelCapacity ?? v.kapasitasTangki ?? "-",
          tripStartTime: mqttVehicle?.tripStartTime ?? v.tripStartTime ?? null,
          lokasiAwal: mappedLokasiAwal,
          lokasiAkhir: mqttVehicle?.lokasiAkhir || "-",
          jenisMuatan: mqttVehicle?.jenisMuatan || "-",
          image: registration?.gambar ? resolveBackendUrl(registration.gambar) : '/assets/selected-vehicle.png',
          name: registration?.noUnit || v.name || v.id,
          unitNumber: registration?.noUnit || "-",
          plateNumber: registration?.noUnit || registration?.noPlat || v.plateNumber || v.id,
        };
      });
  }, [influxVehicles, rawVehicles, registeredAlat, registeredVehicleIds]);

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
          route: `${trip.lokasiStart || "-"} - ${trip.lokasiFinish || "-"}`,
          duration: trip.durasi ? `Durasi ${trip.durasi}` : "Durasi -",
          time: formatClockTime(displayTime),
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

  const displayTripHistory = useMemo(() => {
    if (!currentVehicle) return [];
    const history = [...realTripHistory];
    
    if (currentVehicle.lastTripStatus === "On Trip") {
      history.unshift({
        id: "live-trip-" + currentVehicle.id + "-" + currentVehicle.tripStartTime,
        route: `${currentVehicle.lokasiAwal || "-"} - ${currentVehicle.lokasiAkhir || "-"}`,
        isLive: true,
        startTime: currentVehicle.tripStartTime,
        time: "Sedang Berlangsung"
      });
    }
    
    return history.slice(0, 4);
  }, [realTripHistory, currentVehicle]);

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
    const onCount = vehicleData.filter((vehicle) => vehicle.deviceStatus === "online").length;
    const offCount = vehicleData.filter((vehicle) => vehicle.deviceStatus === "offline").length;
    const lossCount = vehicleData.filter((vehicle) => vehicle.deviceStatus === "loss").length;
    
    return [
      { icon: Power, value: onCount, label: "On", accent: "text-[#39ff14]" },
      { icon: AlertTriangle, value: lossCount, label: "Loss", accent: "text-[#ffc107]" },
      { icon: WifiOff, value: offCount, label: "Off", accent: "text-[#ff5f57]" },
      { icon: Monitor, value: vehicleData.length, label: "Total", accent: "text-white" },
    ];
  }, [vehicleData]);

  const equipmentItems = useMemo(() => {
    const normalizedEquipment = registeredAlat.map((item) => {
      const mqttVehicle = rawVehicles[item.idFms];
      return normalizeEquipmentDisplayStatus(mqttVehicle?.equipmentStatus || item.status || "online");
    });
    const availableCount = normalizedEquipment.filter((status) => status === "Available").length;
    const maintenanceCount = normalizedEquipment.filter((status) => status === "Maintenance").length;
    const breakdownCount = normalizedEquipment.filter((status) => status === "Breakdown").length;
    
    return [
      { icon: Truck, value: availableCount, label: "On", accent: "text-[#39ff14]" },
      { icon: Truck, value: maintenanceCount, label: "Pasif", accent: "text-[#ffc107]" },
      { icon: Truck, value: breakdownCount, label: "Off", accent: "text-[#ff5f57]" },
      { icon: Truck, value: registeredAlat.length, label: "Total", accent: "text-white" },
    ];
  }, [rawVehicles, registeredAlat]);

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
    <PageLayout noScroll={true} className="p-4 font-sans">
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
          <div>
            <div className="grid gap-4 xl:grid-cols-2">
              <StatusPanel title="Device Status" items={deviceItems} />
              <StatusPanel title="Equipment Status" items={equipmentItems} />
            </div>

            <div className="mt-2 flex items-start gap-4">
              <div className="flex flex-col gap-2">
                <ProductionItem
                  className="w-56"
                  label="Total Material"
                  value={influxSummary?.total_produksi || 0}
                  toneColor="bg-[#5FA81E]"
                />
                <ProductionBadge title="Konsumsi BBM" value={`${formatNumber(influxSummary?.konsumsi_bbm || 0)} L`} />
              </div>

              <div className="min-w-0 flex flex-1 flex-col gap-1">
                <div className="grid max-h-[132px] grid-cols-[repeat(auto-fit,minmax(176px,1fr))] auto-rows-fr gap-3 overflow-y-auto pr-1 custom-scrollbar">
                  {produksiItems.map((item) => (
                    <ProductionItem key={item.label} label={item.label} value={item.value} toneColor={item.toneColor} />
                  ))}
                </div>

                <div className="pointer-events-auto flex justify-end">
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
                <TripInfoCard tripHistory={displayTripHistory} />
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
