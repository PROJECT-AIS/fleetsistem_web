import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Headset, Loader2, FileSpreadsheet, Search, Truck, Trash2, ChevronDown as ChevronIcon } from "lucide-react";
import mqtt from "mqtt";
import * as XLSX from "xlsx";
import { publishToTopic } from "../../utils/mqttActions";
import { influxService } from "../../services/influxService";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const ChatOverlay = ({ isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("broadcast");
  const [searchTarget, setSearchTarget] = useState("");
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [vehicleData, setVehicleData] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("fms_chat_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse chat history", e);
      return [];
    }
  });
  const scrollRef = useRef(null);

  const clearHistory = () => {
    if (window.confirm("Hapus semua riwayat pesan?")) {
      setHistory([]);
      localStorage.removeItem("fms_chat_history");
    }
  };

  useEffect(() => {
    localStorage.setItem("fms_chat_history", JSON.stringify(history));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const client = mqtt.connect("wss://mqtt.aispektra.com:443");
    client.on("connect", () => {
      client.subscribe("fms/chat");
      client.subscribe("fms/+/chat");
    });
    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setHistory(prev => {
          const isDuplicate = prev.some(m => m.timestamp === payload.timestamp && m.message === payload.message);
          if (isDuplicate) return prev;
          return [...prev, { ...payload, topic, isMine: payload.sender === "Web Admin" }];
        });
      } catch (e) { console.error("Failed to parse message", e); }
    });
    return () => client.end();
  }, []);

  // Fetch vehicle data for search
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await influxService.getVehicles();
        const data = (res.data || []).map(v => ({
          ...v,
          noPlat: v.plateNumber || v.name || v.id,
          idFms: v.id,
        }));
        setVehicleData(data);
      } catch (error) {
        console.error("Chat fetch vehicles error:", error);
      }
    };
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    if (activeTab === "device" && !selectedTarget) {
      alert("Silakan pilih target kendaraan terlebih dahulu.");
      return;
    }

    setIsSending(true);
    const topic = activeTab === "broadcast" ? "fms/chat" : `fms/${selectedTarget.idFms || selectedTarget.id}/chat`;
    const payload = {
      message: message.trim(),
      sender: "Web Admin",
      timestamp: new Date().toISOString(),
      type: activeTab,
      target: activeTab === "device" ? (selectedTarget.noPlat || selectedTarget.idFms) : "ALL"
    };

    try {
      await publishToTopic(topic, payload);
      setMessage("");
    } catch (error) {
      alert("Gagal mengirim pesan");
    } finally {
      setIsSending(false);
    }
  };

  const exportToExcel = (filterOptions = {}) => {
    let dataToExport = [...history];

    if (filterOptions.date) {
      const targetDate = new Date(filterOptions.date).toDateString();
      dataToExport = dataToExport.filter(m => new Date(m.timestamp).toDateString() === targetDate);
    } else if (filterOptions.month) {
      const [year, month] = filterOptions.month.split("-");
      dataToExport = dataToExport.filter(m => {
        const d = new Date(m.timestamp);
        return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
      });
    }

    if (filterOptions.deviceId) {
      dataToExport = dataToExport.filter(m => m.topic?.includes(filterOptions.deviceId) || m.target === filterOptions.deviceId);
    }

    const data = dataToExport.map(m => {
      let typeLabel = m.type === "device" ? "private" : m.type;
      let targetDisplay = m.target;
      if (typeLabel === "private" && (!targetDisplay || targetDisplay === "Web Admin")) {
        const topicParts = m.topic?.split("/");
        if (topicParts && topicParts.length >= 2) targetDisplay = topicParts[1];
      }
      return {
        Timestamp: new Date(m.timestamp).toLocaleString(),
        Sender: m.sender,
        Type: typeLabel,
        Target: targetDisplay || "ALL",
        Message: m.message
      };
    });

    if (data.length === 0) {
      alert("Tidak ada data untuk filter tersebut.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chat History");
    XLSX.writeFile(wb, `FMS_Chat_History_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredVehicles = vehicleData.filter(v => 
    (v.noPlat || "").toLowerCase().includes(searchTarget.toLowerCase()) || 
    (v.idFms || "").toLowerCase().includes(searchTarget.toLowerCase())
  );

  return (
    <>
      {/* Circular Button Entry */}
      <div className="mt-auto pt-6 border-t border-white/5 flex justify-center w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#39ff14]/20 bg-[#39ff14]/10 text-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.1)] transition-all duration-300 hover:scale-110 hover:bg-[#39ff14] hover:text-black hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] active:scale-95"
          title="Chat Operator"
        >
          <Headset className="h-7 w-7 transition-transform group-hover:rotate-12" />
          {history.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#1e1f23]">
              {history.length > 99 ? "99+" : history.length}
            </span>
          )}
        </button>
      </div>

      {/* Large Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex h-[80vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#1e1f23] shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
            
            {/* Sidebar: Message History */}
            <div className="flex w-[380px] flex-col border-r border-white/5 bg-black/20">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">History Log</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <button 
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black transition-all",
                        showExportMenu ? "bg-[#39ff14] text-black" : "bg-white/5 text-[#39ff14] hover:bg-[#39ff14]/10"
                      )}
                    >
                      EXPORT <ChevronIcon className={cn("h-3 w-3 transition-transform", showExportMenu && "rotate-180")} />
                    </button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#1e1f23] shadow-2xl z-[100] animate-in slide-in-from-top-2">
                        <button 
                          onClick={() => { exportToExcel({ date: new Date() }); setShowExportMenu(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-bold text-white hover:bg-[#39ff14] hover:text-black transition-all"
                        >
                          HARI INI
                        </button>
                        <button 
                          onClick={() => { exportToExcel({ month: `${new Date().getFullYear()}-${new Date().getMonth() + 1}` }); setShowExportMenu(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-bold text-white border-t border-white/5 hover:bg-[#39ff14] hover:text-black transition-all"
                        >
                          BULAN INI
                        </button>
                        <button 
                          onClick={() => { exportToExcel(); setShowExportMenu(false); }}
                          className="w-full px-4 py-3 text-left text-[10px] font-bold text-white border-t border-white/5 hover:bg-[#39ff14] hover:text-black transition-all"
                        >
                          SEMUA DATA
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={clearHistory}
                    className="p-2 rounded-lg bg-white/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Hapus History"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center opacity-20">
                    <MessageSquare className="h-10 w-10 mb-2" />
                    <span className="text-[10px] font-bold">NO HISTORY</span>
                  </div>
                ) : (
                  history.map((msg, i) => (
                    <div key={i} className={cn(
                      "rounded-xl p-3 border border-white/5 transition-all hover:bg-white/5",
                      msg.isMine ? "bg-white/5" : "bg-[#39ff14]/5"
                    )}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={cn("text-[9px] font-black uppercase", msg.isMine ? "text-gray-400" : "text-[#39ff14]")}>
                          {msg.sender}
                        </span>
                        <span className="text-[8px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{msg.message}</p>
                      {msg.target && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-1 w-1 rounded-full bg-[#39ff14]" />
                          <span className="text-[8px] text-[#39ff14]/50 font-bold uppercase">To: {msg.target}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col bg-[#2d2e32]">
              {/* Header / Tabs */}
              <div className="flex items-center justify-between p-6 bg-black/20">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                  <button
                    onClick={() => setActiveTab("broadcast")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-xs font-black transition-all",
                      activeTab === "broadcast" ? "bg-[#39ff14] text-black" : "text-gray-400 hover:text-white"
                    )}
                  >
                    BROADCAST
                  </button>
                  <button
                    onClick={() => setActiveTab("device")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-xs font-black transition-all",
                      activeTab === "device" ? "bg-[#39ff14] text-black" : "text-gray-400 hover:text-white"
                    )}
                  >
                    SPECIFIC DEVICE
                  </button>
                </div>
                <button onClick={() => setIsOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Chat View */}
              <div className="flex-1 flex overflow-hidden">
                {activeTab === "device" && (
                  <div className="w-[280px] border-r border-white/5 bg-black/10 flex flex-col">
                    <div className="p-4 border-b border-white/5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
                        <input 
                          type="text"
                          placeholder="Search unit..."
                          value={searchTarget}
                          onChange={(e) => setSearchTarget(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white focus:border-[#39ff14]/50 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {filteredVehicles.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedTarget(v)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                            selectedTarget?.id === v.id ? "bg-[#39ff14] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"
                          )}
                        >
                          <Truck className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-none mb-1">{v.noPlat || v.idFms}</span>
                            <span className={cn("text-[9px] font-medium opacity-60", selectedTarget?.id === v.id ? "text-black" : "text-gray-500")}>
                              {v.jenisAlat || "Equipment"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex flex-col p-10 justify-center">
                  <div className="mb-6">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-3">
                      {activeTab === "broadcast" ? "BROADCAST MSG" : "DIRECT MESSAGE"}
                    </h2>
                    <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
                      {activeTab === "broadcast" 
                        ? "Kirimkan instruksi massal ke seluruh unit di lapangan."
                        : selectedTarget 
                          ? `Terhubung dengan ${selectedTarget.noPlat || selectedTarget.idFms}.`
                          : "Pilih unit target di panel kiri."}
                    </p>
                  </div>

                  <div className="relative group">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={activeTab === "device" && !selectedTarget ? "Pilih unit terlebih dahulu..." : "Tulis pesan di sini..."}
                      disabled={activeTab === "device" && !selectedTarget}
                      className="h-48 w-full resize-none rounded-[28px] border-2 border-white/5 bg-white/5 p-6 text-base text-white placeholder:text-gray-600 focus:border-[#39ff14]/30 focus:outline-none transition-all disabled:opacity-20"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || !message.trim() || (activeTab === "device" && !selectedTarget)}
                      className="absolute bottom-6 right-6 flex items-center gap-3 px-8 py-4 rounded-xl bg-[#39ff14] text-black font-black text-xs shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all"
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> KIRIM</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatOverlay;
