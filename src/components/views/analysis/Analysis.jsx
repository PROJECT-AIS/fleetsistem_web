import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calendar,
  Droplets,
  Layers,
  RefreshCw,
  Route,
  Truck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../../layout/PageLayout";
import api from "../../../services/api";
import { dataTripService } from "../../../services/configService";
import {
  analysisGroupedHeaderCellClass,
  analysisBodyCellClass,
  analysisBodyClass,
  analysisHeaderCellClass,
  analysisHeaderRowClass,
  analysisSubHeaderCellClass,
  analysisSubHeaderRowClass,
  analysisTableClass,
  analysisTableHeadClass,
  analysisTableScrollClass,
  analysisTableShellClass,
  analysisRowClass,
  getStripedRowStyle,
} from "../shared/tableStyles";
import { influxService } from "../../../services/influxService";
import { shiftCodeService } from "../../../services/configService";

const cn = (...classes) => classes.filter(Boolean).join(" ");
const numberFormatter = new Intl.NumberFormat("id-ID");

const SCOPE_OPTIONS = [
  { value: "all", label: "All Unit" },
  { value: "unit", label: "Spesifik Unit" },
];

const MATERIAL_COLORS = ["#78d72b", "#35b8ff", "#7b7cff", "#eb67b1", "#f59e0b", "#14b8a6"];

const ACCENT_STYLES = {
  green: {
    chip: "border-[#8BFF2A]/20 bg-[#8BFF2A]/14 text-[#8BFF2A]",
    icon: "bg-[#8BFF2A]/14 text-[#8BFF2A]",
    note: "text-[#8BFF2A]",
  },
  cyan: {
    chip: "border-[#37c7ff]/20 bg-[#37c7ff]/14 text-[#37c7ff]",
    icon: "bg-[#37c7ff]/14 text-[#37c7ff]",
    note: "text-[#37c7ff]",
  },
  indigo: {
    chip: "border-[#8d88ff]/20 bg-[#8d88ff]/14 text-[#8d88ff]",
    icon: "bg-[#8d88ff]/14 text-[#8d88ff]",
    note: "text-[#8d88ff]",
  },
  pink: {
    chip: "border-[#ff6bb7]/20 bg-[#ff6bb7]/14 text-[#ff6bb7]",
    icon: "bg-[#ff6bb7]/14 text-[#ff6bb7]",
    note: "text-[#ff6bb7]",
  },
};

const chartGridClass = "stroke-[#333842]";
const chartTickClass = { fill: "#7f8794", fontSize: 9, fontWeight: 700 };

const formatNumber = (value) => numberFormatter.format(Number(value || 0));
const normalizeText = (value) => String(value || "").trim().toLowerCase();

