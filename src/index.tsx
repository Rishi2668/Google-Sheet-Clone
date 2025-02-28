import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';

// Get the root element
const rootElement = document.getElementById('root');

// Make sure the element exists
if (!rootElement) throw new Error('Failed to find the root element');

// Create a root
const root = createRoot(rootElement);

// Render your app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);