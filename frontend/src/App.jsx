import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';

const HomePage     = lazy(() => import('./pages/HomePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '12px',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-mono)',
      fontSize: '14px'
    }}>
      <div className="animate-spin" style={{
        width: 20, height: 20,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%'
      }} />
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<Loading />}>
              <HomePage />
            </Suspense>
          } />
          <Route path="dashboard" element={
            <Suspense fallback={<Loading />}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="analytics/:shortCode" element={
            <Suspense fallback={<Loading />}>
              <AnalyticsPage />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
