import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './lib/firebase' // Initialize Firebase
import App from './App.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

console.log('Main.tsx: Starting execution');
try {
  const rootElement = document.getElementById('root');
  console.log('Main.tsx: Root element:', rootElement);
  if (!rootElement) throw new Error('Root element not found');

  const root = createRoot(rootElement);
  console.log('Main.tsx: Root created, rendering...');

  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  );
  console.log('Main.tsx: Render called');
} catch (error) {
  console.error('Main.tsx: Fatal Error during render:', error);
  document.body.innerHTML += `<div style="color:red; font-size:20px; padding:20px;">Fatal Error: ${error}</div>`;
}
