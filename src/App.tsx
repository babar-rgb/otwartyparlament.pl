import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navigation from './components/layout/Navigation';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ScrollToTop from './components/ui/ScrollToTop';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Poslowie = lazy(() => import('./pages/Poslowie'));
const MpProfile = lazy(() => import('./pages/MpProfile'));
const Europarlament = lazy(() => import('./pages/Europarlament'));
const EuroVotes = lazy(() => import('./pages/EuroVotes'));
const EuroMPProfile = lazy(() => import('./pages/EuroMPProfile'));
const EuroVoteDetails = lazy(() => import('./pages/EuroVoteDetails'));
const Komisje = lazy(() => import('./pages/Komisje'));
const KomisjaDetails = lazy(() => import('./pages/KomisjaDetails'));
const CommitteeSittingDetails = lazy(() => import('./pages/CommitteeSittingDetails'));
const Partie = lazy(() => import('./pages/Partie'));
const PartyProfile = lazy(() => import('./pages/PartyProfile'));
const Rankingi = lazy(() => import('./pages/Rankingi'));
const WealthRankings = lazy(() => import('./pages/WealthRankings'));
const SpeechesList = lazy(() => import('./pages/SpeechesList'));
const SpeechDetails = lazy(() => import('./pages/SpeechDetails'));
const InterpellationsList = lazy(() => import('./pages/InterpellationsList'));
const InterpellationDetails = lazy(() => import('./pages/InterpellationDetails'));
const TestWyborczy = lazy(() => import('./pages/TestWyborczy'));
const OProjekcie = lazy(() => import('./pages/OProjekcie'));
const Metodologia = lazy(() => import('./pages/Metodologia'));
const BillDetails = lazy(() => import('./pages/BillDetails'));
const LawMap = lazy(() => import('./pages/LawMap'));
const Projekty = lazy(() => import('./pages/Projekty'));
const VotesList = lazy(() => import('./pages/VotesList'));
const VoteDetails = lazy(() => import('./pages/VoteDetails'));
const CategoryDetails = lazy(() => import('./pages/CategoryDetails'));
const Categories = lazy(() => import('./pages/Categories'));
const OpenSource = lazy(() => import('./pages/OpenSource'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Contact = lazy(() => import('./pages/Contact'));
const Comparator = lazy(() => import('./pages/Comparator'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const LiveAnalysis = lazy(() => import('./pages/LiveAnalysis'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Transfery = lazy(() => import('./pages/Transfery'));
const Rzad = lazy(() => import('./pages/Rzad'));
const AITwin = lazy(() => import('./pages/AITwin'));
const LegislativeTracker = lazy(() => import('./pages/LegislativeTracker'));
const LegislativeProcessDetails = lazy(() => import('./pages/LegislativeProcessDetails'));
const SittingsHistory = lazy(() => import('./pages/SittingsHistory'));
const ForYou = lazy(() => import('./pages/ForYou'));
const HelpPage = lazy(() => import('./pages/HelpPage'));

const HelpButton = lazy(() => import('./components/layout/HelpButton'));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-page flex flex-col transition-colors duration-300">
        <ErrorBoundary>
          <Navigation />
          <main className="flex-grow pt-0">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/procesy" element={<LegislativeTracker />} />
                <Route path="/procesy/:id" element={<LegislativeProcessDetails />} />
                <Route path="/poslowie" element={<Poslowie />} />
                <Route path="/poslowie/:idOrSlug" element={<MpProfile />} />
                {/* Europarlament Routes */}
                <Route path="/europarlament" element={<Europarlament />} />
                <Route path="/europarlament/glosowania" element={<EuroVotes />} />
                <Route path="/europarlament/:id" element={<EuroMPProfile />} />
                <Route path="/europarlament/glosowanie/:id" element={<EuroVoteDetails />} />
                {/* Komisje Routes */}
                <Route path="/komisje" element={<Komisje />} />
                <Route path="/komisje/:code" element={<KomisjaDetails />} />
                <Route path="/komisje/:committeeCode/posiedzenie/:sittingId" element={<CommitteeSittingDetails />} />
                <Route path="/partie" element={<Partie />} />
                <Route path="/partie/:id" element={<PartyProfile />} />
                <Route path="/rankingi" element={<Rankingi />} />
                <Route path="/majatek" element={<WealthRankings />} />
                <Route path="/wypowiedzi" element={<SpeechesList />} />
                <Route path="/wypowiedzi/:id" element={<SpeechDetails />} />
                <Route path="/interpelacje" element={<InterpellationsList />} />
                <Route path="/interpelacje/:id" element={<InterpellationDetails />} />
                <Route path="/test-wyborczy" element={<TestWyborczy />} />
                <Route path="/o-projekcie" element={<OProjekcie />} />
                <Route path="/ustawy/:id" element={<BillDetails />} />
                <Route path="/mapa/:processId" element={<LawMap />} />
                <Route path="/projekty" element={<Projekty />} />
                <Route path="/projekty/:id" element={<ProjectDetails />} />
                <Route path="/glosowania" element={<VotesList />} />
                <Route path="/glosowania/:term/:sitting/:votingNumber" element={<VoteDetails />} />
                <Route path="/glosowanie/:id" element={<VoteDetails />} />
                <Route path="/tematy/:slug" element={<CategoryDetails />} />
                <Route path="/kategoria/:slug" element={<CategoryDetails />} />
                <Route path="/kategorie" element={<Categories />} />
                <Route path="/metodologia" element={<Metodologia />} />
                <Route path="/open-source" element={<OpenSource />} />
                <Route path="/newsletter" element={<Newsletter />} />
                <Route path="/kontakt" element={<Contact />} />
                <Route path="/pomoc" element={<HelpPage />} />
                <Route path="/porownywarka" element={<Comparator />} />
                <Route path="/szukaj" element={<SearchPage />} />
                <Route path="/live" element={<LiveAnalysis />} />
                <Route path="/transfery" element={<Transfery />} />
                <Route path="/rzad" element={<Rzad />} />
                <Route path="/ai-twin" element={<AITwin />} />
                <Route path="/posiedzenia/historia" element={<SittingsHistory />} />
                <Route path="/dla-ciebie" element={<ForYou />} />
                {/* Catch-all MUST be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <HelpButton />
            </Suspense>
          </main>
          <Footer />
        </ErrorBoundary>
      </div>
    </BrowserRouter>
  );
}
