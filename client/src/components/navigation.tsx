import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NavigationProps {
  onLogout?: () => void;
}

export function Navigation({ onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  };

  const menuItems = [
    { label: "Home", path: "/", icon: "fas fa-home" },
    { label: "Hunt Library", path: "/hunt-library", icon: "fas fa-map" },
    { label: "Hunt Collections", path: "/hunt-collections", icon: "fas fa-th-large" },
    { label: "Build Own Hunt", path: "/build-hunt", icon: "fas fa-hammer" },
    { label: "My Account", path: "/my-account", icon: "fas fa-user" },
    { label: "Settings", path: "/settings", icon: "fas fa-cog" },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Top Navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" onClick={closeMobileMenu}>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-saka-orange to-saka-red rounded-xl flex items-center justify-center shadow-lg">
                  <div className="relative">
                    <i className="fas fa-user-secret text-white text-lg"></i>
                    <i className="fas fa-search absolute -bottom-0.5 -right-0.5 text-white text-sm opacity-90"></i>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-saka-dark">Saka</h1>
              </div>
            </Link>
            
            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              {menuItems.slice(0, -1).map((item) => (
                <Link key={item.path} to={item.path}>
                  <button className={`font-medium transition-colors ${
                    location === item.path 
                      ? "text-saka-orange" 
                      : "text-saka-dark hover:text-saka-orange"
                  }`}>
                    {item.label}
                  </button>
                </Link>
              ))}
              {user?.isAdmin && (
                <Link to="/admin">
                  <button className={`font-medium transition-colors flex items-center gap-2 ${
                    location.startsWith('/admin')
                      ? "text-saka-orange" 
                      : "text-saka-dark hover:text-saka-orange"
                  }`} data-testid="link-admin">
                    <i className="fas fa-crown text-yellow-500"></i>
                    Admin
                  </button>
                </Link>
              )}
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-saka-red hover:text-red-600 font-medium"
              >
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button & User Avatar */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="md:hidden">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/api/placeholder/32/32" alt={user.name} />
                    <AvatarFallback className="bg-saka-orange text-white text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <button 
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
                  {isMobileMenuOpen ? (
                    <>
                      <div className="w-5 h-0.5 bg-saka-orange transform rotate-45 translate-y-1.5"></div>
                      <div className="w-5 h-0.5 bg-saka-orange transform -rotate-45 -translate-y-0.5"></div>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-0.5 bg-saka-orange"></div>
                      <div className="w-5 h-0.5 bg-saka-orange"></div>
                      <div className="w-5 h-0.5 bg-saka-orange"></div>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="bg-white border-t border-gray-100 shadow-lg">
            <div className="max-w-6xl mx-auto px-4 py-2">
              {user && (
                <div className="py-3 px-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src="/api/placeholder/40/40" alt={user.name} />
                      <AvatarFallback className="bg-saka-orange text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-saka-dark">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              <nav className="py-2">
                {menuItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={closeMobileMenu}>
                    <button className={`w-full flex items-center space-x-3 px-2 py-3 rounded-lg transition-colors ${
                      location === item.path
                        ? "bg-saka-orange/10 text-saka-orange"
                        : "text-saka-dark hover:bg-gray-50"
                    }`}>
                      <i className={`${item.icon} w-5 text-center`}></i>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-3 px-2 py-3 rounded-lg text-saka-red hover:bg-red-50 transition-colors"
                >
                  <i className="fas fa-sign-out-alt w-5 text-center"></i>
                  <span className="font-medium">Logout</span>
                </button>

                {/* Admin Link in Mobile Menu */}
                {user?.isAdmin && (
                  <Link to="/admin" onClick={closeMobileMenu}>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 rounded-lg transition-colors">
                      <i className="fas fa-crown w-5 text-center text-yellow-500"></i>
                      <span className="font-medium">Admin Dashboard</span>
                    </button>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}