import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AuthContext } from './authContextValue';
import { MqttContext } from './mqttContextValue';
import { useMqtt } from '../hooks/useMqtt';
import { alatService, operatorService } from '../services/configService';

const EMPTY_MQTT_DATA = {
    vehicles: [],
    mqttStatus: 'idle',
    rawVehicles: {}
};

export const MqttProvider = ({ children }) => {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const [refData, setRefData] = useState({ alat: [], operators: [] });
    
    useEffect(() => {
        if (isAuthenticated && !loading) {
            Promise.all([
                alatService.getAll(),
                operatorService.getAll()
            ]).then(([alatRes, opRes]) => {
                setRefData({
                    alat: alatRes.data?.data || [],
                    operators: opRes.data?.data || []
                });
            }).catch(err => console.error('Error fetching FMS ref data:', err));
        }
    }, [isAuthenticated, loading]);

    const enabled = isAuthenticated && !loading;
    const mqttData = useMqtt(undefined, { 
        enabled,
        referenceData: refData
    });

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
