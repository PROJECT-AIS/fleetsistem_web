import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

const MQTT_URL = 'ws://mqtt.aistrack.site';
const DEFAULT_TOPIC = ['#', 'fms/+/data']; // Subscribe to all and specific pattern

/**
 * Hook to manage MQTT connection and vehicle telemetry
 */
export const useMqtt = (topic = DEFAULT_TOPIC) => {
    const [vehicles, setVehicles] = useState({});
    const [status, setStatus] = useState('connecting');
    const clientRef = useRef(null);

    useEffect(() => {
        console.log(`Connecting to MQTT: ${MQTT_URL}`);
        const client = mqtt.connect(MQTT_URL, {
            clientId: 'ais_web_' + Math.random().toString(16).substring(2, 8),
            keepalive: 60,
            clean: true,
            reconnectPeriod: 2000,
            connectTimeout: 30 * 1000,
        });

        client.on('connect', () => {
            console.log('MQTT Connected');
            setStatus('connected');
            if (Array.isArray(topic)) {
                topic.forEach(t => client.subscribe(t));
            } else {
                client.subscribe(topic);
            }
        });

        client.on('message', (receivedTopic, message) => {
            const rawMessage = message.toString();
            console.log(`MQTT Raw [${receivedTopic}]:`, rawMessage);
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
                    processVehicleData({ ...data, vehicle_id: extractedId }, receivedTopic);
                } else {
                    console.warn('MQTT Message skipped (no id found):', receivedTopic);
                }
            } catch (e) {
                console.error('Error parsing MQTT message:', e);
            }
        });

        client.on('error', (err) => {
            console.error('MQTT Error:', err);
            setStatus('error');
        });

        client.on('close', () => {
            console.log('MQTT Connection closed');
            setStatus('offline');
        });

        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.end();
            }
        };
    }, [topic]);

    const processVehicleData = useCallback((data, topic) => {
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
        
        console.log(`[useMqtt] Processed ${vehicleId}: lat=${lat}, lng=${lng}, heading=${heading}`);
    }, []);

    return {
        vehicles: Object.values(vehicles),
        mqttStatus: status,
        rawVehicles: vehicles
    };
};
