import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Filter, RefreshCw, MapPin, Route, Clock, CheckCircle2 } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import api from "../../../services/api";
import {
  analysisBodyCellClass,
  analysisBodyClass,
  analysisHeaderCellClass,
  analysisHeaderRowClass,
  analysisTableClass,
  analysisTableHeadClass,
  analysisTableScrollClass,
  analysisTableShellClass,
  analysisRowClass,
  getStripedRowStyle,
} from "../shared/tableStyles";

export default function DataTrip() {
  const [dataTrip, setDataTrip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setIsRefreshing(true);
      const res = await api.get('/datatrip');
      if (res.data?.ok) {
        setDataTrip(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching datatrip:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = dataTrip.length;
    const uniqueAlat = new Set(dataTrip.map(r => r.idAlat).filter(Boolean)).size;
    const uniqueOperator = new Set(dataTrip.map(r => r.namaOperator).filter(Boolean)).size;
    const todayStr = new Date().toLocaleDateString('id-ID');
    const todayTrips = dataTrip.filter(r => {
      if (!r.tanggal) return false;
      // Try to match today's date
      try {
        const d = new Date(r.createdAt || r.tanggal);
        return d.toLocaleDateString('id-ID') === todayStr;
      } catch { return false; }
    }).length;
    return { total, uniqueAlat, uniqueOperator, todayTrips };
  }, [dataTrip]);

  const filteredData = useMemo(() => {
    if (!search) return dataTrip;
    const lower = search.toLowerCase();
    return dataTrip.filter(row => 
      (row.idAlat || "").toLowerCase().includes(lower) ||
      (row.trip || "").toLowerCase().includes(lower) ||
      (row.namaOperator || "").toLowerCase().includes(lower) ||
      (row.jenisMuatan || "").toLowerCase().includes(lower) ||
      (row.lokasiStart || "").toLowerCase().includes(lower) ||
      (row.lokasiFinish || "").toLowerCase().includes(lower)
    );
  }, [dataTrip, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const excelData = filteredData.map((row, i) => ({
      'NO': i + 1,
      'ID_ALAT': row.idAlat,
      'TRIP': row.trip,
      'TANGGAL': row.tanggal,
      'LOKASI START': row.lokasiStart,
      'LOKASI FINISH': row.lokasiFinish,
      'NAMA OPERATOR': row.namaOperator,
      'ID OPERATOR': row.idOperator,
      'JENIS MUATAN': row.jenisMuatan,
      'WAKTU START': row.waktuStart,
      'WAKTU FINISH': row.waktuFinish,
      'DURASI': row.durasi,
    }));
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Trip');
    XLSX.writeFile(workbook, `DataTrip_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <PageLayout className="p-6">
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #1a1a3e 70%, #0f0f23 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(30%, -40%)' }}
        />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translateY(40%)' }}
        />

        <div className="relative px-7 pt-7 pb-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[1.65rem] font-bold text-white tracking-tight leading-tight">Data Trip</h1>
              <p className="text-sm text-gray-400 mt-1">Rekap perjalanan unit yang sudah selesai</p>
            </div>
            <div className="flex items-center gap-2.5">
              {lastUpdated && (
                <span className="text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg">
                  <Clock className="w-3 h-3 inline mr-1 -mt-[1px]" />
                  {lastUpdated.toLocaleTimeString('id-ID')}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3 h-3" />
                Data Tersimpan
              </span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Total Trip</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Route className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Trip Hari Ini</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.todayTrips}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Unit Terdaftar</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{stats.uniqueAlat}</p>
            </div>
            <div className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-xl px-4 py-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Operator</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.uniqueOperator}</p>
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
                placeholder="Cari alat, trip, lokasi, operator..."
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
              style={{ borderCollapse: "separate", borderSpacing: 0 }}
            >
              <thead className={analysisTableHeadClass}>
                <tr className={analysisHeaderRowClass}>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-center`}>NO</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>ID_ALAT</th>
                  <th className={`${analysisHeaderCellClass} min-w-[200px] whitespace-nowrap text-left`}>TRIP</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>TANGGAL</th>
                  <th className={`${analysisHeaderCellClass} min-w-[150px] whitespace-nowrap text-left`}>LOKASI START</th>
                  <th className={`${analysisHeaderCellClass} min-w-[150px] whitespace-nowrap text-left`}>LOKASI FINISH</th>
                  <th className={`${analysisHeaderCellClass} min-w-[150px] whitespace-nowrap text-left`}>NAMA OPERATOR</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>ID OPERATOR</th>
                  <th className={`${analysisHeaderCellClass} min-w-[150px] whitespace-nowrap text-left`}>JENIS MUATAN</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-center`}>WAKTU START</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-center`}>WAKTU FINISH</th>
                  <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>DURASI</th>
                </tr>
              </thead>
              <tbody className={analysisBodyClass}>
                {loading && dataTrip.length === 0 ? (
                  <tr>
                     <td colSpan="12" className="px-4 py-8 text-center text-gray-400">
                       <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                         <span>Memuat data perjalanan...</span>
                       </div>
                     </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id} className={analysisRowClass} style={getStripedRowStyle(idx)}>
                      <td className={`${analysisBodyCellClass} text-center`}>{startIndex + idx + 1}</td>
                      <td className={analysisBodyCellClass}>{row.idAlat || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-medium text-white`}>{row.trip || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-mono`}>{row.tanggal || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.lokasiStart || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.lokasiFinish || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.namaOperator || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.idOperator || "-"}</td>
                      <td className={`${analysisBodyCellClass} font-medium text-white`}>{row.jenisMuatan || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center font-mono`}>{row.waktuStart || "-"}</td>
                      <td className={`${analysisBodyCellClass} text-center font-mono`}>{row.waktuFinish || "-"}</td>
                      <td className={analysisBodyCellClass}>{row.durasi || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-4 py-12 text-center">
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
