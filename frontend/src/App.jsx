import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import LocationSelector from './pages/LocationSelector';
import NearbyWells from './pages/NearbyWells';
import WellIntelligence from './pages/WellIntelligence';
import LiveDrilling from './pages/LiveDrilling';
import GeologicalCorrelation from './pages/GeologicalCorrelation';
import HistoricalEvents from './pages/HistoricalEvents';
import Documents from './pages/Documents';
import Evidence from './pages/Evidence';

export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        {/* Tricolor stripe */}
        <div className="tricolor-stripe">
          <div className="saffron" />
          <div className="white" />
          <div className="green" />
        </div>

        {/* Government header */}
        <Header />

        {/* Main layout */}
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/select-location" element={<LocationSelector />} />
              <Route path="/nearby-wells" element={<NearbyWells />} />
              <Route path="/well-intelligence" element={<WellIntelligence />} />
              <Route path="/well-intelligence/:wellId" element={<WellIntelligence />} />
              <Route path="/live-drilling" element={<LiveDrilling />} />
              <Route path="/geological-correlation" element={<GeologicalCorrelation />} />
              <Route path="/historical-events" element={<HistoricalEvents />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/evidence/:alertId" element={<Evidence />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </LanguageProvider>
  );
}
