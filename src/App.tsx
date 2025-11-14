import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Poslowie from './pages/Poslowie';
import MpProfile from './pages/MpProfile';
import Glosowania from './pages/Glosowania';
import VoteDetail from './pages/VoteDetail';
import Partie from './pages/Partie';
import PartyProfile from './pages/PartyProfile';
import Rankingi from './pages/Rankingi';
import TestWyborczy from './pages/TestWyborczy';
import OProjekcie from './pages/OProjekcie';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/poslowie" element={<Poslowie />} />
            <Route path="/poslowie/:id" element={<MpProfile />} />
            <Route path="/glosowania" element={<Glosowania />} />
            <Route path="/glosowania/:id" element={<VoteDetail />} />
            <Route path="/partie" element={<Partie />} />
            <Route path="/partie/:id" element={<PartyProfile />} />
            <Route path="/rankingi" element={<Rankingi />} />
            <Route path="/test" element={<TestWyborczy />} />
            <Route path="/o-projekcie" element={<OProjekcie />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
