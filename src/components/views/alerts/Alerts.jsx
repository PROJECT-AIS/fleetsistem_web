import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BatteryWarning, RefreshCw, Truck, WifiOff } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import { alatService } from "../../../services/configService";
import { useMqttContext } from "../../../context/mqttContextValue";
import { normalizeEquipmentDisplayStatus } from "../../../utils/statusUtils";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const ALERT_TONE = {
  critical: "border-red-500/30 bg-red-500/10 text-red-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-100",
};



export default function Alerts() {
  const [registeredAlat, setRegisteredAlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const { rawVehicles } = useMqttContext();

  const fetchAlat = useCallback(async (withLoading = true) => {
    try {
      if (withLoading) setLoading(true);
      const response = await alatService.getAll();
      setRegisteredAlat(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching equipment alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlat(true);
    const interval = setInterval(() => fetchAlat(false), 30000);
    return () => clearInterval(interval);
  }, [fetchAlat]);

  const alerts = useMemo(() => {
    const rows = [];

    registeredAlat.forEach((alat) => {
      const equipmentStatus = normalizeEquipmentDisplayStatus(rawVehicles[alat.idFms]?.equipmentStatus || alat.status || "online");
      if (equipmentStatus === "Maintenance" || equipmentStatus === "Breakdown") {
        rows.push({
          id: `equipment-${alat.id}`,
          icon: Truck,
          category: "Equipment",
          unit: alat.noUnit || alat.idFms || "-",
          severity: equipmentStatus === "Breakdown" ? "critical" : "warning",
          title: equipmentStatus === "Breakdown" ? "Unit breakdown" : "Unit maintenance",
          message: `${alat.noUnit || alat.idFms} berstatus ${equipmentStatus.toLowerCase()} dan perlu tindakan.`,
          updatedAt: alat.updatedAt,
        });
      }
    });

    Object.values(rawVehicles).forEach((vehicle) => {
      const unitLabel = vehicle.metadata?.noUnit || vehicle.id || "-";
      const batteryValue = Number(
        vehicle.battery?.percent ?? vehicle.device?.battery_percent ?? vehicle.esp_v_batt ?? NaN
      );

      if (vehicle.deviceStatus === "offline") {
        rows.push({
          id: `offline-${vehicle.id}`,
          icon: WifiOff,
          category: "Device",
          unit: unitLabel,
          severity: "critical",
          title: "Device offline",
          message: `Device pada ${unitLabel} terputus dari sistem.`,
          updatedAt: new Date().toISOString(),
        });
      }

      if (vehicle.deviceStatus === "loss") {
        rows.push({
          id: `loss-${vehicle.id}`,
          icon: AlertTriangle,
          category: "Device",
          unit: unitLabel,
          severity: "warning",
          title: "Loss coordinate",
          message: `Koordinat GPS ${unitLabel} tidak valid dan perlu dicek.`,
          updatedAt: new Date().toISOString(),
        });
      }

      if (Number.isFinite(batteryValue) && batteryValue <= 10) {
        rows.push({
          id: `battery-${vehicle.id}`,
          icon: BatteryWarning,
          category: "Device",
          unit: unitLabel,
          severity: "warning",
          title: "Battery rendah",
          message: `Baterai unit ${unitLabel} tinggal ${batteryValue}.`,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return rows.sort((a, b) => {
      const severityScore = { critical: 3, warning: 2, info: 1 };
      if (severityScore[b.severity] !== severityScore[a.severity]) {
        return severityScore[b.severity] - severityScore[a.severity];
      }

      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [rawVehicles, registeredAlat]);



  return (
    <PageLayout noScroll={true} className="p-6">
      <div className="flex h-full min-h-0 flex-col rounded-3xl border border-white/8 bg-[#232428] shadow-2xl">
        <div className="flex shrink-0 flex-col gap-4 border-b border-white/5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Alerts</h1>
          </div>
          <button
            type="button"
            onClick={() => fetchAlat(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#4a4b4d] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#5a5b5d]"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 custom-scrollbar">
          {alerts.length > 0 ? (
            <div className="grid gap-3">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <div key={alert.id} className={cn("rounded-2xl border p-4 shadow-lg", ALERT_TONE[alert.severity])}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">
                            {alert.category}
                          </div>
                          <div className="mt-1 text-lg font-black text-white">{alert.title}</div>
                          <div className="mt-2 text-sm leading-6 text-white/85">{alert.message}</div>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-xl bg-black/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/80">
                        {alert.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#2b2d32] p-8 text-center text-sm font-bold uppercase tracking-[0.16em] text-gray-400">
              Tidak ada alert urgent saat ini.
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
