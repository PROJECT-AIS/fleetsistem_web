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
    { id: "alat", label: "Input Data Alat", icon: Truck },
    { id: "operator", label: "Input Data Operator", icon: User },
    { id: "lokasi", label: "Input Data Lokasi", icon: MapPin },
];

const PARAMETER_INPUT_TABS = [
    { id: "shift-code", label: "Shift Code", icon: PackageSearch },
    { id: "material-type", label: "Material Type", icon: PackageSearch },
    { id: "alat", label: "Equipment", icon: Truck },
    { id: "operator", label: "Operator", icon: User },
    { id: "lokasi", label: "Location", icon: MapPin },
];

// Toast notification
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${type === "success" ? "bg-green-500" : "bg-red-500"
            } text-white`}>
            {type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {message}
        </div>
    );
};

// Reusable form input component
const FormInput = ({ label, name, value, onChange, type = "text", placeholder = "", required = false, disabled = false }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-400">{label} {required && <span className="text-red-400">*</span>}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none transition-colors disabled:opacity-50"
        />
    </div>
);

// Reusable select component
const FormSelect = ({ label, name, value, onChange, options, required = false }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-400">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none transition-colors"
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
            { key: "idFms", label: "ID FMS" },
            { key: "noPlat", label: "No Plat" },
            { key: "jenisAlat", label: "Jenis Alat" },
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
            { key: "idCardNfc", label: "ID Card NFC" },
        ],
    },
    lokasi: {
        title: "Data Location Tersimpan",
        columns: [
            { key: "name", label: "Nama Lokasi" },
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
    <div className="mt-8 rounded-2xl bg-[#343538] p-5 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-sm text-gray-400">Entry data dan view data sekarang ditampilkan dalam satu halaman.</p>
            </div>
            <Link
                to={manageHref}
                className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#4a4b4d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a5b5d]"
            >
                <Eye className="h-4 w-4" />
                Kelola Detail
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
const KalibrasiTab = ({ showToast, alatList, rows, onSaved, manageHref = "/parameter/view" }) => {
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
            <h2 className="text-xl font-bold text-white mb-2">Input Kalibrasi Sensor Fuel</h2>
            <p className="text-gray-400 text-sm mb-6">Konfigurasi nilai sensor bahan bakar untuk kalibrasi alat</p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <FormSelect
                    label="Pilih Alat"
                    name="alatId"
                    value={form.alatId}
                    onChange={handleChange}
                    options={alatList.map(a => ({ value: a.id, label: `${a.idFms} - ${a.noPlat}` }))}
                    required
                />
                <FormInput label="Empty (Nilai Kosong)" name="empty" value={form.empty} onChange={handleChange} type="number" placeholder="0" required />
                <FormInput label="Full (Nilai Penuh)" name="full" value={form.full} onChange={handleChange} type="number" placeholder="1023" required />
                <FormInput label="Kapasitas Tangki (Liter)" name="kapasitasTangki" value={form.kapasitasTangki} onChange={handleChange} type="number" placeholder="100" required />

                <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Kalibrasi
                    </button>
                    <button type="button" onClick={() => setForm({ alatId: "", empty: "", full: "", kapasitasTangki: "" })} className="flex items-center gap-2 px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg font-semibold hover:bg-[#5a5b5d] transition-colors">
                        <X className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </form>

            <PreviewTable
                title={PREVIEW_TABLES.kalibrasi.title}
                columns={PREVIEW_TABLES.kalibrasi.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </div>
    );
};

// Input Data Alat Component
const InputDataAlat = ({ showToast, rows, onSaved, manageHref = "/parameter/view" }) => {
    const [form, setForm] = useState({ idFms: "", noPlat: "", jenisAlat: "", detailAlat: "", status: "Aktif", gambar: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, gambar: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await alatService.create(form);
            showToast("Data alat berhasil disimpan", "success");
            setForm({ idFms: "", noPlat: "", jenisAlat: "", detailAlat: "", status: "Aktif", gambar: null });
            setPreviewImage(null);
            onSaved?.();
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan data alat", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="ID Alat FMS" name="idFms" value={form.idFms} onChange={handleChange} placeholder="FMS-001" required />
                <FormInput label="Nomor Plat" name="noPlat" value={form.noPlat} onChange={handleChange} placeholder="DD 1234 AB" required />
                <FormSelect label="Jenis Alat" name="jenisAlat" value={form.jenisAlat} onChange={handleChange}
                    options={[
                        { value: "Excavator", label: "Excavator" },
                        { value: "Dump Truck", label: "Dump Truck" },
                        { value: "Bulldozer", label: "Bulldozer" },
                        { value: "Loader", label: "Loader" },
                        { value: "Grader", label: "Grader" },
                    ]} required />
                <FormSelect label="Status" name="status" value={form.status} onChange={handleChange}
                    options={[
                        { value: "Aktif", label: "Aktif" },
                        { value: "Maintenance", label: "Maintenance" },
                        { value: "Non-Aktif", label: "Non-Aktif" },
                    ]} required />
                <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1.5">Detail Alat</label>
                    <textarea name="detailAlat" value={form.detailAlat} onChange={handleChange} placeholder="Deskripsi detail..." rows={3}
                        className="w-full bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none resize-none" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-400">Gambar Alat</label>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4a4b4d] text-white rounded-lg cursor-pointer hover:bg-[#5a5b5d] transition-colors">
                        <Upload className="w-4 h-4" />
                        Pilih Gambar
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {previewImage && <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-[#4a4b4d]" />}
                </div>
            </div>
            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Alat
                </button>
            </div>

            <PreviewTable
                title={PREVIEW_TABLES.alat.title}
                columns={PREVIEW_TABLES.alat.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </form>
    );
};

// Input Data Operator Component (with NFC Scan)
const InputDataOperator = ({ showToast, rows, onSaved, manageHref = "/parameter/view" }) => {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2">
                    <FormInput label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap" />
                </div>
            </div>

            {/* NFC Scan Section */}
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
                            onClick={stopScan}
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

                {/* Scanning indicator */}
                {scanning && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-[#74CD25]/10 border border-[#74CD25]/20">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74CD25] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#74CD25]"></span>
                        </div>
                        <span className="text-sm text-[#74CD25] font-medium">Menunggu scan kartu NFC... Tempelkan kartu ke reader</span>
                    </div>
                )}

                {/* Success indicator */}
                {nfcId && !scanning && (
                    <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">Kartu NFC berhasil terbaca</span>
                    </div>
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Operator
                </button>
            </div>

            <PreviewTable
                title={PREVIEW_TABLES.operator.title}
                columns={PREVIEW_TABLES.operator.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </form>
    );
};

// Input Data Lokasi Component
const InputDataLokasi = ({ showToast, rows, onSaved, manageHref = "/parameter/view" }) => {
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <FormInput label="Nama Lokasi" name="name" value={form.name} onChange={handleChange} placeholder="Site A" required />
                </div>
                <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} placeholder="-5.123456" required />
                <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} placeholder="119.123456" required />
                <FormInput label="Radius (meter)" name="radius" value={form.radius} onChange={handleChange} type="number" placeholder="500" required />
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-gray-400">Type</label>
                    <div className="bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] flex items-center gap-2">
                        <span className="text-[#74CD25] font-medium">● Circle</span>
                        <span className="text-gray-500 text-xs">(Auto)</span>
                    </div>
                </div>
            </div>

            {/* Google Maps Preview */}
            <div className="bg-[#2d2e32] rounded-lg overflow-hidden border border-[#4a4b4d]" style={{ height: '300px' }}>
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
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat, lng }}
                        zoom={15}
                        options={mapOptions}
                        onLoad={onMapLoad}
                    >
                        {/* Marker di titik pusat */}
                        <Marker position={{ lat, lng }} />
                        {/* Circle geofence */}
                        <Circle
                            center={{ lat, lng }}
                            radius={radius}
                            options={circleOptions}
                        />
                    </GoogleMap>
                )}
            </div>

            {/* Info koordinat */}
            {hasValidCoords && (
                <div className="flex items-center gap-4 text-sm text-gray-400 bg-[#2d2e32] px-4 py-2 rounded-lg">
                    <span><strong className="text-white">Lat:</strong> {lat.toFixed(6)}</span>
                    <span><strong className="text-white">Lng:</strong> {lng.toFixed(6)}</span>
                    <span><strong className="text-white">Radius:</strong> {radius} meter</span>
                </div>
            )}

            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Lokasi
                </button>
            </div>

            <PreviewTable
                title={PREVIEW_TABLES.lokasi.title}
                columns={PREVIEW_TABLES.lokasi.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </form>
    );
};

const InputShiftCode = ({ showToast, rows, onSaved, manageHref = "/parameter/view" }) => {
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
            <h2 className="text-xl font-bold text-white mb-2">Input Shift Code</h2>
            <p className="text-gray-400 text-sm mb-6">Kelola parameter shift sesuai datasheet operasi.</p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Nama Shift" name="namaShift" value={form.namaShift} onChange={handleChange} placeholder="DAY SHIFT" required />
                    <FormInput label="Kode Shift" name="kodeShift" value={form.kodeShift} onChange={handleChange} placeholder="21" required />
                    <FormInput label="Rentang Waktu" name="rentangWaktu" value={form.rentangWaktu} onChange={handleChange} placeholder="06.00 - 18.00" required />
                    <FormInput label="Keterangan" name="keterangan" value={form.keterangan} onChange={handleChange} placeholder="Opsional" />
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Shift Code
                    </button>
                </div>
            </form>

            <PreviewTable
                title={PREVIEW_TABLES.shiftCode.title}
                columns={PREVIEW_TABLES.shiftCode.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </div>
    );
};

const InputMaterialType = ({ showToast, rows, onSaved, manageHref = "/parameter/view" }) => {
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
            <h2 className="text-xl font-bold text-white mb-2">Input Material Type</h2>
            <p className="text-gray-400 text-sm mb-6">Kelola parameter jenis muatan sesuai datasheet material.</p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                <FormInput label="Jenis Muatan" name="jenisMuatan" value={form.jenisMuatan} onChange={handleChange} placeholder="OVERBURDEN (OB)" required />

                <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan Material Type
                    </button>
                </div>
            </form>

            <PreviewTable
                title={PREVIEW_TABLES.materialType.title}
                columns={PREVIEW_TABLES.materialType.columns}
                rows={rows}
                manageHref={manageHref}
            />
        </div>
    );
};

// User Management Tab Component
const UserManagementTab = ({ showToast, rows, onSaved, manageHref = "/setup/view" }) => {
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
            <h2 className="text-xl font-bold text-white mb-2">User Management</h2>
            <p className="text-gray-400 text-sm mb-6">Kelola akun pengawas lapangan</p>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-400">Foto Profil</label>
                    <div className="flex items-center gap-4">
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-full border-2 border-[#74CD25]" />
                        ) : (
                            <div className="w-20 h-20 bg-[#4a4b4d] rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4a4b4d] text-white rounded-lg cursor-pointer hover:bg-[#5a5b5d] transition-colors">
                            <Upload className="w-4 h-4" />
                            Upload Foto
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama pengawas" required />
                    <FormInput label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="email@example.com" required />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm text-gray-400">Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="********"
                                className="w-full bg-[#2d2e32] text-white px-4 py-2.5 pr-12 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
                </div>

                <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan User
                    </button>
                </div>
            </form>

            <PreviewTable
                title={PREVIEW_TABLES.users.title}
                columns={PREVIEW_TABLES.users.columns}
                rows={rows}
                manageHref={manageHref}
            />
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
        <PageLayout className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                <p className="mt-2 text-sm text-gray-400">{pageDescription}</p>
            </div>

            {showPrimaryTabs && (
                <div className="flex gap-2 mb-6 bg-[#2d2e32] p-2 rounded-xl w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200
                    ${isActive ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30" : "bg-transparent text-gray-400 hover:bg-[#343538] hover:text-white"}`}>
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="bg-[#343538] rounded-xl p-6 min-h-[500px]">
                {parameterView === "shift-code" && (
                    <InputShiftCode showToast={showToast} rows={shiftCodeRows} onSaved={loadShiftCodeData} manageHref={`${manageHref}?tab=shift-code`} />
                )}

                {parameterView === "material-type" && (
                    <InputMaterialType showToast={showToast} rows={materialTypeRows} onSaved={loadMaterialTypeData} manageHref={`${manageHref}?tab=material-type`} />
                )}

                {!parameterView && activeTab === "kalibrasi" && (
                    <KalibrasiTab
                        showToast={showToast}
                        alatList={alatList}
                        rows={kalibrasiRows}
                        onSaved={loadKalibrasiData}
                        manageHref={`${manageHref}?tab=kalibrasi`}
                    />
                )}

                {!parameterView && activeTab === "input-data" && (
                    <div className="animate-fade-in">
                        {showInputTabs && (
                            <div className="flex flex-wrap gap-2 mb-6 border-b border-[#4a4b4d] pb-4">
                                {activeInputTabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeInputTab === tab.id;
                                    return (
                                        <button key={tab.id} onClick={() => setActiveInputTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive ? "bg-[#74CD25]/20 text-[#74CD25] border border-[#74CD25]" : "bg-transparent text-gray-400 hover:bg-[#4a4b4d] hover:text-white border border-transparent"}`}>
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {activeInputTab === "shift-code" && (
                            <InputShiftCode showToast={showToast} rows={shiftCodeRows} onSaved={loadShiftCodeData} manageHref={`${manageHref}?tab=shift-code`} />
                        )}
                        {activeInputTab === "material-type" && (
                            <InputMaterialType showToast={showToast} rows={materialTypeRows} onSaved={loadMaterialTypeData} manageHref={`${manageHref}?tab=material-type`} />
                        )}
                        {activeInputTab === "alat" && (
                            <InputDataAlat showToast={showToast} rows={alatRows} onSaved={loadAlatData} manageHref={`${manageHref}?tab=alat`} />
                        )}
                        {activeInputTab === "operator" && (
                            <InputDataOperator showToast={showToast} rows={operatorRows} onSaved={loadOperatorData} manageHref={`${manageHref}?tab=operator`} />
                        )}
                        {activeInputTab === "lokasi" && (
                            <InputDataLokasi showToast={showToast} rows={lokasiRows} onSaved={loadLokasiData} manageHref={`${manageHref}?tab=lokasi`} />
                        )}
                    </div>
                )}

                {!parameterView && activeTab === "user-management" && (
                    <UserManagementTab showToast={showToast} rows={userRows} onSaved={loadUserData} manageHref={manageHref} />
                )}
            </div>
        </PageLayout>
    );
}
