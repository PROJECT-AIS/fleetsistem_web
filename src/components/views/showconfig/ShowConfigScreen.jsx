import React, { useState, useEffect, useRef } from "react";
import { Truck, User, MapPin, Fuel, Users, Edit2, Trash2, Search, ChevronLeft, ChevronRight, X, Loader2, Save, Eye, EyeOff, Upload, PackageSearch } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { alatService, operatorService, lokasiService, shiftCodeService, materialTypeService, kalibrasiService, pengawasService } from "../../../services/configService";
import { GoogleMap, useJsApiLoader, Circle, Marker } from '@react-google-maps/api';
import mqtt from 'mqtt';
import { resolveBackendUrl } from "../../../config/apiConfig";

const GOOGLE_MAPS_API_KEY = 'AIzaSyAcm-7sXCOMDgcP6YCH2cG_vWK4EfiP5ac';
const MQTT_BROKER_URL = 'wss://mqtt.aispektra.com:443';
const MQTT_TOPIC = 'fms/#/data';

// Tab configuration
const TABS = [
    { id: "shift-code", label: "Shift Code", icon: PackageSearch },
    { id: "material-type", label: "Material Type", icon: PackageSearch },
    { id: "alat", label: "Data Alat", icon: Truck },
    { id: "operator", label: "Data Operator", icon: User },
    { id: "lokasi", label: "Data Lokasi", icon: MapPin },
    { id: "kalibrasi", label: "Data Kalibrasi", icon: Fuel },
    { id: "users", label: "Data Users", icon: Users },
];

