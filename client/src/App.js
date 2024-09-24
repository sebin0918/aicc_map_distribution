import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import Login from './pages/Login';
import Admin from './pages/Admin';
import MyAssetPlaner from './pages/MyAssetPlaner';
import HouseHold from './pages/HouseHold';
import NewsCheck from './pages/NewsCheck';
import StockChart from './pages/StockChart';
import FAQ from './pages/FAQ';
import SignUp from './pages/SignUp';
import StockPrediction from './pages/StockPrediction';
import NewsTalk from './pages/NewsTalk';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import CheckPasswordMyPage from './pages/CheckPasswordMyPage';
import axios from 'axios';

const AppRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    checkSession();
  }, []);  // 빈 배열을 사용하여 첫 번째 렌더링 시 한 번만 실행

  const checkSession = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/check-session`, {
        withCredentials: true,
      });
  
      if (response.status === 200) {
        console.log('Session is valid');
        setIsAuthenticated(true);
        await fetchUserInfo(); 
      } else {
        console.warn('No valid session found');
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Failed to check session:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
        withCredentials: true,
      });

      if (response.status === 200) {
        const data = response.data;
        setUserInfo(data);
        console.log('User info fetched:', data);
      } else {
        console.error('Failed to fetch user info:', response.data);
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `http://43.201.52.123:5000/api/auth/login`,
        { user_email: email, user_password: password },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        console.log('Login successful');
        setIsAuthenticated(true);
        await fetchUserInfo();
        navigate('/');
      } else {
        setErrorMessage('Login failed: Unexpected response');
      }
    } catch (error) {
      const errorMsg = error.response && error.response.data ? error.response.data.message : 'Login failed. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Login failed:', errorMsg);
    }
  };

  const logout = async () => {
    try {
      const response = await axios.post('${process.env.REACT_APP_API_URL}/api/auth/logout', {}, {
        withCredentials: true,
      });

      if (response.status === 200) {
        console.log('Logout successful');
        setIsAuthenticated(false);
        setUserInfo(null);
        navigate('/login');
      } else {
        console.error('Logout failed:', response.data);
      }
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<MainLayout isAuthenticated={isAuthenticated} logout={logout}><HomePage /></MainLayout>} />
      <Route path='/login' element={<Login onLogin={login} errorMessage={errorMessage} />} />
      <Route path='/signup' element={<SignUp />} />
      <Route path="/FAQ" element={<MainLayout isAuthenticated={isAuthenticated} logout={logout}><FAQ /></MainLayout>} />
      <Route path='/admin' element={<Admin />} />
      
      <Route 
        path="/mypage" 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><MyPage /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/myassetplaner' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><MyAssetPlaner /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/household' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><HouseHold /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/newscheck' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><NewsCheck /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/newstalk' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><NewsTalk /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/stockchart' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><StockChart /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/stockprediction' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><StockPrediction /></MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path='/checkpasswordmypage' 
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout isAuthenticated={isAuthenticated} logout={logout}><CheckPasswordMyPage /></MainLayout>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
