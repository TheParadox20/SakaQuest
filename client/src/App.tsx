import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import HuntLibrary from "@/pages/hunt-library";
import ClueScreen from "@/pages/clue-screen";
import ProfilePage from "@/pages/profile";
import Homepage from "@/pages/homepage";
import MyAccountPage from "@/pages/my-account";
import SettingsPage from "@/pages/settings";
import HuntCollections from "@/pages/hunt-collections";
import BuildHuntPage from "@/pages/build-hunt";
import MyHuntsPage from "@/pages/my-hunts";
import InviteHuntPage from "@/pages/invite-hunt";
import JoinHuntPage from "@/pages/join-hunt";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import HuntCompletion from "@/pages/hunt-completion";
import DeleteAccountPage from "@/pages/delete-account";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminHunts from "@/pages/admin-hunts";
import AdminHuntForm from "@/pages/admin-hunt-form";
import AdminStatistics from "@/pages/admin-statistics";



function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/login" component={LoginPage} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/" component={LoginPage} />
          <Route path="/privacy-policy" component={PrivacyPolicyPage} />

        </>
      ) : (
        <>
          <Route path="/login">
            {() => {
              // Redirect authenticated users away from login page
              window.location.replace("/");
              return null;
            }}
          </Route>
          <Route path="/" component={Homepage} />
          <Route path="/hunt-library" component={HuntLibrary} />
          <Route path="/hunt-collections/:category?" component={HuntCollections} />
          <Route path="/hunt/:huntId" component={ClueScreen} />
          <Route path="/hunt/:huntId/complete" component={HuntCompletion} />
          <Route path="/my-account" component={MyAccountPage} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/build-hunt" component={BuildHuntPage} />
          <Route path="/my-hunts" component={MyHuntsPage} />
          <Route path="/invite-hunt" component={InviteHuntPage} />
          <Route path="/join-hunt/:inviteCode?" component={JoinHuntPage} />
          <Route path="/delete-account" component={DeleteAccountPage} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/hunts" component={AdminHunts} />
          <Route path="/admin/hunts/new" component={AdminHuntForm} />
          <Route path="/admin/hunts/:huntId/edit" component={AdminHuntForm} />
          <Route path="/admin/statistics" component={AdminStatistics} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
