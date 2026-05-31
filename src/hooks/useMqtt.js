import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeDeviceStatus, normalizeEquipmentOperationalStatus } from '../utils/statusUtils';

const MQTT_URL = 'wss://mqtt.aispektra.com:443';
const DEFAULT_TOPIC = 'fms/+/data';
const DEBUG_MQTT = import.meta.env.DEV && import.meta.env.VITE_DEBUG_MQTT === 'true';

const normalizeTripStatus = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'end_trip';

    if (
        raw === 'on trip' ||
        raw === 'on_trip' ||
        raw === 'ontrip' ||
        raw === 'start trip' ||
        raw === 'start_trip' ||
        raw === 'terbuka' ||
        raw === 'aktif'
    ) {
        return 'on_trip';
    }

    if (
        raw === 'end trip' ||
        raw === 'end_trip' ||
        raw === 'endtrip' ||
        raw === 'close trip' ||
        raw === 'close_trip' ||
        raw === 'tertutup' ||
        raw === 'selesai'
    ) {
        return 'end_trip';
    }

    if (raw.includes('on') && raw.includes('trip')) return 'on_trip';
    if ((raw.includes('end') || raw.includes('close')) && raw.includes('trip')) return 'end_trip';

    return 'unknown';
};

/**
 * Hook to manage MQTT connection and vehicle telemetry
 */
