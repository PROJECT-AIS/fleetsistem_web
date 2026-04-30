import mqtt from "mqtt";

const MQTT_BROKER_URL = "wss://mqtt.aispektra.com:443";
const MQTT_TOPIC = "fms/web";

export const MQTT_ACTIONS = {
    geoCreate: ["sync_geo"],
    geoEdit: ["sync_geo_edit"],
    geoDelete: ["sync_geo_hapus"],
    materialCreate: ["sync_mat", "sync_material"],
    materialEdit: ["sync_material_edit"],
    materialDelete: ["sync_material_hapus"],
};

export const publishToTopic = (topic, payload) => {
    return new Promise((resolve, reject) => {
        const client = mqtt.connect(MQTT_BROKER_URL);
        client.on("connect", () => {
            const message = typeof payload === "string" ? payload : JSON.stringify(payload);
            client.publish(topic, message, { qos: 1 }, (error) => {
                client.end(true);
                if (error) reject(error);
                else resolve();
            });
        });
        client.on("error", (err) => {
            client.end(true);
            reject(err);
        });
    });
};

export const publishMqttActions = (actions) => {
    const actionList = (Array.isArray(actions) ? actions : [actions]).filter(Boolean);

    if (actionList.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const client = mqtt.connect(MQTT_BROKER_URL);
        let finished = false;
        let pendingPublishes = actionList.length;

        const cleanup = () => {
            client.end(true);
        };

        const complete = () => {
            pendingPublishes -= 1;
            if (pendingPublishes === 0 && !finished) {
                finished = true;
                cleanup();
                resolve();
            }
        };

        const fail = (error) => {
            if (finished) {
                return;
            }

            finished = true;
            cleanup();
            reject(error);
        };

        client.on("connect", () => {
            actionList.forEach((action) => {
                const payload = JSON.stringify({ action });
                client.publish(MQTT_TOPIC, payload, { qos: 1 }, (error) => {
                    if (error) {
                        fail(error);
                        return;
                    }

                    complete();
                });
            });
        });

        client.on("error", fail);
    });
};
