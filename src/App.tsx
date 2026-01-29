import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HealthProvider } from "@/contexts/HealthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import Vitals from "./pages/Vitals";
import Reminders from "./pages/Reminders";
import HealthWorkerConnect from "./pages/HealthWorkerConnect";
import HealthFeed from "./pages/HealthFeed";
import Auth from "./pages/Auth";
import AshaWorkerDashboard from "./pages/AshaWorkerDashboard";
import NotFound from "./pages/NotFound";
import "./i18n";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
        <div className="text-center">
          <div className="animate-pulse text-lg text-muted-foreground">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth page
  if (!user || !profile) {
    return <Auth />;
  }

  // Role-based routing
  if (profile.role === 'asha_worker') {
    return <AshaWorkerDashboard />;
  }

  // Patient routes
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/vitals" element={<Vitals />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/connect" element={<HealthWorkerConnect />} />
        <Route path="/feed" element={<HealthFeed />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <HealthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </HealthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
