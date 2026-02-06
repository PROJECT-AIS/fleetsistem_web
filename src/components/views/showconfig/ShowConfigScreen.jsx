import React, { useState, useEffect } from "react";
import { Truck, User, MapPin, Fuel, Users, Edit2, Trash2, Plus, Search, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { alatService, operatorService, lokasiService, kalibrasiService, pengawasService } from "../../../services/configService";

// Tab configuration
const TABS = [
    { id: "alat", label: "Data Alat", icon: Truck },
    { id: "operator", label: "Data Operator", icon: User },
    { id: "lokasi", label: "Data Lokasi", icon: MapPin },
    { id: "kalibrasi", label: "Data Kalibrasi", icon: Fuel },
    { id: "users", label: "Data Users", icon: Users },
];

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

const operatorColumns = [
    { key: "nama", label: "Nama" },
    { key: "noTelp", label: "No Telepon" },
    { key: "divisi", label: "Divisi" },
    { key: "idCardNfc", label: "ID NFC" },
    { key: "jabatan", label: "Jabatan" },
];

const lokasiColumns = [
    { key: "nama", label: "Nama Lokasi" },
    { key: "jenisLokasi", label: "Jenis" },
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

export default function ShowConfigScreen() {
    const [activeTab, setActiveTab] = useState("alat");
    const [loading, setLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ open: false, item: null, type: "" });

    // Data states
    const [alatData, setAlatData] = useState([]);
    const [operatorData, setOperatorData] = useState([]);
    const [lokasiData, setLokasiData] = useState([]);
    const [kalibrasiData, setKalibrasiData] = useState([]);
    const [usersData, setUsersData] = useState([]);

    // Fetch data based on active tab
    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (tab) => {
        setLoading(true);
        try {
            let response;
            switch (tab) {
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

    const handleEdit = (item) => {
        console.log("Edit:", item);
        // TODO: Open edit modal
    };

    const handleDelete = (item) => {
        const nameField = item.nama || item.idFms || item.email || `ID: ${item.id}`;
        setDeleteModal({ open: true, item, type: activeTab, name: nameField });
    };

    const confirmDelete = async () => {
        const { item, type } = deleteModal;
        try {
            switch (type) {
                case "alat": await alatService.delete(item.id); break;
                case "operator": await operatorService.delete(item.id); break;
                case "lokasi": await lokasiService.delete(item.id); break;
                case "kalibrasi": await kalibrasiService.delete(item.id); break;
                case "users": await pengawasService.delete(item.id); break;
            }
            fetchData(type);
        } catch (error) {
            console.error("Error deleting:", error);
        } finally {
            setDeleteModal({ open: false, item: null, type: "" });
        }
    };

    const renderTable = () => {
        switch (activeTab) {
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
            <h1 className="text-2xl font-bold text-white mb-6">Show Config</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 bg-[#2d2e32] p-2 rounded-xl w-fit">
                {TABS.map((tab) => {
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
        </PageLayout>
    );
}
