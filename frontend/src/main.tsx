import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.tsx';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster position="bottom-center" toastOptions={{ style: { zIndex: 'var(--z-toast)', background: '#333', color: '#fff', borderRadius: '8px' } }} />
  </React.StrictMode>,
);
