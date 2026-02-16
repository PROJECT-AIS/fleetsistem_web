import React, { createContext, useContext } from 'react';
import { useMqtt } from '../hooks/useMqtt';

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
    const mqttData = useMqtt();

    return (
        <MqttContext.Provider value={mqttData}>
            {children}
        </MqttContext.Provider>
    );
};

export const useMqttContext = () => {
    const context = useContext(MqttContext);
    if (!context) {
        throw new Error('useMqttContext must be used within an MqttProvider');
    }
    return context;
};
