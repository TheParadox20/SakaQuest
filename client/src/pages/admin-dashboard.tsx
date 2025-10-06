import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/authUtils";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!getAuthToken(),
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-saka-orange to-saka-red rounded-lg flex items-center justify-center">
                <i className="fas fa-crown text-white"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-saka-dark">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your hunts and content</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <i className="fas fa-home"></i>
                Back to App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-8 card-shadow mb-8">
          <h2 className="text-3xl font-bold text-saka-dark mb-2">
            Welcome back, Admin! 👋
          </h2>
          <p className="text-gray-600">
            Use this dashboard to create and manage your treasure hunts.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Manage Hunts */}
          <Link href="/admin/hunts">
            <div className="bg-white rounded-2xl p-6 card-shadow hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-saka-orange to-saka-red rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-map-marked-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-saka-dark mb-2">Manage Hunts</h3>
              <p className="text-gray-600 text-sm">
                View, edit, and delete existing treasure hunts
              </p>
              <div className="mt-4 flex items-center text-saka-orange font-medium group-hover:gap-2 transition-all">
                <span>Open</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>

          {/* Create New Hunt */}
          <Link href="/admin/hunts/new">
            <div className="bg-white rounded-2xl p-6 card-shadow hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-saka-green to-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-plus-circle text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-saka-dark mb-2">Create New Hunt</h3>
              <p className="text-gray-600 text-sm">
                Design a new treasure hunt from scratch
              </p>
              <div className="mt-4 flex items-center text-saka-green font-medium group-hover:gap-2 transition-all">
                <span>Create</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>

          {/* Statistics */}
          <Link href="/admin/statistics">
            <div className="bg-white rounded-2xl p-6 card-shadow hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-saka-gold to-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <i className="fas fa-chart-line text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-saka-dark mb-2">Statistics</h3>
              <p className="text-gray-600 text-sm">
                View analytics and user engagement
              </p>
              <div className="mt-4 flex items-center text-saka-gold font-medium group-hover:gap-2 transition-all">
                <span>View Stats</span>
                <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
