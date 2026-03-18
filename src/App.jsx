import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/AuthContext';
import PageNotFound from './lib/PageNotFound';

// Public pages
import Home from './pages/Home';
import VenueDetail from './pages/VenueDetail';
import Booking from './pages/Booking';

// Admin pages
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import AdminReservations from './pages/AdminReservations';
import AdminVenues from './pages/AdminVenues';
import AdminVenueBlocks from './pages/AdminVenueBlocks';
import AdminCustomers from './pages/AdminCustomers';

// Layouts
import PublicLayout from './components/public/PublicLayout';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/venues/:slug" element={<VenueDetail />} />
            </Route>

            {/* Booking (own layout) */}
            <Route path="/booking" element={<Booking />} />

            {/* Admin login (no auth required) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin routes (protected) */}
            <Route element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }>
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/reservations" element={<AdminReservations />} />
              <Route path="/admin/venues" element={<AdminVenues />} />
              <Route path="/admin/venues/:id/blocks" element={<AdminVenueBlocks />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
            </Route>

            {/* Legacy redirects */}
            <Route path="/Home" element={<Navigate to="/" replace />} />
            <Route path="/Booking" element={<Navigate to="/booking" replace />} />
            <Route path="/Admin" element={<Navigate to="/admin" replace />} />
            <Route path="/AdminReservations" element={<Navigate to="/admin/reservations" replace />} />
            <Route path="/AdminRooms" element={<Navigate to="/admin/venues" replace />} />
            <Route path="/AdminCustomers" element={<Navigate to="/admin/customers" replace />} />

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
