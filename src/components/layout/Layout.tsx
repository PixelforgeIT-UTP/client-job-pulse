import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
export default function Layout() {
  return <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <Header />
        
        <main className="py-6 px-4 sm:px-6 lg:px-8 bg-[#858d80]/0">
          <Outlet />
        </main>
      </div>
    </div>;
}