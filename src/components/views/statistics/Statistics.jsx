import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Droplets,
  Layers,
  Route,
  Truck,
  Calendar,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  RefreshCw
} from "lucide-react";
import {
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
  Area,
  AreaChart
} from "recharts";
import PageLayout from "../../layout/PageLayout";
import { useMqttContext } from "../../../context/mqttContextValue";
import { influxService } from "../../../services/influxService";
import { dataTripService, lokasiService, materialTypeService } from "../../../services/configService";

const PERIOD_OPTIONS = [
  { key: "realtime", label: "Realtime", icon: Activity },
  { key: "today", label: "Hari Ini", icon: Clock },
  { key: "week", label: "Minggu Ini", icon: Calendar },
];

const THEME_GREEN_SERIES = [
  "#4A8516",
  "#5FA81E",
  "#74CD25",
  "#8AE035",
  "#6CBF23",
  "#3F7015",
];
const getThemeSeriesColor = (index) => THEME_GREEN_SERIES[index % THEME_GREEN_SERIES.length];

const numberFormatter = new Intl.NumberFormat("id-ID");

const cn = (...classes) => classes.filter(Boolean).join(" ");

const formatNumber = (value) => numberFormatter.format(Math.round(Number(value || 0)));
const normalizeText = (value) => String(value || "").trim().toLowerCase();
const shortDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const parseTripTimestamp = (trip) => {
  const rawDate = trip.createdAt || trip.updatedAt || trip.waktuFinish || trip.waktuStart || trip.tanggal;
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const parseStatTimestamp = (row) => {
  const rawDate = row.time || row.timestamp || row.bucketStart || row._time || null;
  if (!rawDate) return null;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1b1e]/90 p-4 shadow-2xl backdrop-blur-xl">
      <div className="mb-2 text-xs font-black uppercase tracking-widest text-gray-500">{label}</div>
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-[11px] font-bold text-gray-300 uppercase">{entry.name}</span>
            </div>
            <span className="text-xs font-black text-white">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, sublabel, accent, trend }) => (
  <div className="group relative h-full min-h-[112px] overflow-hidden rounded-2xl border border-white/5 bg-[#2d2e32]/80 p-4 transition-all hover:border-[#74CD25]/30 hover:bg-[#2d2e32] shadow-xl">
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#74CD25]/5 blur-3xl" />
    <div className="relative flex items-start justify-between">
      <div className="space-y-3">
        <div className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-1.5", accent)}>
          {React.createElement(icon, { className: "h-4 w-4" })}
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div>
          <div className="text-3xl font-black text-white tracking-tight">{value}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-gray-500">
            {sublabel}
            {trend && (
              <span className="flex items-center gap-0.5 text-[#74CD25]">
                <ArrowUpRight className="h-3 w-3" />
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const MaterialPieChart = ({ data, totalValue }) => (
  <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:items-center">
    {/* Chart Section */}
    <div className="relative mx-auto h-full min-h-[140px] min-w-0 flex-1 max-h-[180px] lg:max-h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="95%"
            paddingAngle={4}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                fillOpacity={0.85} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Label - Smaller for compact fit */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Total Vol</span>
        <span className="text-xl font-black text-white tracking-tighter">{formatNumber(totalValue)}</span>
      </div>
    </div>

    {/* More Compact Legend */}
    <div className="grid w-full shrink-0 grid-cols-1 gap-1 overflow-y-auto pr-1 custom-scrollbar max-h-[150px] lg:w-56 lg:max-h-[220px]">
      {data.map((item) => (
        <div 
          key={item.key} 
          className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-1.5"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-bold uppercase tracking-tight text-gray-400 truncate">
              {item.name}
            </span>
          </div>
          <span className="text-[10px] font-black text-white ml-2">{item.percent}%</span>
        </div>
      ))}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, icon: Icon, children }) => (
  <div 
    className={cn(
      "group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#2d2e32]/60 p-4 shadow-xl transition-all hover:border-[#74CD25]/20 hover:bg-[#2d2e32] backdrop-blur-md"
    )}
  >
    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[#74CD25]/5 blur-3xl" />
    <div className="mb-3 flex items-start justify-between relative z-10">
      <div className="min-w-0">
        <h2 className="text-sm font-black text-white tracking-tight leading-none mb-1 group-hover:text-[#74CD25] transition-colors truncate">{title}</h2>
        <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{subtitle}</p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#74CD25]/10 text-[#74CD25]">
        {React.createElement(Icon, { className: "h-4 w-4" })}
      </div>
    </div>
    <div className="flex-1 min-h-0 relative z-10">{children}</div>
  </div>
);

export default function Statistics() {
  const [activePeriod, setActivePeriod] = useState("realtime");
  const { rawVehicles } = useMqttContext();
  const [influxStats, setInfluxStats] = useState([]);
  const [lokasiEntries, setLokasiEntries] = useState([]);
  const [tripEntries, setTripEntries] = useState([]);
  const [materialTypeEntries, setMaterialTypeEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await influxService.getStatistics({ period: activePeriod });
      if (res.data && res.data.length > 0) {
        setInfluxStats(res.data);
      } else {
        setInfluxStats([]);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setInfluxStats([]);
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const fetchLocationSource = useCallback(async () => {
    try {
      const [lokasiRes, tripRes, materialTypeRes] = await Promise.all([
        lokasiService.getAll(),
        dataTripService.getAll(),
        materialTypeService.getAll(),
      ]);

      setLokasiEntries(Array.isArray(lokasiRes.data?.data) ? lokasiRes.data.data : []);
      setTripEntries(tripRes.data?.ok && Array.isArray(tripRes.data.data) ? tripRes.data.data : []);
      setMaterialTypeEntries(Array.isArray(materialTypeRes.data?.data) ? materialTypeRes.data.data : []);
    } catch (error) {
      console.error("Error fetching location source:", error);
      setLokasiEntries([]);
      setTripEntries([]);
      setMaterialTypeEntries([]);
    }
  }, []);

  useEffect(() => {
    fetchLocationSource();
    const interval = setInterval(fetchLocationSource, 30000);
    return () => clearInterval(interval);
  }, [fetchLocationSource]);

  const filteredTripsByPeriod = useMemo(() => {
    const now = new Date();
    const realtimeAgo = now.getTime() - (6 * 60 * 60 * 1000);
    const weekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const todayLabel = now.toLocaleDateString("id-ID");

    return tripEntries.filter((trip) => {
      const parsed = parseTripTimestamp(trip);
      if (!parsed) return false;

      if (activePeriod === "today") {
        return parsed.toLocaleDateString("id-ID") === todayLabel;
      }
      if (activePeriod === "week") {
        return parsed.getTime() >= weekAgo;
      }
      return parsed.getTime() >= realtimeAgo;
    });
  }, [activePeriod, tripEntries]);

  const periodBins = useMemo(() => {
    const now = new Date();

    if (activePeriod === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return [
        { label: "Shift 1", start: startOfDay, end: noon },
        { label: "Shift 2", start: noon, end: endOfDay },
      ];
    }

    if (activePeriod === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const dayDate = new Date(now);
        dayDate.setHours(0, 0, 0, 0);
        dayDate.setDate(now.getDate() - (6 - i));
        const start = new Date(dayDate);
        const end = new Date(dayDate);
        end.setHours(23, 59, 59, 999);
        return {
          label: shortDays[start.getDay()],
          start,
          end,
        };
      });
    }

    return Array.from({ length: 7 }, (_, i) => {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(now.getHours() - (6 - i));
      const end = new Date(start);
      end.setHours(start.getHours() + 1);
      const label = `${String(start.getHours()).padStart(2, "0")}:00`;
      return { label, start, end };
    });
  }, [activePeriod]);

  const chartData = useMemo(() => {
    const normalizedStatRows = influxStats
      .map((row) => ({
        ...row,
        parsedTime: parseStatTimestamp(row),
        fuel: Number(row.fuel || 0),
        operating: Number(row.operating || 0),
      }))
      .filter((row) => row.parsedTime);
    const onlineNow = Object.values(rawVehicles).filter((v) => v.status === "online").length;

    return periodBins.map((bin, index) => {
      const tripsInBin = filteredTripsByPeriod.filter((trip) => {
        const parsed = parseTripTimestamp(trip);
        if (!parsed) return false;
        return parsed >= bin.start && parsed <= bin.end;
      });
      const statsInBin = normalizedStatRows.filter(
        (row) => row.parsedTime >= bin.start && row.parsedTime <= bin.end
      );

      const uniqueFleet = new Set(
        tripsInBin.map((trip) => String(trip.idAlat || "").trim()).filter(Boolean)
      ).size;
      const fuelFromInflux = statsInBin.reduce((sum, row) => sum + (Number.isFinite(row.fuel) ? row.fuel : 0), 0);
      const operatingFromInflux = statsInBin.reduce(
        (max, row) => Math.max(max, Number.isFinite(row.operating) ? row.operating : 0),
        0
      );

      let operating = Math.max(uniqueFleet, operatingFromInflux);
      if (activePeriod === "realtime" && index === periodBins.length - 1) {
        operating = Math.max(operating, onlineNow);
      }

      return {
        label: bin.label,
        trip: tripsInBin.length,
        operating,
        fuel: fuelFromInflux,
      };
    });
  }, [activePeriod, filteredTripsByPeriod, influxStats, periodBins, rawVehicles]);

  const materialTypeDefinitions = useMemo(() => {
    const seen = new Set();
    return materialTypeEntries
      .map((item) => String(item.jenisMuatan || "").trim())
      .filter(Boolean)
      .filter((label) => {
        const normalized = normalizeText(label);
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map((label, index) => ({
        key: `material-${normalizeText(label).replace(/\s+/g, "-") || index}`,
        label,
        normalized: normalizeText(label),
        color: getThemeSeriesColor(index),
      }));
  }, [materialTypeEntries]);

  const materialPieData = useMemo(() => {
    if (!materialTypeDefinitions.length) return [];

    const raw = materialTypeDefinitions.map((material) => ({
      key: material.key,
      name: material.label,
      color: material.color,
      value: filteredTripsByPeriod.reduce((sum, trip) => {
        return normalizeText(trip.jenisMuatan) === material.normalized ? sum + 1 : sum;
      }, 0),
    }));

    const total = raw.reduce((sum, item) => sum + item.value, 0);
    return raw.map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [filteredTripsByPeriod, materialTypeDefinitions]);

  const materialCompositionTotal = useMemo(
    () => materialPieData.reduce((sum, item) => sum + (item.value || 0), 0),
    [materialPieData]
  );

  const totals = useMemo(() => {
    // Find the most recent bucket that has fuel data to match current dashboard state
    const latestValidBucket = [...chartData].reverse().find(row => Number(row.fuel || 0) > 0);
    const totalFuel = latestValidBucket ? Number(latestValidBucket.fuel || 0) : 0;
    
    const maxOperating = chartData.reduce((max, row) => Math.max(max, Number(row.operating || 0)), 0);
    const persistedTrips = filteredTripsByPeriod.length;
    const totalTrip = persistedTrips;
    const totalProduction = totalTrip;

    return { totalProduction, totalFuel, totalTrip, maxOperating };
  }, [chartData, filteredTripsByPeriod.length]);

  const materialBarData = useMemo(
    () =>
      materialPieData.map((item) => ({
        name: item.name,
        value: item.value,
        color: item.color,
      })),
    [materialPieData]
  );

  const locationBasedMaterialData = useMemo(() => {
    if (!lokasiEntries.length) return materialBarData;

    return lokasiEntries.map((lokasi, index) => {
      const locationName = normalizeText(lokasi.name);
      const tripCount = filteredTripsByPeriod.reduce((sum, trip) => {
        const start = normalizeText(trip.lokasiStart);
        const finish = normalizeText(trip.lokasiFinish);
        return (start === locationName || finish === locationName) ? sum + 1 : sum;
      }, 0);

      return {
        name: lokasi.name || `Lokasi ${index + 1}`,
        value: tripCount,
        color: getThemeSeriesColor(index),
      };
    });
  }, [filteredTripsByPeriod, lokasiEntries, materialBarData]);

  return (
    <PageLayout noScroll={true} className="p-4">
      <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#74CD25]/10 px-4 py-1 border border-[#74CD25]/20">
            <TrendingUp className="h-3.5 w-3.5 text-[#74CD25]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#74CD25]">System Performance</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Fleet Statistics</h1>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#2d2e32] p-1.5 shadow-2xl border border-white/5">
          {PERIOD_OPTIONS.map((period) => (
            <button
              key={period.key}
              onClick={() => setActivePeriod(period.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                activePeriod === period.key
                  ? "bg-[#74CD25] text-white shadow-xl shadow-[#74CD25]/20"
                  : "text-gray-500 hover:text-white"
              )}
            >
              <period.icon className="h-3.5 w-3.5" />
              {period.label}
            </button>
          ))}
          <div className="h-6 w-px bg-white/5 mx-1" />
          <button 
            onClick={fetchStats}
            className="p-2.5 text-gray-500 hover:text-[#74CD25] transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>



      <div className="grid flex-1 min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden">
        {/* Top Row: Primary Graphics */}
        <div className="grid min-h-0 gap-3 md:grid-cols-2">
          <ChartCard 
            title="Material Composition" 
            subtitle="Based on Material Type" 
            icon={BarChart3}
          >
            <MaterialPieChart data={materialPieData} totalValue={materialCompositionTotal} />
          </ChartCard>

          <ChartCard 
            title="Fuel Consumption" 
            subtitle="Usage trend" 
            icon={Droplets}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: "#666", fontSize: 8, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={20}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fill: "#666", fontSize: 8, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="fuel" 
                  stroke="#38BDF8" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorFuel)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Bottom Row: Secondary Metrics */}
        <div className="grid min-h-0 gap-3 md:grid-cols-3">
          <ChartCard 
            title="Fleet Activity" 
            subtitle="Active vehicles" 
            icon={Truck}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#666", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                <YAxis tick={{ fill: "#666", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="stepAfter" 
                  dataKey="operating" 
                  stroke="#74CD25" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 8, strokeWidth: 0, fill: "#74CD25" }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Trip Efficiency" 
            subtitle="Trips trend" 
            icon={Route}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: "#666", fontSize: 8, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis 
                  tick={{ fill: "#666", fontSize: 8, fontWeight: 900 }} 
                  axisLine={false} 
                  tickLine={false}
                  width={35}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="trip" fill="#F472B6" radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Material Production" 
            subtitle="From entry parameter location" 
            icon={Layers}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationBasedMaterialData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                <YAxis tick={{ fill: "#666", fontSize: 9, fontWeight: 900 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                  {locationBasedMaterialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
      </div>
    </PageLayout>
  );
}
