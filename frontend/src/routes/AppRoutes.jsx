// routes/AppRoutes.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loading from '../components/Layout/Loading';

const Home = lazy(() => import('../pages/Home'));
const Anuncios = lazy(() => import('../pages/Anuncios'));
const QuienesSomos = lazy(() => import('../pages/QuienesSomos'));
const Actividades = lazy(() => import('../pages/Actividades'));
const Recursos = lazy(() => import('../pages/Recursos'));
const Contacto = lazy(() => import('../pages/Contacto'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anuncios" element={<Anuncios />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/actividades" element={<Actividades />} />
        <Route path="/recursos" element={<Recursos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
