import React, { useState, useEffect, useCallback, useRef } from "react";
import { Database, Users, Truck, User, MapPin, Save, X, Fuel, Upload, Eye, EyeOff, Check, Loader2, PackageSearch, Wifi, WifiOff, CreditCard } from "lucide-react";
import { useNfcScan } from "../../../hooks/useNfcScan";
import PageLayout from "../../layout/PageLayout";
import { alatService, operatorService, lokasiService, shiftCodeService, materialTypeService, kalibrasiService, pengawasService } from "../../../services/configService";
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';
import { Link } from "react-router-dom";
import { MQTT_ACTIONS, publishMqttActions } from "../../../utils/mqttActions";
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

const GOOGLE_MAPS_API_KEY = 'AIzaSyAcm-7sXCOMDgcP6YCH2cG_vWK4EfiP5ac';

// Main Tab data
const TABS = [
    { id: "kalibrasi", label: "Kalibrasi", icon: Fuel },
    { id: "input-data", label: "Input Data", icon: Database },
    { id: "user-management", label: "User Management", icon: Users },
];

// Input Data Sub-tabs
const INPUT_DATA_TABS = [
    { id: "alat", label: "Data Alat", icon: Truck },
    { id: "operator", label: "Data Operator", icon: User },
    { id: "lokasi", label: "Data Lokasi", icon: MapPin },
];

