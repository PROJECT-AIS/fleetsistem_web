import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Truck,
  User,
  Activity,
  RefreshCw
} from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { influxService } from "../../../services/influxService";
import { alatService, materialTypeService } from "../../../services/configService";
import { useMqttContext } from "../../../context/mqttContextValue";

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const buildMaterialKey = (label, index) => {
  const sanitized = normalizeText(label).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `material_${sanitized || index}`;
};
const getAlignClass = (align = "left") => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
};
const normalizeTripStatus = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "unknown";
  if (raw.includes("on") && raw.includes("trip")) return "on_trip";
  if ((raw.includes("end") || raw.includes("close") || raw.includes("selesai")) && raw.includes("trip")) return "end_trip";
  return "unknown";
};
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return r * c;
};

const baseColumns = [
  { key: "no", label: "NO", width: 60, align: "right" },
  { key: "idAlat", label: "ID_ALAT", width: 104 },
  { key: "tanggal", label: "TANGGAL", width: 104, align: "center" },
  { key: "operator", label: "OPERATOR", width: 112 },
  { key: "statusTrip", label: "STATUS TRIP", width: 120, align: "center" },
  { key: "jarakTempuh", label: "JARAK (KM)", width: 100, align: "center" },
  { key: "kecepatanTertinggi", label: "MAX SPEED", width: 100, align: "center" },
];

const fixedTripColumns = [
  { key: "total", label: "TOTAL", width: 64, align: "center" },
  { key: "kosong", label: "KOSONG", width: 84, align: "center" },
];

const summaryColumns = [
  { key: "totalKonsumsiFuel", label: "TOTAL KONSUMSI FUEL", width: 110, align: "center" },
];

