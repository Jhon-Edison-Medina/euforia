// routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Anuncios from '../pages/Anuncios';
import QuienesSomos from '../pages/QuienesSomos';
import Actividades from '../pages/Actividades';
import Recursos from '../pages/Recursos';
import Contacto from '../pages/Contacto';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/anuncios" element={<Anuncios />} />
      <Route path="/quienes-somos" element={<QuienesSomos />} />
      <Route path="/actividades" element={<Actividades />} />
      <Route path="/recursos" element={<Recursos />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
};

export default AppRoutes;