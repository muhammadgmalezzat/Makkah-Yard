import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClubDashboard from "./pages/ClubDashboard";
import PackagesPage from "./pages/PackagesPage";
import NewSubscriptionPage from "./pages/NewSubscriptionPage";
import SearchSubscriptionsPage from "./pages/SearchSubscriptionsPage";
import RenewSubscriptionPage from "./pages/RenewSubscriptionPage";
import AccountProfile from "./pages/AccountProfile";
import AddSubMember from "./pages/AddSubMember";
import MessagingPage from "./pages/MessagingPage";
import SportsManagement from "./pages/academy/SportsManagement";
import GroupsManagement from "./pages/academy/GroupsManagement";
import NewAcademySubscription from "./pages/academy/NewAcademySubscription";
import ChildProfile from "./pages/academy/ChildProfile";
import ExpiringSubscriptions from "./pages/academy/ExpiringSubscriptions";
import CoachList from "./pages/academy/CoachList";
import AcademyDashboard from "./pages/academy/AcademyDashboard";

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
            <Route path="/club-dashboard" element={<ClubDashboard />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route
              path="/subscriptions/new"
              element={<NewSubscriptionPage />}
            />
            <Route
              path="/subscriptions/add-sub-member"
              element={<AddSubMember />}
            />
            <Route
              path="/subscriptions/search"
              element={<SearchSubscriptionsPage />}
            />
            <Route path="/accounts/:accountId" element={<AccountProfile />} />
            <Route
              path="/subscriptions/:subscriptionId/renew"
              element={<RenewSubscriptionPage />}
            />
            <Route path="/academy/dashboard" element={<AcademyDashboard />} />
            <Route path="/academy/sports" element={<SportsManagement />} />
            <Route path="/academy/groups" element={<GroupsManagement />} />
            <Route path="/academy/new" element={<NewAcademySubscription />} />
            <Route
              path="/academy/members/:memberId"
              element={<ChildProfile />}
            />
            <Route
              path="/academy/members/:memberId/subscription/:subscriptionId"
              element={<ChildProfile />}
            />
            <Route
              path="/academy/expiring"
              element={<ExpiringSubscriptions />}
            />
            <Route path="/academy/coach-list" element={<CoachList />} />
            <Route path="/messaging" element={<MessagingPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
