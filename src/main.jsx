// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './app/AppContext';
import { router } from './app/router';
import './assets/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(

    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>

);