import { createContext, useContext } from 'react';

export const MqttContext = createContext();

export const useMqttContext = () => {
    const context = useContext(MqttContext);
    if (!context) {
        throw new Error('useMqttContext must be used within an MqttProvider');
    }
    return context;
};
