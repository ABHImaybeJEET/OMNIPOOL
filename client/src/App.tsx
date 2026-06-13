import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import UserDashboard from "./pages/UserDashboard";
import RegistryPage from "./pages/RegistryPage";
import AICopilotPage from "./pages/AICopilotPage";
import EnterprisePage from "./pages/EnterprisePage";
import ChatPage from "./pages/ChatPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogFormPage from "./pages/BlogFormPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/layout/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route element={<Layout />}>
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/registry" element={<RegistryPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/copilot" element={<AICopilotPage />} />
          <Route path="/enterprise" element={<EnterprisePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blog/create" element={<BlogFormPage />} />
          <Route path="/blog/edit/:id" element={<BlogFormPage />} />
        </Route>
      </Route>
    </Routes>
    </>
  );
}

export default App;
