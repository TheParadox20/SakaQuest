import { ReactNode } from "react";
import { Navigation } from "./navigation";
import { BottomNavigation } from "./bottom-navigation";

interface LayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export function Layout({ children, showBottomNav = true, className = "" }: LayoutProps) {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Navigation />
      <main className={showBottomNav ? "pb-16" : ""}>
        {children}
      </main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}