import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UserPlus, CalendarClock } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/branch/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Employees', path: '/branch/employees', icon: <Users size={20} /> },
    { label: 'Add Employee', path: '/branch/employees/add', icon: <UserPlus size={20} /> },
    { label: 'Assign Shift', path: '/branch/assign-shift', icon: <CalendarClock size={20} /> },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-72 bg-white/60 backdrop-blur-3xl border-r border-white/50 transition-all duration-500 lg:static lg:translate-x-0
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/5 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <div className="h-24 flex items-center px-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                <img src="/EECLOGORED.png" alt="EEC Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tighter">
                EEC <span className="text-indigo-600">Branch</span>
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all group ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50'
                      : 'text-slate-500 hover:bg-white hover:text-indigo-600'
                  }`
                }
              >
                <span className="mr-4 text-slate-400 group-hover:text-indigo-600 transition-colors">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