const PARAMETER_INPUT_TABS = [
    { id: "shift-code", label: "Shift Code", icon: PackageSearch },
    { id: "material-type", label: "Material Type", icon: PackageSearch },
    { id: "alat", label: "Data Alat", icon: Truck },
    { id: "operator", label: "Data Operator", icon: User },
    { id: "lokasi", label: "Data Lokasi", icon: MapPin },
];

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Toast notification
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in border ${
            type === "success" 
                ? "bg-[#74CD25]/10 border-[#74CD25]/30 text-[#74CD25]" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            } backdrop-blur-md`}>
            {type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-wide uppercase">{message}</span>
        </div>
    );
};

// Reusable form input component
const FormInput = ({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    required = false,
    disabled = false,
    compact = false,
    className = "",
}) => (
    <div className={cn("flex flex-col gap-1.5", compact && "gap-1")}>
        <label className={cn("text-xs font-bold text-gray-500 uppercase tracking-widest", compact && "tracking-[0.12em]")}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={cn(
                "bg-[#2d2e32] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-[#74CD25] focus:outline-none transition-all disabled:opacity-50 text-sm",
                compact && "px-3 py-2.5 text-sm rounded-lg",
                className
            )}
        />
    </div>
);

// Reusable select component
const FormSelect = ({ label, name, value, onChange, options, required = false, compact = false }) => (
    <div className={cn("flex flex-col gap-1.5", compact && "gap-1")}>
        <label className={cn("text-xs font-bold text-gray-500 uppercase tracking-widest", compact && "tracking-[0.12em]")}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={cn(
                "bg-[#2d2e32] text-white px-4 py-3 rounded-xl border border-white/10 focus:border-[#74CD25] focus:outline-none transition-all text-sm appearance-none",
                compact && "px-3 py-2.5 text-sm rounded-lg"
            )}
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
        >
            <option value="">Pilih {label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const PREVIEW_LIMIT = 5;

const PREVIEW_TABLES = {
    alat: {
        title: "Data Equipment Tersimpan",
        columns: [
            { key: "idFms", label: "ID Device (FMS)" },
            { key: "noUnit", label: "Nomor Unit" },
            { key: "jenisAlat", label: "Jenis Alat" },
            { key: "merk", label: "Merek" },
            { key: "kapasitasMuat", label: "Max Load (TON)" },
            { key: "kapasitasTangki", label: "Fuel Capacity (L)" },
            { key: "tahunManufaktur", label: "Year" },
            { key: "status", label: "Status" },
        ],
    },
    operator: {
        title: "Data Operator Tersimpan",
        columns: [
            { key: "idOperator", label: "ID Operator" },
            { key: "nama", label: "Nama" },
            { key: "jabatan", label: "Jabatan" },
            { key: "divisi", label: "Divisi" },
            { key: "noTelp", label: "No. Telepon" },
            { key: "alamat", label: "Alamat" },
            { key: "idCardNfc", label: "ID Card NFC" },
        ],
    },
    lokasi: {
        title: "Data Location Tersimpan",
        columns: [
            { key: "name", label: "Nama Lokasi" },
            { key: "type", label: "Type" },
            { key: "latitude", label: "Latitude" },
            { key: "longitude", label: "Longitude" },
            { key: "radius", label: "Radius" },
        ],
    },
    shiftCode: {
        title: "Data Shift Code Tersimpan",
        columns: [
            { key: "namaShift", label: "Nama Shift" },
            { key: "kodeShift", label: "Kode Shift" },
            { key: "rentangWaktu", label: "Rentang Waktu" },
            { key: "keterangan", label: "Keterangan" },
        ],
    },
    materialType: {
        title: "Data Material Type Tersimpan",
        columns: [
            { key: "jenisMuatan", label: "Jenis Muatan" },
        ],
    },
    kalibrasi: {
        title: "Data Sensor Calibration Tersimpan",
        columns: [
            { key: "alatName", label: "Equipment" },
            { key: "empty", label: "Empty" },
            { key: "full", label: "Full" },
            { key: "kapasitasTangki", label: "Kapasitas Tangki" },
        ],
    },
    users: {
        title: "Data User Management Tersimpan",
        columns: [
            { key: "nama", label: "Nama" },
            { key: "email", label: "Email" },
            { key: "noTelp", label: "No. Telepon" },
            { key: "createdAtLabel", label: "Dibuat" },
        ],
    },
};

const PreviewTable = ({ title, columns, rows, manageHref }) => (
    <div className="mt-12 rounded-3xl bg-[#2d2e32] p-7 border border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#74CD25]/5 rounded-full blur-2xl -ml-16 -mt-16 pointer-events-none" />
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative">
            <div>
                <h3 className="text-xl font-black text-white tracking-tight uppercase">{title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-bold uppercase tracking-widest">Entry data dan view data terintegrasi</p>
            </div>
            <Link
                to={manageHref}
                className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-[#4a4b4d] px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#5a5b5d] hover:scale-105 active:scale-95 shadow-lg"
            >
                <Eye className="h-4 w-4" />
                Manage Detail
            </Link>
        </div>

        {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#5a5b5d] px-4 py-8 text-center text-sm text-gray-400">
                Belum ada data yang tersimpan.
            </div>
        ) : (
            <div className={analysisTableShellClass}>
                <div className={analysisTableScrollClass}>
                <table className={`${analysisTableClass} text-left`}>
                    <thead className={analysisTableHeadClass}>
                        <tr className={analysisHeaderRowClass}>
                            {columns.map((column) => (
                                <th key={column.key} className={`${analysisHeaderCellClass} text-left`}>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={analysisBodyClass}>
                        {rows.map((row, index) => (
                            <tr key={row.id} className={analysisRowClass} style={getStripedRowStyle(index)}>
                                {columns.map((column) => (
                                    <td key={column.key} className={analysisBodyCellClass}>
                                        {row[column.key] ?? "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        )}
    </div>
);

// Kalibrasi Tab Component
const KalibrasiTab = ({ showToast, alatList, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ alatId: "", empty: "", full: "", kapasitasTangki: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.alatId) {
            showToast("Pilih alat terlebih dahulu", "error");
            return;
        }
        setLoading(true);
        try {
            await kalibrasiService.create(form);
            showToast("Kalibrasi berhasil disimpan", "success");
            setForm({ alatId: "", empty: "", full: "", kapasitasTangki: "" });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan kalibrasi", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {!compact ? <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight uppercase">Sensor Calibration</h2> : null}
            {!compact ? <p className="text-gray-500 text-xs mb-8 font-bold uppercase tracking-widest">Konfigurasi ambang batas sensor bahan bakar</p> : null}

            <form
                onSubmit={handleSubmit}
                className={cn(
                    "space-y-6 max-w-4xl bg-[#2d2e32] p-8 rounded-2xl border border-white/5 shadow-xl",
                    compact && "space-y-4 max-w-full p-4 rounded-xl"
                )}
            >
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6", compact && "gap-3")}>
                    <FormSelect
                        label="Equipment"
                        name="alatId"
                        value={form.alatId}
                        onChange={handleChange}
                        options={alatList.map(a => ({ value: a.id, label: `${a.idFms || a.noPlat} (${a.typeAlat || 'Unit'})` }))}
                        compact={compact}
                        required
                    />
                    <FormInput label="Empty Value (Raw)" name="empty" value={form.empty} onChange={handleChange} type="number" placeholder="Contoh: 150" required compact={compact} />
                    <FormInput label="Full Value (Raw)" name="full" value={form.full} onChange={handleChange} type="number" placeholder="Contoh: 1023" required compact={compact} />
                    <FormInput label="Kapasitas Tangki (Liter)" name="kapasitasTangki" value={form.kapasitasTangki} onChange={handleChange} type="number" placeholder="Contoh: 200" required compact={compact} />
                </div>

                <div className={cn("flex gap-3 pt-2", compact && "pt-1")}>
                    <button type="submit" disabled={loading} className={cn(
                        "flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95",
                        compact && "px-5 py-2.5"
                    )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Kalibrasi
                    </button>
                    <button type="button" onClick={() => setForm({ alatId: "", empty: "", full: "", kapasitasTangki: "" })} className={cn(
                        "flex items-center gap-2 px-6 py-3 bg-[#4a4b4d] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5a5b5d] transition-all",
                        compact && "px-4 py-2.5"
                    )}>
                        <X className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </form>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.kalibrasi.title}
                    columns={PREVIEW_TABLES.kalibrasi.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </div>
    );
};

// Input Data Alat Component
const InputDataAlat = ({ showToast, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ 
        idFms: "", 
        noUnit: "", 
        jenisAlat: "", 
        merk: "", 
        kapasitasMuat: "", 
        kapasitasTangki: "", 
        tahunManufaktur: "", 
        status: "Aktif" 
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await alatService.create(form);
            showToast("Data alat berhasil disimpan", "success");
            setForm({ 
                idFms: "", 
                noUnit: "", 
                jenisAlat: "", 
                merk: "", 
                kapasitasMuat: "", 
                kapasitasTangki: "", 
                tahunManufaktur: "", 
                status: "Aktif" 
            });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan data alat", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("space-y-6", compact && "space-y-4")}>
            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", compact && "gap-3")}>
                <FormInput label="ID Device (FMS)" name="idFms" value={form.idFms} onChange={handleChange} placeholder="FMS-001" required compact={compact} />
                <FormInput label="Nomor Unit" name="noUnit" value={form.noUnit} onChange={handleChange} placeholder="ABC-DT-001" required compact={compact} />
                <FormInput label="Jenis Alat" name="jenisAlat" value={form.jenisAlat} onChange={handleChange} placeholder="DUMP TRUCK 10 WHEEL" required compact={compact} />
                <FormInput label="Merek" name="merk" value={form.merk} onChange={handleChange} placeholder="SCANIA / VOLVO" compact={compact} />
                <FormInput label="Kapasitas Muat Maksimum (TON)" name="kapasitasMuat" value={form.kapasitasMuat} onChange={handleChange} type="number" placeholder="30" compact={compact} />
                <FormInput label="Kapasitas Tangki BBM (Liter)" name="kapasitasTangki" value={form.kapasitasTangki} onChange={handleChange} type="number" placeholder="400" compact={compact} />
                <FormInput label="Tahun Manufaktur" name="tahunManufaktur" value={form.tahunManufaktur} onChange={handleChange} type="number" placeholder="2024" compact={compact} />
                <FormSelect label="Status" name="status" value={form.status} onChange={handleChange} compact={compact}
                    options={[
                        { value: "Aktif", label: "Aktif" },
                        { value: "Maintenance", label: "Maintenance" },
                        { value: "Non-Aktif", label: "Non-Aktif" },
                    ]} required />
            </div>
            
            <div className={cn("flex gap-3 pt-4", compact && "pt-2")}>
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Alat
                </button>
            </div>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.alat.title}
                    columns={PREVIEW_TABLES.alat.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </form>
    );
};

// Input Data Operator Component (with NFC Scan)
const InputDataOperator = ({ showToast, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ idOperator: "", nama: "", noTelp: "", divisi: "", idCardNfc: "", jabatan: "", alamat: "" });
    const [loading, setLoading] = useState(false);
    const { scanning, nfcId, error: nfcError, startScan, stopScan } = useNfcScan({ timeout: 30000 });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Auto-fill NFC ID when scanned
    useEffect(() => {
        if (nfcId) {
            setForm(prev => ({ ...prev, idCardNfc: nfcId }));
            showToast(`Kartu NFC terdeteksi: ${nfcId}`, "success");
        }
    }, [nfcId, showToast]);

    // Show error toast if NFC scan fails
    useEffect(() => {
        if (nfcError) {
            showToast(nfcError, "error");
        }
    }, [nfcError, showToast]);

    const handleStopScan = useCallback(() => {
        stopScan();
        setForm(prev => ({ ...prev, idCardNfc: "" }));
        showToast("Scan dihentikan, ID Card NFC dikosongkan", "success");
    }, [showToast, stopScan]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await operatorService.create(form);
            showToast("Data operator berhasil disimpan", "success");
            setForm({ idOperator: "", nama: "", noTelp: "", divisi: "", idCardNfc: "", jabatan: "", alamat: "" });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan data operator", "error");
        } finally {
            setLoading(false);
        }
    };

    if (compact) {
        const nfcStatusLabel = scanning ? "Menunggu scan kartu" : form.idCardNfc ? "Kartu terbaca" : "Siap scan";

        return (
            <form onSubmit={handleSubmit} className="h-full flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    <FormInput label="ID Operator" name="idOperator" value={form.idOperator} onChange={handleChange} placeholder="OP-001" required compact />
                    <FormInput label="Nama Operator" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama lengkap" required compact />
                    <FormSelect label="Jabatan" name="jabatan" value={form.jabatan} onChange={handleChange} compact
                        options={[
                            { value: "Driver", label: "Driver" },
                            { value: "Operator", label: "Operator" },
                            { value: "Supervisor", label: "Supervisor" },
                            { value: "Mekanik", label: "Mekanik" },
                        ]} required />
                    <FormSelect label="Divisi" name="divisi" value={form.divisi} onChange={handleChange} compact
                        options={[
                            { value: "Operasional", label: "Operasional" },
                            { value: "Logistik", label: "Logistik" },
                            { value: "Maintenance", label: "Maintenance" },
                            { value: "HSE", label: "HSE" },
                        ]} required />
                    <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} placeholder="08xxxxxxxxxx" required compact />
                    <FormInput label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap" compact />
                </div>

                <div className="rounded-lg border border-[#4a4b4d] bg-[#2d2e32] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-[#74CD25]" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">ID Card NFC</h3>
                        </div>
                        <span className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider",
                            scanning ? "bg-[#74CD25]/15 text-[#74CD25]" : form.idCardNfc ? "bg-emerald-500/15 text-emerald-400" : "bg-white/10 text-gray-300"
                        )}>
                            {nfcStatusLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
                        <input
                            type="text"
                            name="idCardNfc"
                            value={form.idCardNfc}
                            onChange={handleChange}
                            placeholder="Tekan Scan untuk membaca kartu NFC..."
                            className="w-full bg-[#1e1f22] text-white px-3 py-2 text-sm rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none transition-colors font-mono"
                        />
                        {scanning ? (
                            <button
                                type="button"
                                onClick={handleStopScan}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg font-semibold text-sm hover:bg-red-500/30 transition-all"
                            >
                                <WifiOff className="w-3.5 h-3.5" />
                                Stop
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={startScan}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#74CD25]/15 text-[#74CD25] border border-[#74CD25]/40 rounded-lg font-semibold text-sm hover:bg-[#74CD25]/25 transition-all"
                            >
                                <Wifi className="w-3.5 h-3.5" />
                                Scan NFC
                            </button>
                        )}
                    </div>

                    {scanning ? <p className="mt-2 text-sm text-[#74CD25]">Tempel kartu NFC ke reader. Tekan Stop untuk membatalkan dan kosongkan ID.</p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#74CD25] text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Operator
                    </button>
                </div>

                {showPreview ? (
                    <PreviewTable
                        title={PREVIEW_TABLES.operator.title}
                        columns={PREVIEW_TABLES.operator.columns}
                        rows={rows}
                        manageHref={manageHref}
                    />
                ) : null}
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FormInput label="ID Operator" name="idOperator" value={form.idOperator} onChange={handleChange} placeholder="OP-001" required />
                <FormInput label="Nama Operator" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama lengkap" required />
                <FormSelect label="Jabatan" name="jabatan" value={form.jabatan} onChange={handleChange}
                    options={[
                        { value: "Driver", label: "Driver" },
                        { value: "Operator", label: "Operator" },
                        { value: "Supervisor", label: "Supervisor" },
                        { value: "Mekanik", label: "Mekanik" },
                    ]} required />
                <FormSelect label="Divisi" name="divisi" value={form.divisi} onChange={handleChange}
                    options={[
                        { value: "Operasional", label: "Operasional" },
                        { value: "Logistik", label: "Logistik" },
                        { value: "Maintenance", label: "Maintenance" },
                        { value: "HSE", label: "HSE" },
                    ]} required />
                <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
                <div className="md:col-span-2 xl:col-span-3">
                    <FormInput label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap" />
                </div>
            </div>

            <div className="rounded-xl border border-[#4a4b4d] bg-[#2d2e32] p-5">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-[#74CD25]" />
                    <h3 className="text-sm font-semibold text-white">ID Card NFC</h3>
                </div>

                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <input
                            type="text"
                            name="idCardNfc"
                            value={form.idCardNfc}
                            onChange={handleChange}
                            placeholder="Tekan Scan untuk membaca kartu NFC..."
                            className="w-full bg-[#1e1f22] text-white px-4 py-3 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none transition-colors font-mono text-sm"
                        />
                    </div>
                    {scanning ? (
                        <button
                            type="button"
                            onClick={handleStopScan}
                            className="flex items-center gap-2 px-5 py-3 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg font-semibold text-sm hover:bg-red-500/30 transition-all"
                        >
                            <WifiOff className="w-4 h-4" />
                            Stop
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={startScan}
                            className="flex items-center gap-2 px-5 py-3 bg-[#74CD25]/15 text-[#74CD25] border border-[#74CD25]/40 rounded-lg font-semibold text-sm hover:bg-[#74CD25]/25 transition-all"
                        >
                            <Wifi className="w-4 h-4" />
                            Scan NFC
                        </button>
                    )}
                </div>

                {scanning && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-[#74CD25]/10 border border-[#74CD25]/20">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74CD25] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#74CD25]"></span>
                        </div>
                        <span className="text-sm text-[#74CD25] font-medium">Menunggu scan kartu NFC...</span>
                    </div>
                )}

                {form.idCardNfc && !scanning && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">Kartu NFC berhasil terbaca</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Operator
                </button>
            </div>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.operator.title}
                    columns={PREVIEW_TABLES.operator.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </form>
    );
};

// Input Data Lokasi Component
const InputDataLokasi = ({ showToast, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius: "", type: "circle" });
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields
        if (!form.name.trim() || !form.latitude.trim() || !form.longitude.trim() || !form.radius.toString().trim()) {
            showToast("Semua field lokasi harus diisi", "error");
            return;
        }

        // Validate latitude and longitude are valid numbers
        const latVal = parseFloat(form.latitude);
        const lngVal = parseFloat(form.longitude);
        const radiusVal = parseFloat(form.radius);

        if (isNaN(latVal) || isNaN(lngVal)) {
            showToast("Latitude dan Longitude harus berupa angka yang valid", "error");
            return;
        }

        if (isNaN(radiusVal) || radiusVal <= 0) {
            showToast("Radius harus berupa angka lebih dari 0", "error");
            return;
        }

        setLoading(true);
        try {
            await lokasiService.create(form);
            publishMqttActions(MQTT_ACTIONS.geoCreate).catch((error) => {
                console.error("MQTT publish error:", error);
            });
            showToast("Data lokasi berhasil disimpan", "success");
            setForm({ name: "", latitude: "", longitude: "", radius: "", type: "circle" });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan data lokasi", "error");
        } finally {
            setLoading(false);
        }
    };

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    // Parse koordinat dan radius
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseFloat(form.radius) || 100;
    const hasValidCoords = !isNaN(lat) && !isNaN(lng);

    // Map options
    const mapOptions = {
        mapTypeId: 'hybrid',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
        ]
    };

    // Circle options dengan warna hijau sesuai tema
    const circleOptions = {
        strokeColor: '#74CD25',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#74CD25',
        fillOpacity: 0.25,
        clickable: false,
        draggable: false,
        editable: false,
        visible: true,
        zIndex: 1
    };

    if (compact) {
        return (
            <form onSubmit={handleSubmit} className="h-full flex flex-col gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
                    <div className="xl:col-span-2">
                        <FormInput label="Nama Lokasi" name="name" value={form.name} onChange={handleChange} placeholder="Site A" required compact />
                    </div>
                    <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="-5.123456" required compact />
                    <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="119.123456" required compact />
                    <FormInput label="Radius (meter)" name="radius" value={form.radius} onChange={handleChange} type="number" placeholder="500" required compact />
                </div>

                <div className="rounded-lg border border-[#4a4b4d] bg-[#2d2e32] p-3">
                    <div className="mb-2 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#74CD25]" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Preview Lokasi (Circle)</h3>
                        </div>
                    </div>

                    <div className="bg-[#26272b] rounded-lg overflow-hidden border border-[#4a4b4d]" style={{ height: "110px" }}>
                        {loadError && (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-sm text-red-500">Error loading Google Maps</p>
                            </div>
                        )}
                        {!isLoaded && !loadError && (
                            <div className="w-full h-full flex items-center justify-center bg-[#2d2e32]">
                                <Loader2 className="w-4 h-4 text-[#74CD25] animate-spin" />
                                <span className="ml-2 text-sm text-gray-400">Loading map...</span>
                            </div>
                        )}
                        {isLoaded && !hasValidCoords && (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-sm text-gray-500">Masukkan koordinat untuk preview lokasi</p>
                            </div>
                        )}
                        {isLoaded && hasValidCoords && (
                            <GoogleMap
                                mapContainerStyle={{ width: "100%", height: "100%" }}
                                center={{ lat, lng }}
                                zoom={15}
                                options={mapOptions}
                                onLoad={onMapLoad}
                            >
                                <Marker position={{ lat, lng }} />
                                <Circle
                                    center={{ lat, lng }}
                                    radius={radius}
                                    options={circleOptions}
                                />
                            </GoogleMap>
                        )}
                    </div>
                </div>

                {hasValidCoords ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                        <span><strong className="text-white">Lat:</strong> {lat.toFixed(6)}</span>
                        <span><strong className="text-white">Lng:</strong> {lng.toFixed(6)}</span>
                        <span><strong className="text-white">Radius:</strong> {radius} meter</span>
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[#74CD25] text-white rounded-lg font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Simpan Lokasi
                    </button>
                </div>

                {showPreview ? (
                    <PreviewTable
                        title={PREVIEW_TABLES.lokasi.title}
                        columns={PREVIEW_TABLES.lokasi.columns}
                        rows={rows}
                        manageHref={manageHref}
                    />
                ) : null}
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="md:col-span-2 xl:col-span-3">
                    <FormInput label="Nama Lokasi" name="name" value={form.name} onChange={handleChange} placeholder="Site A" required />
                </div>
                <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="-5.123456" required />
                <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="119.123456" required />
                <FormInput label="Radius (meter)" name="radius" value={form.radius} onChange={handleChange} type="number" placeholder="500" required />
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</label>
                    <div className="bg-[#2d2e32] text-white px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="text-[#74CD25] font-medium">Circle</span>
                        <span className="text-gray-500 text-xs">(Auto)</span>
                    </div>
                </div>
            </div>

            <div className="bg-[#2d2e32] rounded-lg overflow-hidden border border-[#4a4b4d]" style={{ height: "300px" }}>
                {loadError && (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-red-500">Error loading Google Maps</p>
                    </div>
                )}
                {!isLoaded && !loadError && (
                    <div className="w-full h-full flex items-center justify-center bg-[#2d2e32]">
                        <Loader2 className="w-6 h-6 text-[#74CD25] animate-spin" />
                        <span className="ml-2 text-gray-400">Loading map...</span>
                    </div>
                )}
                {isLoaded && !hasValidCoords && (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-50" />
                            <p className="text-gray-500">Masukkan koordinat untuk preview lokasi</p>
                        </div>
                    </div>
                )}
                {isLoaded && hasValidCoords && (
                    <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={{ lat, lng }}
                        zoom={15}
                        options={mapOptions}
                        onLoad={onMapLoad}
                    >
                        <Marker position={{ lat, lng }} />
                        <Circle
                            center={{ lat, lng }}
                            radius={radius}
                            options={circleOptions}
                        />
                    </GoogleMap>
                )}
            </div>

            {hasValidCoords && (
                <div className="flex items-center gap-4 text-sm text-gray-400 bg-[#2d2e32] px-4 py-2 rounded-lg">
                    <span><strong className="text-white">Lat:</strong> {lat.toFixed(6)}</span>
                    <span><strong className="text-white">Lng:</strong> {lng.toFixed(6)}</span>
                    <span><strong className="text-white">Radius:</strong> {radius} meter</span>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Lokasi
                </button>
            </div>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.lokasi.title}
                    columns={PREVIEW_TABLES.lokasi.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </form>
    );
};

const InputShiftCode = ({ showToast, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ namaShift: "", kodeShift: "", rentangWaktu: "", keterangan: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await shiftCodeService.create(form);
            showToast("Shift code berhasil disimpan", "success");
            setForm({ namaShift: "", kodeShift: "", rentangWaktu: "", keterangan: "" });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan shift code", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {!compact ? <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight uppercase">Input Shift Code</h2> : null}
            {!compact ? <p className="text-gray-500 text-xs mb-8 font-bold uppercase tracking-widest">Kelola parameter shift sesuai datasheet operasi</p> : null}

            <form onSubmit={handleSubmit} className={cn("space-y-6 max-w-3xl", compact && "space-y-4 max-w-full")}>
                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", compact && "gap-3")}>
                    <FormInput label="Nama Shift" name="namaShift" value={form.namaShift} onChange={handleChange} placeholder="DAY SHIFT" required compact={compact} />
                    <FormInput label="Kode Shift" name="kodeShift" value={form.kodeShift} onChange={handleChange} placeholder="21" required compact={compact} />
                    <FormInput label="Rentang Waktu" name="rentangWaktu" value={form.rentangWaktu} onChange={handleChange} placeholder="06.00 - 18.00" required compact={compact} />
                    <FormInput label="Keterangan" name="keterangan" value={form.keterangan} onChange={handleChange} placeholder="Opsional" compact={compact} />
                </div>

                <div className={cn("flex gap-3 pt-4", compact && "pt-2")}>
                    <button type="submit" disabled={loading} className={cn(
                        "flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95",
                        compact && "px-5 py-2.5 text-[11px]"
                    )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Shift Code
                    </button>
                </div>
            </form>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.shiftCode.title}
                    columns={PREVIEW_TABLES.shiftCode.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </div>
    );
};

const InputMaterialType = ({ showToast, rows, onSaved, manageHref = "/parameter/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ jenisMuatan: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await materialTypeService.create(form);
            publishMqttActions(MQTT_ACTIONS.materialCreate).catch((error) => {
                console.error("MQTT publish error:", error);
            });
            showToast("Material type berhasil disimpan", "success");
            setForm({ jenisMuatan: "" });
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan material type", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {!compact ? <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight uppercase">Input Material Type</h2> : null}
            {!compact ? <p className="text-gray-500 text-xs mb-8 font-bold uppercase tracking-widest">Kelola parameter jenis muatan sesuai datasheet material</p> : null}

            <form onSubmit={handleSubmit} className={cn("space-y-6 max-w-xl", compact && "space-y-4 max-w-full")}>
                <FormInput label="Jenis Muatan" name="jenisMuatan" value={form.jenisMuatan} onChange={handleChange} placeholder="OVERBURDEN (OB)" required compact={compact} />

                <div className={cn("flex gap-3 pt-4", compact && "pt-2")}>
                    <button type="submit" disabled={loading} className={cn(
                        "flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95",
                        compact && "px-5 py-2.5 text-[11px]"
                    )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Material Type
                    </button>
                </div>
            </form>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.materialType.title}
                    columns={PREVIEW_TABLES.materialType.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </div>
    );
};

// User Management Tab Component
const UserManagementTab = ({ showToast, rows, onSaved, manageHref = "/setup/view", showPreview = true, compact = false }) => {
    const [form, setForm] = useState({ nama: "", email: "", password: "", noTelp: "", fotoProfil: null });
    const [showPassword, setShowPassword] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, fotoProfil: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await pengawasService.create(form);
            showToast("User berhasil disimpan", "success");
            setForm({ nama: "", email: "", password: "", noTelp: "", fotoProfil: null });
            setPreviewImage(null);
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan user", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {!compact ? <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight uppercase">User Management</h2> : null}
            {!compact ? <p className="text-gray-500 text-xs mb-8 font-bold uppercase tracking-widest">Kelola akun pengawas lapangan dan hak akses</p> : null}

            <form onSubmit={handleSubmit} className={cn("space-y-6 max-w-2xl", compact && "space-y-4 max-w-full rounded-xl bg-[#2d2e32] p-4 border border-white/5")}>
                <div className={cn("flex flex-col gap-2", compact && "gap-1.5")}>
                    <label className={cn("text-sm text-gray-400", compact && "text-xs font-bold uppercase tracking-widest text-gray-500")}>Foto Profil</label>
                    <div className={cn("flex items-center gap-4", compact && "gap-3")}>
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className={cn("w-20 h-20 object-cover rounded-full border-2 border-[#74CD25]", compact && "w-16 h-16")} />
                        ) : (
                            <div className={cn("w-20 h-20 bg-[#4a4b4d] rounded-full flex items-center justify-center", compact && "w-16 h-16")}>
                                <User className={cn("w-8 h-8 text-gray-400", compact && "w-6 h-6")} />
                            </div>
                        )}
                        <label className={cn(
                            "flex items-center gap-2 px-5 py-2.5 bg-[#4a4b4d] text-white rounded-xl cursor-pointer hover:bg-[#5a5b5d] transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-black/20",
                            compact && "px-4 py-2 text-[11px]"
                        )}>
                            <Upload className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />
                            Upload Foto
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", compact && "gap-3")}>
                    <FormInput label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama pengawas" required compact={compact} />
                    <FormInput label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="email@example.com" required compact={compact} />
                    <div className={cn("flex flex-col gap-1.5", compact && "gap-1")}>
                        <label className={cn("text-xs font-bold text-gray-500 uppercase tracking-widest", compact && "tracking-[0.12em]")}>Password <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="********"
                                className={cn(
                                    "w-full bg-[#2d2e32] text-white px-4 py-3 pr-12 rounded-xl border border-white/10 focus:border-[#74CD25] focus:outline-none transition-all text-sm",
                                    compact && "px-3 py-2.5 pr-10 rounded-lg"
                                )} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showPassword ? <EyeOff className={cn("w-5 h-5", compact && "w-4 h-4")} /> : <Eye className={cn("w-5 h-5", compact && "w-4 h-4")} />}
                            </button>
                        </div>
                    </div>
                    <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} placeholder="08xxxxxxxxxx" required compact={compact} />
                </div>

                <div className={cn("flex gap-3 pt-4", compact && "pt-2")}>
                    <button type="submit" disabled={loading} className={cn(
                        "flex items-center gap-2 px-8 py-3 bg-[#74CD25] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5fa01c] transition-all shadow-lg shadow-[#74CD25]/20 disabled:opacity-50 hover:scale-105 active:scale-95",
                        compact && "px-5 py-2.5"
                    )}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan User
                    </button>
                </div>
            </form>

            {showPreview ? (
                <PreviewTable
                    title={PREVIEW_TABLES.users.title}
                    columns={PREVIEW_TABLES.users.columns}
                    rows={rows}
                    manageHref={manageHref}
                />
            ) : null}
        </div>
    );
};

export default function ConfigScreen({
    defaultTab = "kalibrasi",
    defaultInputTab = "alat",
    pageTitle = "Config",
    pageDescription = "Kelola data master dan konfigurasi utama dalam satu halaman.",
    showPrimaryTabs = true,
    showInputTabs = true,
    parameterView = null,
    inputTabMode = "default",
    manageHref = "/parameter/view",
}) {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [activeInputTab, setActiveInputTab] = useState(defaultInputTab);
    const [toast, setToast] = useState(null);
    const [alatList, setAlatList] = useState([]);
    const [alatRows, setAlatRows] = useState([]);
    const [operatorRows, setOperatorRows] = useState([]);
    const [lokasiRows, setLokasiRows] = useState([]);
    const [shiftCodeRows, setShiftCodeRows] = useState([]);
    const [materialTypeRows, setMaterialTypeRows] = useState([]);
    const [kalibrasiRows, setKalibrasiRows] = useState([]);
    const [userRows, setUserRows] = useState([]);
    const activeInputTabs = inputTabMode === "parameter" ? PARAMETER_INPUT_TABS : INPUT_DATA_TABS;
    const isParameterMode = inputTabMode === "parameter";
    const isSetupMode = !showPrimaryTabs && !showInputTabs;
    const showPreviewTables = inputTabMode !== "parameter" && !isSetupMode;
    const activeManageHref = `${manageHref}?tab=${activeInputTab}`;
    const activeSetupManageTab = activeTab === "user-management" ? "users" : activeTab;
    const activeSetupManageHref = `${manageHref}?tab=${activeSetupManageTab}`;

    const loadAlatData = useCallback(async () => {
        const res = await alatService.getAll();
        const rows = res.data.data || [];
        setAlatList(rows);
        setAlatRows(rows.slice(0, PREVIEW_LIMIT));
    }, []);

    const loadOperatorData = useCallback(async () => {
        const res = await operatorService.getAll();
        setOperatorRows((res.data.data || []).slice(0, PREVIEW_LIMIT));
    }, []);

    const loadLokasiData = useCallback(async () => {
        const res = await lokasiService.getAll();
        setLokasiRows((res.data.data || []).slice(0, PREVIEW_LIMIT));
    }, []);

    const loadShiftCodeData = useCallback(async () => {
        const res = await shiftCodeService.getAll();
        setShiftCodeRows((res.data.data || []).slice(0, PREVIEW_LIMIT));
    }, []);

    const loadMaterialTypeData = useCallback(async () => {
        const res = await materialTypeService.getAll();
        setMaterialTypeRows((res.data.data || []).slice(0, PREVIEW_LIMIT));
    }, []);

    const loadKalibrasiData = useCallback(async () => {
        const res = await kalibrasiService.getAll();
        const rows = (res.data.data || []).map((item) => ({
            ...item,
            alatName: item.alat?.idFms || item.alat?.noPlat || "-",
        }));
        setKalibrasiRows(rows.slice(0, PREVIEW_LIMIT));
    }, []);

    const loadUserData = useCallback(async () => {
        const res = await pengawasService.getAll();
        const rows = (res.data.data || []).map((item) => ({
            ...item,
            createdAtLabel: new Date(item.createdAt).toLocaleDateString("id-ID"),
        }));
        setUserRows(rows.slice(0, PREVIEW_LIMIT));
    }, []);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    useEffect(() => {
        setActiveInputTab(defaultInputTab);
    }, [defaultInputTab]);

    useEffect(() => {
        loadAlatData().catch(console.error);
        loadOperatorData().catch(console.error);
        loadLokasiData().catch(console.error);
        loadShiftCodeData().catch(console.error);
        loadMaterialTypeData().catch(console.error);
        loadKalibrasiData().catch(console.error);
        loadUserData().catch(console.error);
    }, [loadAlatData, loadOperatorData, loadLokasiData, loadShiftCodeData, loadMaterialTypeData, loadKalibrasiData, loadUserData]);

    const showToast = (message, type) => setToast({ message, type });

    return (
        <PageLayout noScroll={true} className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{pageTitle}</h1>
                    <p className="mt-1 text-sm text-gray-400">{pageDescription}</p>
                </div>
                {isParameterMode || isSetupMode ? (
                    <Link
                        to={isSetupMode ? activeSetupManageHref : activeManageHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#74CD25]/40 bg-[#74CD25]/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#74CD25] transition hover:bg-[#74CD25]/20"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        {isSetupMode ? "Ke View Setup" : "Ke View Parameter"}
                    </Link>
                ) : null}
            </div>

            {showPrimaryTabs && (
                <div className="flex gap-2 mb-6 bg-[#2d2e32] p-1.5 rounded-2xl w-fit border border-white/5 shadow-inner overflow-x-auto max-w-full">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 tracking-tight text-sm
                    ${isActive ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/40 scale-105" : "bg-transparent text-gray-400 hover:bg-[#343538] hover:text-white"}`}>
                                <Icon className="w-4.5 h-4.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="bg-[#343538] rounded-3xl p-8 shadow-2xl border border-white/5 flex-1 min-h-0 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#74CD25]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                
                <div className={`flex-1 ${showPreviewTables ? "overflow-y-auto custom-scrollbar pr-2" : "overflow-hidden"}`}>
                    {!parameterView && activeTab === "kalibrasi" && (
                        <KalibrasiTab
                            showToast={showToast}
                            alatList={alatList}
                            rows={kalibrasiRows}
                            onSaved={loadKalibrasiData}
                            manageHref={`${manageHref}?tab=kalibrasi`}
                            showPreview={showPreviewTables}
                            compact={isSetupMode}
                        />
                    )}

                    {!parameterView && activeTab === "input-data" && (
                        isParameterMode ? (
                            <div className="animate-fade-in relative flex min-h-0 flex-1 flex-col">
                                {showInputTabs && (
                                    <div className="mb-6">
                                        <div className="flex gap-2 bg-[#2d2e32] p-1.5 rounded-2xl w-fit border border-white/5 shadow-inner overflow-x-auto max-w-full">
                                            {activeInputTabs.map((tab) => {
                                                const Icon = tab.icon;
                                                const isActive = activeInputTab === tab.id;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveInputTab(tab.id)}
                                                        className={`flex shrink-0 items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 tracking-tight text-xs whitespace-nowrap ${
                                                            isActive
                                                                ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/40 scale-105"
                                                                : "bg-transparent text-gray-400 hover:bg-[#343538] hover:text-white"
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        {tab.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#2d2e32] p-4 shadow-xl shadow-black/20">
                                    <div className="h-full overflow-y-auto custom-scrollbar">
                                        {activeInputTab === "shift-code" && (
                                            <InputShiftCode showToast={showToast} rows={shiftCodeRows} onSaved={loadShiftCodeData} manageHref={`${manageHref}?tab=shift-code`} showPreview={showPreviewTables} compact={false} />
                                        )}
                                        {activeInputTab === "material-type" && (
                                            <InputMaterialType showToast={showToast} rows={materialTypeRows} onSaved={loadMaterialTypeData} manageHref={`${manageHref}?tab=material-type`} showPreview={showPreviewTables} compact={false} />
                                        )}
                                        {activeInputTab === "alat" && (
                                            <InputDataAlat showToast={showToast} rows={alatRows} onSaved={loadAlatData} manageHref={`${manageHref}?tab=alat`} showPreview={showPreviewTables} compact={false} />
                                        )}
                                        {activeInputTab === "operator" && (
                                            <InputDataOperator showToast={showToast} rows={operatorRows} onSaved={loadOperatorData} manageHref={`${manageHref}?tab=operator`} showPreview={showPreviewTables} compact={false} />
                                        )}
                                        {activeInputTab === "lokasi" && (
                                            <InputDataLokasi showToast={showToast} rows={lokasiRows} onSaved={loadLokasiData} manageHref={`${manageHref}?tab=lokasi`} showPreview={showPreviewTables} compact={false} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in flex flex-col min-h-0">
                                {showInputTabs && (
                                    <div className="mb-8 flex flex-wrap gap-2 border-b border-white/5 pb-6">
                                        {activeInputTabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeInputTab === tab.id;
                                            return (
                                                <button key={tab.id} onClick={() => setActiveInputTab(tab.id)}
                                                    className={`${cn(
                                                        "flex items-center gap-2.5 rounded-xl transition-all duration-300 whitespace-nowrap px-5 py-2.5 text-[11px] font-black tracking-widest uppercase"
                                                    )}
                            ${isActive ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/20" : "bg-[#2d2e32] text-gray-500 hover:bg-[#4a4b4d] hover:text-white border border-white/5"}`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {activeInputTab === "shift-code" && (
                                    <InputShiftCode showToast={showToast} rows={shiftCodeRows} onSaved={loadShiftCodeData} manageHref={`${manageHref}?tab=shift-code`} showPreview={showPreviewTables} compact={false} />
                                )}
                                {activeInputTab === "material-type" && (
                                    <InputMaterialType showToast={showToast} rows={materialTypeRows} onSaved={loadMaterialTypeData} manageHref={`${manageHref}?tab=material-type`} showPreview={showPreviewTables} compact={false} />
                                )}
                                {activeInputTab === "alat" && (
                                    <InputDataAlat showToast={showToast} rows={alatRows} onSaved={loadAlatData} manageHref={`${manageHref}?tab=alat`} showPreview={showPreviewTables} compact={false} />
                                )}
                                {activeInputTab === "operator" && (
                                    <InputDataOperator showToast={showToast} rows={operatorRows} onSaved={loadOperatorData} manageHref={`${manageHref}?tab=operator`} showPreview={showPreviewTables} compact={false} />
                                )}
                                {activeInputTab === "lokasi" && (
                                    <InputDataLokasi showToast={showToast} rows={lokasiRows} onSaved={loadLokasiData} manageHref={`${manageHref}?tab=lokasi`} showPreview={showPreviewTables} compact={false} />
                                )}
                            </div>
                        )
                    )}

                    {!parameterView && activeTab === "user-management" && (
                        <UserManagementTab showToast={showToast} rows={userRows} onSaved={loadUserData} manageHref={manageHref} showPreview={showPreviewTables} compact={isSetupMode} />
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
