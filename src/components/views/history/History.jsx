import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Filter, RefreshCw, Truck, Activity, Clock, Gauge } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import api from "../../../services/api";
import {
  analysisBodyCellClass,
  analysisBodyClass,
  analysisGroupedHeaderCellClass,
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

const StatusBadge = ({ status }) => {
  if (!status || status === '-') return <span className="text-gray-500">-</span>;
  const s = status.toLowerCase();
  let color = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  if (s === "aktif" || s === "start" || s === "terbuka") color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s === "idle") color = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (s === "passif" || s === "mati" || s === "tertutup" || s === "ya") color = "bg-red-500/20 text-red-400 border-red-500/30";
  if (s.includes("anomali")) color = "bg-red-500/20 text-red-400 border-red-500/30";
  if (s === "normal") color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {status}
    </span>
  );
};

export default function History() {
  const [dataLog, setDataLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const fetchData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setIsRefreshing(true);
      const res = await api.get('/datalog');
      if (res.data?.ok) {
        setDataLog(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching datalog:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Compute stats
  const stats = useMemo(() => {
    const total = dataLog.length;
    const aktif = dataLog.filter(r => r.statusAlat === 'AKTIF').length;
    const idle = dataLog.filter(r => r.statusAlat === 'IDLE').length;
    const mati = dataLog.filter(r => r.statusAlat === 'MATI').length;
    return { total, aktif, idle, mati };
  }, [dataLog]);

  const filteredData = useMemo(() => {
    if (!search) return dataLog;
    const lower = search.toLowerCase();
    return dataLog.filter(row => 
      (row.idAlat || "").toLowerCase().includes(lower) ||
      (row.noPol || "").toLowerCase().includes(lower) ||
      (row.namaOperator || "").toLowerCase().includes(lower) ||
      (row.jenisAlat || "").toLowerCase().includes(lower) ||
      (row.trip || "").toLowerCase().includes(lower)
    );
  }, [dataLog, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const excelData = filteredData.map((row, i) => ({
      'NO': i + 1,
      'WAKTU': row.waktu || '',
      'ID_ALAT': row.idAlat,
      'NO_POL': row.noPol,
      'JENIS ALAT': row.jenisAlat,
      'MEREK ALAT': row.merekAlat,
      'TRIP': row.trip,
      'LATITUDE': row.latitude,
      'LONGITUDE': row.longitude,
      'KECEPATAN KENDARAAN (KM/JAM)': row.kecepatan,
      'JENIS MUATAN': row.jenisMuatan,
      'VOLUME FUEL': row.volumeFuel,
      'KONSUMSI FUEL': row.konsumsiFuel,
      'ANOMALI STATUS FUEL': row.anomaliStatusFuel,
      'FUEL MASUK': row.fuelMasuk,
      'STATUS ALAT': row.statusAlat,
      'START': row.start,
      'RENTANG WAKTU AKTIF': row.rentangWaktuAktif,
      'DURASI AKTIF': row.durasiAktif,
      'RENTANG WAKTU PASSIF': row.rentangWaktuPassif,
      'DURASI PASSIF': row.durasiPassif,
      'MATI': row.mati,
      'NAMA OPERATOR': row.namaOperator,
      'ID OPERATOR': row.idOperator,
      'STATUS TRIP': row.statusTrip,
    }));
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Log');
    XLSX.writeFile(workbook, `DataLog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <PageLayout className="p-6">
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #1a2a1a 0%, #0f1f12 40%, #1a2e1a 70%, #0d1a0f 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #74CD25 0%, transparent 70%)', transform: 'translate(30%, -40%)' }}
        />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #74CD25 0%, transparent 70%)', transform: 'translateY(40%)' }}
        />

        <div className="relative px-7 pt-7 pb-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[1.65rem] font-bold text-white tracking-tight leading-tight">Data Log</h1>
              <p className="text-sm text-gray-400 mt-1">Pantau aktivitas seluruh unit kendaraan secara real-time</p>
            </div>
            <div className="flex items-center gap-2.5">
              {lastUpdated && (
                <span className="text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                  <Clock className="w-3 h-3 inline mr-1 -mt-[1px]" />
                  {lastUpdated.toLocaleTimeString('id-ID')}
                </span>
              )}
              {/* Animated pulse dot */}
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                Terhubung
              </span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total Unit</span>
                <div className="w-8 h-8 rounded-lg bg-[#74CD25]/10 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-[#74CD25]" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Aktif</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.aktif}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Idle</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">{stats.idle}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Mati</span>
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full border-2 border-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.mati}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLE SECTION ── */}
      <div className="bg-[#343538] rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => fetchData(true)} 
               disabled={isRefreshing}
               className="flex items-center gap-2 px-4 py-2.5 bg-[#4a4b4d] hover:bg-[#5a5b5d] text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
             >
               <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
               Refresh
             </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari alat, nopol, atau operator..."
                className="bg-[#2d2e32] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none focus:ring-2 focus:ring-[#74CD25]/20 w-72 text-sm transition-all"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#74CD25] to-[#5FA81E] text-white font-semibold hover:shadow-lg hover:shadow-[#74CD25]/30 transition-all duration-200 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className={analysisTableShellClass}>
          <div className={analysisTableScrollClass}>
            <table
              className={`${analysisTableClass} text-sm`}
              style={{ minWidth: "3200px", borderCollapse: "separate", borderSpacing: 0 }}
            >
              <thead className={analysisTableHeadClass}>
                <tr className={analysisHeaderRowClass}>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-center`}>NO</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} min-w-[160px] text-left`}>WAKTU</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>ID_ALAT</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>NO_POL</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>JENIS ALAT</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>MEREK ALAT</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>TRIP</th>
                  <th colSpan="3" className={analysisGroupedHeaderCellClass}>DATA GPS</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>JENIS MUATAN</th>
                  <th colSpan="4" className={analysisGroupedHeaderCellClass}>DATA SENSOR FUEL</th>
                  <th colSpan="7" className={analysisGroupedHeaderCellClass}>STATUS ALAT</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} min-w-[140px] text-left`}>NAMA OPERATOR</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-left`}>ID OPERATOR</th>
                  <th rowSpan="2" className={`${analysisHeaderCellClass} text-center`}>STATUS TRIP</th>
                </tr>
                <tr className={analysisSubHeaderRowClass}>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>LATITUDE</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>LONGITUDE</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>KECEPATAN KENDARAAN (KM/JAM)</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>VOLUME FUEL</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>KONSUMSI FUEL</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>ANOMALI STATUS FUEL</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>FUEL MASUK</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>STATUS ALAT</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>START</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>RENTANG WAKTU AKTIF</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>DURASI AKTIF</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>RENTANG WAKTU PASSIF</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>DURASI PASSIF</th>
                  <th className={`${analysisSubHeaderCellClass} text-center`}>MATI</th>
                </tr>
              </thead>
              <tbody className={analysisBodyClass}>
                {loading && dataLog.length === 0 ? (
                  <tr>
                     <td colSpan="25" className="px-4 py-8 text-center text-gray-400">
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-3 border-[#74CD25] border-t-transparent rounded-full animate-spin"></div>
                         <span>Memuat data kendaraan...</span>
                       </div>
                     </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id || idx} className={analysisRowClass} style={getStripedRowStyle(idx)}>
                      <td className={`${analysisBodyCellClass} text-center`}>{startIndex + idx + 1}</td>
                      <td className={`${analysisBodyCellClass} font-mono text-xs`}>{row.waktu || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-medium text-white`}>{row.idAlat || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.noPol || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.jenisAlat || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.merekAlat || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-medium text-white`}>{row.trip || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.latitude || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.longitude || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center`}>{row.kecepatan || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-medium text-white`}>{row.jenisMuatan || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center font-mono`}>{row.volumeFuel || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center font-mono`}>{row.konsumsiFuel || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center`}><StatusBadge status={row.anomaliStatusFuel} /></td>
                      <td className={`${analysisBodyCellClass} text-center font-mono`}>{row.fuelMasuk || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center`}><StatusBadge status={row.statusAlat} /></td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.start || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.rentangWaktuAktif || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.durasiAktif || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.rentangWaktuPassif || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.durasiPassif || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.mati || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-white`}>{row.namaOperator || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.idOperator || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center`}><StatusBadge status={row.statusTrip} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="25" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-12 h-12 text-gray-600" />
                        <p className="text-gray-400 text-lg">Tidak ada data ditemukan</p>
                        <p className="text-gray-500 text-sm">Coba ubah kata kunci pencarian</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#4a4b4d]">
            <p className="text-sm text-gray-400">
              Menampilkan <span className="text-white font-semibold">{startIndex + 1}</span> - <span className="text-white font-semibold">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> dari <span className="text-white font-semibold">{filteredData.length}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#2d2e32] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d3e42] border border-[#4a4b4d]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                  if (totalPages > 5 && currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium ${currentPage === pageNum
                        ? "bg-[#74CD25] text-white"
                        : "bg-[#2d2e32] text-gray-400 hover:bg-[#3d3e42] hover:text-white border border-[#4a4b4d]"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#2d2e32] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d3e42] border border-[#4a4b4d]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
