import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RacePage from './pages/RacePage';
import MapPage from './pages/MapPage';
import ExplorePage from './pages/ExplorePage';
import ShipmentPage from './pages/ShipmentPage';
import SourcesPage from './pages/SourcesPage';

// Vite の BASE_URL を React Router の basename に渡す
// 本番（GitHub Pages）では "/sake-todofuken/"、開発では "/"
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<RacePage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="shipment" element={<ShipmentPage />} />
          <Route path="sources" element={<SourcesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
