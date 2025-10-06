import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";

interface Statistics {
  totalHunts: number;
  totalUsers: number;
  activeUsers: number;
  completedHunts: number;
  totalRevenue: string;
  completionRate: string;
  recentPurchases: number;
  recentCompletions: number;
  hunts: Array<{
    id: string;
    title: string;
    price: string;
    category: string;
    difficulty: string;
  }>;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminStatistics() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!getAuthToken(),
  });

  const { data: stats, isLoading } = useQuery<Statistics>({
    queryKey: ["/api/admin/statistics"],
    enabled: !!getAuthToken() && !!user?.isAdmin,
  });

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-saka-dark">Statistics & Analytics</h1>
              <p className="text-sm text-gray-500">Platform performance and user engagement</p>
            </div>
            <Link href="/admin">
              <Button variant="outline" className="gap-2" data-testid="button-exit-to-dashboard">
                <i className="fas fa-times"></i>
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-saka-orange to-saka-red rounded-xl flex items-center justify-center">
                    <i className="fas fa-map-marked-alt text-white text-xl"></i>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-saka-dark mb-1">{stats.totalHunts}</h3>
                <p className="text-gray-600 text-sm">Total Hunts</p>
              </div>

              <div className="bg-white rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-saka-green to-emerald-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-users text-white text-xl"></i>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-saka-dark mb-1">{stats.totalUsers}</h3>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-xs text-saka-green mt-1">{stats.activeUsers} active</p>
              </div>

              <div className="bg-white rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-saka-gold to-yellow-600 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-xl"></i>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-saka-dark mb-1">{stats.completedHunts}</h3>
                <p className="text-gray-600 text-sm">Hunts Completed</p>
                <p className="text-xs text-saka-gold mt-1">{stats.completionRate}% completion rate</p>
              </div>

              <div className="bg-white rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                    <i className="fas fa-dollar-sign text-white text-xl"></i>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-saka-dark mb-1">{stats.totalRevenue} KES</h3>
                <p className="text-gray-600 text-sm">Total Revenue</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 card-shadow">
                <h3 className="text-lg font-bold text-saka-dark mb-4">Recent Activity (Last 7 Days)</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-saka-orange/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-shopping-cart text-saka-orange"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-saka-dark">New Purchases</p>
                        <p className="text-sm text-gray-500">Hunt purchases this week</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-saka-orange">{stats.recentPurchases}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-saka-green/10 rounded-lg flex items-center justify-center">
                        <i className="fas fa-flag-checkered text-saka-green"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-saka-dark">Completions</p>
                        <p className="text-sm text-gray-500">Hunts finished this week</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-saka-green">{stats.recentCompletions}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 card-shadow">
                <h3 className="text-lg font-bold text-saka-dark mb-4">Hunt Categories</h3>
                <div className="space-y-3">
                  {Array.from(new Set(stats.hunts.map(h => h.category))).map(category => {
                    const count = stats.hunts.filter(h => h.category === category).length;
                    const percentage = (count / stats.hunts.length * 100).toFixed(0);
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-semibold text-saka-dark">{count} hunts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-saka-orange to-saka-red h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hunts Table */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-bold text-saka-dark mb-4">All Hunts</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Hunt Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Difficulty</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.hunts.map(hunt => (
                      <tr key={hunt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-saka-dark font-medium">{hunt.title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{hunt.category}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${hunt.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                              hunt.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'}`}>
                            {hunt.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-semibold text-saka-gold">
                          {hunt.price} KES
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 card-shadow text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-chart-line text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-saka-dark mb-2">No Data Available</h3>
            <p className="text-gray-600">Statistics will appear here once data is available</p>
          </div>
        )}
      </div>
    </div>
  );
}
