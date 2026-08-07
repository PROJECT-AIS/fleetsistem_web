import React, { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, X, Send, Headset, Loader2, FileSpreadsheet, Search, Truck, Trash2, ChevronDown as ChevronIcon, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { publishToTopic } from "../../utils/mqttActions";
import { influxService } from "../../services/influxService";
import { showToast } from "../../utils/swalTheme";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const MessageResponses = ({ responses }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const acceptCount = Object.values(responses).filter(v => v === "ACCEPT" || v === "ACCEPTED").length;
  const rejectCount = Object.values(responses).filter(v => v === "REJECT" || v === "REJECTED").length;

  return (
    <div className="relative flex flex-col items-end z-10">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 transition-all text-gray-400 hover:text-white"
      >
        {acceptCount > 0 && <span className="text-[9px] font-bold uppercase text-[#39ff14] flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3"/> {acceptCount} ACCEPT</span>}
        {acceptCount > 0 && rejectCount > 0 && <span className="text-[8px] text-gray-600 mx-0.5">•</span>}
        {rejectCount > 0 && <span className="text-[9px] font-bold uppercase text-red-400 flex items-center gap-0.5"><XCircle className="w-3 h-3"/> {rejectCount} REJECT</span>}
        <ChevronIcon className={cn("h-2.5 w-2.5 text-gray-500 transition-transform ml-0.5", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 flex flex-col p-1 bg-[#343538] rounded-xl border border-white/10 w-48 max-h-40 overflow-y-auto scrollbar-thin z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.7)] origin-top-right animate-in zoom-in-95 duration-200">
          {Object.entries(responses).map(([devId, status]) => (
            <div key={devId} className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-[9px] font-bold text-gray-300">{devId}</span>
              <span className={cn(
                "text-[8px] font-bold uppercase flex items-center gap-1",
                status === "ACCEPTED" || status === "ACCEPT" ? "text-[#39ff14]" : "text-red-400"
              )}>
                {status === "ACCEPTED" || status === "ACCEPT" ? <CheckCircle2 className="w-2.5 h-2.5"/> : <XCircle className="w-2.5 h-2.5"/>}
                {status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatOverlay = ({ isSidebarOpen = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("broadcast");
  const [searchTarget, setSearchTarget] = useState("");
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [vehicleData, setVehicleData] = useState([]);
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [showAlertExportMenu, setShowAlertExportMenu] = useState(false);
  const [alertHistory, setAlertHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("fms_alert_history");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse alert history", e);
      return [];
    }
  });
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const handleSystemAlert = (e) => {
      setAlertHistory(prev => [e.detail, ...prev].slice(0, 50));
      setUnreadAlerts(prev => prev + 1);
    };
    window.addEventListener('fms_system_alert', handleSystemAlert);
    return () => window.removeEventListener('fms_system_alert', handleSystemAlert);
  }, []);

  useEffect(() => {
    if (isAlertOpen) setUnreadAlerts(0);
  }, [isAlertOpen]);

  useEffect(() => {
    localStorage.setItem("fms_alert_history", JSON.stringify(alertHistory));
  }, [alertHistory]);
  
  const clearAlertHistory = () => {
    if (window.confirm("Hapus semua riwayat alert?")) {
      setAlertHistory([]);
      localStorage.removeItem("fms_alert_history");
    }
  };
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
      scrollRef.current.scrollTop = 0;
    }
  }, [history]);

  useEffect(() => {
    let client;
    let disposed = false;

    const initClient = async () => {
      try {
        const { default: mqtt } = await import("mqtt");
        if (disposed) return;

        client = mqtt.connect("wss://mqtt.aispektra.com:443");
        client.on("connect", () => {
          client.subscribe("fms/chat");
          client.subscribe("fms/+/chat");
        });
        client.on("message", (topic, message) => {
          try {
            const payload = JSON.parse(message.toString());
            setHistory(prev => {
              const existingIndex = prev.findIndex(m => 
                (payload.id && m.id === payload.id) || 
                (m.timestamp === payload.timestamp && m.message === payload.message)
              );
              
              if (existingIndex !== -1) {
                const existing = prev[existingIndex];
                if (payload.status && payload.status !== existing.status) {
                  const newHistory = [...prev];
                  newHistory[existingIndex] = { ...existing, status: payload.status };
                  return newHistory;
                }
                return prev;
              }
              let finalPayload = { ...payload };
              
              // Handle ACCEPT / REJECT special cases from device
              if (
                finalPayload.sender !== "Web Admin" &&
                typeof finalPayload.message === "string" &&
                (finalPayload.message.trim() === "[REJECT]" || 
                 finalPayload.message.trim() === "[ACCEPT]" || 
                 finalPayload.message.trim() === "[ACCEPTED]")
              ) {
                const deviceId = finalPayload.sender.split(' ')[0];
                const statusStr = finalPayload.message.trim().replace(/\[|\]/g, '');
                
                let targetIndex = -1;
                
                if (finalPayload.reply_to_mode === "message" && finalPayload.reply_to_id) {
                  targetIndex = prev.findIndex(m => m.isMine && m.id && finalPayload.reply_to_id.includes(m.id));
                }
                
                // Fallback to the latest message if reply_to_id is not provided or not found
                if (targetIndex === -1) {
                  const lastSentIndex = prev.map(m => m).reverse().findIndex(m => 
                    m.isMine && (m.target === deviceId || m.target === "ALL" || topic.includes(m.target || ""))
                  );
                  if (lastSentIndex !== -1) {
                    targetIndex = prev.length - 1 - lastSentIndex;
                  }
                }
                
                if (targetIndex !== -1) {
                  const newHistory = [...prev];
                  const existingMsg = newHistory[targetIndex];
                  
                  const updatedResponses = { ...(existingMsg.responses || {}) };
                  updatedResponses[deviceId] = statusStr;
                  
                  newHistory[targetIndex] = { ...existingMsg, responses: updatedResponses };
                  return newHistory;
                }
                
                // If we couldn't find a matching message, do not add this as a new message bubble
                return prev;
              }
              
              return [...prev, { ...finalPayload, topic, isMine: finalPayload.sender === "Web Admin" }];
            });
          } catch (e) { console.error("Failed to parse message", e); }
        });
      } catch (error) {
        console.error("Failed to initialize chat MQTT client", error);
      }
    };

    initClient();

    return () => {
      disposed = true;
      client?.end();
    };
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
      showToast("Silakan pilih target kendaraan terlebih dahulu.", "warning");
      return;
    }

    setIsSending(true);
    const topic = activeTab === "broadcast" ? "fms/chat" : `fms/${selectedTarget.idFms || selectedTarget.id}/chat`;
    const payload = {
      id: Date.now().toString(),
      message: message.trim(),
      sender: "Web Admin",
      timestamp: new Date().toISOString(),
      type: activeTab,
      target: activeTab === "device" ? (selectedTarget.noPlat || selectedTarget.idFms) : "ALL"
    };

    try {
      await publishToTopic(topic, payload);
      setMessage("");
    } catch {
      showToast("Gagal mengirim pesan", "error");
    } finally {
      setIsSending(false);
    }
  };

  const exportToExcel = async (filterOptions = {}) => {
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
        Message: m.message,
        Status: m.status || "-"
      };
    });

    if (data.length === 0) {
      showToast("Tidak ada data untuk filter tersebut.", "warning");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chat History");
      XLSX.writeFile(wb, `FMS_Chat_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Export chat history error:", error);
      showToast("Gagal export data chat.", "error");
    }
  };

  const exportAlertsToExcel = async (filterOptions = {}) => {
    let dataToExport = [...alertHistory];

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

    const data = dataToExport.map(m => ({
      Timestamp: m.timestamp ? new Date(m.timestamp).toLocaleString() : "-",
      VehicleID: m.vehicleId,
      Type: m.type,
      Title: m.title,
      Message: m.message
    }));

    if (data.length === 0) {
      showToast("Tidak ada data alert untuk filter tersebut.", "warning");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "System Alerts");
      XLSX.writeFile(wb, `FMS_System_Alerts_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Export alert history error:", error);
      showToast("Gagal export data alert.", "error");
    }
  };

  const filteredVehicles = vehicleData.filter(v => 
    (v.noPlat || "").toLowerCase().includes(searchTarget.toLowerCase()) || 
    (v.idFms || "").toLowerCase().includes(searchTarget.toLowerCase())
  );

  const groupedAlerts = useMemo(() => {
    const groups = [];
    alertHistory.forEach(alert => {
      const recentIndex = groups.findIndex(g => 
        g.type === alert.type && 
        g.vehicleId === alert.vehicleId && 
        Math.abs(new Date(g.timestamp).getTime() - new Date(alert.timestamp).getTime()) < 60000
      );

      if (recentIndex >= 0) {
        groups[recentIndex].count = (groups[recentIndex].count || 1) + 1;
        if (new Date(alert.timestamp) > new Date(groups[recentIndex].timestamp)) {
           groups[recentIndex].timestamp = alert.timestamp;
        }
      } else {
        groups.push({ ...alert, count: 1 });
      }
    });
    return groups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [alertHistory]);

  return (
    <>
      {/* Circular Button Entry */}
      <div className={cn("mt-auto pt-6 border-t border-white/5 flex justify-center w-full relative", isSidebarOpen ? "flex-row gap-4" : "flex-col items-center gap-4")}>
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

        <button
          onClick={() => setIsAlertOpen(!isAlertOpen)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500/20 bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 hover:scale-110 hover:bg-amber-500 hover:text-black hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95"
          title="System Alerts"
        >
          <AlertTriangle className="h-7 w-7 transition-transform group-hover:scale-110" />
          {unreadAlerts > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white ring-2 ring-[#1e1f23]">
              {unreadAlerts > 99 ? "99+" : unreadAlerts}
            </span>
          )}
        </button>

        {isAlertOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="flex h-[80vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#1e1f23] shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
              
              <div className="flex flex-1 flex-col bg-[#2d2e32]">
                <div className="flex items-center justify-between p-6 bg-black/20">
                  <h2 className="text-2xl font-bold font-sans text-white tracking-wide flex items-center gap-3">
                    <AlertTriangle className="h-7 w-7 text-amber-500" /> SYSTEM ALERTS
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setShowAlertExportMenu(!showAlertExportMenu)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                          showAlertExportMenu ? "bg-amber-500 text-black" : "bg-white/5 text-amber-500 hover:bg-amber-500/10"
                        )}
                      >
                        EXPORT <ChevronIcon className={cn("h-4 w-4 transition-transform", showAlertExportMenu && "rotate-180")} />
                      </button>
                      
                      {showAlertExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1e1f23] shadow-2xl z-[100] animate-in slide-in-from-top-2">
                          <button 
                            onClick={() => { exportAlertsToExcel({ date: new Date() }); setShowAlertExportMenu(false); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-white hover:bg-amber-500 hover:text-black transition-all"
                          >
                            HARI INI
                          </button>
                          <button 
                            onClick={() => { exportAlertsToExcel({ month: `${new Date().getFullYear()}-${new Date().getMonth() + 1}` }); setShowAlertExportMenu(false); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-white border-t border-white/5 hover:bg-amber-500 hover:text-black transition-all"
                          >
                            BULAN INI
                          </button>
                          <button 
                            onClick={() => { exportAlertsToExcel(); setShowAlertExportMenu(false); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold text-white border-t border-white/5 hover:bg-amber-500 hover:text-black transition-all"
                          >
                            SEMUA DATA
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={clearAlertHistory}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#ff5555] hover:bg-[#ff5555]/20 hover:text-[#ff7777] transition-all"
                      title="Hapus History Alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setIsAlertOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all ml-2">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 space-y-4 custom-scrollbar text-left">
                  {groupedAlerts.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center opacity-30">
                      <AlertTriangle className="h-16 w-16 mb-4" />
                      <span className="text-sm font-bold uppercase tracking-widest">NO RECENT ALERTS</span>
                    </div>
                  ) : (
                    groupedAlerts.map((alert, i) => (
                      <div key={i} className={cn(
                        "flex justify-between items-center p-5 rounded-2xl border bg-white/5 hover:bg-white/10 transition-colors border-l-4",
                        alert.iconColor === 'amber' ? "border-amber-500 border-r-white/5 border-t-white/5 border-b-white/5" :
                        alert.iconColor === 'red' ? "border-red-500 border-r-white/5 border-t-white/5 border-b-white/5" :
                        "border-orange-500 border-r-white/5 border-t-white/5 border-b-white/5"
                      )}>
                        <div className="flex flex-col min-w-0 justify-center">
                          <h4 className="text-xl font-bold font-sans text-white mb-1">
                            {alert.title}
                            {alert.count > 1 && (
                              <span className="ml-3 text-sm font-semibold bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                                {alert.count}x in last minute
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
                            {alert.message}
                          </p>
                        </div>
                        {alert.timestamp && (
                          <div className="flex-shrink-0 ml-6 self-start mt-1">
                            <span className="text-xs text-gray-500 font-mono bg-black/30 px-3 py-1.5 rounded-full whitespace-nowrap">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Large Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex h-[80vh] w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#1e1f23] shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-300">
            
            {/* Sidebar: Message History */}
            <div className="flex w-[380px] flex-col border-r border-white/5 bg-black/20">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h3 className="text-sm font-bold font-sans text-white uppercase tracking-wide">History Log</h3>
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
                    className="p-2 rounded-lg bg-white/5 text-[#ff5555] hover:bg-[#ff5555]/20 hover:text-[#ff7777] transition-all"
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
                  [...history].reverse().map((msg, i) => (
                    <div key={msg.id || i} className="flex flex-col gap-1 w-full">
                      <div className={cn(
                        "rounded-2xl border p-3.5 transition-all w-full shadow-sm hover:bg-white/5",
                        msg.isMine 
                          ? "border-white/5 bg-white/5" 
                          : "border-[#39ff14]/18 bg-[#39ff14]/10"
                      )}>
                        <div className="flex justify-between items-center mb-1.5 gap-6">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", msg.isMine ? "text-white/40" : "text-[#39ff14]")}>
                            {msg.sender}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        
                        <div className="text-[13px] leading-relaxed break-anywhere whitespace-pre-wrap text-white/90">
                          {msg.message}
                        </div>
                        
                        {msg.target && (
                          <div className={cn("mt-2.5 pt-2 flex justify-between items-start gap-2 border-t", msg.isMine ? "border-white/5" : "border-[#39ff14]/20")}>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                <div className={cn("h-1 w-1 rounded-full", msg.isMine ? "bg-[#39ff14]" : "bg-[#39ff14]")} />
                                <span className="text-[9px] text-gray-400 font-bold uppercase">To: <span className={msg.isMine ? "text-white/70" : "text-[#39ff14]/80"}>{msg.target}</span></span>
                              </div>
                              
                              {msg.target !== "ALL" && msg.responses && Object.keys(msg.responses).length > 0 && (
                                <>
                                  <span className="text-[8px] text-gray-600 mx-0.5">•</span>
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase flex items-center gap-1",
                                    Object.values(msg.responses)[0] === "ACCEPTED" || Object.values(msg.responses)[0] === "ACCEPT" ? "text-[#39ff14]" : "text-red-400"
                                  )}>
                                    {Object.values(msg.responses)[0] === "ACCEPTED" || Object.values(msg.responses)[0] === "ACCEPT" ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                    {Object.values(msg.responses)[0]}
                                  </span>
                                </>
                              )}
                              
                              {(!msg.responses || Object.keys(msg.responses).length === 0) && msg.status && (
                                <>
                                  <span className="text-[8px] text-gray-600 mx-0.5">•</span>
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase flex items-center gap-1",
                                    msg.status.toLowerCase() === "accepted" || msg.status.toLowerCase() === "accept" ? "text-[#39ff14]" :
                                    msg.status.toLowerCase() === "rejected" || msg.status.toLowerCase() === "reject" ? "text-red-400" :
                                    "text-white/50"
                                  )}>
                                    {msg.status.toLowerCase() === "accepted" || msg.status.toLowerCase() === "accept" ? <CheckCircle2 className="w-3 h-3"/> :
                                     msg.status.toLowerCase() === "rejected" || msg.status.toLowerCase() === "reject" ? <XCircle className="w-3 h-3"/> : null}
                                    {msg.status}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Responses Container (for BROADCAST only) */}
                            {msg.target === "ALL" && msg.responses && Object.keys(msg.responses).length > 0 && (
                              <div className="flex-shrink-0">
                                <MessageResponses responses={msg.responses} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                      activeTab === "broadcast" ? "bg-[#39ff14] text-black shadow-md" : "text-gray-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    BROADCAST
                  </button>
                  <button
                    onClick={() => setActiveTab("device")}
                    className={cn(
                      "px-6 py-2 rounded-lg text-xs font-bold transition-all",
                      activeTab === "device" ? "bg-[#39ff14] text-black shadow-md" : "text-gray-300 hover:text-white hover:bg-white/5"
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
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
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
                    <h2 className="text-2xl font-bold font-sans text-white tracking-wide mb-3">
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
                      className="h-48 w-full resize-none rounded-[28px] border-2 border-white/5 bg-white/5 p-6 text-base text-white placeholder:text-gray-400 focus:border-[#39ff14]/30 focus:outline-none transition-all disabled:opacity-20 scrollbar-hide"
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || !message.trim() || (activeTab === "device" && !selectedTarget)}
                      className="absolute bottom-6 right-6 flex items-center gap-3 px-8 py-4 rounded-xl bg-[#39ff14] text-black font-black text-xs shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all"
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-pulse" /> : <><Send className="h-4 w-4" /> KIRIM</>}
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
