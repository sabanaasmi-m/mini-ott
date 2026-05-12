import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

// Auth
import Login from './pages/Login';

// Admin pages
import Dashboard from './pages/Dashboard';
import Films from './pages/Films';
import AddFilm from './pages/AddFilm';
import EditFilm from './pages/EditFilm';
import FilmApproval from './pages/FilmApproval';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Comments from './pages/Comments';
import Settings from './pages/Settings';
// BUG FIX 3: Import the fixed subscriptions page (renamed to avoid conflict)
import SubscriptionsAdmin from './pages/SubscriptionsAdmin';

// Creator pages
import CreatorDashboard from './pages/creator/Dashboard';
import CreatorMyFilms from './pages/creator/MyFilms';
import CreatorUploadFilm from './pages/creator/UploadFilm';
import CreatorEditFilm from './pages/creator/EditFilm';
import CreatorAnalytics from './pages/creator/Analytics';
import CreatorComments from './pages/creator/Comments';
import CreatorEarnings from './pages/creator/Earnings';
import CreatorSettings from './pages/creator/Settings';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireAdmin = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return isAdmin ? children : <Navigate to="/creator/dashboard" replace />;
};

const RequireCreator = ({ children }) => {
  const { isCreator, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return isCreator ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/dashboard' : '/creator/dashboard'} replace />
            : <Login />
        }
      />

      <Route element={<RequireAuth><MainLayout /></RequireAuth>}>

        {/* Admin routes */}
        <Route path="/dashboard"        element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/films"            element={<RequireAdmin><Films /></RequireAdmin>} />
        <Route path="/films/add"        element={<RequireAdmin><AddFilm /></RequireAdmin>} />
        <Route path="/films/edit/:id"   element={<RequireAdmin><EditFilm /></RequireAdmin>} />
        <Route path="/films/approval"   element={<RequireAdmin><FilmApproval /></RequireAdmin>} />
        <Route path="/categories"       element={<RequireAdmin><Categories /></RequireAdmin>} />
        <Route path="/users"            element={<RequireAdmin><Users /></RequireAdmin>} />
        <Route path="/analytics"        element={<RequireAdmin><Analytics /></RequireAdmin>} />
        <Route path="/comments"         element={<RequireAdmin><Comments /></RequireAdmin>} />
        {/* BUG FIX 3: Use the new SubscriptionsAdmin component */}
        <Route path="/subscriptions"    element={<RequireAdmin><SubscriptionsAdmin /></RequireAdmin>} />
        <Route path="/settings"         element={<RequireAdmin><Settings /></RequireAdmin>} />

        {/* Creator routes */}
        <Route path="/creator/dashboard"      element={<RequireCreator><CreatorDashboard /></RequireCreator>} />
        <Route path="/creator/films"          element={<RequireCreator><CreatorMyFilms /></RequireCreator>} />
        <Route path="/creator/films/upload"   element={<RequireCreator><CreatorUploadFilm /></RequireCreator>} />
        <Route path="/creator/films/edit/:id" element={<RequireCreator><CreatorEditFilm /></RequireCreator>} />
        <Route path="/creator/analytics"      element={<RequireCreator><CreatorAnalytics /></RequireCreator>} />
        <Route path="/creator/comments"       element={<RequireCreator><CreatorComments /></RequireCreator>} />
        <Route path="/creator/earnings"       element={<RequireCreator><CreatorEarnings /></RequireCreator>} />
        <Route path="/creator/settings"       element={<RequireCreator><CreatorSettings /></RequireCreator>} />

      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;