export const useMqtt = (topic = DEFAULT_TOPIC, { enabled = true, referenceData = { alat: [], operators: [] } } = {}) => {
    const [vehicles, setVehicles] = useState({});
    const [status, setStatus] = useState(enabled ? 'connecting' : 'idle');
    const clientRef = useRef(null);

    // Keep reference data in a ref for use in processVehicleData without triggering re-renders
    const refDataRef = useRef(referenceData);
    useEffect(() => {
        refDataRef.current = referenceData;
    }, [referenceData]);

    const processVehicleData = useCallback((data) => {
        const vehicleId = data.vehicle_id || data.device_id || 'unknown';
        const { alat, operators } = refDataRef.current;

        // 1. GPS & Basic Info
        const lat = data.gps?.lat ?? 0;
        const lng = data.gps?.lon ?? 0;
        const speedKph = data.gps?.speed_kph ?? 0;
        const heading = data.imu?.orientation?.heading ?? data.gps?.course ?? 0;
        const gpsValid = data.gps?.valid ?? false;

        // 2. Map Operator via NFC UID
        const nfcUid = data.nfc?.last_uid;
        let operatorName = "Unidentified";
        let operatorId = nfcUid || "-";

        if (nfcUid) {
            const foundOp = operators.find(op => op.idCardNfc === nfcUid || op.nfcUid === nfcUid);
            if (foundOp) {
                operatorName = foundOp.nama;
                operatorId = foundOp.idOperator || foundOp.id || nfcUid;
            }
        }

        // 3. Asset (Alat) Details Mapping
        const assetInfo = alat.find(a => a.idFms === vehicleId);
        const lokasiAwal = data.operator_input?.lokasi_awal ?? data.lokasi_awal ?? data.loc_start ?? "-";
        const lokasiAkhir = data.operator_input?.lokasi_akhir ?? data.lokasi_akhir ?? data.loc_end ?? "-";
        const jenisMuatan = data.operator_input?.jenis_muatan ?? data.jenis_muatan ?? data.payload_type ?? "-";
        const payloadDeviceStatus = normalizeDeviceStatus(data.device_fms?.device_status ?? data.status, '');
        const deviceOnline = payloadDeviceStatus
            ? payloadDeviceStatus === 'online'
            : Boolean(data.vehicle?.engine_on || data.vehicle?.moving || speedKph > 0);
        const resolvedDeviceStatus = payloadDeviceStatus || (deviceOnline ? 'online' : 'offline');
        const payloadEquipmentStatus =
            data.vehicle?.status ??
            data.equipment?.status ??
            data.equipment_status ??
            data.status_alat ??
            data.asset?.status;
        let resolvedEquipmentStatus = normalizeEquipmentOperationalStatus(
            payloadEquipmentStatus ?? assetInfo?.status ?? 'online'
        );

        // Dynamically infer Idling (pasif) or Working (online) based on speed
        if (resolvedEquipmentStatus !== 'offline') {
            if (speedKph === 0) {
                resolvedEquipmentStatus = 'pasif';
            } else {
                resolvedEquipmentStatus = 'online';
            }
        }

        // 4. Retase (Trip) Logic
        const rawTripStatus = data.operator_input?.status_trip || data.status_trip || "End Trip";
        const normalizedTripStatus = normalizeTripStatus(rawTripStatus);
        const currentTripStatus = normalizedTripStatus === 'on_trip'
            ? 'On Trip'
            : normalizedTripStatus === 'end_trip'
                ? 'End Trip'
                : String(rawTripStatus || "End Trip").trim();
        setVehicles(prev => {
            const existing = prev[vehicleId] || {
                history: [],
                fuelHistory: [],
                maxSpeedInTrip: 0,
                lastTripStatus: 'End Trip',
                tripPath: [],
                tripStartTime: null
            };

            // Track max speed during "On Trip"
            let newMaxSpeed = existing.maxSpeedInTrip || 0;
            let newTripPath = [...(existing.tripPath || [])];

            if (normalizedTripStatus === "on_trip") {
                if (speedKph > newMaxSpeed) newMaxSpeed = speedKph;
                
                // Add to trip path while on trip
                if (gpsValid) {
                    // Only add if coordinate changed significantly or enough time passed
                    const lastPoint = newTripPath[newTripPath.length - 1];
                    if (!lastPoint || Math.abs(lastPoint.lat - lat) > 0.00001 || Math.abs(lastPoint.lng - lng) > 0.00001) {
                        newTripPath.push({ lat, lng });
                    }
                }
            }

            let newTripStartTime = existing.tripStartTime;

            // Detect Trip Completion (On Trip -> End Trip)
            if (existing.lastTripStatus === "On Trip" && normalizedTripStatus === "end_trip") {
                if (DEBUG_MQTT) console.log(`[useMqtt] RETASE transition detected for ${vehicleId}.`);

                // Increment session trip count only for UI display.
                existing.tripCount = (existing.tripCount || 0) + 1;

                // Note: We don't clear newTripPath immediately here so user can see the last route
                // Reset max speed for next trip
                newMaxSpeed = 0;
                newTripStartTime = null;
            }

            // If starting a NEW trip from any other state, clear the old path and set new start time
            if (existing.lastTripStatus !== "On Trip" && normalizedTripStatus === "on_trip") {
                newTripPath = [{ lat, lng }];
                newTripStartTime = Date.now();
            } else if (normalizedTripStatus === "on_trip" && !newTripStartTime) {
                // Fallback: if already on_trip but no start time, initialize it
                newTripStartTime = Date.now();
            }

            // Fuel history update
            const fuelVal = data.fuel?.volume_l ?? 0;
            let displayTime = data.datetime?.best || new Date().toLocaleString();
            const timeStr = String(displayTime).includes(' ') ? displayTime.split(' ')[1] : String(displayTime);
            
            const newFuelHistory = [...(existing.fuelHistory || []), {
                time: timeStr, 
                value: fuelVal
            }].slice(-30);

            const newHistory = [...(existing.history || []), { lat, lng, time: displayTime }].slice(-100);

            // Stolen fuel tracking
            let newLastStolenL = existing.lastStolenL || 0;
            let newStolenActiveUntil = existing.stolenActiveUntil || 0;
            if (data.fuel && data.fuel.stolen_l !== undefined) {
                const currentStolen = Number(data.fuel.stolen_l);
                if (currentStolen > newLastStolenL) {
                    newStolenActiveUntil = Date.now() + 15000; // Keep active for 15 seconds after movement
                    newLastStolenL = currentStolen;
                } else if (currentStolen < newLastStolenL) {
                    newLastStolenL = currentStolen; // reset
                }
            }

            return {
                ...prev,
                [vehicleId]: {
                    ...existing,
                    ...data,
                    id: vehicleId,
                    name: assetInfo?.noUnit || assetInfo?.noPlat || vehicleId,
                    lat,
                    lng,
                    gpsValid,
                    status: resolvedDeviceStatus,
                    deviceStatus: gpsValid ? resolvedDeviceStatus : 'loss',
                    equipmentStatus: resolvedEquipmentStatus,
                    image: assetInfo?.gambar ? assetInfo.gambar : "/assets/selected-vehicle.png",
                    fuelLevel: data.fuel?.percent || 0,
                    speed: speedKph,
                    heading,
                    history: newHistory,
                    fuelData: newFuelHistory,
                    operatorName,
                    operatorId,
                    plateNumber: assetInfo?.noUnit || assetInfo?.noPlat || vehicleId,
                    lokasiAwal,
                    lokasiAkhir,
                    jenisMuatan,
                    maxSpeedInTrip: newMaxSpeed,
                    lastTripStatus: currentTripStatus,
                    tripPath: newTripPath.slice(-500),
                    tripStartTime: newTripStartTime,
                    tripCount: existing.tripCount || 0,
                    geofenceName: data.geofence?.name || "-",
                    metadata: assetInfo || {},
                    lastStolenL: newLastStolenL,
                    stolenActiveUntil: newStolenActiveUntil
                }
            };
        });
    }, []);

    useEffect(() => {
        if (!enabled) {
            if (clientRef.current) {
                clientRef.current.end(true);
                clientRef.current = null;
            }
            setVehicles({});
            setStatus('idle');
            return undefined;
        }

        let isActive = true;
        let client = null;
        setStatus('connecting');

        import('mqtt').then(({ default: mqtt }) => {
            if (!isActive) return;

            client = mqtt.connect(MQTT_URL, {
                clientId: 'ais_web_' + Math.random().toString(16).substring(2, 8),
                protocolVersion: 4,
                keepalive: 60,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 30 * 1000,
            });

            client.on('connect', () => {
                if (!isActive) return;
                setStatus('connected');
                client.subscribe(topic);
            });

            client.on('message', (receivedTopic, message) => {
                if (!isActive) return;
                try {
                    const data = JSON.parse(message.toString());
                    let extractedId = data.vehicle_id || data.device_id;
                    if (!extractedId && receivedTopic.startsWith('fms/')) {
                        const parts = receivedTopic.split('/');
                        if (parts.length >= 2) extractedId = parts[1];
                    }

                    if (extractedId) {
                        processVehicleData({ ...data, vehicle_id: extractedId });
                    }
                } catch (e) {
                    console.error('MQTT parse error:', e);
                }
            });

            client.on('error', () => setStatus('error'));
            client.on('close', () => setStatus('offline'));
            clientRef.current = client;
        }).catch(() => setStatus('error'));

        return () => {
            isActive = false;
            if (client) client.end(true);
            if (clientRef.current === client) clientRef.current = null;
        };
    }, [enabled, processVehicleData, topic]);

    return {
        vehicles: Object.values(vehicles),
        mqttStatus: status,
        rawVehicles: vehicles
    };
};
