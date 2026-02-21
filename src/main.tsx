import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './lib/firebase' // Initialize Firebase
import App from './App.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://94026ec9927690885662f23b931e384e@o4510920907358208.ingest.us.sentry.io/4510920909783040",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch every time the user tabs back
    },
  },
})


console.log('Main.tsx: Starting execution');
try {
  const rootElement = document.getElementById('root');
  console.log('Main.tsx: Root element:', rootElement);
  if (!rootElement) throw new Error('Root element not found');

  const root = createRoot(rootElement);
  console.log('Main.tsx: Root created, rendering...');

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  );
  console.log('Main.tsx: Render called');
} catch (error) {
  console.error('Main.tsx: Fatal Error during render:', error);
  document.body.innerHTML += `<div style="color:red; font-size:20px; padding:20px;">Fatal Error: ${error}</div>`;
}
