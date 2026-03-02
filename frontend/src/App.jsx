import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PackagesPage from "./pages/PackagesPage";
import NewSubscriptionPage from "./pages/NewSubscriptionPage";
import SearchSubscriptionsPage from "./pages/SearchSubscriptionsPage";
import RenewSubscriptionPage from "./pages/RenewSubscriptionPage";
import AcademyOnlySubscription from "./pages/AcademyOnlySubscription";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route
              path="/subscriptions/new"
              element={<NewSubscriptionPage />}
            />
            <Route
              path="/subscriptions/academy-only"
              element={<AcademyOnlySubscription />}
            />
            <Route
              path="/subscriptions/search"
              element={<SearchSubscriptionsPage />}
            />
            <Route
              path="/subscriptions/:subscriptionId/renew"
              element={<RenewSubscriptionPage />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
