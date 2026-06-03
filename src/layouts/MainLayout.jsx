import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-[#fafaf9] dark:bg-stone-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        <main className="flex-1 p-4 lg:p-8 animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
