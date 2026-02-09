import React, { useState, useEffect, useCallback, useRef } from "react";
import { Settings, Database, Users, Truck, User, MapPin, Save, X, Fuel, Upload, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { alatService, operatorService, lokasiService, kalibrasiService, pengawasService } from "../../../services/configService";
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA6myHzS10YXdcazAFalmXvDkrYCp5cLc8';

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

// Kalibrasi Tab Component
const KalibrasiTab = ({ showToast, alatList }) => {
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
        </div>
    );
};

// Input Data Alat Component
const InputDataAlat = ({ showToast }) => {
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
        </form>
    );
};

// Input Data Operator Component
const InputDataOperator = ({ showToast }) => {
    const [form, setForm] = useState({ nama: "", noTelp: "", divisi: "", idCardNfc: "", jabatan: "", alamat: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await operatorService.create(form);
            showToast("Data operator berhasil disimpan", "success");
            setForm({ nama: "", noTelp: "", divisi: "", idCardNfc: "", jabatan: "", alamat: "" });
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menyimpan data operator", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Nama Operator" name="nama" value={form.nama} onChange={handleChange} placeholder="Nama lengkap" required />
                <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
                <FormSelect label="Divisi" name="divisi" value={form.divisi} onChange={handleChange}
                    options={[
                        { value: "Operasional", label: "Operasional" },
                        { value: "Logistik", label: "Logistik" },
                        { value: "Maintenance", label: "Maintenance" },
                        { value: "HSE", label: "HSE" },
                    ]} required />
                <FormInput label="ID Card NFC" name="idCardNfc" value={form.idCardNfc} onChange={handleChange} placeholder="NFC-XXXXX" />
                <FormSelect label="Jabatan" name="jabatan" value={form.jabatan} onChange={handleChange}
                    options={[
                        { value: "Driver", label: "Driver" },
                        { value: "Operator", label: "Operator" },
                        { value: "Supervisor", label: "Supervisor" },
                        { value: "Mekanik", label: "Mekanik" },
                    ]} required />
                <FormInput label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} placeholder="Alamat lengkap" />
            </div>
            <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors shadow-lg disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Data Operator
                </button>
            </div>
        </form>
    );
};

// Input Data Lokasi Component
const InputDataLokasi = ({ showToast }) => {
    const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius: "", type: "circle" });
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-lokasi',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await lokasiService.create(form);
            showToast("Data lokasi berhasil disimpan", "success");
            setForm({ name: "", latitude: "", longitude: "", radius: "", type: "circle" });
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
        </form>
    );
};

// User Management Tab Component
const UserManagementTab = ({ showToast }) => {
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
        </div>
    );
};

export default function ConfigScreen() {
    const [activeTab, setActiveTab] = useState("kalibrasi");
    const [activeInputTab, setActiveInputTab] = useState("alat");
    const [toast, setToast] = useState(null);
    const [alatList, setAlatList] = useState([]);

    useEffect(() => {
        // Fetch alat list for kalibrasi dropdown
        alatService.getAll().then(res => setAlatList(res.data.data || [])).catch(console.error);
    }, []);

    const showToast = (message, type) => setToast({ message, type });

    return (
        <PageLayout className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <h1 className="text-2xl font-bold text-white mb-6">Config</h1>

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

            <div className="bg-[#343538] rounded-xl p-6 min-h-[500px]">
                {activeTab === "kalibrasi" && <KalibrasiTab showToast={showToast} alatList={alatList} />}

                {activeTab === "input-data" && (
                    <div className="animate-fade-in">
                        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#4a4b4d] pb-4">
                            {INPUT_DATA_TABS.map((tab) => {
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
                        {activeInputTab === "alat" && <InputDataAlat showToast={showToast} />}
                        {activeInputTab === "operator" && <InputDataOperator showToast={showToast} />}
                        {activeInputTab === "lokasi" && <InputDataLokasi showToast={showToast} />}
                    </div>
                )}

                {activeTab === "user-management" && <UserManagementTab showToast={showToast} />}
            </div>
        </PageLayout>
    );
}
