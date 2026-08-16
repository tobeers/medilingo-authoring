import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DeviceTestPublish from './DeviceTestPublish';
import './styles.css';
import './workbench.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <DeviceTestPublish />
  </React.StrictMode>,
);
