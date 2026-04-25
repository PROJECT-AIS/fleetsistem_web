import React, { useState, useEffect, useCallback, useMemo } from "react";
import PageLayout from "../../layout/PageLayout";
import { influxService } from "../../../services/influxService";

const baseColumns = [
  { key: "seq", label: "SEQ", width: 40, align: "right" },
  { key: "idAlat", label: "ID_ALAT", width: 104 },
  { key: "tanggal", label: "TANGGAL", width: 104, align: "center" },
  { key: "kodeShift", label: "KODE_SHIFT", width: 116, align: "center" },
  { key: "operator", label: "OPERATOR", width: 112 },
  { key: "jarakTempuh", label: "JARAK TEMPUH (KM)", width: 114, align: "center" },
  { key: "kecepatanTertinggi", label: "KECEPATAN TERTINGGI", width: 113, align: "center" },
  { key: "kecepatanRataRata", label: "KECEPATAN RATA-RATA", width: 113, align: "center" },
];

const tripColumns = [
  { key: "total", label: "TOTAL", width: 64, align: "center" },
  { key: "kosong", label: "KOSONG", width: 84, align: "center" },
  { key: "topSoil", label: "TOP SOIL", width: 58, align: "center" },
  { key: "ob", label: "OB", width: 54, align: "center" },
  { key: "limOre", label: "LIM ORE", width: 70, align: "center" },
  { key: "sapOre", label: "SAP ORE", width: 66, align: "center" },
  { key: "civilQuarry", label: "CIVIL QUARRY", width: 104, align: "center" },
  { key: "coal", label: "COAL", width: 54, align: "center" },
  { key: "slag", label: "SLAG", width: 78, align: "center" },
  { key: "materialLainnya", label: "MATERIAL LAINNYA", width: 90, align: "center" },
];

const summaryColumns = [
  { key: "durasiAktif", label: "DURASI AKTIF", width: 78, align: "center" },
  { key: "durasiPasif", label: "DURASI PASIF", width: 78, align: "center" },
  { key: "durasiMati", label: "DURASI MATI", width: 78, align: "center" },
  { key: "totalKonsumsiFuel", label: "TOTAL KONSUMSI FUEL", width: 96, align: "center" },
  { key: "rataRataKonsumsiFuel", label: "RATA-RATA KONSUMSI FUEL (LITER PERJAM)", width: 164, align: "center" },
];

