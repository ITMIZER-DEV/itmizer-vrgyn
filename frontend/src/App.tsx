import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import MenuPermissions from "./pages/Admin/MenuPermissions";
import ClientsList from "./pages/Clients/List";
import ClientForm from "./pages/Clients/Form";
import UsersList from "./pages/Users/List";
import UserForm from "./pages/Users/Form";
import Infrastructure from "./pages/Infrastructure";
import MigrationList from "./pages/Migration/List";
import MigrationForm from "./pages/Migration/Form";
import Billing from "./pages/Migration/Billing";
import Reports from "./pages/Migration/Reports";
import Profile from "./pages/Profile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

import DeploymentList from "./pages/Deployments/List";
import DeploymentForm from "./pages/Deployments/Form";
import RecemVrList from "./pages/RecemVr/index";
import RecemVrForm from "./pages/RecemVr/RecemVrForm";
import RecemVrDetail from "./pages/RecemVr/RecemVrDetail";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class">
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users" element={<UsersList title="Gestão de Usuários" />} />
                <Route path="/admin/user" element={<UsersList title="Gestão de Usuários" />} />
                <Route path="/admin/menus" element={<Admin defaultTab="menus" />} />
                <Route path="/admin/menus/:id" element={<MenuPermissions />} />
                <Route path="/clients" element={<ClientsList />} />
                <Route path="/clients/new" element={<ClientForm />} />
                <Route path="/clients/:id" element={<ClientForm />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/users/new" element={<UserForm />} />
                <Route path="/users/:id" element={<UserForm />} />
                <Route path="/users/migradores" element={<UsersList roleFilter="migrador" title="Migradores" />} />
                <Route path="/users/implantadores" element={<UsersList roleFilter="implantador" title="Implantadores" />} />
                <Route path="/infrastructure" element={<Infrastructure />} />
                <Route path="/assessments" element={<Index />} />
                <Route path="/migration" element={<MigrationList />} />
                <Route path="/migration/billing" element={<Billing />} />
                <Route path="/migration/reports" element={<Reports />} />
                <Route path="/migration/new" element={<MigrationForm />} />
                <Route path="/migration/:id" element={<MigrationForm />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/privacity" element={<Privacy />} />
                <Route path="/termservicy" element={<Terms />} />
                <Route path="/deployments" element={<DeploymentList />} />
                <Route path="/deployments/new" element={<DeploymentForm />} />
                <Route path="/deployments/:id" element={<DeploymentForm />} />
                <Route path="/recem-vr" element={<RecemVrList />} />
                <Route path="/recem-vr/new" element={<RecemVrForm />} />
                <Route path="/recem-vr/:id" element={<RecemVrDetail />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </ThemeProvider>
);

export default App;
