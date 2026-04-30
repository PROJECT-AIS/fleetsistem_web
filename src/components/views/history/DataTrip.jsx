import React, { useState, useEffect, useMemo } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import api from "../../../services/api";

export default function DataTrip() {
  const [dataTrip, setDataTrip] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/datatrip');
      if (res.data?.ok) {
        setDataTrip(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching datatrip:", error);
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
    if (!search) return dataTrip;
    const lower = search.toLowerCase();
    return dataTrip.filter(row => 
      (row.idAlat || "").toLowerCase().includes(lower) ||
      (row.trip || "").toLowerCase().includes(lower) ||
      (row.namaOperator || "").toLowerCase().includes(lower)
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
      <h1 className="text-2xl font-bold text-white mb-6">Data Trip Real Time (Database)</h1>
      
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
                placeholder="Cari alat/trip/operator..."
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
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#92d050] text-black">
                <tr>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">NO</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">ID_ALAT</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap min-w-[200px]">TRIP</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">TANGGAL</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap min-w-[150px]">LOKASI START</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap min-w-[150px]">LOKASI FINISH</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap min-w-[150px]">NAMA OPERATOR</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">ID OPERATOR</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap bg-[#ffff00] min-w-[150px]">JENIS MUATAN</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">WAKTU START</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">WAKTU FINISH</th>
                  <th className="px-3 py-3 font-bold border border-black/20 uppercase whitespace-nowrap">DURASI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b4d]">
                {loading && dataTrip.length === 0 ? (
                  <tr>
                     <td colSpan="12" className="px-4 py-8 text-center text-gray-400">Loading data...</td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
                    <tr key={row.id} className="hover:bg-[#3d3e42]" style={{ backgroundColor: idx % 2 === 0 ? '#2d2e32' : '#343538' }}>
                      <td className="px-3 py-3 text-gray-300 text-center border-r border-[#4a4b4d]">{startIndex + idx + 1}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.idAlat || '-'}</td>
                      <td className="px-3 py-3 text-white font-medium border-r border-[#4a4b4d] bg-[#ffff00]/10">{row.trip || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono border-r border-[#4a4b4d]">{row.tanggal || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.lokasiStart || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.lokasiFinish || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.namaOperator || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.idOperator || '-'}</td>
                      <td className="px-3 py-3 text-yellow-400 font-semibold border-r border-[#4a4b4d]">{row.jenisMuatan || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono text-center border-r border-[#4a4b4d]">{row.waktuStart || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 font-mono text-center border-r border-[#4a4b4d]">{row.waktuFinish || '-'}</td>
                      <td className="px-3 py-3 text-gray-300 border-r border-[#4a4b4d]">{row.durasi || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-4 py-12 text-center">
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
