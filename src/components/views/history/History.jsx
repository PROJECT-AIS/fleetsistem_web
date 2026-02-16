import React, { useState, useMemo } from "react";
import { Download, Search, ChevronLeft, ChevronRight, Calendar, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import PageLayout from "../../layout/PageLayout";
import { isDateInRange, isDateInCustomRange } from "../../../utils/dateUtils";
import { useMqttContext } from "../../../context/MqttContext";

// Dummy data for development with new column structure
const DUMMY_DATA = Array.from({ length: 50 }, (_, i) => ({
  no: i + 1,
  waktu: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/08/2025 ${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  idAlat: `DEV-${String(i + 1).padStart(3, '0')}`,
  unitKendaraan: `B ${1000 + i} XYZ`,
  kecepatanKendaraan: Math.floor(Math.random() * 80) + 20,
  jenisMuatan: ["Batubara", "Pasir", "Kerikil", "Tanah", "Batu"][i % 5],
  statusMuatan: ["Terisi", "Kosong", "Setengah"][i % 3],
  statusUnit: {
    start: `${String(Math.floor(Math.random() * 4) + 6).padStart(2, '0')}:00:00`,
    rentangWaktuAktif: `${8 + (i % 4)}:00 - ${12 + (i % 4)}:00`,
    totalDurasiAktif: `${4 + (i % 3)} jam`,
    rentangWaktuPasif: `${12 + (i % 4)}:00 - ${13 + (i % 4)}:00`,
    totalWaktuPasif: `${1 + (i % 2)} jam`,
    mati: i % 5 === 0 ? "Ya" : "Tidak",
  },
  operator: {
    nama: ["Ahmad Rizki", "Budi Santoso", "Candra Wijaya", "Dedi Kurniawan", "Eko Prasetyo"][i % 5],
    id: `OP-${String(i + 1).padStart(3, '0')}`,
    jabatan: ["Driver", "Operator", "Supervisor", "Driver", "Operator"][i % 5],
    divisi: ["Operasional", "Logistik", "Manajemen", "Operasional", "Logistik"][i % 5],
  },
  gps: {
    latitude: -6.2 + (Math.random() * 0.1),
    longitude: 106.8 + (Math.random() * 0.1),
    trip: `Trip-${String(i + 1).padStart(2, '0')}`,
  },
  sensorFuel: {
    volumeBahanBakar: Math.floor(Math.random() * 200) + 50,
    konsumsi: (Math.random() * 5 + 2).toFixed(2),
    anomaliStatus: i % 7 === 0 ? "Terdeteksi" : "Normal",
    bahanBakarMasuk: Math.floor(Math.random() * 100) + 20,
  },
  lokasi: {
    awal: ["Pit A", "Pit B", "Pit C", "Stockpile 1", "Crusher"][i % 5],
    akhir: ["Stockpile 1", "Stockpile 2", "Port", "Crusher", "Pit A"][i % 5],
  },
  retase: {
    setUlangRetase: i % 3 === 0 ? "Ya" : "Tidak",
  },
}));

const FILTER_OPTIONS = ["Semua", "Hari Ini", "Minggu Ini", "Bulan Ini"];

// Status Badge Component
const StatusBadge = ({ status, type }) => {
  const getStyles = () => {
    switch (type) {
      case 'muatan':
        if (status === "Terisi") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (status === "Kosong") return "bg-red-500/20 text-red-400 border-red-500/30";
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case 'boolean':
        return status === "Ya"
          ? "bg-red-500/20 text-red-400 border-red-500/30"
          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case 'anomali':
        return status === "Terdeteksi"
          ? "bg-red-500/20 text-red-400 border-red-500/30"
          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case 'retase':
        return status === "Ya"
          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
          : "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}>
      {status}
    </span>
  );
};

export default function History() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { rawVehicles } = useMqttContext();

  // Transform live vehicle data into history logs
  const mqttLogs = useMemo(() => {
    const logs = [];
    Object.values(rawVehicles).forEach(v => {
      if (v.history) {
        v.history.forEach((h, idx) => {
          logs.push({
            no: `${v.id}-${idx}`,
            waktu: h.time,
            idAlat: v.device_id || v.id,
            unitKendaraan: v.vehicle_id,
            kecepatanKendaraan: v.gps?.speed_kph || 0,
            jenisMuatan: "-",
            statusMuatan: "-",
            statusUnit: {
              start: "-",
              rentangWaktuAktif: "-",
              totalDurasiAktif: "-",
              rentangWaktuPasif: "-",
              totalWaktuPasif: "-",
              mati: v.vehicle?.engine_on ? "Tidak" : "Ya",
            },
            operator: {
              nama: "MQTT User",
              id: "-",
              jabatan: "-",
              divisi: "-",
            },
            gps: {
              latitude: h.lat,
              longitude: h.lng,
              trip: "-",
            },
            sensorFuel: {
              volumeBahanBakar: v.fuel?.volume_l || 0,
              konsumsi: v.fuel?.consumption_l || 0,
              anomaliStatus: "Normal",
              bahanBakarMasuk: 0,
            },
            lokasi: {
              awal: "-",
              akhir: "-",
            },
            retase: {
              setUlangRetase: "Tidak",
            },
          });
        });
      }
    });
    return logs.reverse(); // Newest first
  }, [rawVehicles]);

  const historyData = useMemo(() => {
    if (mqttLogs.length > 0) return mqttLogs;
    return DUMMY_DATA;
  }, [mqttLogs]);

  // Filtered data based on active filters and search
  const filteredData = useMemo(() => {
    return historyData.filter(row => {
      const matchesFilter = isDateInRange(row.waktu, activeFilter);
      const matchesDateRange = isDateInCustomRange(row.waktu, startDate, endDate);
      const searchTerm = search.toLowerCase();
      const matchesSearch = !searchTerm ||
        row.idAlat.toLowerCase().includes(searchTerm) ||
        row.unitKendaraan.toLowerCase().includes(searchTerm) ||
        row.waktu.toLowerCase().includes(searchTerm);

      return matchesFilter && matchesDateRange && matchesSearch;
    });
  }, [activeFilter, startDate, endDate, search, historyData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Export to Excel function
  const handleExport = () => {
    // Prepare data for Excel
    const excelData = filteredData.map((row, index) => ({
      'No': index + 1,
      'Waktu': row.waktu,
      'ID Alat': row.idAlat,
      'Unit Kendaraan': row.unitKendaraan,
      'Kecepatan (Km/h)': row.kecepatanKendaraan,
      'Jenis Muatan': row.jenisMuatan,
      'Status Muatan': row.statusMuatan,
      'Status Unit - Start': row.statusUnit.start,
      'Status Unit - Rentang Aktif': row.statusUnit.rentangWaktuAktif,
      'Status Unit - Total Aktif': row.statusUnit.totalDurasiAktif,
      'Status Unit - Rentang Pasif': row.statusUnit.rentangWaktuPasif,
      'Status Unit - Total Pasif': row.statusUnit.totalWaktuPasif,
      'Status Unit - Mati': row.statusUnit.mati,
      'Operator - Nama': row.operator.nama,
      'Operator - ID': row.operator.id,
      'Operator - Jabatan': row.operator.jabatan,
      'Operator - Divisi': row.operator.divisi,
      'GPS - Latitude': row.gps.latitude.toFixed(6),
      'GPS - Longitude': row.gps.longitude.toFixed(6),
      'GPS - Trip': row.gps.trip,
      'Sensor Fuel - Volume (L)': row.sensorFuel.volumeBahanBakar,
      'Sensor Fuel - Konsumsi (L/km)': row.sensorFuel.konsumsi,
      'Sensor Fuel - Anomali': row.sensorFuel.anomaliStatus,
      'Sensor Fuel - Masuk (L)': row.sensorFuel.bahanBakarMasuk,
      'Lokasi - Awal': row.lokasi.awal,
      'Lokasi - Akhir': row.lokasi.akhir,
      'Set Ulang Retase': row.retase.setUlangRetase
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // Waktu
      { wch: 12 }, // ID Alat
      { wch: 15 }, // Unit Kendaraan
      { wch: 12 }, // Kecepatan
      { wch: 12 }, // Jenis Muatan
      { wch: 12 }, // Status Muatan
      { wch: 12 }, // Start
      { wch: 18 }, // Rentang Aktif
      { wch: 12 }, // Total Aktif
      { wch: 18 }, // Rentang Pasif
      { wch: 12 }, // Total Pasif
      { wch: 8 },  // Mati
      { wch: 18 }, // Nama
      { wch: 12 }, // Operator ID
      { wch: 12 }, // Jabatan
      { wch: 12 }, // Divisi
      { wch: 14 }, // Latitude
      { wch: 14 }, // Longitude
      { wch: 10 }, // Trip
      { wch: 12 }, // Volume
      { wch: 12 }, // Konsumsi
      { wch: 12 }, // Anomali
      { wch: 12 }, // Masuk
      { wch: 15 }, // Awal
      { wch: 15 }, // Akhir
      { wch: 15 }, // Retase
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'History Data');

    // Generate Excel file and download
    XLSX.writeFile(workbook, `history_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <PageLayout className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">History Data</h1>

      {/* Main Container */}
      <div className="bg-[#343538] rounded-2xl p-6 shadow-2xl">
        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Left: Filter Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-[#2d2e32] p-1 rounded-xl">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${activeFilter === opt
                    ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30"
                    : "text-gray-400 hover:text-white hover:bg-[#3d3e42]"
                    }`}
                  onClick={() => { setActiveFilter(opt); setCurrentPage(1); }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 bg-[#2d2e32] px-3 py-2 rounded-xl">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                className="bg-transparent text-white text-sm focus:outline-none w-32"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                className="bg-transparent text-white text-sm focus:outline-none w-32"
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Right: Search & Download */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari data..."
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

        {/* Info Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm text-gray-400">
            Total: <span className="text-white font-semibold">{filteredData.length}</span> data
          </p>
          {totalPages > 1 && (
            <p className="text-sm text-gray-400">
              Halaman <span className="text-white font-semibold">{currentPage}</span> dari <span className="text-white font-semibold">{totalPages}</span>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#4a4b4d] overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full" style={{ minWidth: '2400px' }}>
              <thead className="sticky top-0 z-10">
                {/* Main Header Row */}
                <tr className="bg-gradient-to-r from-[#4A8516] to-[#5FA81E]">
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">No</th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">Waktu</th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">ID Alat</th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">Unit Kendaraan</th>
                  <th rowSpan="2" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">Kecepatan</th>
                  <th rowSpan="2" className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">Jenis Muatan</th>
                  <th rowSpan="2" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10">Status Muatan</th>
                  <th colSpan="6" className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 bg-[#5FA81E]/80">Status Unit</th>
                  <th colSpan="4" className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 bg-[#6BB82E]/80">Operator</th>
                  <th colSpan="3" className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 bg-[#5FA81E]/80">GPS</th>
                  <th colSpan="4" className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 bg-[#6BB82E]/80">Sensor Fuel</th>
                  <th colSpan="2" className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-white/10 bg-[#5FA81E]/80">Lokasi</th>
                  <th rowSpan="2" className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider">Retase</th>
                </tr>
                {/* Sub Header Row */}
                <tr className="bg-[#3d6d12]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Start</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10 whitespace-nowrap">Rentang Aktif</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10 whitespace-nowrap">Total Aktif</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10 whitespace-nowrap">Rentang Pasif</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10 whitespace-nowrap">Total Pasif</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white/90 border-r border-white/10">Mati</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Nama</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Jabatan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Divisi</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Latitude</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Longitude</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Trip</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white/90 border-r border-white/10">Volume (L)</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white/90 border-r border-white/10 whitespace-nowrap">Konsumsi</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white/90 border-r border-white/10">Anomali</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-white/90 border-r border-white/10">Masuk (L)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Awal</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-white/90 border-r border-white/10">Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b4d]">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr
                      key={row.no}
                      className="hover:bg-[#3d3e42] transition-colors duration-150"
                      style={{ backgroundColor: index % 2 === 0 ? '#2d2e32' : '#343538' }}
                    >
                      <td className="px-4 py-3 text-sm text-gray-300 font-medium">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap font-mono">{row.waktu}</td>
                      <td className="px-4 py-3 text-sm text-white font-semibold">{row.idAlat}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{row.unitKendaraan}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 text-center font-mono">{row.kecepatanKendaraan} <span className="text-gray-500 text-xs">km/h</span></td>
                      <td className="px-4 py-3 text-sm text-gray-300">{row.jenisMuatan}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={row.statusMuatan} type="muatan" /></td>
                      <td className="px-3 py-3 text-sm text-gray-300 font-mono">{row.statusUnit.start}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 whitespace-nowrap">{row.statusUnit.rentangWaktuAktif}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.statusUnit.totalDurasiAktif}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 whitespace-nowrap">{row.statusUnit.rentangWaktuPasif}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.statusUnit.totalWaktuPasif}</td>
                      <td className="px-3 py-3 text-center"><StatusBadge status={row.statusUnit.mati} type="boolean" /></td>
                      <td className="px-3 py-3 text-sm text-white font-medium whitespace-nowrap">{row.operator.nama}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 font-mono">{row.operator.id}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.operator.jabatan}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.operator.divisi}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 font-mono">{row.gps.latitude.toFixed(6)}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 font-mono">{row.gps.longitude.toFixed(6)}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.gps.trip}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 text-center font-mono">{row.sensorFuel.volumeBahanBakar}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 text-center font-mono">{row.sensorFuel.konsumsi}</td>
                      <td className="px-3 py-3 text-center"><StatusBadge status={row.sensorFuel.anomaliStatus} type="anomali" /></td>
                      <td className="px-3 py-3 text-sm text-gray-300 text-center font-mono">{row.sensorFuel.bahanBakarMasuk}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.lokasi.awal}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{row.lokasi.akhir}</td>
                      <td className="px-3 py-3 text-center"><StatusBadge status={row.retase.setUlangRetase} type="retase" /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="27" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="w-12 h-12 text-gray-600" />
                        <p className="text-gray-400 text-lg">Tidak ada data ditemukan</p>
                        <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#4a4b4d]">
            <p className="text-sm text-gray-400">
              Menampilkan <span className="text-white font-semibold">{startIndex + 1}</span> - <span className="text-white font-semibold">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> dari <span className="text-white font-semibold">{filteredData.length}</span> data
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#2d2e32] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d3e42] transition-colors border border-[#4a4b4d]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === pageNum
                        ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30"
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
                className="p-2 rounded-lg bg-[#2d2e32] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3d3e42] transition-colors border border-[#4a4b4d]"
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