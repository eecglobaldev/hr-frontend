import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Menu, LogOut } from 'lucide-react';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user, branchId, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-3xl border-b border-white/50 px-6">
      <div className="max-w-7xl mx-auto h-24 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <button
            type="button"
            className="lg:hidden p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all"
            onClick={onMenuClick}
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-10 w-px bg-slate-200/50 hidden sm:block" />
          <Link
            to="/branch/dashboard"
            className="flex items-center pl-4 group cursor-pointer no-underline"
          >
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                {user?.name}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
                {branchId || 'Branch Manager'}
              </span>
            </div>
            <div className="h-12 w-12 rounded-[1.2rem] bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-100 ring-4 ring-white group-hover:scale-105 transition-all">
              {user?.name?.split(' ').map((n) => n[0]).join('') || 'BM'}
            </div>
          </Link>
          <button
            onClick={logout}
            className="ml-4 p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all group"
            title="Logout"
          >
            <LogOut size={20} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
