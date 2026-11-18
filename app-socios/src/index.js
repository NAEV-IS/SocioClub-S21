import './styles/tokens.css';
import './styles/base.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SocioProvider } from './context/SocioContext';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode><BrowserRouter><SocioProvider><App /></SocioProvider></BrowserRouter></StrictMode>,
);
