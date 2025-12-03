import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Poslowie from './pages/Poslowie';
import MpProfile from './pages/MpProfile';
import Glosowania from './pages/Glosowania';
// import VoteDetail from './pages/VoteDetail';
import Partie from './pages/Partie';
import PartyProfile from './pages/PartyProfile';
import Rankingi from './pages/Rankingi';
import TestWyborczy from './pages/TestWyborczy';
import OProjekcie from './pages/OProjekcie';
import VoteDetails from './pages/VoteDetails';
import CategoryDetails from './pages/CategoryDetails';
import DataSources from './pages/DataSources';
import OpenSource from './pages/OpenSource';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-paper flex flex-col">
        <Navigation />
        <main className="flex-grow pt-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/poslowie" element={<Poslowie />} />
            <Route path="/poslowie/:id" element={<MpProfile />} />
            <Route path="/glosowania" element={<Glosowania />} />
            <Route path="/glosowania/:id" element={<VoteDetails />} />
            {/* <Route path="/glosowania/details" element={<VoteDetails />} /> */}
            <Route path="/partie" element={<Partie />} />
            <Route path="/partie/:id" element={<PartyProfile />} />
            <Route path="/rankingi" element={<Rankingi />} />
            <Route path="/test" element={<TestWyborczy />} />
            <Route path="/o-projekcie" element={<OProjekcie />} />
            <Route path="/tematy/:slug" element={<CategoryDetails />} />
            <Route path="/metodologia" element={<DataSources />} />
            <Route path="/open-source" element={<OpenSource />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
