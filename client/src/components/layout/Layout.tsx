import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout: React.FC = () => {
  const location = useLocation();
  const noFooterPaths = ['/copilot', '/chat'];
  const shouldHideFooter = noFooterPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary bg-grid-texture">
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col">
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

export default Layout;
