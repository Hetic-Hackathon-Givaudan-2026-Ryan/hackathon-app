import { BrowserRouter, HashRouter, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProspectDetail from './pages/ProspectDetail';
import Prospects from './pages/Prospects';
import Questions from './pages/Questions';
import Signals from './pages/Signals';
import Appointments from './pages/Appointments';

// Ouvert en fichier local (double-clic sur le HTML), il n'y a pas de serveur
// pour répondre aux adresses /prospects/... : on passe par le #.
const Router = location.protocol === 'file:' ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="prospects" element={<Prospects />} />
          <Route path="prospects/:id" element={<ProspectDetail />} />
          <Route path="signaux" element={<Signals />} />
          <Route path="rendez-vous" element={<Appointments />} />
          <Route path="questions" element={<Questions />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
