import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TooltipVisibilityProvider } from "@/hooks/useTooltipVisibility";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Panden from "./pages/Panden";
import PandDetail from "./pages/PandDetail";
import Huurders from "./pages/Huurders";
import Financien from "./pages/Financien";
import Instellingen from "./pages/Instellingen";
import Doelen from "./pages/Doelen";
import Sneeuwbal from "./pages/Sneeuwbal";
import NettoVermogen from "./pages/NettoVermogen";
import RenteOpRente from "./pages/RenteOpRente";
import Pensioen from "./pages/Pensioen";
import Contracten from "./pages/Contracten";
import Legacy from "./pages/Legacy";
import Inchecklijsten from "./pages/Inchecklijsten";
import Rendementsanalysator from "./pages/Rendementsanalysator";
import MultiUnitAnalysator from "./pages/MultiUnitAnalysator";
import AIAdvertentieAnalyzer from "./pages/AIAdvertentieAnalyzer";
import Aannemers from "./pages/Aannemers";
import VvEOverzicht from "./pages/VvEOverzicht";
import Academy from "./pages/Academy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipVisibilityProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/panden" element={<ProtectedRoute><Panden /></ProtectedRoute>} />
              <Route path="/panden/:id" element={<ProtectedRoute><PandDetail /></ProtectedRoute>} />
              <Route path="/huurders" element={<ProtectedRoute><Huurders /></ProtectedRoute>} />
              <Route path="/financien" element={<ProtectedRoute><Financien /></ProtectedRoute>} />
              <Route path="/doelen" element={<ProtectedRoute><Doelen /></ProtectedRoute>} />
              <Route path="/sneeuwbal" element={<ProtectedRoute><Sneeuwbal /></ProtectedRoute>} />
              <Route path="/vermogen" element={<ProtectedRoute><NettoVermogen /></ProtectedRoute>} />
              <Route path="/rente-op-rente" element={<ProtectedRoute><RenteOpRente /></ProtectedRoute>} />
              <Route path="/pensioen" element={<ProtectedRoute><Pensioen /></ProtectedRoute>} />
              <Route path="/contracten" element={<ProtectedRoute><Contracten /></ProtectedRoute>} />
              <Route path="/legacy" element={<ProtectedRoute><Legacy /></ProtectedRoute>} />
              <Route path="/inchecklijsten" element={<ProtectedRoute><Inchecklijsten /></ProtectedRoute>} />
              <Route path="/analysator" element={<ProtectedRoute><Rendementsanalysator /></ProtectedRoute>} />
              <Route path="/multi-unit" element={<ProtectedRoute><MultiUnitAnalysator /></ProtectedRoute>} />
              <Route path="/ai-analyzer" element={<ProtectedRoute><AIAdvertentieAnalyzer /></ProtectedRoute>} />
              <Route path="/aannemers" element={<ProtectedRoute><Aannemers /></ProtectedRoute>} />
              <Route path="/vve" element={<ProtectedRoute><VvEOverzicht /></ProtectedRoute>} />
              <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
              <Route path="/instellingen" element={<ProtectedRoute><Instellingen /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TooltipVisibilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
