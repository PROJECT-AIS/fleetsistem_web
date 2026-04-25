import { useState, useEffect, useCallback, useRef } from 'react';

const MQTT_URL = 'wss://mqtt.aispektra.com:443';
const DEFAULT_TOPIC = 'fms/+/data';
const DEBUG_MQTT = import.meta.env.DEV && import.meta.env.VITE_DEBUG_MQTT === 'true';

/**
 * Hook to manage MQTT connection and vehicle telemetry
 */
export const useMqtt = (topic = DEFAULT_TOPIC, { enabled = true } = {}) => {
    const [vehicles, setVehicles] = useState({});
    const [status, setStatus] = useState(enabled ? 'connecting' : 'idle');
    const clientRef = useRef(null);

    const processVehicleData = useCallback((data) => {
        const vehicleId = data.vehicle_id || data.device_id || 'unknown';
        
        // Extract coordinates based on confirmed JSON structure: data.gps.lat and data.gps.lon
        const lat = data.gps?.lat ?? data.lat ?? 0;
        const lng = data.gps?.lon ?? data.gps?.lng ?? data.lon ?? data.lng ?? 0;
        
        // Extract heading: confirmed at data.imu.orientation.heading
        const heading = data.imu?.orientation?.heading ?? data.imu?.heading ?? data.gps?.course ?? data.gps?.heading ?? 
                         data.course ?? data.heading ?? 0;

        // Format time for history - if not valid date, use current time
        let displayTime = data.datetime?.best || data.datetime?.rtc || data.time || data.timestamp || new Date().toLocaleString();
        
        // If it's a BOOT time or similar, maybe append actual date
        if (String(displayTime).includes('BOOT')) {
            const now = new Date();
            displayTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} (${displayTime})`;
        }

        setVehicles(prev => {
            const existing = prev[vehicleId] || {
                history: [],
                fuelHistory: [],
                weeklyFuel: [] 
            };

            const newPoint = { lat, lng, time: displayTime };
            const newHistory = [...(existing.history || []), newPoint].slice(-100);

            // Fuel history
            const fuelVal = data.fuel?.volume_l ?? data.fuel?.level ?? 0;
            const fuelPercent = data.fuel?.percent ?? data.fuel?.percentage ?? 0;
            
            const timeStr = String(displayTime).includes(' ') ? displayTime.split(' ')[1] : String(displayTime);
            const newFuelHistory = [...(existing.fuelHistory || []), {
                time: timeStr, 
                value: fuelVal
            }].slice(-30);

            return {
                ...prev,
                [vehicleId]: {
                    ...data,
                    id: vehicleId,
                    name: vehicleId,
                    lat: lat,
                    lng: lng,
                    status: (data.vehicle?.engine_on || data.vehicle?.moving || data.engine === 'on' || data.moving) ? 'online' : 'offline',
                    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=150&h=100&fit=crop",
                    fuelLevel: fuelPercent,
                    speed: data.gps?.speed_kph ?? data.speed ?? 0,
                    heading: heading,
                    history: newHistory,
                    fuelData: newFuelHistory,
                    operatorName: data.operator || "MQTT Operator",
                    plateNumber: vehicleId,
                    jabatan: "Operator",
                    divisi: "Logistics",
                }
            };
        });
        
        if (DEBUG_MQTT) {
            console.log(`[useMqtt] Processed ${vehicleId}: lat=${lat}, lng=${lng}, heading=${heading}`);
        }
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

            if (DEBUG_MQTT) {
                console.log(`Connecting to MQTT: ${MQTT_URL}`);
            }

            client = mqtt.connect(MQTT_URL, {
                clientId: 'ais_web_' + Math.random().toString(16).substring(2, 8),
                keepalive: 60,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 30 * 1000,
            });

            client.on('connect', () => {
                if (!isActive) return;
                if (DEBUG_MQTT) {
                    console.log('MQTT Connected');
                }
                setStatus('connected');
                if (Array.isArray(topic)) {
                    topic.forEach(t => client.subscribe(t));
                } else {
                    client.subscribe(topic);
                }
            });

            client.on('message', (receivedTopic, message) => {
                if (!isActive) return;
                const rawMessage = message.toString();
                if (DEBUG_MQTT) {
                    console.log(`MQTT Raw [${receivedTopic}]:`, rawMessage);
                }
                try {
                    const data = JSON.parse(rawMessage);
                    
                    // Extract ID from topic if not in JSON
                    let extractedId = data.vehicle_id || data.device_id;
                    if (!extractedId && receivedTopic.startsWith('fms/')) {
                        const parts = receivedTopic.split('/');
                        if (parts.length >= 2) extractedId = parts[1];
                    }

                    if (extractedId) {
                        // For FMS topics, we handle the data even if type is missing
                        processVehicleData({ ...data, vehicle_id: extractedId });
                    } else {
                        console.warn('MQTT Message skipped (no id found):', receivedTopic);
                    }
                } catch (e) {
                    console.error('Error parsing MQTT message:', e);
                }
            });

            client.on('error', (err) => {
                if (!isActive) return;
                console.error('MQTT Error:', err);
                setStatus('error');
            });

            client.on('close', () => {
                if (!isActive) return;
                if (DEBUG_MQTT) {
                    console.log('MQTT Connection closed');
                }
                setStatus('offline');
            });

            clientRef.current = client;
        }).catch((err) => {
            if (!isActive) return;
            console.error('MQTT module load error:', err);
            setStatus('error');
        });

        return () => {
            isActive = false;
            if (client) {
                client.end(true);
            }
            if (clientRef.current === client) {
                clientRef.current = null;
            }
        };
    }, [enabled, processVehicleData, topic]);

    return {
        vehicles: Object.values(vehicles),
        mqttStatus: status,
        rawVehicles: vehicles
    };
};
