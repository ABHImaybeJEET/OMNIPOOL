import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import UserDashboard from "./pages/UserDashboard";
import RegistryPage from "./pages/RegistryPage";
import SkillsProfilePage from "./pages/SkillsProfilePage";
import EnterprisePage from "./pages/EnterprisePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/registry" element={<RegistryPage />} />
        <Route path="/skills" element={<SkillsProfilePage />} />
        <Route path="/enterprise" element={<EnterprisePage />} />
      </Route>
    </Routes>
  );
}

export default App;
