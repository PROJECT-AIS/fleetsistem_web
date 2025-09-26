import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Menu, Users, Clock, Car, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import IconBang from "/assets/Iconimage.png";
import SideBar from "../../utils/sidebar/SideBar";
import Header from '../../utils/Header';

// Util: hitung bearing (derajat 0-360) dari dua titik lat/lng
function computeBearing(fromLat, fromLng, toLat, toLng) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const phi1 = toRad(fromLat);
  const phi2 = toRad(toLat);
  const dLambda = toRad(toLng - fromLng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda) - Math.sin(phi1) * Math.sin(phi2);
  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;
  return brng;
}

const HomeScreen = () => {
  // Rute GPS untuk polyline
  const gpsPath = [
    [-5.132132, 119.500958],
    [-5.133734, 119.504865],
    [-5.135291, 119.506632],
    [-5.136228, 119.507596],
    [-5.137361, 119.511503],
    [-5.137361, 119.51211],
    [-5.137482, 119.51541],
    [-5.138291, 119.517625],
    [-5.139099, 119.519506],
    [-5.14089, 119.520986],
    [-5.141706, 119.521623],
  ];
  const lastGps = gpsPath[gpsPath.length - 1];
  const prevGps = gpsPath[gpsPath.length - 2] || lastGps;
  const computedHeading = Math.round(
    computeBearing(prevGps[0], prevGps[1], lastGps[0], lastGps[1])
  );
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("cars");
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('selectedVehicle changed:', selectedVehicle);
  }, [selectedVehicle]);

  const vehicleData = [
    {
      id: 1,
      lat: lastGps[0],
      lng: lastGps[1],
      status: "online",
      type: "excavator",
      name: "Excavator D",
      image:
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=150&h=100&fit=crop",
      lastLocation: "Site A",
      fuelLevel: 85,
      distance: "2.5 KM",
      time: "08:30",
      heading: computedHeading,
    },
    {
      id: 2,
      lat: -5.145,
      lng: 119.433,
      status: "online",
      type: "dump_truck",
      name: "Dump Truck C",
      image:
        "https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lastLocation: "Site B",
      fuelLevel: 92,
      distance: "1.8 KM",
      time: "09:15",
      heading: 240,
    },
    {
      id: 3,
      lat: -5.125,
      lng: 119.413,
      status: "offline",
      type: "dump_truck",
      name: "Dump Truck A",
      image:
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lastLocation: "Site C",
      fuelLevel: 45,
      distance: "5.2 KM",
      time: "07:45",
      heading: 130,
    },
    {
      id: 4,
      lat: -5.155,
      lng: 119.443,
      status: "online",
      type: "car",
      name: "Vehicle 004",
      image:
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=150&h=100&fit=crop",
      lastLocation: "Site D",
      fuelLevel: 78,
      distance: "3.1 KM",
      time: "08:00",
      heading: 20,
    },
    {
      id: 5,
      lat: -5.165,
      lng: 119.453,
      status: "online",
      type: "truck",
      name: "Vehicle 005",
      image:
        "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lastLocation: "Site E",
      fuelLevel: 67,
      distance: "4.3 KM",
      time: "08:45",
      heading: 310,
    },
  ];

  const tripHistory = [
    {
      id: 1,
      location: "Jl. GK Tanjungkaya",
      time: "Lawan Siponh",
      status: "completed",
    },
    {
      id: 2,
      location: "Jl. GK Menarangteng",
      time: "4540541",
      status: "completed",
    },
    {
      id: 3,
      location: "Jl. GK Tanjungkaya",
      time: "4540541",
      status: "completed",
    },
    {
      id: 4,
      location: "Jl. GK Tanjungkaya",
      time: "Lawan Siponh",
      status: "completed",
    },
    {
      id: 5,
      location: "Jl. GK Menarangteng",
      time: "Lawan Siponh",
      status: "completed",
    },
    {
      id: 6,
      location: "Jl. GK Tanjungkaya",
      time: "4540541",
      status: "completed",
    },
    {
      id: 7,
      location: "Jl. GK Tanjungkaya",
      time: "Lawan Siponh",
      status: "completed",
    },
    {
      id: 8,
      location: "Jl. GK Menarangteng",
      time: "4540541",
      status: "completed",
    },
  ];

  const stats = {
    total: 25,
    online: 15,
    offline: 5,
    lossCoordinate: 5,
  };

  // Icon dp.png berotasi mengikuti heading
  const getRotatedIcon = (heading = 0) =>
    L.divIcon({
      className: "vehicle-marker",
      html: `<img src="/assets/dp.png" style="width:39px;height:20px;transform:rotate(${heading}deg);" />`,
      iconSize: [39, 20],
      iconAnchor: [19, 20],
    });

  const getFocusedRotatedIcon = (heading = 0) =>
    L.divIcon({
      className: "focused-marker",
      html: `<img src="/assets/dp.png" style="width:78px;height:40px;transform:rotate(${heading}deg);" />`,
      iconSize: [78, 40],
      iconAnchor: [39, 40],
    });

  const handleVehicleClick = (vehicle) => {
    console.log('Marker clicked:', vehicle.name);
    if (selectedVehicle && selectedVehicle.id === vehicle.id) {
      setSelectedVehicle(null);
    } else {
      setSelectedVehicle(vehicle);
    }
  };

  const handleVehicleHover = (vehicle, position) => {
    setHoveredVehicle(vehicle);
    setHoverPosition(position);
  };

  const handleVehicleLeave = () => {
    setHoveredVehicle(null);
  };

  const StatCard = ({ icon, value, label, color = "#74CD25" }) => (
    <div
      className="p-4 rounded-lg flex items-center space-x-3"
      style={{ backgroundColor: "#343538" }}
    >
      <div className="p-2 rounded">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
      </div>
    </div>
  );

  const VehicleTooltip = ({ vehicle, position }) => {
    const cardWidth = 220;
    const cardHeight = 100;
    const markerAnchorY = 41;
    return (
      <div
        className="fixed z-[1000] pointer-events-none"
        style={{
          left: position.x - cardWidth / 2,
          top: position.y - cardHeight + markerAnchorY - 100,
          width: cardWidth,
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden relative pointer-events-none">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            className="w-full h-[60px] object-cover rounded-t-xl bg-gray-200 pointer-events-none"
            onError={e => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
          />
          <div className="p-3 pb-6 pointer-events-none">
            <div className="font-bold text-black text-sm">{vehicle.name}</div>
            <div className="text-xs text-gray-500 mb-1">No. Plat</div>
            <span className={`absolute right-3 bottom-3 px-3 py-0.5 rounded-full  ${vehicle.status === 'online' ? 'bg-[#74CD25] text-white' : 'bg-red-500 text-white'} text-white font-semibold shadow text-xs pointer-events-none`}>
              {vehicle.status === "online" ? "Online" : "Offline"}
            </span>
          </div>
          {/* Arrow bawah */}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white pointer-events-none"></div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#1E1F22" }}
    >
      {/* Header */}
      <Header />

      <div className="flex">
        <SideBar />

        <div className="flex-1 p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<img src={IconBang} alt="Bang" className="w-10 h-10" />}
              value={stats.total}
              label="Total"
            />
            <StatCard
              icon={<img src={IconBang} alt="Bang" className="w-10 h-10" />}
              value={stats.online}
              label="ON"
            />
            <StatCard
              icon={<img src={IconBang} alt="Bang" className="w-10 h-10" />}
              value={stats.offline}
              label="OFF"
            />
            <StatCard
              icon={<img src={IconBang} alt="Bang" className="w-10 h-10" />}
              value={stats.lossCoordinate}
              label="Loss Coordinate"
            />
          </div>

          <div className="flex gap-6">
            {/* Map */}
            <div className={selectedVehicle ? "flex-1" : "flex-1 w-full"}>
              <div
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: "#343538" }}
              >
                <div className={selectedVehicle ? "h-[500px] rounded overflow-hidden transition-all duration-500" : "h-[600px] rounded overflow-hidden transition-all duration-500 w-full"}>
                  <MapContainer
                    ref={mapRef}
                    center={[-5.135, 119.423]}
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      attribution="Fetched by Raffi Fadlika"
                    />
                    {/* Polyline rute GPS */}
                    <Polyline
                      positions={gpsPath}
                      pathOptions={{ color: "#74CD25", weight: 4, opacity: 0.9 }}
                    />
                    {vehicleData.map((v) => {
                      const isSelected = selectedVehicle && v.id === selectedVehicle.id;
                      return (
                        <Marker
                          key={v.id + (isSelected ? '-selected' : '-default')}
                          position={[v.lat, v.lng]}
                          icon={isSelected ? getFocusedRotatedIcon(v.heading) : getRotatedIcon(v.heading)}
                          eventHandlers={{
                            mouseover: () => {
                              const map = mapRef.current;
                              if (map) {
                                const point = map.latLngToContainerPoint([v.lat, v.lng]);
                                const mapRect = map.getContainer().getBoundingClientRect();
                                handleVehicleHover(v, {
                                  x: point.x + mapRect.left,
                                  y: point.y + mapRect.top,
                                });
                              }
                            },
                            mouseout: handleVehicleLeave,
                            click: () => {
                              console.log('Direct marker click:', v.name);
                              handleVehicleClick(v);
                            },
                          }}
                        />
                      );
                    })}
                  </MapContainer>
                </div>
                {/* Card bawah hanya jika ada selectedVehicle */}
                {selectedVehicle && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="rounded-lg p-4" style={{ backgroundColor: "#343538" }}>
                      <h3 className="text-lg font-semibold mb-2">Volume Bahan Bakar Realtime</h3>
                      <div className="text-sm text-gray-400">Kamis, 29/05/2025</div>
                      <div className="mt-4 h-32 flex items-center justify-center">
                        {/* Grafik dummy SVG */}
                        <svg width="180" height="80">
                          <polyline fill="none" stroke="#74CD25" strokeWidth="3" points="0,70 30,30 60,60 90,50 120,60 150,40 180,60" />
                          <circle cx="30" cy="30" r="4" fill="#74CD25" />
                          <circle cx="60" cy="60" r="4" fill="#74CD25" />
                          <circle cx="90" cy="50" r="4" fill="#74CD25" />
                          <circle cx="120" cy="60" r="4" fill="#74CD25" />
                          <circle cx="150" cy="40" r="4" fill="#74CD25" />
                          <circle cx="180" cy="60" r="4" fill="#74CD25" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>00:00</span><span>10:00</span><span>12:00</span><span>13:00</span><span>14:00</span>
                      </div>
                    </div>
                    <div className="rounded-lg p-4" style={{ backgroundColor: "#343538" }}>
                      <h3 className="text-lg font-semibold mb-2">Konsumsi Bahan Bakar</h3>
                      <div className="text-sm text-gray-400">Per Minggu</div>
                      <div className="mt-4 h-32 flex items-center justify-center">
                        {/* Grafik dummy SVG */}
                        <svg width="180" height="80">
                          <polyline fill="none" stroke="#74CD25" strokeWidth="3" points="0,60 30,40 60,70 90,50 120,60 150,30 180,50" />
                          <circle cx="30" cy="40" r="4" fill="#74CD25" />
                          <circle cx="60" cy="70" r="4" fill="#74CD25" />
                          <circle cx="90" cy="50" r="4" fill="#74CD25" />
                          <circle cx="120" cy="60" r="4" fill="#74CD25" />
                          <circle cx="150" cy="30" r="4" fill="#74CD25" />
                          <circle cx="180" cy="50" r="4" fill="#74CD25" />
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Sidebar kanan modern hanya jika ada selectedVehicle */}
            {selectedVehicle && (
              <div
                key={selectedVehicle.id}
                className="w-96 space-y-6 animate-fade-in-right relative"
              >
                {/* Tombol Unselect */}
                <button
                  className="absolute top-4 right-4 p-2 rounded-full bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-600 transition z-10 flex items-center justify-center"
                  onClick={() => setSelectedVehicle(null)}
                  title="Batalkan Pilihan"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Detail Kendaraan (Cars) */}
                <div className="rounded-2xl shadow-2xl p-7 bg-gradient-to-br from-[#232526] to-[#343538] border border-[#232526] transition-all duration-500">
                  <div className="flex items-center mb-6">
                    <img src={selectedVehicle.image} alt={selectedVehicle.name} className="w-24 h-20 object-cover rounded-xl shadow-md border-2 border-[#74CD25] mr-5" />
                    <div>
                      <div className="text-2xl font-extrabold text-[#74CD25] mb-1">{selectedVehicle.name}</div>
                      <div className="text-xs text-gray-400 mb-1">{selectedVehicle.lastLocation}</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedVehicle.status === 'online' ? 'bg-[#74CD25] text-white' : 'bg-red-500 text-white'}`}>{selectedVehicle.status === 'online' ? 'Aktif' : 'Tidak Aktif'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-2">
                    <div className="bg-[#232526] rounded-lg p-3 shadow text-white flex flex-col items-center">
                      <div className="text-lg font-bold">135</div>
                      <div className="text-xs text-gray-400 mt-1">KM/H</div>
                    </div>
                    <div className="bg-[#232526] rounded-lg p-3 shadow text-white flex flex-col items-center">
                      <div className="text-lg font-bold">486</div>
                      <div className="text-xs text-gray-400 mt-1">KM</div>
                    </div>
                    <div className="bg-[#232526] rounded-lg p-3 shadow text-white flex flex-col items-center">
                      <div className="text-lg font-bold">20</div>
                      <div className="text-xs text-gray-400 mt-1">L</div>
                    </div>
                  </div>
                </div>
                {/* Last Trip */}
                <div className="rounded-2xl shadow-2xl p-7 bg-gradient-to-br from-[#232526] to-[#343538] border border-[#232526] transition-all duration-500">
                  <h3 className="text-xl font-bold mb-5 text-white">Last Trip</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {tripHistory.slice(0, 8).map((trip, idx) => (
                      <div
                        key={trip.id + idx}
                        className="flex items-center space-x-3 p-3 rounded-xl bg-[#232526] hover:bg-[#2e2e2e] transition"
                      >
                        <div className="w-3 h-3 rounded-full bg-[#74CD25] mr-2"></div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white">{trip.location}</div>
                          <div className="text-xs text-gray-400">{trip.time}</div>
                        </div>
                        <div className="text-xs text-gray-400 font-bold">480KM</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Tooltip */}
      {hoveredVehicle && (
        <VehicleTooltip vehicle={hoveredVehicle} position={hoverPosition} />
      )}

      <style>{`
        .animate-fade-in-right {
          animation: fadeInRight 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default HomeScreen;