// Toast notification
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${type === "success" ? "bg-green-500" : "bg-red-500"} text-white`}>
            {type === "success" ? <Save className="w-5 h-5" /> : <X className="w-5 h-5" />}
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
const FormSelect = ({ label, name, value, onChange, options, required = false, disabled = false }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm text-gray-400">{label} {required && <span className="text-red-400">*</span>}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none transition-colors disabled:opacity-50"
        >
            <option value="">Pilih {label}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const EditShiftCodeModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ namaShift: "", kodeShift: "", rentangWaktu: "", keterangan: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                namaShift: item.namaShift || "",
                kodeShift: item.kodeShift || "",
                rentangWaktu: item.rentangWaktu || "",
                keterangan: item.keterangan || "",
            });
        }
    }, [item]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await shiftCodeService.update(item.id, form);
            onSave("Shift code berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update shift code", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Shift Code</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Nama Shift" name="namaShift" value={form.namaShift} onChange={handleChange} required />
                        <FormInput label="Kode Shift" name="kodeShift" value={form.kodeShift} onChange={handleChange} required />
                        <FormInput label="Rentang Waktu" name="rentangWaktu" value={form.rentangWaktu} onChange={handleChange} required />
                        <FormInput label="Keterangan" name="keterangan" value={form.keterangan} onChange={handleChange} />
                    </div>
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditMaterialTypeModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ jenisMuatan: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({ jenisMuatan: item.jenisMuatan || "" });
        }
    }, [item]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await materialTypeService.update(item.id, form);
            onSave("Material type berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update material type", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Material Type</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Jenis Muatan" name="jenisMuatan" value={form.jenisMuatan} onChange={handleChange} required />
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, itemName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#343538] rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Konfirmasi Hapus</h3>
                <p className="text-gray-300 mb-6">Apakah Anda yakin ingin menghapus <span className="text-red-400 font-semibold">{itemName}</span>?</p>
                <div className="flex gap-3 justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">
                        Batal
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===================== EDIT MODALS =====================

// Edit Alat Modal
const EditAlatModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ idFms: "", noPlat: "", jenisAlat: "", detailAlat: "", status: "Aktif", gambar: null });
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (item) {
            setForm({
                idFms: item.idFms || "",
                noPlat: item.noPlat || "",
                jenisAlat: item.jenisAlat || "",
                detailAlat: item.detailAlat || "",
                status: item.status || "Aktif",
                gambar: null
            });
            setPreviewImage(item.gambar ? resolveBackendUrl(item.gambar) : null);
        }
    }, [item]);

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
            await alatService.update(item.id, form);
            onSave("Data alat berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update data alat", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Data Alat</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="ID Alat FMS" name="idFms" value={form.idFms} onChange={handleChange} disabled required />
                        <FormInput label="Nomor Plat" name="noPlat" value={form.noPlat} onChange={handleChange} required />
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
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1.5">Detail Alat</label>
                        <textarea name="detailAlat" value={form.detailAlat} onChange={handleChange} placeholder="Deskripsi detail..." rows={3}
                            className="w-full bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none resize-none" />
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4a4b4d] text-white rounded-lg cursor-pointer hover:bg-[#5a5b5d] transition-colors">
                            <Upload className="w-4 h-4" />
                            Ganti Gambar
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                        {previewImage && <img src={previewImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-[#4a4b4d]" />}
                    </div>
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Operator Modal
const EditOperatorModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ nama: "", noTelp: "", divisi: "", idCardNfc: "", jabatan: "", alamat: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                nama: item.nama || "",
                noTelp: item.noTelp || "",
                divisi: item.divisi || "",
                idCardNfc: item.idCardNfc || "",
                jabatan: item.jabatan || "",
                alamat: item.alamat || ""
            });
        }
    }, [item]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await operatorService.update(item.id, form);
            onSave("Data operator berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update data operator", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Data Operator</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Nama Operator" name="nama" value={form.nama} onChange={handleChange} required />
                        <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} required />
                        <FormSelect label="Divisi" name="divisi" value={form.divisi} onChange={handleChange}
                            options={[
                                { value: "Operasional", label: "Operasional" },
                                { value: "Logistik", label: "Logistik" },
                                { value: "Maintenance", label: "Maintenance" },
                                { value: "HSE", label: "HSE" },
                            ]} required />
                        <FormInput label="ID Card NFC" name="idCardNfc" value={form.idCardNfc} onChange={handleChange} />
                        <FormSelect label="Jabatan" name="jabatan" value={form.jabatan} onChange={handleChange}
                            options={[
                                { value: "Driver", label: "Driver" },
                                { value: "Operator", label: "Operator" },
                                { value: "Supervisor", label: "Supervisor" },
                                { value: "Mekanik", label: "Mekanik" },
                            ]} required />
                        <FormInput label="Alamat" name="alamat" value={form.alamat} onChange={handleChange} />
                    </div>
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Lokasi Modal with Google Maps
const EditLokasiModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius: "", type: "circle" });
    const [loading, setLoading] = useState(false);
    const mapRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name || "",
                latitude: item.latitude || "",
                longitude: item.longitude || "",
                radius: item.radius?.toString() || "",
                type: item.type || "circle"
            });
        }
    }, [item]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const publishMqttMessage = () => {
        const client = mqtt.connect(MQTT_BROKER_URL);
        client.on('connect', () => {
            const message = JSON.stringify({ action: 'sync_geo_edit' });
            client.publish(MQTT_TOPIC, message, { qos: 1 }, () => client.end());
        });
        client.on('error', () => client.end());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields
        if (!form.name.trim() || !form.latitude.toString().trim() || !form.longitude.toString().trim() || !form.radius.toString().trim()) {
            onSave("Semua field lokasi harus diisi", "error");
            return;
        }

        // Validate latitude and longitude are valid numbers
        const latVal = parseFloat(form.latitude);
        const lngVal = parseFloat(form.longitude);
        const radiusVal = parseFloat(form.radius);

        if (isNaN(latVal) || isNaN(lngVal)) {
            onSave("Latitude dan Longitude harus berupa angka yang valid", "error");
            return;
        }

        if (isNaN(radiusVal) || radiusVal <= 0) {
            onSave("Radius harus berupa angka lebih dari 0", "error");
            return;
        }

        setLoading(true);
        try {
            await lokasiService.update(item.id, form);
            publishMqttMessage();
            onSave("Data lokasi berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update data lokasi", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseFloat(form.radius) || 100;
    const hasValidCoords = !isNaN(lat) && !isNaN(lng);

    const mapOptions = {
        mapTypeId: 'hybrid',
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
    };

    const circleOptions = {
        strokeColor: '#74CD25',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#74CD25',
        fillOpacity: 0.25,
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Data Lokasi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <FormInput label="Nama Lokasi" name="name" value={form.name} onChange={handleChange} required />
                        </div>
                        <FormInput label="Latitude" name="latitude" value={form.latitude} onChange={handleChange} required />
                        <FormInput label="Longitude" name="longitude" value={form.longitude} onChange={handleChange} required />
                        <FormInput label="Radius (meter)" name="radius" value={form.radius} onChange={handleChange} type="number" required />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Type</label>
                            <div className="bg-[#2d2e32] text-white px-4 py-2.5 rounded-lg border border-[#4a4b4d] flex items-center gap-2">
                                <span className="text-[#74CD25] font-medium">● Circle</span>
                                <span className="text-gray-500 text-xs">(Auto)</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Preview */}
                    <div className="bg-[#2d2e32] rounded-lg overflow-hidden border border-[#4a4b4d]" style={{ height: '250px' }}>
                        {isLoaded && hasValidCoords ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat, lng }}
                                zoom={15}
                                options={mapOptions}
                                onLoad={(map) => { mapRef.current = map; }}
                            >
                                <Marker position={{ lat, lng }} />
                                <Circle center={{ lat, lng }} radius={radius} options={circleOptions} />
                            </GoogleMap>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-50" />
                                    <p className="text-gray-500">Masukkan koordinat untuk preview</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Kalibrasi Modal
const EditKalibrasiModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ alatId: "", empty: "", full: "", kapasitasTangki: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                alatId: item.alatId?.toString() || "",
                empty: item.empty?.toString() || "",
                full: item.full?.toString() || "",
                kapasitasTangki: item.kapasitasTangki?.toString() || ""
            });
        }
    }, [item]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await kalibrasiService.update(item.id, form);
            onSave("Data kalibrasi berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update data kalibrasi", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-lg w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Data Kalibrasi</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-[#2d2e32] px-4 py-3 rounded-lg border border-[#4a4b4d]">
                        <span className="text-sm text-gray-400">Alat: </span>
                        <span className="text-white font-medium">{item?.alat?.idFms || `ID: ${item?.alatId}`}</span>
                    </div>
                    <FormInput label="Empty (Nilai Kosong)" name="empty" value={form.empty} onChange={handleChange} type="number" required />
                    <FormInput label="Full (Nilai Penuh)" name="full" value={form.full} onChange={handleChange} type="number" required />
                    <FormInput label="Kapasitas Tangki (Liter)" name="kapasitasTangki" value={form.kapasitasTangki} onChange={handleChange} type="number" required />
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Edit Users Modal
const EditUsersModal = ({ isOpen, onClose, item, onSave }) => {
    const [form, setForm] = useState({ nama: "", email: "", password: "", noTelp: "", fotoProfil: null });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        if (item) {
            setForm({
                nama: item.nama || "",
                email: item.email || "",
                password: "",
                noTelp: item.noTelp || "",
                fotoProfil: null
            });
            setPreviewImage(item.fotoProfil ? resolveBackendUrl(item.fotoProfil) : null);
        }
    }, [item]);

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
            const submitData = { ...form };
            if (!submitData.password) delete submitData.password;
            await pengawasService.update(item.id, submitData);
            onSave("Data user berhasil diupdate");
            onClose();
        } catch (error) {
            onSave(error.response?.data?.message || "Gagal update data user", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#343538] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Edit Data User</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" className="w-20 h-20 object-cover rounded-full border-2 border-[#74CD25]" />
                        ) : (
                            <div className="w-20 h-20 bg-[#4a4b4d] rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4a4b4d] text-white rounded-lg cursor-pointer hover:bg-[#5a5b5d] transition-colors">
                            <Upload className="w-4 h-4" />
                            Ganti Foto
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput label="Nama Lengkap" name="nama" value={form.nama} onChange={handleChange} required />
                        <FormInput label="Email" name="email" value={form.email} onChange={handleChange} type="email" required />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm text-gray-400">Password <span className="text-gray-500 text-xs">(kosongkan jika tidak diubah)</span></label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="********"
                                    className="w-full bg-[#2d2e32] text-white px-4 py-2.5 pr-12 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <FormInput label="No. Telepon" name="noTelp" value={form.noTelp} onChange={handleChange} required />
                    </div>
                    <div className="flex gap-3 pt-4 justify-end">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 bg-[#4a4b4d] text-white rounded-lg hover:bg-[#5a5b5d] transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-[#74CD25] text-white rounded-lg font-semibold hover:bg-[#5fa01c] transition-colors disabled:opacity-50">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Table Component
const DataTable = ({ columns, data, onEdit, onDelete, loading }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredData = data.filter((item) =>
        Object.values(item).some((val) =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#74CD25] animate-spin" />
                <span className="ml-3 text-gray-400">Memuat data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari data..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="bg-[#2d2e32] text-white pl-10 pr-4 py-2 rounded-lg border border-[#4a4b4d] focus:border-[#74CD25] focus:outline-none w-64"
                    />
                </div>
                <div className="text-sm text-gray-400">
                    Total: {filteredData.length} data
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#4a4b4d]">
                <table className="w-full">
                    <thead>
                        <tr className="bg-[#5A5B5D]">
                            <th className="px-4 py-3 text-left text-sm font-bold text-white">No</th>
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-3 text-left text-sm font-bold text-white">
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-center text-sm font-bold text-white">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <tr key={item.id} className="border-t border-[#4a4b4d] hover:bg-[#3d3e42] transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-300">{startIndex + index + 1}</td>
                                    {columns.map((col) => (
                                        <td key={col.key} className="px-4 py-3 text-sm text-gray-300">
                                            {col.key === "status" ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item[col.key] === "Aktif" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                                                    }`}>
                                                    {item[col.key]}
                                                </span>
                                            ) : col.render ? col.render(item) : (
                                                item[col.key] || "-"
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit?.(item)}
                                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(item)}
                                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-400">
                                    {data.length === 0 ? "Belum ada data" : "Tidak ada data ditemukan"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-[#4a4b4d] text-white disabled:opacity-50 hover:bg-[#5a5b5d] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-300">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-[#4a4b4d] text-white disabled:opacity-50 hover:bg-[#5a5b5d] transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Column configurations
const alatColumns = [
    { key: "idFms", label: "ID FMS" },
    { key: "noPlat", label: "No Plat" },
    { key: "jenisAlat", label: "Jenis Alat" },
    { key: "detailAlat", label: "Detail" },
    { key: "status", label: "Status" },
];

const shiftCodeColumns = [
    { key: "namaShift", label: "Nama Shift" },
    { key: "kodeShift", label: "Kode Shift" },
    { key: "rentangWaktu", label: "Rentang Waktu" },
    { key: "keterangan", label: "Keterangan" },
];

const materialTypeColumns = [
    { key: "jenisMuatan", label: "Jenis Muatan" },
];

const operatorColumns = [
    { key: "nama", label: "Nama" },
    { key: "noTelp", label: "No Telepon" },
    { key: "divisi", label: "Divisi" },
    { key: "idCardNfc", label: "ID NFC" },
    { key: "jabatan", label: "Jabatan" },
];

const lokasiColumns = [
    { key: "name", label: "Nama Lokasi" },
    { key: "type", label: "Type" },
    { key: "latitude", label: "Latitude" },
    { key: "longitude", label: "Longitude" },
    { key: "radius", label: "Radius (m)" },
];

const kalibrasiColumns = [
    { key: "alatIdFms", label: "ID Alat", render: (item) => item.alat?.idFms || "-" },
    { key: "empty", label: "Empty" },
    { key: "full", label: "Full" },
    { key: "kapasitasTangki", label: "Kapasitas (L)" },
];

const usersColumns = [
    { key: "nama", label: "Nama" },
    { key: "email", label: "Email" },
    { key: "noTelp", label: "No Telepon" },
];

export default function ShowConfigScreen({
    defaultTab = "alat",
    pageTitle = "Show Config",
    pageDescription = "Lihat dan kelola data konfigurasi yang sudah tersimpan.",
    visibleTabs = null,
}) {
    const tabs = visibleTabs?.length ? TABS.filter((tab) => visibleTabs.includes(tab.id)) : TABS;
    const initialTab = tabs.some((tab) => tab.id === defaultTab) ? defaultTab : tabs[0]?.id || "alat";
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: "" });
    const [toast, setToast] = useState(null);

    // Edit modal states
    const [editAlatModal, setEditAlatModal] = useState({ open: false, item: null });
    const [editOperatorModal, setEditOperatorModal] = useState({ open: false, item: null });
    const [editLokasiModal, setEditLokasiModal] = useState({ open: false, item: null });
    const [editKalibrasiModal, setEditKalibrasiModal] = useState({ open: false, item: null });
    const [editUsersModal, setEditUsersModal] = useState({ open: false, item: null });
    const [editShiftCodeModal, setEditShiftCodeModal] = useState({ open: false, item: null });
    const [editMaterialTypeModal, setEditMaterialTypeModal] = useState({ open: false, item: null });

    // Data states
    const [shiftCodeData, setShiftCodeData] = useState([]);
    const [materialTypeData, setMaterialTypeData] = useState([]);
    const [alatData, setAlatData] = useState([]);
    const [operatorData, setOperatorData] = useState([]);
    const [lokasiData, setLokasiData] = useState([]);
    const [kalibrasiData, setKalibrasiData] = useState([]);
    const [usersData, setUsersData] = useState([]);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Fetch data based on active tab
    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            let response;
            switch (tab) {
                case "shift-code":
                    response = await shiftCodeService.getAll();
                    setShiftCodeData(response.data.data || []);
                    break;
                case "material-type":
                    response = await materialTypeService.getAll();
                    setMaterialTypeData(response.data.data || []);
                    break;
                case "alat":
                    response = await alatService.getAll();
                    setAlatData(response.data.data || []);
                    break;
                case "operator":
                    response = await operatorService.getAll();
                    setOperatorData(response.data.data || []);
                    break;
                case "lokasi":
                    response = await lokasiService.getAll();
                    setLokasiData(response.data.data || []);
                    break;
                case "kalibrasi":
                    response = await kalibrasiService.getAll();
                    setKalibrasiData(response.data.data || []);
                    break;
                case "users":
                    response = await pengawasService.getAll();
                    setUsersData(response.data.data || []);
                    break;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => setToast({ message, type });

    const handleSaveCallback = (message, type = "success") => {
        showToast(message, type);
        if (type === "success") {
            fetchData(activeTab);
        }
    };

    const handleEdit = (item) => {
        switch (activeTab) {
            case "shift-code": setEditShiftCodeModal({ open: true, item }); break;
            case "material-type": setEditMaterialTypeModal({ open: true, item }); break;
            case "alat": setEditAlatModal({ open: true, item }); break;
            case "operator": setEditOperatorModal({ open: true, item }); break;
            case "lokasi": setEditLokasiModal({ open: true, item }); break;
            case "kalibrasi": setEditKalibrasiModal({ open: true, item }); break;
            case "users": setEditUsersModal({ open: true, item }); break;
        }
    };

    const handleDelete = (item) => {
        const nameField = item.nama || item.name || item.idFms || item.email || `ID: ${item.id}`;
        setDeleteModal({ open: true, item, type: activeTab, name: nameField });
    };

    const publishMqttDelete = () => {
        const client = mqtt.connect(MQTT_BROKER_URL);
        client.on('connect', () => {
            const message = JSON.stringify({ action: 'sync_geo_hapus' });
            client.publish(MQTT_TOPIC, message, { qos: 1 }, () => client.end());
        });
        client.on('error', () => client.end());
    };

    const confirmDelete = async () => {
        const { item, type } = deleteModal;
        try {
            switch (type) {
                case "shift-code": await shiftCodeService.delete(item.id); break;
                case "material-type": await materialTypeService.delete(item.id); break;
                case "alat": await alatService.delete(item.id); break;
                case "operator": await operatorService.delete(item.id); break;
                case "lokasi":
                    await lokasiService.delete(item.id);
                    publishMqttDelete();
                    break;
                case "kalibrasi": await kalibrasiService.delete(item.id); break;
                case "users": await pengawasService.delete(item.id); break;
            }
            showToast("Data berhasil dihapus");
            fetchData(type);
        } catch (error) {
            showToast(error.response?.data?.message || "Gagal menghapus data", "error");
        } finally {
            setDeleteModal({ open: false, item: null, type: "" });
        }
    };

    const renderTable = () => {
        switch (activeTab) {
            case "shift-code":
                return <DataTable columns={shiftCodeColumns} data={shiftCodeData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "material-type":
                return <DataTable columns={materialTypeColumns} data={materialTypeData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "alat":
                return <DataTable columns={alatColumns} data={alatData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "operator":
                return <DataTable columns={operatorColumns} data={operatorData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "lokasi":
                return <DataTable columns={lokasiColumns} data={lokasiData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "kalibrasi":
                return <DataTable columns={kalibrasiColumns} data={kalibrasiData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            case "users":
                return <DataTable columns={usersColumns} data={usersData} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />;
            default:
                return null;
        }
    };

    return (
        <PageLayout className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                <p className="mt-2 text-sm text-gray-400">{pageDescription}</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-[#2d2e32] p-2 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200
                ${isActive
                                    ? "bg-[#74CD25] text-white shadow-lg shadow-[#74CD25]/30"
                                    : "bg-transparent text-gray-400 hover:bg-[#343538] hover:text-white"
                                }
              `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="bg-[#343538] rounded-xl p-6">
                {renderTable()}
            </div>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, item: null, type: "" })}
                onConfirm={confirmDelete}
                itemName={deleteModal.name}
            />

            {/* Edit Modals */}
            <EditAlatModal
                isOpen={editAlatModal.open}
                onClose={() => setEditAlatModal({ open: false, item: null })}
                item={editAlatModal.item}
                onSave={handleSaveCallback}
            />
            <EditOperatorModal
                isOpen={editOperatorModal.open}
                onClose={() => setEditOperatorModal({ open: false, item: null })}
                item={editOperatorModal.item}
                onSave={handleSaveCallback}
            />
            <EditLokasiModal
                isOpen={editLokasiModal.open}
                onClose={() => setEditLokasiModal({ open: false, item: null })}
                item={editLokasiModal.item}
                onSave={handleSaveCallback}
            />
            <EditKalibrasiModal
                isOpen={editKalibrasiModal.open}
                onClose={() => setEditKalibrasiModal({ open: false, item: null })}
                item={editKalibrasiModal.item}
                onSave={handleSaveCallback}
            />
            <EditUsersModal
                isOpen={editUsersModal.open}
                onClose={() => setEditUsersModal({ open: false, item: null })}
                item={editUsersModal.item}
                onSave={handleSaveCallback}
            />
            <EditShiftCodeModal
                isOpen={editShiftCodeModal.open}
                onClose={() => setEditShiftCodeModal({ open: false, item: null })}
                item={editShiftCodeModal.item}
                onSave={handleSaveCallback}
            />
            <EditMaterialTypeModal
                isOpen={editMaterialTypeModal.open}
                onClose={() => setEditMaterialTypeModal({ open: false, item: null })}
                item={editMaterialTypeModal.item}
                onSave={handleSaveCallback}
            />
        </PageLayout>
    );
}
