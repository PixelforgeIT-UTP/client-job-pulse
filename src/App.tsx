
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";



// Auth Context
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Layout and Pages
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Jobs from "@/pages/Jobs";
import Quotes from "@/pages/Quotes";
import Invoices from "@/pages/Invoices";
import Payments from "@/pages/Payments";
import Schedule from "@/pages/Schedule";
import TimeTracking from "@/pages/TimeTracking";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import QuoteDetail from '@/pages/QuoteDetail';
import NewQuote from '@/pages/NewQuote';



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes with Layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="quotes" element={<Quotes />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="time-tracking" element={<TimeTracking />} />
              <Route path="/quotes/new" element={<NewQuote />} />
              <Route path="/quotes/:id" element={<QuoteDetail />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
