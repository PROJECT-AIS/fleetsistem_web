import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import api from "../../../services/api";

const StatusBadge = ({ status }) => {
  if (!status) return <span className="text-gray-500">-</span>;
  const s = status.toLowerCase();
  let color = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  
  if (s === "aktif" || s === "start" || s === "terbuka") color = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (s === "passif" || s === "mati" || s === "tertutup") color = "bg-red-500/20 text-red-400 border-red-500/30";
  if (s.includes("anomali")) color = "bg-amber-500/20 text-amber-400 border-amber-500/30";
  
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
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/datalog');
      if (res.data?.ok) {
        setDataLog(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching datalog:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (!search) return dataLog;
    const lower = search.toLowerCase();
    return dataLog.filter(row => 
      (row.idAlat || "").toLowerCase().includes(lower) ||
      (row.noPol || "").toLowerCase().includes(lower) ||
      (row.namaOperator || "").toLowerCase().includes(lower) ||
      (row.jenisAlat || "").toLowerCase().includes(lower)
    );
  }, [dataLog, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const excelData = filteredData.map((row, i) => ({
      'NO': i + 1,
      'WAKTU': row.waktu ? new Date(row.waktu).toLocaleString('id-ID') : '',
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
      <h1 className="text-2xl font-bold text-white mb-6">Data Log Real Time (Database)</h1>
      
      <div className="bg-[#343538] rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <button onClick={fetchData} className="px-4 py-2 bg-[#4a4b4d] hover:bg-[#5a5b5d] text-white rounded-lg text-sm font-semibold transition-all">
               Refresh Data
             </button>
             <span className="text-xs text-gray-400">Auto refresh setiap 10 detik</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari alat/nopol/operator..."
                className="bg-[#2d2e32] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none focus:ring-2 focus:ring-[#74CD25]/20 w-64 text-sm transition-all"
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

        <div className="rounded-xl border border-[#4a4b4d] overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm" style={{ minWidth: '3200px' }}>
              <thead className="sticky top-0 z-10 bg-[#92d050] text-black">
                <tr>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">NO</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase min-w-[160px]">WAKTU</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">ID_ALAT</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">NO_POL</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">JENIS ALAT</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">MEREK ALAT</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">TRIP</th>
                  <th colSpan="3" className="px-3 py-2 font-bold border border-black/20 uppercase bg-[#ffc000] text-center">DATA GPS</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">JENIS MUATAN</th>
                  <th colSpan="4" className="px-3 py-2 font-bold border border-black/20 uppercase bg-[#ffc000] text-center">DATA SENSOR FUEL</th>
                  <th colSpan="7" className="px-3 py-2 font-bold border border-black/20 uppercase bg-[#ffc000] text-center">STATUS ALAT</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase min-w-[140px]">NAMA OPERATOR</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">ID OPERATOR</th>
                  <th rowSpan="2" className="px-3 py-3 font-bold border border-black/20 uppercase">STATUS TRIP</th>
                </tr>
                <tr className="bg-[#92d050]">
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">LATITUDE</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">LONGITUDE</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">KECEPATAN KENDARAAN (KM/JAM)</th>
                  
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">VOLUME FUEL</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">KONSUMSI FUEL</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">ANOMALI STATUS FUEL</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">FUEL MASUK</th>
                  
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">STATUS ALAT</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">START</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">RENTANG WAKTU AKTIF</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">DURASI AKTIF</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">RENTANG WAKTU PASSIF</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">DURASI PASSIF</th>
                  <th className="px-3 py-2 font-bold border border-black/20 uppercase">MATI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b4d]">
                {loading && dataLog.length === 0 ? (
                  <tr>
                     <td colSpan="25" className="px-4 py-8 text-center text-gray-400">Loading data...</td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-[#3d3e42]" style={{ backgroundColor: idx % 2 === 0 ? '#2d2e32' : '#343538' }}>
                      <td className="px-3 py-3 text-gray-300 text-center border-r border-[#4a4b4d]">{startIndex + idx + 1}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.waktu ? new Date(row.waktu).toLocaleString('id-ID') : '-'}</td>
                      <td className="px-3 py-3 text-white font-medium border-r border-[#4a4b4d]">{row.idAlat || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.noPol || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.jenisAlat || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.merekAlat || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.trip || '-'}</td>
                      
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.latitude || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.longitude || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 text-center border-r border-[#4a4b4d]">{row.kecepatan || '-'}</td>
                      
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.jenisMuatan || '-'}</td>
                      
                      <td className="px-3 py-3 text-gray-300 font-mono text-center border-r border-[#4a4b4d]">{row.volumeFuel || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono text-center border-r border-[#4a4b4d]">{row.konsumsiFuel || '-'}</td>
                      <td className="px-3 py-3 text-center border-r border-[#4a4b4d]"><StatusBadge status={row.anomaliStatusFuel} /></td>
                      <td className="px-3 py-3 text-gray-300 font-mono text-center border-r border-[#4a4b4d]">{row.fuelMasuk || '-'}</td>
                      
                      <td className="px-3 py-3 text-center border-r border-[#4a4b4d]"><StatusBadge status={row.statusAlat} /></td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.start || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.rentangWaktuAktif || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.durasiAktif || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.rentangWaktuPassif || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.durasiPassif || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.mati || '-'}</td>
                      
                      <td className="px-3 py-3 text-white border-r border-[#4a4b4d]">{row.namaOperator || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.idOperator || '-'}</td>
                      <td className="px-3 py-3 text-center"><StatusBadge status={row.statusTrip} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="25" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-12 h-12 text-gray-600" />
                        <p className="text-gray-400 text-lg">Tidak ada data ditemukan</p>
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
