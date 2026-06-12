import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, FilePlus, Clock, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/briefs/new', label: 'New Brief',  icon: FilePlus },
  { to: '/history',    label: 'History',    icon: Clock },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background:   'rgba(10, 10, 15, 0.85)',
        borderColor:  'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-lg font-bold gradient-text hidden sm:block"
              style={{ letterSpacing: '-0.02em' }}
            >
              BriefForge
            </span>
          </button>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-white bg-white/10 border border-white/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/06'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {/* User dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all duration-200 hover:bg-white/08"
                style={{
                  background:  'rgba(255,255,255,0.05)',
                  borderColor: 'rgba(255,255,255,0.10)',
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  {initials}
                </div>
                <span className="text-sm text-gray-300 max-w-[120px] truncate">
                  {user?.name ?? 'User'}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-3.5 h-3.5 text-gray-500 transition-transform duration-200',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl border overflow-hidden animate-fade-in"
                  style={{
                    background:   'rgba(15,15,26,0.98)',
                    borderColor:  'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(20px)',
                    boxShadow:    '0 16px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400
                                 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/08 transition-all"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div
          className="md:hidden border-t animate-fade-in"
          style={{
            background:  'rgba(10,10,15,0.98)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/06'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}

            <div className="pt-2 border-t mt-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 px-4 py-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-400">{user?.email}</span>
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400
                           hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
}