const truncateText = (value, maxLength = 14) => {
  const normalized = String(value || "-").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, Math.max(1, maxLength - 3))}...` : normalized;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractClockTime = (value) => {
  if (value == null) return "";

  const normalized = String(value).trim();
  if (!normalized) return "";

  const isoMatch = normalized.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];

  const plainTimeMatch = normalized.match(/\b(\d{2}:\d{2}:\d{2})\b/);
  if (plainTimeMatch) return plainTimeMatch[1];

  return "";
};

const parseDurationToSeconds = (value) => {
  if (value == null) return 0;

  const normalized = String(value).trim();
  if (!normalized || normalized === "-") return 0;

  const parts = normalized.split(":").map((part) => Number(part));
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }

  return 0;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";

  const safeSeconds = Math.floor(seconds);
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

const toDateKey = (value) => {
  if (value == null) return "-";

  const normalized = String(value).trim();
  if (!normalized) return "-";

  const directMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (directMatch) return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;

  const parsed = parseDate(normalized);
  if (!parsed) return normalized;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTableDate = (value) => {
  const dateKey = toDateKey(value);
  const parsed = parseDate(`${dateKey}T00:00:00`);
  if (!parsed) return dateKey;

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
};

const toMinutesFromClock = (value) => {
  const clock = extractClockTime(value);
  if (!clock) return null;

  const [hours, minutes] = clock.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
};

const parseShiftRange = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;

  const matches = [...normalized.matchAll(/(\d{1,2}:\d{2})/g)].map((match) => match[1]);
  if (matches.length < 2) return null;

  const start = toMinutesFromClock(matches[0]);
  const end = toMinutesFromClock(matches[1]);
  if (start == null || end == null) return null;

  return { start, end };
};

const isMinutesWithinRange = (minutes, range) => {
  if (minutes == null || !range) return false;
  if (range.start <= range.end) return minutes >= range.start && minutes <= range.end;
  return minutes >= range.start || minutes <= range.end;
};

const resolveShiftCode = (value, shiftCodeRows) => {
  const minutes = toMinutesFromClock(value);
  if (minutes == null) return "-";

  for (const shiftRow of shiftCodeRows) {
    const range = parseShiftRange(shiftRow?.rentangWaktu);
    if (isMinutesWithinRange(minutes, range)) {
      return shiftRow?.kodeShift || shiftRow?.namaShift || "-";
    }
  }

  return "-";
};

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};

const TABLE_MATERIAL_COLUMNS = [
  { key: "topSoil", label: "TOP SOIL", aliases: ["top soil", "topsoil"] },
  { key: "ob", label: "OB", aliases: ["ob", "overburden"] },
  { key: "limOre", label: "LIM ORE", aliases: ["lim ore", "limonite", "lim"] },
  { key: "sapOre", label: "SAP ORE", aliases: ["sap ore", "saprolite", "sap"] },
  { key: "civilQuarry", label: "CIVIL QUARRY", aliases: ["civil quarry", "quarry"] },
  { key: "coal", label: "COAL", aliases: ["coal"] },
  { key: "slag", label: "SLAG", aliases: ["slag"] },
];

const getMaterialBucketKey = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "otherMaterial";

  for (const column of TABLE_MATERIAL_COLUMNS) {
    if (column.aliases.some((alias) => normalized.includes(alias))) {
      return column.key;
    }
  }

  return "otherMaterial";
};

const startOfWeek = (date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

const isWithinRange = (timestamp, start, end) => Boolean(timestamp && timestamp >= start && timestamp < end);

const getDashboardPeriodRange = (period) => {
  const now = new Date();

  if (period === "weekly") {
    const start = startOfWeek(now);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  if (period === "daily") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }

  const end = new Date(now);
  end.setMinutes(0, 0, 0);
  end.setHours(now.getHours() + 1);
  const start = new Date(end);
  start.setHours(end.getHours() - 7);
  return { start, end };
};

const buildDashboardBuckets = (period) => {
  const now = new Date();

  if (period === "weekly") {
    const start = startOfWeek(now);
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + index);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketStart.getDate() + 1);
      return {
        label: bucketStart.toLocaleDateString("id-ID", { weekday: "short" }),
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  if (period === "daily") {
    return Array.from({ length: 8 }, (_, index) => {
      const bucketStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), index * 3, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(bucketStart.getHours() + 3);
      return {
        label: `${String(bucketStart.getHours()).padStart(2, "0")}:00`,
        start: bucketStart,
        end: bucketEnd,
      };
    });
  }

  const alignedEnd = new Date(now);
  alignedEnd.setMinutes(0, 0, 0);
  alignedEnd.setHours(now.getHours() + 1);

  return Array.from({ length: 7 }, (_, index) => {
    const bucketStart = new Date(alignedEnd);
    bucketStart.setHours(alignedEnd.getHours() - (7 - index));
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setHours(bucketStart.getHours() + 1);
    return {
      label: `${String(bucketStart.getHours()).padStart(2, "0")}:00`,
      start: bucketStart,
      end: bucketEnd,
    };
  });
};

const getFieldValue = (row, key) => {
  const value = row[key];
  if (value == null) return "-";
  if (typeof value === "string" && !value.trim()) return "-";
  return value;
};

const normalizeLabel = (value, fallback = "-") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const isActiveTripStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized.includes("on") || normalized.includes("aktif") || normalized.includes("start");
};

const isActiveLogRow = (row) =>
  isActiveTripStatus(row.statusTrip) ||
  String(row.statusAlat || "").trim().toLowerCase().includes("aktif") ||
  Number(row.speed || 0) > 0;

const DashboardTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#1f2228] px-3 py-2.5 shadow-[0_14px_28px_rgba(0,0,0,0.3)]">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8d97a6]">{label}</div>
      <div className="space-y-2">
        {payload.map((item) => (
          <div key={`${item.dataKey}-${item.name}`} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
              <span className="truncate font-semibold text-[#d4d8df]">{item.name}</span>
            </div>
            <span className="font-black text-white">
              {formatNumber(item.value)}
              {item.unit || ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ accent = "green", icon: Icon, eyebrow, value, description, note }) => {
  const accentStyle = ACCENT_STYLES[accent] || ACCENT_STYLES.green;

  return (
    <div className="flex h-full min-h-[122px] flex-col justify-between rounded-[22px] border border-white/8 bg-[#292c31] p-3.5 shadow-[0_14px_28px_rgba(0,0,0,0.22)]">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]", accentStyle.chip)}>
            {eyebrow}
          </span>
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[16px] border border-white/6", accentStyle.icon)}>
            {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
          </span>
        </div>
        <div>
          <div className="text-[1.8rem] font-black leading-none tracking-tight text-white">{value}</div>
          <div className="mt-1.5 text-[13px] font-semibold text-[#8d97a6]">{description}</div>
          {note ? <div className={cn("mt-1 text-[11px] font-black uppercase tracking-[0.14em]", accentStyle.note)}>{note}</div> : null}
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, subtitle, icon: Icon, accent = "green", className = "", children }) => {
  const accentStyle = ACCENT_STYLES[accent] || ACCENT_STYLES.green;

  return (
    <div className={cn("flex h-full min-h-0 flex-col rounded-[22px] border border-white/8 bg-[#292c31] p-3.5 shadow-[0_14px_28px_rgba(0,0,0,0.22)]", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1rem] font-black leading-none tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#727b88]">{subtitle}</p>
        </div>
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-[16px] border border-white/6", accentStyle.icon)}>
          {React.createElement(Icon, { className: "h-3.5 w-3.5" })}
        </span>
      </div>
      {children}
    </div>
  );
};

const ChartEmptyState = ({ label }) => (
  <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed border-white/8 bg-[#24272d] text-sm font-semibold text-[#717784]">
    {label}
  </div>
);

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const [scope, setScope] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedOperator, setSelectedOperator] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tripRows, setTripRows] = useState([]);
  const [logRows, setLogRows] = useState([]);
  const [historyRows, setHistoryRows] = useState([]);
  const [shiftCodeRows, setShiftCodeRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const viewMode = searchParams.get("view") === "table" ? "table" : "chart";

  const fetchAnalysisData = useCallback(async (withLoading = true) => {
    try {
      if (withLoading) setLoading(true);
      setRefreshing(true);

      const [tripRes, logRes, historyRes, shiftCodeRes] = await Promise.all([
        dataTripService.getAll(),
        api.get("/datalog"),
        influxService.getHistory({ limit: 1500 }),
        shiftCodeService.getAll(),
      ]);

      const normalizedTrips = (tripRes.data?.data || []).map((row) => {
        const timestamp =
          parseDate(row.waktuFinish) ||
          parseDate(row.createdAt) ||
          parseDate(row.updatedAt) ||
          parseDate(row.tanggal);

        return {
          id: row.id,
          unit: row.idAlat || "-",
          trip: row.trip || "-",
          dateKey: toDateKey(row.tanggal || row.waktuFinish || timestamp),
          displayDate: formatTableDate(row.tanggal || row.waktuFinish || timestamp),
          operator: row.namaOperator || "-",
          operatorId: row.idOperator || "-",
          material: row.jenisMuatan || "-",
          startLocation: row.lokasiStart || "-",
          finishLocation: row.lokasiFinish || "-",
          startTime: row.waktuStart || "-",
          finishTime: row.waktuFinish || "-",
          duration: row.durasi || "-",
          timestamp,
        };
      });

      const normalizedLogs = (logRes.data?.data || []).map((row, index) => ({
        id: row.id || `${row.idAlat || "unit"}-${index}`,
        unit: row.idAlat || "-",
        operator: row.namaOperator || "-",
        operatorId: row.idOperator || "-",
        material: row.jenisMuatan || "-",
        statusTrip: row.statusTrip || "-",
        statusAlat: row.statusAlat || "-",
        fuel: Number(row.konsumsiFuel || 0),
        speed: Number(row.kecepatan || 0),
        latitude: row.latitude || "-",
        longitude: row.longitude || "-",
        timestamp: parseDate(row.waktu),
      }));

      const normalizedHistory = (historyRes.data?.data || []).map((row, index) => {
        const timestamp = parseDate(row.waktu);
        return {
          id: row.seq || `${row.idAlat || "alat"}-${index}`,
          tripId: row.gps?.trip || "-",
          unit: row.idAlat || row.unitKendaraan || "-",
          operator: row.operator?.nama || "-",
          operatorId: row.operator?.id || "-",
          material: row.jenisMuatan || "-",
          payloadStatus: row.statusMuatan || "-",
          dateKey: toDateKey(row.waktu),
          displayDate: formatTableDate(row.waktu),
          timeValue: row.waktu || "-",
          speed: Number(row.kecepatanKendaraan || 0),
          fuel: Number(row.sensorFuel?.konsumsi || 0),
          latitude: toNumber(row.gps?.latitude),
          longitude: toNumber(row.gps?.longitude),
          activeDurationSeconds: parseDurationToSeconds(row.statusUnit?.totalDurasiAktif),
          passiveDurationSeconds: parseDurationToSeconds(row.statusUnit?.totalWaktuPasif),
          deadIndicator: String(row.statusUnit?.mati || "").trim().toLowerCase(),
          timestamp,
        };
      });

      setTripRows(normalizedTrips);
      setLogRows(normalizedLogs);
      setHistoryRows(normalizedHistory);
      setShiftCodeRows(Array.isArray(shiftCodeRes.data?.data) ? shiftCodeRes.data.data : []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysisData(true);
    const interval = setInterval(() => fetchAnalysisData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalysisData]);

  const allRows = useMemo(() => [...tripRows, ...logRows], [tripRows, logRows]);

  const unitOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.unit).filter(Boolean))).sort((a, b) => a.localeCompare(b, "id")),
    [allRows]
  );

  const operatorOptions = useMemo(
    () => Array.from(new Set(allRows.map((row) => row.operator).filter(Boolean))).sort((a, b) => a.localeCompare(b, "id")),
    [allRows]
  );

  useEffect(() => {
    if (scope === "unit" && selectedUnit === "all" && unitOptions.length > 0) {
      setSelectedUnit(unitOptions[0]);
      return;
    }

    if (selectedUnit !== "all" && unitOptions.length > 0 && !unitOptions.includes(selectedUnit)) {
      setSelectedUnit(scope === "unit" ? unitOptions[0] : "all");
    }
  }, [scope, selectedUnit, unitOptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, scope, selectedUnit, selectedOperator, dateFrom, dateTo]);

  const fromBoundary = useMemo(
    () => (dateFrom ? new Date(`${dateFrom}T00:00:00`) : null),
    [dateFrom]
  );

  const toBoundary = useMemo(
    () => (dateTo ? new Date(`${dateTo}T23:59:59`) : null),
    [dateTo]
  );

  const matchesFilters = useCallback((row) => {
    const matchesUnit =
      scope === "unit"
        ? row.unit === selectedUnit
        : selectedUnit === "all"
          ? true
          : row.unit === selectedUnit;

    const matchesOperator = selectedOperator === "all" ? true : row.operator === selectedOperator;
    const rowDate = row.timestamp;
    const fromMatch = fromBoundary ? (rowDate ? rowDate >= fromBoundary : false) : true;
    const toMatch = toBoundary ? (rowDate ? rowDate <= toBoundary : false) : true;

    return matchesUnit && matchesOperator && fromMatch && toMatch;
  }, [fromBoundary, scope, selectedOperator, selectedUnit, toBoundary]);

  const filteredTripRows = useMemo(
    () => tripRows.filter(matchesFilters),
    [tripRows, matchesFilters]
  );

  const filteredLogRows = useMemo(
    () => logRows.filter(matchesFilters),
    [logRows, matchesFilters]
  );

  const filteredHistoryRows = useMemo(
    () => historyRows.filter(matchesFilters),
    [historyRows, matchesFilters]
  );

  const dashboardPeriod = "realtime";
  const dashboardRange = useMemo(() => getDashboardPeriodRange(dashboardPeriod), []);
  const dashboardBuckets = useMemo(() => buildDashboardBuckets(dashboardPeriod), []);

  const dashboardTripRows = useMemo(
    () => filteredTripRows.filter((row) => isWithinRange(row.timestamp, dashboardRange.start, dashboardRange.end)),
    [dashboardRange.end, dashboardRange.start, filteredTripRows]
  );

  const dashboardLogRows = useMemo(
    () => filteredLogRows.filter((row) => isWithinRange(row.timestamp, dashboardRange.start, dashboardRange.end)),
    [dashboardRange.end, dashboardRange.start, filteredLogRows]
  );

  const dashboardSummary = useMemo(() => {
    const totalProduction = dashboardTripRows.length;
    const averageFuel = dashboardLogRows.length
      ? Math.round(dashboardLogRows.reduce((sum, row) => sum + row.fuel, 0) / dashboardLogRows.length)
      : 0;
    const activeFleet = new Set(dashboardLogRows.filter(isActiveLogRow).map((row) => row.unit).filter(Boolean)).size;
    const tripAggregation = dashboardTripRows.length;

    return [
      {
        eyebrow: "Total Produksi",
        value: formatNumber(totalProduction),
        description: "Accumulated material movement",
        note: "Window realtime",
        icon: Layers,
        accent: "green",
      },
      {
        eyebrow: "Rata-rata BBM",
        value: `${formatNumber(averageFuel)} L`,
        description: "Rata-rata penggunaan BBM",
        note: `${formatNumber(dashboardLogRows.length)} log terproses`,
        icon: Droplets,
        accent: "cyan",
      },
      {
        eyebrow: "Active Fleet",
        value: formatNumber(activeFleet),
        description: "Units in operation",
        note: `${formatNumber(new Set(dashboardLogRows.map((row) => row.unit).filter(Boolean)).size)} unit tercatat`,
        icon: Truck,
        accent: "indigo",
      },
      {
        eyebrow: "Trip Aggregation",
        value: formatNumber(tripAggregation),
        description: "Total payload trips",
        note: `${formatNumber(new Set(dashboardTripRows.map((row) => row.operator).filter(Boolean)).size)} operator aktif`,
        icon: Route,
        accent: "pink",
      },
    ];
  }, [dashboardLogRows, dashboardTripRows]);

  const dashboardSeries = useMemo(() => {
    return dashboardBuckets.map((bucket) => {
      const tripsInBucket = dashboardTripRows.filter((row) => isWithinRange(row.timestamp, bucket.start, bucket.end));
      const logsInBucket = dashboardLogRows.filter((row) => isWithinRange(row.timestamp, bucket.start, bucket.end));

      return {
        label: bucket.label,
        fuel: logsInBucket.reduce((sum, row) => sum + row.fuel, 0),
        activeFleet: new Set(logsInBucket.filter(isActiveLogRow).map((row) => row.unit).filter(Boolean)).size,
        trips: tripsInBucket.length,
      };
    });
  }, [dashboardBuckets, dashboardLogRows, dashboardTripRows]);

  const materialCompositionData = useMemo(() => {
    const counts = dashboardTripRows.reduce((acc, row) => {
      const key = normalizeLabel(row.material, "Tanpa Material");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    const items = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total ? Math.round((value / total) * 100) : 0,
        color: MATERIAL_COLORS[index % MATERIAL_COLORS.length],
      }));

    return { items, total };
  }, [dashboardTripRows]);

  const materialProductionData = useMemo(() => {
    return Object.entries(
      dashboardTripRows.reduce((acc, row) => {
        const key = normalizeLabel(row.startLocation, "Lokasi Tidak Diketahui");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([location, total]) => ({
        location,
        shortLocation: truncateText(location, 12),
        total,
      }));
  }, [dashboardTripRows]);

  const tripEfficiencyMax = useMemo(
    () => Math.max(1, ...dashboardSeries.map((item) => Number(item.trips || 0))),
    [dashboardSeries]
  );

  const tableRows = useMemo(() => {
    const groups = new Map();

    const ensureGroup = (baseRow, shiftCode) => {
      const key = [
        baseRow.unit || "-",
        baseRow.dateKey || "-",
        shiftCode || "-",
        baseRow.operator || "-",
      ].join("|");

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          unit: baseRow.unit || "-",
          dateKey: baseRow.dateKey || "-",
          displayDate: baseRow.displayDate || formatTableDate(baseRow.dateKey),
          shiftCode: shiftCode || "-",
          operator: baseRow.operator || "-",
          tripEntries: [],
          historyEntries: [],
        });
      }

      return groups.get(key);
    };

    filteredTripRows.forEach((row) => {
      const shiftCode = resolveShiftCode(row.finishTime || row.startTime || row.timestamp || row.dateKey, shiftCodeRows);
      ensureGroup(row, shiftCode).tripEntries.push(row);
    });

    filteredHistoryRows.forEach((row) => {
      const shiftCode = resolveShiftCode(row.timeValue || row.timestamp || row.dateKey, shiftCodeRows);
      ensureGroup(row, shiftCode).historyEntries.push(row);
    });

    return Array.from(groups.values())
      .filter((group) => group.tripEntries.length > 0 || group.historyEntries.length > 0)
      .sort((a, b) => {
        if (a.dateKey !== b.dateKey) return String(b.dateKey).localeCompare(String(a.dateKey));
        if (a.unit !== b.unit) return String(a.unit).localeCompare(String(b.unit), "id");
        if (a.shiftCode !== b.shiftCode) return String(a.shiftCode).localeCompare(String(b.shiftCode), "id");
        return String(a.operator).localeCompare(String(b.operator), "id");
      })
      .map((group, index) => {
        const materialCounts = Object.fromEntries(TABLE_MATERIAL_COLUMNS.map((column) => [column.key, 0]));
        let otherMaterial = 0;

        group.tripEntries.forEach((tripRow) => {
          const bucketKey = getMaterialBucketKey(tripRow.material);
          if (bucketKey === "otherMaterial") {
            otherMaterial += 1;
          } else {
            materialCounts[bucketKey] += 1;
          }
        });

        const historyTripMap = new Map();
        group.historyEntries.forEach((historyRow) => {
          const tripKey = historyRow.tripId && historyRow.tripId !== "-" ? historyRow.tripId : `single-${historyRow.id}`;
          if (!historyTripMap.has(tripKey)) historyTripMap.set(tripKey, []);
          historyTripMap.get(tripKey).push(historyRow);
        });

        let totalDistanceKm = 0;
        let maxSpeed = 0;
        let speedSum = 0;
        let speedCount = 0;
        let totalFuel = 0;
        let totalActiveSeconds = 0;
        let totalPassiveSeconds = 0;
        let emptyTrips = 0;

        historyTripMap.forEach((entries) => {
          const sortedEntries = [...entries].sort((a, b) => {
            const aTime = a.timestamp?.getTime?.() || 0;
            const bTime = b.timestamp?.getTime?.() || 0;
            return aTime - bTime;
          });

          let previousPoint = null;
          let tripMaxFuel = 0;
          let tripActiveSeconds = 0;
          let tripPassiveSeconds = 0;
          let tripHasEmptyPayload = false;

          sortedEntries.forEach((entry) => {
            if (Number.isFinite(entry.speed)) {
              maxSpeed = Math.max(maxSpeed, entry.speed);
              speedSum += entry.speed;
              speedCount += 1;
            }

            tripMaxFuel = Math.max(tripMaxFuel, Number(entry.fuel || 0));
            tripActiveSeconds = Math.max(tripActiveSeconds, Number(entry.activeDurationSeconds || 0));
            tripPassiveSeconds = Math.max(tripPassiveSeconds, Number(entry.passiveDurationSeconds || 0));
            tripHasEmptyPayload = tripHasEmptyPayload || normalizeText(entry.payloadStatus) === "empty";

            if (entry.latitude != null && entry.longitude != null) {
              if (previousPoint) {
                totalDistanceKm += haversineDistanceKm(
                  previousPoint.latitude,
                  previousPoint.longitude,
                  entry.latitude,
                  entry.longitude
                );
              }
              previousPoint = { latitude: entry.latitude, longitude: entry.longitude };
            }
          });

          totalFuel += tripMaxFuel;
          totalActiveSeconds += tripActiveSeconds;
          totalPassiveSeconds += tripPassiveSeconds;
          if (tripHasEmptyPayload) emptyTrips += 1;
        });

        const averageSpeed = speedCount > 0 ? speedSum / speedCount : 0;
        const averageFuelPerHour = totalActiveSeconds > 0 ? totalFuel / (totalActiveSeconds / 3600) : 0;

        return {
          no: index + 1,
          idAlat: group.unit,
          tanggal: group.displayDate || "-",
          kodeShift: group.shiftCode || "-",
          operator: group.operator || "-",
          jarakTempuhKm: totalDistanceKm > 0 ? totalDistanceKm.toFixed(2) : "-",
          kecepatanTertinggi: maxSpeed > 0 ? Math.round(maxSpeed) : "-",
          kecepatanRataRata: averageSpeed > 0 ? averageSpeed.toFixed(1) : "-",
          totalTrip: group.tripEntries.length || 0,
          kosongTrip: emptyTrips || 0,
          ...materialCounts,
          otherMaterial,
          durasiAktif: formatDuration(totalActiveSeconds),
          durasiPasif: formatDuration(totalPassiveSeconds),
          durasiMati: "-",
          totalKonsumsiFuel: totalFuel > 0 ? totalFuel.toFixed(2) : "-",
          rataRataKonsumsiFuel: averageFuelPerHour > 0 ? averageFuelPerHour.toFixed(2) : "-",
        };
      });
  }, [filteredHistoryRows, filteredTripRows, shiftCodeRows]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return tableRows.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, tableRows]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / itemsPerPage));

  const rowSpanTableColumns = useMemo(() => ([
    { key: "no", label: "NO", className: "min-w-[58px] text-center" },
    { key: "idAlat", label: "ID_ALAT", className: "min-w-[120px]" },
    { key: "tanggal", label: "TANGGAL", className: "min-w-[128px] text-center" },
    { key: "kodeShift", label: "KODE_SHIFT", className: "min-w-[108px] text-center" },
    { key: "operator", label: "OPERATOR", className: "min-w-[148px]" },
    { key: "jarakTempuhKm", label: "JARAK TEMPUH (KM)", className: "min-w-[120px] text-center" },
    { key: "kecepatanTertinggi", label: "KECEPATAN TERTINGGI", className: "min-w-[126px] text-center" },
    { key: "kecepatanRataRata", label: "KECEPATAN RATA-RATA", className: "min-w-[126px] text-center" },
  ]), []);

  const groupedTableColumns = useMemo(() => ([
    { key: "totalTrip", label: "TOTAL", className: "min-w-[78px] text-center" },
    { key: "kosongTrip", label: "KOSONG", className: "min-w-[88px] text-center" },
    ...TABLE_MATERIAL_COLUMNS.map((column) => ({
      key: column.key,
      label: column.label,
      className: "min-w-[88px] text-center",
    })),
    { key: "otherMaterial", label: "MATERIAL LAINNYA", className: "min-w-[120px] text-center" },
  ]), []);

  const trailingTableColumns = useMemo(() => ([
    { key: "durasiAktif", label: "DURASI AKTIF", className: "min-w-[116px] text-center" },
    { key: "durasiPasif", label: "DURASI PASIF", className: "min-w-[116px] text-center" },
    { key: "durasiMati", label: "DURASI MATI", className: "min-w-[110px] text-center" },
    { key: "totalKonsumsiFuel", label: "TOTAL KONSUMSI FUEL", className: "min-w-[132px] text-center" },
    { key: "rataRataKonsumsiFuel", label: "RATA-RATA KONSUMSI FUEL (LITER PERJAM)", className: "min-w-[168px] text-center" },
  ]), []);

  const headingDescription = viewMode === "chart"
    ? "Ringkasan performa fleet, tren fuel, aktivitas unit, dan distribusi material."
    : "Mode tabel menampilkan detail trip berdasarkan filter unit, operator, dan rentang tanggal.";

  const dashboardScopeLabel = scope === "unit" && selectedUnit !== "all"
    ? `Unit ${selectedUnit}`
    : "Seluruh unit";

  return (
    <PageLayout noScroll={true} className="p-3 lg:p-4">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <div className="rounded-[24px] border border-white/8 bg-[#25282d] p-4 shadow-[0_16px_32px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="mt-2.5 text-[1.95rem] font-black leading-none tracking-tight text-white lg:text-[2.1rem]">
                  {viewMode === "chart" ? "Fleet Statistics" : "Analysis Table"}
                </h1>
                <p className="mt-1.5 max-w-3xl text-[13px] font-medium text-[#96a0ae]">
                  {headingDescription}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 xl:items-end">
                <button
                  type="button"
                  onClick={() => fetchAnalysisData(true)}
                  disabled={refreshing}
                  className="inline-flex h-10 w-10 items-center justify-center self-start rounded-[16px] border border-white/6 bg-[#30343a] text-[#94a0ae] transition-all hover:bg-[#373c43] hover:text-white disabled:opacity-40 xl:self-end"
                  title="Refresh analysis"
                >
                  <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                </button>

                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#737b88]">
                  {lastUpdated ? `Last sync ${lastUpdated.toLocaleTimeString("id-ID")}` : "Menunggu sinkronisasi data"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
              <select
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value);
                  if (event.target.value === "all") {
                    setSelectedUnit("all");
                  }
                }}
                className="rounded-[16px] border border-white/8 bg-[#2a2d32] px-4 py-2.5 text-sm font-semibold text-white outline-none transition-all focus:border-[#8BFF2A]/40"
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
                className="rounded-[16px] border border-white/8 bg-[#2a2d32] px-4 py-2.5 text-sm font-semibold text-white outline-none transition-all focus:border-[#8BFF2A]/40"
              >
                <option value="all">Semua Unit</option>
                {unitOptions.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>

              <select
                value={selectedOperator}
                onChange={(event) => setSelectedOperator(event.target.value)}
                className="rounded-[16px] border border-white/8 bg-[#2a2d32] px-4 py-2.5 text-sm font-semibold text-white outline-none transition-all focus:border-[#8BFF2A]/40"
              >
                <option value="all">Semua Operator</option>
                {operatorOptions.map((operator) => (
                  <option key={operator} value={operator}>{operator}</option>
                ))}
              </select>

              <div className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727b88]" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full rounded-[16px] border border-white/8 bg-[#2a2d32] py-2.5 pl-11 pr-4 text-sm font-semibold text-white outline-none transition-all focus:border-[#8BFF2A]/40"
                />
              </div>

              <div className="relative">
                <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#727b88]" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full rounded-[16px] border border-white/8 bg-[#2a2d32] py-2.5 pl-11 pr-4 text-sm font-semibold text-white outline-none transition-all focus:border-[#8BFF2A]/40"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-white/8 bg-[#292c31] shadow-[0_16px_32px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3 text-sm font-bold text-[#c9d0da]">
                <RefreshCw className="h-4 w-4 animate-spin text-[#8BFF2A]" />
                Memuat data analisis...
              </div>
            </div>
          ) : viewMode === "chart" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 xl:overflow-hidden">
              <div className="grid shrink-0 auto-rows-fr gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {dashboardSummary.map((item) => (
                  <MetricCard key={item.eyebrow} {...item} />
                ))}
              </div>

              <div className="grid min-h-0 flex-[1.02] auto-rows-fr items-stretch gap-3 2xl:grid-cols-4">
                <DashboardCard
                  title="Material Composition"
                  subtitle={`Based on payload type | ${dashboardScopeLabel}`}
                  icon={Layers}
                  accent="green"
                  className="min-h-0 2xl:col-span-2"
                >
                  <div className="grid h-full min-h-0 items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="relative min-h-0">
                      {materialCompositionData.items.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={materialCompositionData.items}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="63%"
                                outerRadius="92%"
                                paddingAngle={3}
                                stroke="none"
                              >
                                {materialCompositionData.items.map((item) => (
                                  <Cell key={item.name} fill={item.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<DashboardTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#6d7481]">Total Vol</span>
                            <span className="mt-1 text-[2rem] font-black leading-none text-white">
                              {formatNumber(materialCompositionData.total)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <ChartEmptyState label="Belum ada komposisi material pada filter aktif." />
                      )}
                    </div>

                    <div className="space-y-1.5 overflow-y-auto">
                      {materialCompositionData.items.length > 0 ? (
                        materialCompositionData.items.map((item) => (
                          <div key={item.name} className="flex items-center justify-between gap-3 rounded-[16px] border border-white/6 bg-[#24272d] px-3 py-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="truncate text-sm font-semibold text-[#d7dbe3]">{item.name}</span>
                            </div>
                            <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-black text-white">
                              {item.percentage}%
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/8 px-4 py-6 text-center text-sm font-semibold text-[#717784]">
                          Data material belum tersedia.
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>

                <DashboardCard
                  title="Fuel Consumption"
                  subtitle={`Usage trend | ${dashboardScopeLabel}`}
                  icon={Droplets}
                  accent="cyan"
                  className="min-h-0 2xl:col-span-2"
                >
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardSeries} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid className={chartGridClass} vertical={false} strokeDasharray="4 4" />
                        <XAxis dataKey="label" tick={chartTickClass} axisLine={false} tickLine={false} />
                        <YAxis tick={chartTickClass} axisLine={false} tickLine={false} width={28} />
                        <Tooltip content={<DashboardTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="fuel"
                          name="Fuel"
                          unit=" L"
                          stroke="#38bdf8"
                          strokeWidth={3}
                          fill="#38bdf8"
                          fillOpacity={0.12}
                          activeDot={{ r: 4, fill: "#38bdf8" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>
              </div>

              <div className="grid min-h-0 flex-1 auto-rows-fr items-stretch gap-3 xl:grid-cols-3">
                <DashboardCard
                  title="Fleet Activity"
                  subtitle={`Active vehicles | ${dashboardScopeLabel}`}
                  icon={Truck}
                  accent="green"
                  className="min-h-0"
                >
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardSeries} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid className={chartGridClass} vertical={false} strokeDasharray="4 4" />
                        <XAxis dataKey="label" tick={chartTickClass} axisLine={false} tickLine={false} />
                        <YAxis tick={chartTickClass} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                        <Tooltip content={<DashboardTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="activeFleet"
                          name="Active Fleet"
                          stroke="#78d72b"
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 4, fill: "#78d72b" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                <DashboardCard
                  title="Trip Efficiency"
                  subtitle={`Trips trend | ${dashboardScopeLabel}`}
                  icon={Route}
                  accent="pink"
                  className="min-h-0"
                >
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardSeries} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid className={chartGridClass} vertical={false} strokeDasharray="4 4" />
                        <XAxis dataKey="label" tick={chartTickClass} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={chartTickClass}
                          axisLine={false}
                          tickLine={false}
                          width={28}
                          allowDecimals={false}
                          domain={[0, tripEfficiencyMax]}
                        />
                        <Tooltip content={<DashboardTooltip />} />
                        <Bar
                          dataKey="trips"
                          name="Trips"
                          fill="#eb67b1"
                          radius={[10, 10, 0, 0]}
                          minPointSize={4}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                <DashboardCard
                  title="Material Production"
                  subtitle={`From entry parameter location | ${dashboardScopeLabel}`}
                  icon={BarChart3}
                  accent="green"
                  className="min-h-0"
                >
                  <div className="flex-1 min-h-0">
                    {materialProductionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={materialProductionData} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                          <CartesianGrid className={chartGridClass} vertical={false} strokeDasharray="4 4" />
                          <XAxis
                            dataKey="shortLocation"
                            tick={chartTickClass}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                          />
                          <YAxis tick={chartTickClass} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                          <Tooltip content={<DashboardTooltip />} />
                          <Bar dataKey="total" name="Trips" fill="#5ca11d" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ChartEmptyState label="Belum ada data produksi berdasarkan lokasi." />
                    )}
                  </div>
                </DashboardCard>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/8 bg-[#292c31] p-3.5 shadow-[0_14px_28px_rgba(0,0,0,0.22)]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                    Analysis Table
                  </h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a818d]">
                    {tableRows.length} data setelah filter
                  </p>
                </div>
              </div>

              <div className={cn(analysisTableShellClass, "flex min-h-0 flex-1 flex-col")}>
                <div className={cn(analysisTableScrollClass, "flex-1")}>
                  <table className={cn(analysisTableClass, "border-separate border-spacing-0")} style={{ minWidth: 2480 }}>
                    <thead className={analysisTableHeadClass}>
                      <tr className={analysisHeaderRowClass}>
                        {rowSpanTableColumns.map((column) => (
                          <th
                            key={column.key}
                            rowSpan={2}
                            className={cn(analysisHeaderCellClass, column.className)}
                          >
                            {column.label}
                          </th>
                        ))}
                        <th colSpan={groupedTableColumns.length} className={analysisGroupedHeaderCellClass}>
                          TRIP MUATAN
                        </th>
                        {trailingTableColumns.map((column) => (
                          <th
                            key={column.key}
                            rowSpan={2}
                            className={cn(analysisHeaderCellClass, column.className)}
                          >
                            {column.label}
                          </th>
                        ))}
                      </tr>
                      <tr className={analysisSubHeaderRowClass}>
                        {groupedTableColumns.map((column) => (
                          <th key={column.key} className={cn(analysisSubHeaderCellClass, column.className)}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={analysisBodyClass}>
                      {paginatedRows.length > 0 ? (
                        paginatedRows.map((row, index) => (
                          <tr key={row.key || `${row.idAlat}-${row.tanggal}-${row.operator}-${index}`} className={analysisRowClass} style={getStripedRowStyle(index)}>
                            {rowSpanTableColumns.map((column) => (
                              <td key={column.key} className={cn(analysisBodyCellClass, column.className)}>
                                {column.key === "no"
                                  ? (currentPage - 1) * itemsPerPage + index + 1
                                  : getFieldValue(row, column.key)}
                              </td>
                            ))}
                            {groupedTableColumns.map((column) => (
                              <td key={column.key} className={cn(analysisBodyCellClass, column.className)}>
                                {getFieldValue(row, column.key)}
                              </td>
                            ))}
                            {trailingTableColumns.map((column) => (
                              <td key={column.key} className={cn(analysisBodyCellClass, column.className)}>
                                {getFieldValue(row, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={rowSpanTableColumns.length + groupedTableColumns.length + trailingTableColumns.length}
                            className="px-4 py-10 text-center text-sm text-[#8f97a4]"
                          >
                            Tidak ada data yang sesuai dengan filter saat ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[#8f97a4]">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-2xl border border-white/8 bg-[#2d3137] px-4 py-2 text-sm font-bold text-white disabled:opacity-30"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-2xl border border-white/8 bg-[#2d3137] px-4 py-2 text-sm font-bold text-white disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
