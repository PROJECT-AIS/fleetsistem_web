import { useState, useRef, useCallback } from 'react';

const MQTT_URL = 'wss://mqtt.aispektra.com:443';
const NFC_TOPIC = 'fms/master_nfc';

/**
 * Hook to scan NFC card via MQTT.
 * Connects to the broker, subscribes to /fms/master_fms,
 * and waits for the latest NFC UID message.
 *
 * Usage:
 *   const { scanning, nfcId, error, startScan, stopScan } = useNfcScan();
 */
export const useNfcScan = ({ timeout = 30000 } = {}) => {
    const [scanning, setScanning] = useState(false);
    const [nfcId, setNfcId] = useState(null);
    const [error, setError] = useState(null);
    const clientRef = useRef(null);
    const timerRef = useRef(null);

    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (clientRef.current) {
            try {
                clientRef.current.end(true);
            } catch (_) { /* ignore */ }
            clientRef.current = null;
        }
        setScanning(false);
    }, []);

    const stopScan = useCallback(() => {
        cleanup();
    }, [cleanup]);

    const startScan = useCallback(() => {
        // Reset state
        setNfcId(null);
        setError(null);
        setScanning(true);

        // Dynamic import mqtt
        import('mqtt').then(({ default: mqtt }) => {
            const client = mqtt.connect(MQTT_URL, {
                clientId: 'nfc_scan_' + Math.random().toString(16).substring(2, 8),
                keepalive: 30,
                clean: true,
                reconnectPeriod: 2000,
                connectTimeout: 10000,
            });

            clientRef.current = client;

            client.on('connect', () => {
                console.log('[NFC Scan] Connected to MQTT, subscribing to', NFC_TOPIC);
                client.subscribe(NFC_TOPIC, { qos: 1 });
            });

            client.on('message', (_topic, message) => {
                try {
                    const raw = message.toString().trim();
                    console.log('[NFC Scan] Received:', raw);

                    let uid = null;

                    // Try parsing as JSON first
                    try {
                        const data = JSON.parse(raw);
                        // Support various payload shapes:
                        // { uid: "..." } or { nfc_uid: "..." } or { id: "..." } or { card_id: "..." }
                        uid = data.uid || data.nfc_uid || data.id || data.card_id || data.UID || data.NFC_UID || null;
                    } catch (_) {
                        // If not JSON, treat raw string as the UID itself
                        uid = raw;
                    }

                    if (uid) {
                        setNfcId(String(uid));
                        cleanup();
                    }
                } catch (e) {
                    console.error('[NFC Scan] Parse error:', e);
                }
            });

            client.on('error', (err) => {
                console.error('[NFC Scan] MQTT error:', err);
                setError('Gagal terhubung ke scanner NFC');
                cleanup();
            });

            // Auto-timeout
            timerRef.current = setTimeout(() => {
                setError('Timeout - tidak ada kartu NFC terdeteksi');
                cleanup();
            }, timeout);

        }).catch((err) => {
            console.error('[NFC Scan] Module load error:', err);
            setError('Gagal memuat modul MQTT');
            cleanup();
        });
    }, [cleanup, timeout]);

    return {
        scanning,
        nfcId,
        error,
        startScan,
        stopScan,
    };
};
