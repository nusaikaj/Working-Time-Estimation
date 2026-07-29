import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <App />
            <ToastContainer position="top-right" autoClose={3500} newestOnTop theme="colored" />
          </AuthProvider>
        </LocalizationProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
