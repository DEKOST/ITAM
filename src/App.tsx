import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentForm from './pages/EquipmentForm';
import EquipmentView from './pages/EquipmentView';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Rooms from './pages/Rooms';
import QRGenerator from './pages/QRGenerator';
import QRScan from './pages/QRScan';

function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/equipment/new" element={<EquipmentForm />} />
            <Route path="/equipment/:id" element={<EquipmentView />} />
            <Route path="/equipment/:id/edit" element={<EquipmentForm />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/users" element={<Users />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/qr-generator" element={<QRGenerator />} />
            <Route path="/qr-scan" element={<QRScan />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DataProvider>
  );
}

export default App;
