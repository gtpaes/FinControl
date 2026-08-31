import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      <div className="lg:pl-64">
        <Header onMenu={() => setDrawer(true)} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}