import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

// Public pages
import Home from './pages/Home';
import Booking from './pages/Booking';

// Client pages
import ClientDashboard from './pages/ClientDashboard';

// Admin pages
import Admin from './pages/Admin';
import AdminReservations from './pages/AdminReservations';
import AdminRooms from './pages/AdminRooms';
import AdminCustomers from './pages/AdminCustomers';
import AdminPayments from './pages/AdminPayments';
import AdminInvoices from './pages/AdminInvoices';
import AdminExpenses from './pages/AdminExpenses';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
import AdminWebsite from './pages/AdminWebsite';

// Layouts
import PublicLayout from './components/public/PublicLayout';
import AdminLayout from './components/admin/AdminLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/Home" element={<Home />} />
      </Route>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      
      {/* Booking (own navbar) */}
      <Route path="/Booking" element={<Booking />} />
      
      {/* Client area (own navbar) */}
      <Route path="/ClientDashboard" element={<ClientDashboard />} />

      {/* Admin routes */}
      <Route element={<AdminLayout />}>
        <Route path="/Admin" element={<Admin />} />
        <Route path="/AdminReservations" element={<AdminReservations />} />
        <Route path="/AdminRooms" element={<AdminRooms />} />
        <Route path="/AdminCustomers" element={<AdminCustomers />} />
        <Route path="/AdminPayments" element={<AdminPayments />} />
        <Route path="/AdminInvoices" element={<AdminInvoices />} />
        <Route path="/AdminExpenses" element={<AdminExpenses />} />
        <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
        <Route path="/AdminSettings" element={<AdminSettings />} />
        <Route path="/AdminWebsite" element={<AdminWebsite />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App