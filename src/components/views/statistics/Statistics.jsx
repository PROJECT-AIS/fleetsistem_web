import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Droplets,
  Layers,
  Route,
  Truck,
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
} from "recharts";
import PageLayout from "../../layout/PageLayout";
import { useMqttContext } from "../../../context/mqttContextValue";
import { influxService } from "../../../services/influxService";

const MATERIALS = [
  { key: "ob", label: "OB", color: "#74CD25" },
  { key: "limOre", label: "LIM Ore", color: "#38BDF8" },
  { key: "sapOre", label: "SAP Ore", color: "#22C55E" },
  { key: "topSoil", label: "Top Soil", color: "#14B8A6" },
  { key: "civilQuarry", label: "Civil Quarry", color: "#60A5FA" },
  { key: "coal", label: "Coal", color: "#94A3B8" },
  { key: "slag", label: "Slag", color: "#64748B" },
  { key: "materialLainnya", label: "Lainnya", color: "#2DD4BF" },
];

const PERIOD_OPTIONS = [
  { key: "realtime", label: "Realtime" },
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
];

const PERIOD_DATA = {
  realtime: [
    { label: "08:00", ob: 18, limOre: 9, sapOre: 7, topSoil: 4, civilQuarry: 2, coal: 1, slag: 1, materialLainnya: 2, fuel: 92, operating: 11, trip: 44 },
    { label: "09:00", ob: 26, limOre: 13, sapOre: 10, topSoil: 6, civilQuarry: 3, coal: 2, slag: 1, materialLainnya: 2, fuel: 128, operating: 14, trip: 63 },
    { label: "10:00", ob: 34, limOre: 17, sapOre: 14, topSoil: 7, civilQuarry: 4, coal: 2, slag: 2, materialLainnya: 3, fuel: 166, operating: 16, trip: 83 },
    { label: "11:00", ob: 39, limOre: 19, sapOre: 16, topSoil: 8, civilQuarry: 5, coal: 3, slag: 2, materialLainnya: 4, fuel: 191, operating: 17, trip: 96 },
    { label: "12:00", ob: 32, limOre: 16, sapOre: 13, topSoil: 7, civilQuarry: 4, coal: 2, slag: 1, materialLainnya: 3, fuel: 155, operating: 13, trip: 78 },
    { label: "13:00", ob: 43, limOre: 22, sapOre: 18, topSoil: 9, civilQuarry: 5, coal: 3, slag: 2, materialLainnya: 4, fuel: 214, operating: 18, trip: 106 },
    { label: "14:00", ob: 47, limOre: 24, sapOre: 20, topSoil: 10, civilQuarry: 6, coal: 3, slag: 2, materialLainnya: 5, fuel: 232, operating: 19, trip: 117 },
  ],
  today: [
    { label: "Shift 1", ob: 156, limOre: 74, sapOre: 63, topSoil: 31, civilQuarry: 18, coal: 12, slag: 8, materialLainnya: 15, fuel: 812, operating: 18, trip: 377 },
    { label: "Shift 2", ob: 148, limOre: 68, sapOre: 59, topSoil: 28, civilQuarry: 16, coal: 10, slag: 7, materialLainnya: 14, fuel: 768, operating: 17, trip: 350 },
  ],
  week: [
    { label: "Sen", ob: 282, limOre: 132, sapOre: 118, topSoil: 56, civilQuarry: 29, coal: 22, slag: 15, materialLainnya: 28, fuel: 1460, operating: 17, trip: 682 },
    { label: "Sel", ob: 306, limOre: 148, sapOre: 126, topSoil: 61, civilQuarry: 34, coal: 24, slag: 16, materialLainnya: 31, fuel: 1584, operating: 18, trip: 746 },
    { label: "Rab", ob: 298, limOre: 141, sapOre: 121, topSoil: 58, civilQuarry: 31, coal: 23, slag: 14, materialLainnya: 29, fuel: 1538, operating: 18, trip: 715 },
    { label: "Kam", ob: 326, limOre: 157, sapOre: 136, topSoil: 65, civilQuarry: 36, coal: 26, slag: 17, materialLainnya: 34, fuel: 1692, operating: 19, trip: 797 },
    { label: "Jum", ob: 314, limOre: 152, sapOre: 130, topSoil: 62, civilQuarry: 35, coal: 25, slag: 16, materialLainnya: 32, fuel: 1626, operating: 18, trip: 766 },
    { label: "Sab", ob: 251, limOre: 119, sapOre: 104, topSoil: 48, civilQuarry: 27, coal: 19, slag: 12, materialLainnya: 25, fuel: 1308, operating: 15, trip: 605 },
    { label: "Min", ob: 224, limOre: 106, sapOre: 92, topSoil: 43, civilQuarry: 24, coal: 17, slag: 11, materialLainnya: 21, fuel: 1162, operating: 14, trip: 538 },
  ],
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const cn = (...classes) => classes.filter(Boolean).join(" ");

const toNumber = (value) => {
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value) => numberFormatter.format(Math.round(Number(value || 0)));

const getMaterialKey = (value) => {
  const material = String(value || "").toLowerCase();

  if (material.includes("lim")) return "limOre";
  if (material.includes("sap")) return "sapOre";
  if (material.includes("top")) return "topSoil";
  if (material.includes("quarry") || material.includes("civil")) return "civilQuarry";
  if (material.includes("coal")) return "coal";
  if (material.includes("slag")) return "slag";
  if (material.includes("ob") || material.includes("overburden")) return "ob";
  if (material) return "materialLainnya";

  return null;
};

const getVehicleMaterialKey = (vehicle) =>
  getMaterialKey(
    vehicle.trip?.material ||
      vehicle.trip?.material_type ||
      vehicle.production?.material ||
      vehicle.payload?.material ||
      vehicle.load?.type ||
      vehicle.material ||
      vehicle.jenisMuatan ||
      vehicle.jenis_muatan
  );

const getVehicleTripValue = (vehicle, materialKey) => {
  const tripValue =
    vehicle.trip?.total ||
    vehicle.trip?.count ||
    vehicle.production?.trip ||
    vehicle.production?.total ||
    vehicle.retase ||
    vehicle.totalTrip;

  return toNumber(tripValue) || (materialKey ? 1 : 0);
};

const getFuelValue = (vehicle) =>
  toNumber(
    vehicle.fuel?.consumption_l ||
      vehicle.fuel?.consumption ||
      vehicle.sensorFuel?.konsumsi ||
      vehicle.fuelConsumption ||
      vehicle.fuel?.volume_l ||
      vehicle.fuelVolume
  );

const isOperating = (vehicle) =>
  vehicle.status === "online" ||
  vehicle.vehicle?.engine_on ||
  vehicle.vehicle?.moving ||
  vehicle.engine === "on" ||
  vehicle.moving;

const buildEmptyPoint = (label) => ({
  label,
  fuel: 0,
  operating: 0,
  trip: 0,
  ...Object.fromEntries(MATERIALS.map((material) => [material.key, 0])),
});

const buildLiveSeries = (vehicles) => {
  if (!vehicles.length) return [];

  const buckets = new Map();

  vehicles.forEach((vehicle) => {
    const fuelPoints = vehicle.fuelData || vehicle.fuelHistory || [];
    const materialKey = getVehicleMaterialKey(vehicle);
    const tripValue = getVehicleTripValue(vehicle, materialKey);
    const operating = isOperating(vehicle) ? 1 : 0;

    if (!fuelPoints.length) {
      const label = String(vehicle.time || vehicle.datetime?.best || "Live").split(" ").pop();
      const point = buckets.get(label) || buildEmptyPoint(label);

      point.fuel += getFuelValue(vehicle);
      point.operating += operating;
      point.trip += tripValue;
      if (materialKey) point[materialKey] += tripValue;

      buckets.set(label, point);
      return;
    }

    fuelPoints.forEach((fuelPoint, index) => {
      const label = fuelPoint.time || `T-${index + 1}`;
      const point = buckets.get(label) || buildEmptyPoint(label);

      point.fuel += toNumber(fuelPoint.value);
      point.operating += operating;
      if (materialKey) {
        const distributedTrip = Math.max(1, Math.round(tripValue / Math.max(fuelPoints.length, 1)));
        point.trip += distributedTrip;
        point[materialKey] += distributedTrip;
      }

      buckets.set(label, point);
    });
  });

  return Array.from(buckets.values()).slice(-8);
};

const addTotals = (rows) =>
  rows.map((row) => ({
    ...row,
    production: MATERIALS.reduce((total, material) => total + toNumber(row[material.key]), 0),
  }));

const mergeLiveWithFallback = (liveRows, fallbackRows) => {
  if (!liveRows.length) return addTotals(fallbackRows);

  return addTotals(
    liveRows.map((row, index) => {
      const fallback = fallbackRows[index % fallbackRows.length];
      const hasProduction = MATERIALS.some((material) => toNumber(row[material.key]) > 0);

      return {
        ...fallback,
        ...row,
        ...(hasProduction
          ? {}
          : Object.fromEntries(MATERIALS.map((material) => [material.key, fallback[material.key]]))),
        trip: row.trip || fallback.trip,
        operating: row.operating || fallback.operating,
        fuel: row.fuel || fallback.fuel,
      };
    })
  );
};

const getTotals = (rows) => {
  const materialTotals = Object.fromEntries(MATERIALS.map((material) => [material.key, 0]));

  rows.forEach((row) => {
    MATERIALS.forEach((material) => {
      materialTotals[material.key] += toNumber(row[material.key]);
    });
  });

  return {
    materialTotals,
    production: Object.values(materialTotals).reduce((total, value) => total + value, 0),
    fuel: rows.reduce((total, row) => total + toNumber(row.fuel), 0),
    trip: rows.reduce((total, row) => total + toNumber(row.trip), 0),
    operating: Math.max(...rows.map((row) => toNumber(row.operating)), 0),
  };
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[#74CD25]/30 bg-[#242529]/95 px-3 py-2 shadow-xl">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/60">{label}</div>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold" style={{ color: entry.color }}>
              {entry.name}
            </span>
            <span className="font-bold text-white">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="z-[9999] rounded-xl border border-[#74CD25]/30 bg-[#242529]/95 px-3 py-2 shadow-xl">
      <div className="text-xs font-semibold uppercase tracking-wide text-white/60">{item.name}</div>
      <div className="mt-1 text-sm font-black text-[#74CD25]">{item.percent}%</div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value, sublabel, accent }) => (
  <div className="rounded-xl border border-[#4a4b4d] bg-[#2d2e32] p-4 shadow-lg">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</div>
        <div className="mt-2 text-2xl font-black leading-none text-white">{value}</div>
        <div className="mt-2 text-xs font-medium text-gray-400">{sublabel}</div>
      </div>
      <div className={cn("rounded-lg p-2", accent)}>
        {React.createElement(icon, { className: "h-5 w-5" })}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="min-h-[320px] rounded-xl border border-[#4a4b4d] bg-[#2d2e32] p-4 shadow-lg">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h2>
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      </div>
      <BarChart3 className="h-5 w-5 flex-shrink-0 text-[#74CD25]" />
    </div>
    <div className="h-[250px] pointer-events-auto relative">{children}</div>
  </div>
);

const MaterialPieChart = ({ data }) => (
  <div className="grid h-full gap-4 md:grid-cols-[minmax(220px,0.85fr)_minmax(0,1fr)]">
    <div className="min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            startAngle={90}
            endAngle={-270}
            innerRadius="48%"
            outerRadius="78%"
            paddingAngle={2}
            stroke="#2d2e32"
            strokeWidth={3}
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>

    <div className="grid content-center gap-2 sm:grid-cols-2">
      {data.map((item) => (
        <div key={item.key} className="rounded-lg border border-[#4a4b4d] bg-[#343538] px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate text-xs font-bold uppercase text-gray-300">{item.name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Statistics() {
  const [activePeriod, setActivePeriod] = useState("realtime");
  const { rawVehicles } = useMqttContext();
  const [influxStats, setInfluxStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasInfluxStats = influxStats.length > 0;

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await influxService.getStatistics({ period: activePeriod });
      setInfluxStats(res.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!loading && hasInfluxStats && !hasAnimated) {
      const timer = setTimeout(() => setHasAnimated(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, hasInfluxStats, hasAnimated]);

  const vehicles = useMemo(() => Object.values(rawVehicles || {}), [rawVehicles]);
  const liveSeries = useMemo(() => buildLiveSeries(vehicles), [vehicles]);
  const chartData = useMemo(() => {
    if (influxStats.length > 0) return addTotals(influxStats);
    return mergeLiveWithFallback(liveSeries, PERIOD_DATA[activePeriod]);
  }, [activePeriod, liveSeries, influxStats]);
  const totals = useMemo(() => getTotals(chartData), [chartData]);
  const materialPieData = useMemo(() => {
    const rawData = MATERIALS.map((material) => ({
      key: material.key,
      name: material.label,
      color: material.color,
      value: toNumber(totals.materialTotals[material.key]),
    })).filter((item) => item.value > 0);
    const total = rawData.reduce((sum, item) => sum + item.value, 0);

    return rawData.map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [totals.materialTotals]);
  const materialBarData = useMemo(
    () =>
      MATERIALS.map((material) => ({
        key: material.key,
        name: material.label,
        color: material.color,
        value: toNumber(totals.materialTotals[material.key]),
      })),
    [totals.materialTotals]
  );
  const isLive = vehicles.length > 0;

  return (
    <PageLayout className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistik & Chart</h1>
          <p className="mt-1 text-sm text-gray-400">
            Data Log {isLive ? "Realtime" : "Preview"} - Total seluruh alat
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-[#2d2e32] p-1">
          {PERIOD_OPTIONS.map((period) => (
            <button
              key={period.key}
              type="button"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                activePeriod === period.key
                  ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/25"
                  : "text-gray-400 hover:bg-[#3d3e42] hover:text-white"
              )}
              onClick={() => setActivePeriod(period.key)}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-[#343538] p-6 shadow-2xl">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={Layers}
            label="Total Produksi"
            value={formatNumber(totals.production)}
            sublabel="OB, LIM Ore, SAP Ore, dan material lain"
            accent="bg-[#74CD25]/15 text-[#74CD25]"
          />
          <SummaryCard
            icon={Droplets}
            label="Konsumsi BBM"
            value={`${formatNumber(totals.fuel)} L`}
            sublabel="Akumulasi dari Data Log realtime"
            accent="bg-[#38BDF8]/15 text-[#38BDF8]"
          />
          <SummaryCard
            icon={Truck}
            label="Alat Beroperasi"
            value={formatNumber(totals.operating)}
            sublabel="Jumlah unit aktif pada periode"
            accent="bg-[#22C55E]/15 text-[#22C55E]"
          />
          <SummaryCard
            icon={Route}
            label="Total Trip"
            value={formatNumber(totals.trip)}
            sublabel="Agregasi trip seluruh alat"
            accent="bg-[#14B8A6]/15 text-[#14B8A6]"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
          <ChartCard title="Total Produksi" subtitle="Diagram batang total produksi per material">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialBarData} margin={{ top: 10, right: 14, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#4a4b4d" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} trigger="axis" isAnimationActive={false} />
                <Bar 
                  dataKey="value" 
                  name="Total Produksi" 
                  radius={[4, 4, 0, 0]} 
                  isAnimationActive={!hasAnimated}
                  animationDuration={hasAnimated ? 0 : 1500}
                >
                  {materialBarData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Konsumsi BBM" subtitle="Total pemakaian BBM seluruh alat">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 14, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#4a4b4d" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} trigger="axis" isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="fuel"
                  name="BBM"
                  stroke="#39ff14"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#39ff14", strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  isAnimationActive={!hasAnimated}
                  animationDuration={hasAnimated ? 0 : 1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.45fr)]">
          <ChartCard title="Alat Beroperasi" subtitle="Unit aktif sepanjang periode">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 14, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#4a4b4d" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} trigger="axis" isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="operating"
                  name="Alat"
                  stroke="#74CD25"
                  strokeWidth={3}
                  dot={{ fill: "#74CD25", r: 3 }}
                  activeDot={{ fill: "#38BDF8", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Total Trip" subtitle="Trip seluruh material dari Data Log">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 14, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="#4a4b4d" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} trigger="axis" isAnimationActive={false} />
                <Bar dataKey="trip" name="Trip" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-4">
          <ChartCard title="Komposisi Material" subtitle="Persentase total produksi berdasarkan jenis muatan">
            <MaterialPieChart data={materialPieData} />
          </ChartCard>
        </div>
      </div>
    </PageLayout>
  );
}
