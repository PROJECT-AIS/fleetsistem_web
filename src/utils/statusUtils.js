const normalizeText = (value) => String(value || "").trim().toLowerCase();

export const normalizeDeviceStatus = (value, fallback = "offline") => {
  const normalized = normalizeText(value);

  if (!normalized) return fallback;
  if (normalized === "loss" || normalized.includes("loss")) return "loss";

  if (
    normalized === "online" ||
    normalized === "on" ||
    normalized === "aktif" ||
    normalized === "active" ||
    normalized === "connected"
  ) {
    return "online";
  }

  if (
    normalized === "offline" ||
    normalized === "off" ||
    normalized === "mati" ||
    normalized === "inactive" ||
    normalized === "disconnected"
  ) {
    return "offline";
  }

  if (normalized.includes("on")) return "online";
  if (normalized.includes("off")) return "offline";

  return fallback;
};

export const normalizeEquipmentOperationalStatus = (value, fallback = "online") => {
  const normalized = normalizeText(value);

  if (!normalized) return fallback;

  if (
    normalized === "pasif" ||
    normalized === "passive" ||
    normalized === "maintenance"
  ) {
    return "pasif";
  }

  if (
    normalized === "offline" ||
    normalized === "off" ||
    normalized === "breakdown" ||
    normalized === "non-aktif" ||
    normalized === "non aktif" ||
    normalized === "inactive"
  ) {
    return "offline";
  }

  if (
    normalized === "online" ||
    normalized === "on" ||
    normalized === "aktif" ||
    normalized === "active" ||
    normalized === "available"
  ) {
    return "online";
  }

  if (normalized.includes("pasif") || normalized.includes("maint")) return "pasif";
  if (normalized.includes("off") || normalized.includes("break") || normalized.includes("non")) return "offline";
  if (normalized.includes("on")) return "online";

  return fallback;
};

export const normalizeEquipmentDisplayStatus = (value) => {
  const normalized = normalizeEquipmentOperationalStatus(value, "online");

  if (normalized === "pasif") return "Maintenance";
  if (normalized === "offline") return "Breakdown";
  return "Available";
};
