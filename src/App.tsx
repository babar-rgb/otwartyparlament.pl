import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Home from './pages/Home';
import Poslowie from './pages/Poslowie';
import MpProfile from './pages/MpProfile';
// import Glosowania from './pages/Glosowania';
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
import Newsletter from './pages/Newsletter';
import Contact from './pages/Contact';
import Comparator from './pages/Comparator';
import BillDetails from './pages/BillDetails';
import BillsList from './pages/BillsList';
import VotesList from './pages/VotesList';
import SearchPage from './pages/SearchPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-paper dark:bg-slate-950 flex flex-col transition-colors duration-300">
        <Navigation />
        <main className="flex-grow pt-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/poslowie" element={<Poslowie />} />
            <Route path="/poslowie/:id" element={<MpProfile />} />
            {/* <Route path="/glosowania" element={<Glosowania />} /> */} {/* Original /glosowania route */}
            {/* <Route path="/glosowania/:id" element={<VoteDetails />} /> */} {/* Original /glosowania/:id route */}
            {/* <Route path="/glosowania/details" element={<VoteDetails />} /> */}
            <Route path="/partie" element={<Partie />} />
            <Route path="/partie/:id" element={<PartyProfile />} />
            <Route path="/rankingi" element={<Rankingi />} />
            <Route path="/test" element={<TestWyborczy />} />
            <Route path="/o-projekcie" element={<OProjekcie />} />
            <Route path="/ustawy/:id" element={<BillDetails />} /> {/* Added route for BillDetails */}
            <Route path="/projekty" element={<BillsList />} /> {/* Added route for BillsList */}
            <Route path="/projekty/:id" element={<BillDetails />} />
            <Route path="/glosowania" element={<VotesList />} />
            <Route path="/glosowania/:sitting/:votingNumber" element={<VoteDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/tematy/:slug" element={<CategoryDetails />} />
            <Route path="/metodologia" element={<DataSources />} />
            <Route path="/open-source" element={<OpenSource />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/porownywarka" element={<Comparator />} />
            <Route path="/szukaj" element={<SearchPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
