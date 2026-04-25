import React, { useContext, useMemo } from 'react';
import { AuthContext } from './authContextValue';
import { MqttContext } from './mqttContextValue';
import { useMqtt } from '../hooks/useMqtt';

const EMPTY_MQTT_DATA = {
    vehicles: [],
    mqttStatus: 'idle',
    rawVehicles: {}
};

export const MqttProvider = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const enabled = isAuthenticated && !loading;
    const mqttData = useMqtt(undefined, { enabled });
    const value = useMemo(
        () => (enabled ? mqttData : EMPTY_MQTT_DATA),
        [enabled, mqttData]
    );

    return (
        <MqttContext.Provider value={value}>
            {children}
        </MqttContext.Provider>
    );
};