const previewRows = [
  {
    no: "1",
    idAlat: "ABC-DT-001",
    tanggal: "18-Feb-2026",
    kodeShift: "21",
    operator: "AMIR",
    jarakTempuh: "128.4",
    kecepatanTertinggi: "62 km/h",
    kecepatanRataRata: "34 km/h",
    total: "18",
    kosong: "3",
    topSoil: "2",
    ob: "5",
    limOre: "3",
    sapOre: "2",
    civilQuarry: "1",
    coal: "1",
    slag: "0",
    materialLainnya: "1",
    durasiAktif: "8j 12m",
    durasiPasif: "1j 05m",
    durasiMati: "43m",
    totalKonsumsiFuel: "184 L",
    rataRataKonsumsiFuel: "20.6 L/jam",
  },
  {
    no: "2",
    idAlat: "ABC-DT-001",
    tanggal: "18-Feb-2026",
    kodeShift: "22",
    operator: "ANTO",
    jarakTempuh: "116.9",
    kecepatanTertinggi: "59 km/h",
    kecepatanRataRata: "31 km/h",
    total: "16",
    kosong: "4",
    topSoil: "1",
    ob: "4",
    limOre: "2",
    sapOre: "3",
    civilQuarry: "1",
    coal: "0",
    slag: "1",
    materialLainnya: "0",
    durasiAktif: "7j 45m",
    durasiPasif: "1j 18m",
    durasiMati: "57m",
    totalKonsumsiFuel: "169 L",
    rataRataKonsumsiFuel: "19.4 L/jam",
  },
  {
    no: "3",
    idAlat: "ABC-DT-002",
    tanggal: "18-Feb-2026",
    kodeShift: "21",
    operator: "BURHAN",
    jarakTempuh: "134.2",
    kecepatanTertinggi: "65 km/h",
    kecepatanRataRata: "36 km/h",
    total: "20",
    kosong: "2",
    topSoil: "3",
    ob: "6",
    limOre: "4",
    sapOre: "2",
    civilQuarry: "1",
    coal: "1",
    slag: "0",
    materialLainnya: "1",
    durasiAktif: "8j 34m",
    durasiPasif: "52m",
    durasiMati: "34m",
    totalKonsumsiFuel: "196 L",
    rataRataKonsumsiFuel: "21.0 L/jam",
  },
  {
    no: "4",
    idAlat: "ABC-DT-002",
    tanggal: "18-Feb-2026",
    kodeShift: "22",
    operator: "DIDIK",
    jarakTempuh: "109.7",
    kecepatanTertinggi: "58 km/h",
    kecepatanRataRata: "30 km/h",
    total: "15",
    kosong: "4",
    topSoil: "1",
    ob: "3",
    limOre: "2",
    sapOre: "2",
    civilQuarry: "1",
    coal: "1",
    slag: "0",
    materialLainnya: "1",
    durasiAktif: "7j 21m",
    durasiPasif: "1j 27m",
    durasiMati: "1j 12m",
    totalKonsumsiFuel: "158 L",
    rataRataKonsumsiFuel: "18.7 L/jam",
  },
  {
    no: "5",
    idAlat: "ABC-DT-003",
    tanggal: "18-Feb-2026",
    kodeShift: "21",
    operator: "DG SUDDING",
    jarakTempuh: "141.5",
    kecepatanTertinggi: "67 km/h",
    kecepatanRataRata: "38 km/h",
    total: "21",
    kosong: "2",
    topSoil: "2",
    ob: "7",
    limOre: "5",
    sapOre: "2",
    civilQuarry: "1",
    coal: "1",
    slag: "0",
    materialLainnya: "1",
    durasiAktif: "8j 48m",
    durasiPasif: "44m",
    durasiMati: "28m",
    totalKonsumsiFuel: "205 L",
    rataRataKonsumsiFuel: "21.8 L/jam",
  },
  {
    no: "6",
    idAlat: "ABC-DT-003",
    tanggal: "18-Feb-2026",
    kodeShift: "22",
    operator: "ANCA",
    jarakTempuh: "121.3",
    kecepatanTertinggi: "61 km/h",
    kecepatanRataRata: "33 km/h",
    total: "17",
    kosong: "3",
    topSoil: "2",
    ob: "4",
    limOre: "3",
    sapOre: "2",
    civilQuarry: "1",
    coal: "1",
    slag: "1",
    materialLainnya: "0",
    durasiAktif: "7j 58m",
    durasiPasif: "1j 02m",
    durasiMati: "1j 00m",
    totalKonsumsiFuel: "176 L",
    rataRataKonsumsiFuel: "20.1 L/jam",
  },
  {
    no: "7",
    idAlat: "ABC-DT-004",
    tanggal: "18-Feb-2026",
    kodeShift: "21",
    operator: "YUSUF",
    jarakTempuh: "137.8",
    kecepatanTertinggi: "64 km/h",
    kecepatanRataRata: "35 km/h",
    total: "19",
    kosong: "3",
    topSoil: "2",
    ob: "5",
    limOre: "4",
    sapOre: "2",
    civilQuarry: "2",
    coal: "0",
    slag: "0",
    materialLainnya: "1",
    durasiAktif: "8j 25m",
    durasiPasif: "58m",
    durasiMati: "37m",
    totalKonsumsiFuel: "190 L",
    rataRataKonsumsiFuel: "20.9 L/jam",
  },
  {
    no: "8",
    idAlat: "ABC-DT-004",
    tanggal: "18-Feb-2026",
    kodeShift: "22",
    operator: "FAJAR",
    jarakTempuh: "112.6",
    kecepatanTertinggi: "57 km/h",
    kecepatanRataRata: "29 km/h",
    total: "14",
    kosong: "4",
    topSoil: "1",
    ob: "3",
    limOre: "2",
    sapOre: "2",
    civilQuarry: "1",
    coal: "0",
    slag: "1",
    materialLainnya: "0",
    durasiAktif: "7j 10m",
    durasiPasif: "1j 34m",
    durasiMati: "1j 16m",
    totalKonsumsiFuel: "151 L",
    rataRataKonsumsiFuel: "18.2 L/jam",
  },
];

