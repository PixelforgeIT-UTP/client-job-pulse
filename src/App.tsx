
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout and Pages
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Jobs from "@/pages/Jobs";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="quotes" element={<Dashboard />} />
            <Route path="invoices" element={<Dashboard />} />
            <Route path="payments" element={<Dashboard />} />
            <Route path="schedule" element={<Dashboard />} />
            <Route path="time-tracking" element={<Dashboard />} />
          </Route>
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
