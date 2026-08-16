import React from 'react';
import ReactDOM from 'react-dom/client';
import StudioWrapper from './StudioWrapper';
import './styles.css';
import './workbench.css';
import './studio.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudioWrapper />
  </React.StrictMode>,
);
