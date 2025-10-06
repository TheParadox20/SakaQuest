import { Link, useLocation } from "wouter";

export function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { 
      label: "Home", 
      path: "/", 
      icon: "fas fa-home",
      activeIcon: "fas fa-home"
    },
    { 
      label: "Hunts", 
      path: "/hunt-library", 
      icon: "fas fa-map",
      activeIcon: "fas fa-map"
    },
    { 
      label: "Build", 
      path: "/build-hunt", 
      icon: "fas fa-hammer",
      activeIcon: "fas fa-hammer"
    },
    { 
      label: "Account", 
      path: "/my-account", 
      icon: "fas fa-user",
      activeIcon: "fas fa-user"
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <button className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive(item.path)
                  ? "text-saka-orange"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
                <i className={`${isActive(item.path) ? item.activeIcon : item.icon} text-lg`}></i>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}