import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './new.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { MqttProvider } from './context/MqttContext.jsx'

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <MqttProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MqttProvider>
  </AuthProvider>,
)
