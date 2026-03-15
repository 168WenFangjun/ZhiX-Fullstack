import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import Editor from './pages/Editor';
import ManageArticles from './pages/ManageArticles';
import Login from './pages/Login';
import Register from './pages/Register';
import Membership from './pages/Membership';
import PaymentSuccess from './pages/PaymentSuccess';
import Favorites from './pages/Favorites';
import UserLevel from './pages/UserLevel';
import AvatarSelector from './pages/AvatarSelector';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ArticleProvider } from './context/ArticleContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" />;
}

function App() {
  return (
    <AuthProvider>
      <ArticleProvider>
        <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/level" element={<UserLevel />} />
              <Route path="/avatar" element={<AvatarSelector />} />
              <Route path="/manage" element={<PrivateRoute><ManageArticles /></PrivateRoute>} />
              <Route path="/editor" element={<PrivateRoute><Editor /></PrivateRoute>} />
              <Route path="/editor/:id" element={<PrivateRoute><Editor /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
        </Router>
      </ArticleProvider>
    </AuthProvider>
  );
}

export default App;
