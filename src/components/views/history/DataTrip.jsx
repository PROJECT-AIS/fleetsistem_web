import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const StatCard = ({
  label,
  value,
  icon,
  valueTone = "text-white",
  iconTone = "text-[#74CD25]",
  iconBg = "bg-[#74CD25]/10",
}) => (
  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5">
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</span>
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        {icon ? React.createElement(icon, { className: `h-4 w-4 ${iconTone}` }) : null}
      </span>
    </div>
    <p className={`text-3xl font-black leading-none ${valueTone}`}>{value}</p>
  </div>
);

export default function DataTrip() {
  const [dataTrip, setDataTrip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAlat, setFilterAlat] = useState("all");
  const [filterMuatan, setFilterMuatan] = useState("all");
  const [filterOperator, setFilterOperator] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const fetchData = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      setIsRefreshing(true);
      const res = await api.get("/datatrip");
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
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = useMemo(() => {
    const total = dataTrip.length;
    const uniqueAlat = new Set(dataTrip.map((r) => r.idAlat).filter(Boolean)).size;
    const uniqueOperator = new Set(dataTrip.map((r) => r.namaOperator).filter(Boolean)).size;
    const todayStr = new Date().toLocaleDateString("id-ID");
    const todayTrips = dataTrip.filter((r) => {
      if (!r.tanggal) return false;
      try {
        const d = new Date(r.createdAt || r.tanggal);
        return d.toLocaleDateString("id-ID") === todayStr;
      } catch {
        return false;
      }
    }).length;
    return { total, uniqueAlat, uniqueOperator, todayTrips };
  }, [dataTrip]);

  const toSearchText = (value) => String(value ?? "").toLowerCase();
  const toFilterText = (value) => String(value ?? "").trim();

  const filterOptions = useMemo(() => {
    const getUnique = (arr) =>
      Array.from(new Set(arr.map((v) => toFilterText(v)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "id", { sensitivity: "base" })
      );

    return {
      alat: getUnique(dataTrip.map((row) => row.idAlat)),
      muatan: getUnique(dataTrip.map((row) => row.jenisMuatan)),
      operator: getUnique(dataTrip.map((row) => row.namaOperator)),
    };
  }, [dataTrip]);

  const filteredData = useMemo(() => {
    const lower = search.toLowerCase();
    return dataTrip.filter(
      (row) =>
        (search
          ? (
              toSearchText(row.idAlat).includes(lower) ||
              toSearchText(row.trip).includes(lower) ||
              toSearchText(row.namaOperator).includes(lower) ||
              toSearchText(row.jenisMuatan).includes(lower) ||
              toSearchText(row.lokasiStart).includes(lower) ||
              toSearchText(row.lokasiFinish).includes(lower)
            )
          : true) &&
        (filterAlat === "all" ? true : toFilterText(row.idAlat) === filterAlat) &&
        (filterMuatan === "all" ? true : toFilterText(row.jenisMuatan) === filterMuatan) &&
        (filterOperator === "all" ? true : toFilterText(row.namaOperator) === filterOperator) &&
        (!filterDate ? true : toFilterText(row.tanggal).includes(filterDate))
    );
  }, [dataTrip, search, filterAlat, filterMuatan, filterOperator, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  const visibleStart = filteredData.length === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(startIndex + itemsPerPage, filteredData.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAlat, filterMuatan, filterOperator, filterDate]);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const excelData = filteredData.map((row, i) => ({
      NO: i + 1,
      ID_ALAT: row.idAlat,
      TRIP: row.trip,
      TANGGAL: row.tanggal,
      "LOKASI START": row.lokasiStart,
      "LOKASI FINISH": row.lokasiFinish,
      "NAMA OPERATOR": row.namaOperator,
      "ID OPERATOR": row.idOperator,
      "JENIS MUATAN": row.jenisMuatan,
      "WAKTU START": row.waktuStart,
      "WAKTU FINISH": row.waktuFinish,
      DURASI: row.durasi,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Trip");
    XLSX.writeFile(workbook, `DataTrip_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <PageLayout noScroll={true} className="flex flex-col gap-4 p-4 lg:p-6">
      <div
        className="relative shrink-0 overflow-hidden rounded-3xl border border-[#74CD25]/15 bg-[#1a2a1a]"
        style={{ background: "linear-gradient(135deg, #1a2a1a 0%, #112314 45%, #182818 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, #74CD25 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #74CD25 0%, transparent 70%)" }}
        />

        <div className="relative px-5 pb-5 pt-5 lg:px-6 lg:pb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white lg:text-[30px]">Data Trip</h1>
              <p className="mt-1 text-sm tracking-wide text-gray-400">Rekap perjalanan unit yang sudah selesai</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {lastUpdated && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {lastUpdated.toLocaleTimeString("id-ID")}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#74CD25]/25 bg-[#74CD25]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#74CD25]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Total Trip" value={stats.total} icon={Route} />
            <StatCard
              label="Trip Hari Ini"
              value={stats.todayTrips}
              icon={Clock}
              valueTone="text-[#74CD25]"
              iconTone="text-[#74CD25]"
              iconBg="bg-[#74CD25]/10"
            />
            <StatCard label="Unit Terdaftar" value={stats.uniqueAlat} icon={MapPin} />
            <StatCard label="Operator" value={stats.uniqueOperator} icon={CheckCircle2} />
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-[#343538] shadow-2xl">
        <div className="shrink-0 border-b border-white/5 px-4 py-4 lg:px-5">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[auto_minmax(320px,1fr)_auto] xl:items-center">
            <div className="rounded-xl border border-white/10 bg-[#2d2e32] px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-gray-500">Data Tersaring</p>
              <p className="text-sm font-black text-white">{filteredData.length} baris</p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cari alat, trip, lokasi, operator..."
                  className="w-full rounded-xl border border-white/10 bg-[#2d2e32] py-2.5 pl-11 pr-4 text-sm text-white transition-all focus:border-[#74CD25] focus:outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <select
                  value={filterAlat}
                  onChange={(e) => setFilterAlat(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#2d2e32] px-3 py-2 text-xs font-semibold text-white focus:border-[#74CD25] focus:outline-none"
                >
                  <option value="all">Semua Alat</option>
                  {filterOptions.alat.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={filterMuatan}
                  onChange={(e) => setFilterMuatan(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#2d2e32] px-3 py-2 text-xs font-semibold text-white focus:border-[#74CD25] focus:outline-none"
                >
                  <option value="all">Semua Muatan</option>
                  {filterOptions.muatan.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select
                  value={filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#2d2e32] px-3 py-2 text-xs font-semibold text-white focus:border-[#74CD25] focus:outline-none"
                >
                  <option value="all">Semua Operator</option>
                  {filterOptions.operator.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#2d2e32] px-3 py-2 text-xs font-semibold text-white focus:border-[#74CD25] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#4a4b4d] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#5a5b5d] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#74CD25] to-[#5FA81E] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#74CD25]/30"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 py-4 lg:px-5">
          <div className={`${analysisTableShellClass} flex min-h-0 flex-1 flex-col`}>
            <div className={`${analysisTableScrollClass} flex-1`}>
              <table
                className={`${analysisTableClass} min-w-full table-auto text-sm`}
                style={{ borderCollapse: "separate", borderSpacing: 0 }}
              >
                <thead className={analysisTableHeadClass}>
                  <tr className={analysisHeaderRowClass}>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-center`}>NO</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>ID_ALAT</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>TRIP</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>TANGGAL</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>LOKASI START</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>LOKASI FINISH</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>NAMA OPERATOR</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>ID OPERATOR</th>
                    <th className={`${analysisHeaderCellClass} whitespace-nowrap text-left`}>JENIS MUATAN</th>
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
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#74CD25] border-t-transparent" />
                          <span>Memuat data perjalanan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row, idx) => (
                      <tr
                        key={row.id || `${row.idAlat || "alat"}-${row.trip || idx}-${idx}`}
                        className={analysisRowClass}
                        style={getStripedRowStyle(idx)}
                      >
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
                          <Filter className="h-12 w-12 text-gray-600" />
                          <p className="text-lg text-gray-400">Tidak ada data ditemukan</p>
                          <p className="text-sm text-gray-500">Coba ubah kata kunci pencarian</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="shrink-0 border-t border-white/5 px-4 py-3.5 lg:px-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Menampilkan <span className="font-semibold text-white">{visibleStart}</span> - <span className="font-semibold text-white">{visibleEnd}</span> dari <span className="font-semibold text-white">{filteredData.length}</span> data
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#4a4b4d] bg-[#2d2e32] p-2 text-white hover:bg-[#3d3e42] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1;
                    if (totalPages > 5 && currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-[#74CD25] text-white"
                            : "border border-[#4a4b4d] bg-[#2d2e32] text-gray-400 hover:bg-[#3d3e42] hover:text-white"
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
                  className="rounded-lg border border-[#4a4b4d] bg-[#2d2e32] p-2 text-white hover:bg-[#3d3e42] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