const allColumns = [...baseColumns, ...tripColumns, ...summaryColumns];
const tableWidth = allColumns.reduce((total, column) => total + column.width, 0);

const headerCellClass =
  "border-r border-white/10 px-3 py-3 text-center align-middle text-xs font-bold uppercase leading-tight tracking-wider text-white";
const subHeaderCellClass =
  "border-r border-white/10 px-3 py-2 text-center align-middle text-xs font-semibold uppercase leading-tight text-white/90";
const bodyCellClass =
  "px-3 py-3 align-middle text-sm leading-5 text-gray-300";

const getAlignClass = (align) => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

const renderHeaderLabel = (label) => (
  <span className="block whitespace-normal">
    {label.split(" ").map((word, index) => (
      <React.Fragment key={`${label}-${word}-${index}`}>
        {index > 0 ? " " : ""}
        {word}
      </React.Fragment>
    ))}
  </span>
);

export default function Analysis() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalysisData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await influxService.getHistory({ limit: 100 }); // Get more for analysis
      const formatted = res.data.data.map(r => ({
        seq: r.seq || r.no,
        idAlat: r.idAlat,
        tanggal: r.waktu.split(' ')[0],
        kodeShift: "-",
        operator: r.operatorName || "-",
        jarakTempuh: "-",
        kecepatanTertinggi: `${r.kecepatanKendaraan} km/h`,
        kecepatanRataRata: "-",
        total: "-",
        kosong: "-",
        topSoil: "-",
        ob: "-",
        limOre: "-",
        sapOre: "-",
        civilQuarry: "-",
        coal: "-",
        slag: "-",
        materialLainnya: "-",
        durasiAktif: "-",
        durasiPasif: "-",
        durasiMati: r.statusUnit.mati === "Ya" ? "Ya" : "-",
        totalKonsumsiFuel: `${r.sensorFuel.volumeBahanBakar} L`,
        rataRataKonsumsiFuel: "-"
      }));
      setRows(formatted);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const displayRows = useMemo(() => rows.length > 0 ? rows : previewRows, [rows]);

  return (
    <PageLayout className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-white">Analysis</h1>

      <div className="rounded-2xl bg-[#343538] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">
            TABEL PRODUKSI & KINERJA {rows.length > 0 ? "(LIVE DATA)" : "(DATA PREVIEW)"}
          </h2>
          <p className="text-sm text-gray-400">
            Total: <span className="font-semibold text-white">{displayRows.length}</span> unit
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#4a4b4d]">
          <div className="overflow-x-auto scrollbar-hide">
            <table
              className="w-full"
              style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: Math.max(tableWidth, 2400), tableLayout: "fixed" }}
            >
              <colgroup>
                {allColumns.map((column) => (
                  <col key={column.key} style={{ width: column.width }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-[#4A8516] to-[#5FA81E]">
                  {baseColumns.map((column) => (
                    <th key={column.key} rowSpan={2} className={headerCellClass}>
                      {renderHeaderLabel(column.label)}
                    </th>
                  ))}
                  <th
                    colSpan={tripColumns.length}
                    className="border-r border-white/10 bg-[#6BB82E]/80 px-4 py-2 text-center align-middle text-xs font-bold uppercase tracking-wider text-white"
                  >
                    TRIP MUATAN
                  </th>
                  {summaryColumns.map((column) => (
                    <th key={column.key} rowSpan={2} className={headerCellClass}>
                      {renderHeaderLabel(column.label)}
                    </th>
                  ))}
                </tr>
                <tr className="bg-[#3d6d12]">
                  {tripColumns.map((column) => (
                    <th key={column.key} className={subHeaderCellClass}>
                      {renderHeaderLabel(column.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4a4b4d]">
                {displayRows.map((row, rowIndex) => (
                  <tr
                    key={`preview-row-${rowIndex}`}
                    className="transition-colors duration-150 hover:bg-[#3d3e42]"
                    style={{ backgroundColor: rowIndex % 2 === 0 ? "#2d2e32" : "#343538" }}
                  >
                    {allColumns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.key}`}
                        className={`${bodyCellClass} ${getAlignClass(column.align)} ${
                          column.key === "idAlat" ? "font-semibold text-white" : ""
                        } ${column.key === "operator" ? "font-medium text-white" : ""}`}
                      >
                        {row[column.key] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
