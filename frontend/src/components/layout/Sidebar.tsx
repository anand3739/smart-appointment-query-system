import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarPlus,
  Clock,
  Users,
  ListOrdered,
  Building2,
  Layers,
  Cpu,
  BarChart3,
  CalendarCheck,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const customerLinks = [
    { to: '/customer', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/customer/book', label: 'Book Appointment', icon: CalendarPlus },
    { to: '/customer/queue', label: 'Live Queue Tracker', icon: Users },
    { to: '/customer/history', label: 'Appointment History', icon: Clock },
    { to: '/customer/waitlist', label: 'Waiting List', icon: ListOrdered },
  ];

  const staffLinks = [
    { to: '/staff', label: 'Staff Overview', icon: LayoutDashboard },
    { to: '/staff/queue', label: 'Queue Operations', icon: Users },
    { to: '/staff/appointments', label: "Today's Schedule", icon: CalendarCheck },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/admin/analytics', label: 'Operational Analytics', icon: BarChart3 },
    { to: '/admin/branches', label: 'Branch Management', icon: Building2 },
    { to: '/admin/services', label: 'Service Catalog', icon: Layers },
    { to: '/admin/resources', label: 'Resource Counters', icon: Cpu },
  ];

  let links = customerLinks;
  if (user.role === 'STAFF') links = staffLinks;
  if (user.role === 'ADMIN') links = adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/customer' || item.to === '/staff' || item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
