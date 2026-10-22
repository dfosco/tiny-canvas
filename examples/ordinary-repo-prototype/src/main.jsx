import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import CanvasDocument from '@dfosco/tiny-canvas/canvas-document';
import documents from 'virtual:tiny-canvas-documents';
import ChromeOverview from './hyperbase/prototypes/chrome-overview/index.jsx';
import '@dfosco/tiny-canvas/style.css';
import './hyperbase/styles/shadcn.css';

function CanvasPage() {
  const location = useLocation();
  const document = documents.find((entry) => entry.id === location.pathname);
  if (!document) return <main><h1>Canvas not found</h1></main>;
  return <CanvasDocument {...document} />;
}

function NotFound() {
  if (window.location.pathname.endsWith('/Example')) {
    return (
      <main role="alert">
        <h1>Button Patterns prototype has unresolved source requirements</h1>
        <p>The reference route depends on SiloDashboard, a missing SiloChart component, flow/object data, and the PrimaryButtons and DangerButtons JSX companions.</p>
      </main>
    );
  }
  return <main><h1>Prototype route not found</h1></main>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/canvas/*" element={<CanvasPage />} />
        <Route path="/chrome-overview" element={<ChromeOverview />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