export default function Analysis() {
  const [rows, setRows] = useState([]);
  const [registeredAlat, setRegisteredAlat] = useState([]);
  const [latestVehicles, setLatestVehicles] = useState([]);
  const [materialTypeEntries, setMaterialTypeEntries] = useState([]);
  const { rawVehicles } = useMqttContext();
  const [initialLoading, setInitialLoading] = useState(true);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [truckPage, setTruckPage] = useState(1);
  const [trucksPerPage] = useState(12);
  const [filterDate, setFilterDate] = useState("");
  const [selectedTruck, setSelectedTruck] = useState(null);
  const fetchClassificationRef = useRef(null);
  const fetchHistoryRef = useRef(null);

  const materialTypeColumns = useMemo(() => {
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
        key: buildMaterialKey(label, index),
        label: label.toUpperCase(),
        width: Math.max(78, Math.min(180, label.length * 9)),
        align: "center",
        materialNormalized: normalizeText(label),
      }));
  }, [materialTypeEntries]);

  const allColumns = useMemo(
    () => [...baseColumns, ...fixedTripColumns, ...materialTypeColumns, ...summaryColumns],
    [materialTypeColumns]
  );

  const tableMinWidth = useMemo(() => {
    const widths = allColumns.reduce((sum, col) => sum + (col.width || 110), 0);
    return Math.max(1080, widths + 180);
  }, [allColumns]);

  const fetchClassificationData = useCallback(async (withLoading = false) => {
    if (withLoading) setClassificationLoading(true);
    try {
      const [alatRes, vehiclesRes, materialTypeRes] = await Promise.all([
        alatService.getAll(),
        influxService.getVehicles(),
        materialTypeService.getAll(),
      ]);

      if (alatRes.data?.success || alatRes.data?.ok) {
        setRegisteredAlat(Array.isArray(alatRes.data.data) ? alatRes.data.data : []);
      }
      setLatestVehicles(vehiclesRes.data || []);
      setMaterialTypeEntries(Array.isArray(materialTypeRes.data?.data) ? materialTypeRes.data.data : []);
    } catch (error) {
      console.error("Error fetching classification data:", error);
      setMaterialTypeEntries([]);
    } finally {
      if (withLoading) setClassificationLoading(false);
    }
  }, []);

  const fetchHistoryData = useCallback(async ({ withLoading = false } = {}) => {
    if (withLoading) setHistoryLoading(true);
    try {
      const res = await influxService.getHistory({ limit: 500 });
      const normalizedRows = (res.data?.data || [])
        .map((r) => {
          const rawTime = r.waktu && r.waktu !== "-" ? r.waktu : null;
          const timeMs = rawTime ? Date.parse(rawTime) : NaN;
          const lat = toNumber(r.gps?.latitude);
          const lng = toNumber(r.gps?.longitude);

          return {
            idFms: r.idAlat || "-",
            unitKendaraan: r.unitKendaraan || r.idAlat || "-",
            operator: r.operator?.nama || "-",
            statusTripRaw: r.statusTrip || r.operator_input?.status_trip || "-",
            statusTripNorm: normalizeTripStatus(r.statusTrip || r.operator_input?.status_trip || "-"),
            tripId: r.gps?.trip || "-",
            statusMuatan: r.statusMuatan || "-",
            jenisMuatan: r.jenisMuatan || "-",
            konsumsiFuel: Number(r.sensorFuel?.konsumsi || 0),
            kecepatan: Number(r.kecepatanKendaraan || 0),
            lat,
            lng,
            waktu: rawTime,
            timeMs,
            tanggal: rawTime ? rawTime.split(" ")[0] : "-",
          };
        })
        .sort((a, b) => (Number.isNaN(a.timeMs) ? 0 : a.timeMs) - (Number.isNaN(b.timeMs) ? 0 : b.timeMs));

      const tripMap = new Map();

      normalizedRows.forEach((row) => {
        const vehicleKey = row.idFms || row.unitKendaraan || "-";
        const rawTripId = String(row.tripId || "-").trim();
        const fallbackTripId = `${vehicleKey}-${row.tanggal || "unknown"}`;
        const tripId = rawTripId && rawTripId !== "-" ? rawTripId : fallbackTripId;
        const aggregateKey = `${vehicleKey}::${tripId}`;

        if (!tripMap.has(aggregateKey)) {
          const isOnTrip = row.statusTripNorm === "on_trip";
          tripMap.set(aggregateKey, {
            idFms: row.idFms,
            unitKendaraan: row.unitKendaraan,
            tripId,
            operator: row.operator,
            statusTripRaw: row.statusTripRaw,
            statusMuatan: row.statusMuatan,
            jenisMuatan: row.jenisMuatan,
            tanggal: row.tanggal,
            fullTime: row.waktu,
            maxSpeed: isOnTrip ? row.kecepatan || 0 : 0,
            totalFuel: isOnTrip ? row.konsumsiFuel || 0 : 0,
            distanceKm: 0,
            hasOnTrip: isOnTrip,
            hasEndTrip: false,
            trackingActive: isOnTrip,
            closed: false,
            lastLat: isOnTrip ? row.lat : null,
            lastLng: isOnTrip ? row.lng : null,
            startTimeMs: isOnTrip ? row.timeMs : NaN,
            endTimeMs: NaN,
            lastTimeMs: row.timeMs,
          });
          return;
        }

        const agg = tripMap.get(aggregateKey);
        const isOnTrip = row.statusTripNorm === "on_trip";
        const isEndTrip = row.statusTripNorm === "end_trip";

        if (!agg.closed && !agg.trackingActive && isOnTrip) {
          agg.trackingActive = true;
          agg.hasOnTrip = true;
          agg.lastLat = row.lat;
          agg.lastLng = row.lng;
          agg.startTimeMs = Number.isFinite(row.timeMs) ? row.timeMs : agg.startTimeMs;
        }

        agg.lastTimeMs = row.timeMs;
        agg.operator = row.operator || agg.operator;
        agg.statusTripRaw = row.statusTripRaw || agg.statusTripRaw;
        agg.statusMuatan = row.statusMuatan || agg.statusMuatan;
        agg.jenisMuatan = row.jenisMuatan || agg.jenisMuatan;
        agg.tanggal = row.tanggal || agg.tanggal;
        agg.fullTime = row.waktu || agg.fullTime;

        if (agg.trackingActive) {
          if (row.lat != null && row.lng != null && agg.lastLat != null && agg.lastLng != null) {
            const segment = haversineDistanceKm(agg.lastLat, agg.lastLng, row.lat, row.lng);
            if (Number.isFinite(segment) && segment > 0) {
              agg.distanceKm += segment;
            }
          }

          if (row.lat != null && row.lng != null) {
            agg.lastLat = row.lat;
            agg.lastLng = row.lng;
          }

          agg.maxSpeed = Math.max(agg.maxSpeed || 0, row.kecepatan || 0);
          agg.totalFuel = Math.max(agg.totalFuel || 0, row.konsumsiFuel || 0);
        }

        if (isOnTrip) agg.hasOnTrip = true;
        if (isEndTrip && agg.trackingActive) {
          agg.hasEndTrip = true;
          agg.closed = true;
          agg.trackingActive = false;
          agg.endTimeMs = Number.isFinite(row.timeMs) ? row.timeMs : agg.endTimeMs;
        }
      });

      const aggregatedRows = Array.from(tripMap.values())
        .filter((trip) => trip.hasOnTrip && trip.hasEndTrip)
        .sort((a, b) => {
          const bTime = Number.isFinite(b.endTimeMs) ? b.endTimeMs : b.lastTimeMs;
          const aTime = Number.isFinite(a.endTimeMs) ? a.endTimeMs : a.lastTimeMs;
          const bSafe = Number.isFinite(bTime) ? bTime : 0;
          const aSafe = Number.isFinite(aTime) ? aTime : 0;
          return bSafe - aSafe;
        })
        .map((trip, idx) => {
          const jenisMuatanNormalized = normalizeText(trip.jenisMuatan);
          const dynamicMaterialFlags = Object.fromEntries(
            materialTypeColumns.map((col) => [
              col.key,
              jenisMuatanNormalized && jenisMuatanNormalized === col.materialNormalized ? "1" : "0",
            ])
          );

          return {
            no: idx + 1,
            idAlat: trip.idFms || "-",
            idFms: trip.idFms || "-",
            unitKendaraan: trip.unitKendaraan || "-",
            tanggal: trip.tanggal || "-",
            fullTime: trip.fullTime || null,
            operator: trip.operator || "-",
            statusTrip: "END TRIP",
            jarakTempuh: trip.distanceKm.toFixed(2),
            kecepatanTertinggi: `${Math.round(trip.maxSpeed || 0)} km/h`,
            total: "1",
            kosong: String(trip.statusMuatan || "").toLowerCase() === "empty" ? "1" : "0",
            ...dynamicMaterialFlags,
            totalKonsumsiFuel: `${trip.totalFuel || 0} L`,
          };
        });

      setRows(aggregatedRows);
    } catch (error) {
      console.error("Error fetching history data:", error);
    } finally {
      if (withLoading) setHistoryLoading(false);
    }
  }, [materialTypeColumns]);

  useEffect(() => {
    fetchClassificationRef.current = fetchClassificationData;
  }, [fetchClassificationData]);

  useEffect(() => {
    fetchHistoryRef.current = fetchHistoryData;
  }, [fetchHistoryData]);

  useEffect(() => {
    let mounted = true;
    const INITIAL_LOADING_TIMEOUT_MS = 1800;
    const runInitial = async () => {
      setInitialLoading(true);
      const classificationTask = fetchClassificationRef.current?.(true) ?? Promise.resolve();
      const historyTask = fetchHistoryRef.current?.({ withLoading: true }) ?? Promise.resolve();
      const fallbackTimeout = new Promise((resolve) => setTimeout(resolve, INITIAL_LOADING_TIMEOUT_MS));

      await Promise.race([classificationTask, fallbackTimeout]);
      historyTask.catch(() => {});

      if (mounted) setInitialLoading(false);
    };

    runInitial();

    const interval = setInterval(() => {
      fetchClassificationRef.current?.();
      fetchHistoryRef.current?.();
    }, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const trucks = useMemo(() => {
    const truckMap = {};

    const getRealStatus = (idOrFms) => {
      const mqttV = rawVehicles[idOrFms];
      if (mqttV) {
        if (mqttV.vehicle?.engine_on) return 'Active';
        if (mqttV.status === 'online') return 'Standby';
        return 'Inactive';
      }
      const v = latestVehicles.find(lv => lv.id === idOrFms || lv.idFms === idOrFms);
      return v ? (v.status === 'online' ? 'Active' : 'Inactive') : 'Inactive';
    };

    const getOperatorStatus = (idOrFms) => {
        const mqttV = rawVehicles[idOrFms];
        return mqttV?.operator_input?.status_trip || "-";
    };

    registeredAlat.forEach(alat => {
      const id = alat.noUnit || alat.idFms || alat.idAlat;
      if (id) {
        truckMap[id] = {
          id: id,
          idFms: alat.idFms,
          operator: "-",
          statusTrip: getOperatorStatus(alat.idFms),
          lastDate: "-",
          status: getRealStatus(alat.idFms),
          totalTrips: 0,
          totalFuel: 0
        };
      }
    });

    rows.forEach(row => {
      const trkKey = row.unitKendaraan;
      if (trkKey && trkKey !== "-" && truckMap[trkKey]) {
        // Fallback: If live data didn't provide these, use the latest from history
        if (!truckMap[trkKey].operator || truckMap[trkKey].operator === "-") {
            truckMap[trkKey].operator = row.operator;
        }
        if (!truckMap[trkKey].statusTrip || truckMap[trkKey].statusTrip === "-") {
            truckMap[trkKey].statusTrip = row.statusTrip;
        }
        if (!truckMap[trkKey].lastDate || truckMap[trkKey].lastDate === "-") {
            truckMap[trkKey].lastDate = row.tanggal;
        }
        
        truckMap[trkKey].totalTrips += (parseInt(row.total) || 0);
        truckMap[trkKey].totalFuel += (parseFloat(row.totalKonsumsiFuel) || 0);
      } else if (trkKey && trkKey !== "-") {
        truckMap[trkKey] = {
          id: trkKey,
          idFms: row.idFms,
          operator: row.operator,
          statusTrip: row.statusTrip,
          lastDate: row.tanggal,
          status: getRealStatus(row.idFms || trkKey),
          totalTrips: (parseInt(row.total) || 0),
          totalFuel: (parseFloat(row.totalKonsumsiFuel) || 0)
        };
      }
    });

    return Object.values(truckMap);
  }, [rows, registeredAlat, latestVehicles, rawVehicles]);

  const filteredTrucks = useMemo(() => {
    return trucks.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [trucks, searchTerm]);

  const totalTruckPages = Math.max(1, Math.ceil(filteredTrucks.length / trucksPerPage));
  const paginatedTrucks = useMemo(
    () => filteredTrucks.slice((truckPage - 1) * trucksPerPage, truckPage * trucksPerPage),
    [filteredTrucks, truckPage, trucksPerPage]
  );

  const filteredRows = useMemo(() => {
    if (!selectedTruck) return [];
    return rows.filter(row => {
      const matchesTruck = row.idFms === selectedTruck || row.unitKendaraan === selectedTruck;
      const matchesDate = filterDate ? row.tanggal.includes(filterDate) : true;
      return matchesTruck && matchesDate;
    });
  }, [rows, selectedTruck, filterDate]);

  useEffect(() => {
    setTruckPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (truckPage > totalTruckPages) {
      setTruckPage(totalTruckPages);
    }
  }, [truckPage, totalTruckPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTruck, filterDate]);

  const selectedTruckData = useMemo(() => {
    if (!selectedTruck) return null;
    return trucks.find(t => t.idFms === selectedTruck || t.id === selectedTruck) || { id: selectedTruck };
  }, [trucks, selectedTruck]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (initialLoading) {
    return (
      <PageLayout className="p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#74CD25]/20 border-t-[#74CD25] rounded-full animate-spin" />
            <Activity className="w-6 h-6 text-[#74CD25] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-white font-black text-xl tracking-wider animate-pulse">LOADING ANALYTICS...</p>
        </div>
      </PageLayout>
    );
  }

  if (!selectedTruck) {
    return (
      <PageLayout className="p-6 h-full flex flex-col overflow-hidden">
        <div className="mb-8 shrink-0 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">FMS-VCU Classification</h1>
            <p className="text-gray-400 mt-1">Pilih FMS-VCU untuk melihat laporan kinerja detail.</p>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Cari FMS-VCU ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#343538] text-white pl-11 pr-4 py-2.5 rounded-xl border border-white/10 focus:border-[#74CD25] focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
            {paginatedTrucks.map(truck => (
              <button
                key={truck.idFms || truck.id}
                onClick={() => setSelectedTruck(truck.idFms || truck.id)}
                className="group relative text-left rounded-3xl bg-[#343538] p-6 border border-white/5 shadow-xl hover:shadow-[#74CD25]/10 hover:border-[#74CD25]/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-[#74CD25]/10">
                    <Truck className="w-6 h-6 text-[#74CD25]" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${truck.status === "Active" ? "bg-green-500/20 text-green-400" : truck.status === "Standby" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {truck.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mb-1">{truck.id}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium truncate">{truck.operator}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Trips</p>
                    <p className="text-lg font-black text-white">{truck.totalTrips}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Fuel</p>
                    <p className="text-lg font-black text-white">{truck.totalFuel.toFixed(1)}L</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!paginatedTrucks.length && (
            <div className="rounded-2xl border border-white/10 bg-[#2d2e32]/70 p-8 text-center">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                {classificationLoading && !searchTerm
                  ? "Memuat data truck..."
                  : searchTerm
                    ? "Data truck tidak ditemukan"
                    : "Belum ada data truck"}
              </p>
            </div>
          )}

          {totalTruckPages > 1 && (
            <div className="sticky bottom-0 z-10 mt-2 flex items-center justify-between rounded-2xl border border-white/5 bg-[#2d2e32]/90 px-4 py-3 backdrop-blur">
              <p className="text-sm text-gray-400">
                Halaman {truckPage} dari {totalTruckPages} ({filteredTrucks.length} unit)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTruckPage((p) => Math.max(1, p - 1))}
                  disabled={truckPage === 1}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#343538] px-3 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>
                <button
                  onClick={() => setTruckPage((p) => Math.min(totalTruckPages, p + 1))}
                  disabled={truckPage === totalTruckPages}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#343538] px-3 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-30"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout noScroll={true} className="p-6">
      <div className="mb-6 shrink-0 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => setSelectedTruck(null)} className="p-2.5 rounded-xl bg-[#343538] text-white border border-white/5 shadow-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl sm:text-3xl font-black text-white tracking-tight">{selectedTruckData?.id} Analysis</h1>
          </div>
        </div>
        <button
          onClick={() => fetchHistoryData({ withLoading: true })}
          disabled={historyLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4a4b4d] text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 min-h-0 rounded-[24px] bg-[#343538] p-4 sm:p-6 shadow-2xl border border-white/5 flex flex-col overflow-hidden">
        <div className="mb-6 shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-auto">
            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Filter Tanggal..."
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-[#2d2e32] text-white pl-11 pr-4 py-3 rounded-xl border border-white/10 text-sm"
            />
          </div>
          <span className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#74CD25]/10 text-[#74CD25] text-xs font-black border border-[#74CD25]/20 uppercase">
            {filteredRows.length} RECORDS
          </span>
        </div>

        <div className="relative flex-1 min-h-0 overflow-auto custom-scrollbar rounded-2xl border border-white/8 bg-[#2d2e32]/65">
          {historyLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1f2023]/55 backdrop-blur-[1px]">
              <div className="flex items-center gap-3 rounded-xl border border-[#74CD25]/25 bg-[#1f2023]/90 px-4 py-2 text-xs font-black uppercase tracking-widest text-[#74CD25]">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading data...
              </div>
            </div>
          )}
          <table className="w-full border-separate border-spacing-0" style={{ minWidth: tableMinWidth }}>
            <thead>
              <tr className="bg-[#2d2e32]">
                {allColumns.map(col => (
                  <th key={col.key} className={`sticky top-0 z-10 whitespace-nowrap bg-[#2d2e32]/95 backdrop-blur p-3 sm:p-4 text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest border-b border-white/10 ${getAlignClass(col.align)}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                    {allColumns.map(col => (
                      <td key={col.key} className={`whitespace-nowrap p-3 sm:p-4 text-xs sm:text-sm text-gray-300 border-b border-white/5 ${getAlignClass(col.align)}`}>
                        {col.key === 'no'
                          ? ((currentPage - 1) * itemsPerPage) + idx + 1
                          : (row[col.key] || "-")
                        }
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={allColumns.length} className="px-4 py-10 text-center text-sm font-bold uppercase tracking-wider text-gray-400">
                    {historyLoading ? "Memuat data..." : "Belum ada data trip untuk unit ini"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 shrink-0">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl bg-[#2d2e32] text-white disabled:opacity-30">Prev</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-xl bg-[#2d2e32] text-white disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
