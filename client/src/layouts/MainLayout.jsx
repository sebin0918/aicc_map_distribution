// client/src/layouts/MainLayout.jsx
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NavigationBar from '../components/NavigationBar';
import ChatBot from '../components/ChatBot';

const MainLayout = ({ children, isAuthenticated, logout }) => {
  return (
    <div>
      {/* Header에 isAuthenticated와 logout 전달 */}
      <Header isAuthenticated={isAuthenticated} logout={logout} />
      <NavigationBar />
      {children}
      <ChatBot />
      <Footer />
    </div>
  );
};

export default MainLayout;
