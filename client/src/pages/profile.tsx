import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { removeAuthToken } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";

interface CompletedHunt {
  id: string;
  userId: string;
  huntId: string;
  completed: boolean;
  totalPoints: number;
  completedAt: string;
  hunt: {
    id: string;
    title: string;
    coverImageUrl: string;
    difficulty: string;
  };
}

interface Purchase {
  id: string;
  huntId: string;
  amountPaid: string;
  paymentStatus: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: completedHunts = [] } = useQuery<CompletedHunt[]>({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
    enabled: !!user,
  });

  const handleLogout = () => {
    removeAuthToken();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
  };

  const totalPoints = completedHunts.reduce((sum, hunt) => sum + hunt.totalPoints, 0);
  const totalBadges = Math.floor(completedHunts.length / 2) + 1; // Simple badge calculation

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-saka-orange to-saka-red">
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/">
              <button className="p-2 hover:bg-white/20 rounded-full">
                <i className="fas fa-arrow-left text-white"></i>
              </button>
            </Link>
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button className="p-2 hover:bg-white/20 rounded-full">
              <i className="fas fa-edit text-white"></i>
            </button>
          </div>
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full">
              <i className="fas fa-user text-white text-3xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{user.name}</h3>
              <p className="text-white/80">{user.email}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{completedHunts.length}</p>
                <p className="text-sm text-white/80">Hunts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalPoints}</p>
                <p className="text-sm text-white/80">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalBadges}</p>
                <p className="text-sm text-white/80">Badges</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Completed Hunts */}
        {completedHunts.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-saka-dark">Completed Hunts</h4>
            
            <div className="space-y-3">
              {completedHunts.map((completion) => (
                <div key={completion.id} className="bg-white rounded-xl p-4 card-shadow flex items-center space-x-4">
                  <img 
                    src={completion.hunt.coverImageUrl} 
                    alt={completion.hunt.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-saka-dark">{completion.hunt.title}</h5>
                    <p className="text-sm text-gray-600">Completed • {completion.totalPoints} points</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <i className="fas fa-medal text-saka-gold text-sm"></i>
                      <span className="text-xs text-gray-500">Heritage Explorer</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <i className="fas fa-check-circle text-saka-green text-xl"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchased Hunts */}
        {purchases.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-saka-dark">Purchased Hunts</h4>
            
            <div className="space-y-3">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white rounded-xl p-4 card-shadow flex items-center space-x-4">
                  <div className="w-16 h-16 bg-saka-gold/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-crown text-saka-gold text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-saka-dark">Premium Hunt</h5>
                    <p className="text-sm text-gray-600">Ready to start • ${purchase.amountPaid}</p>
                    <Badge 
                      variant={purchase.paymentStatus === 'completed' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {purchase.paymentStatus}
                    </Badge>
                  </div>
                  <Button 
                    size="sm"
                    className="bg-saka-gold text-white hover:bg-yellow-600"
                  >
                    Start
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-saka-dark">Earned Badges</h4>
          
          <div className="grid grid-cols-3 gap-3">
            {completedHunts.length > 0 && (
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-saka-gold to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-medal text-white"></i>
                </div>
                <p className="text-xs font-medium text-saka-dark">Heritage Explorer</p>
              </div>
            )}
            
            {completedHunts.length >= 2 && (
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-saka-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-compass text-white"></i>
                </div>
                <p className="text-xs font-medium text-saka-dark">Navigator</p>
              </div>
            )}
            
            {totalPoints >= 500 && (
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-saka-orange to-saka-red rounded-full flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-fire text-white"></i>
                </div>
                <p className="text-xs font-medium text-saka-dark">Speed Hunter</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-saka-dark">Settings</h4>
          
          <div className="bg-white rounded-xl divide-y divide-gray-100 card-shadow">
            <button className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-bell text-gray-400"></i>
                <span className="font-medium text-saka-dark">Notifications</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
            
            <button className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-lock text-gray-400"></i>
                <span className="font-medium text-saka-dark">Privacy</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
            
            <button className="w-full px-4 py-4 text-left hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <i className="fas fa-question-circle text-gray-400"></i>
                <span className="font-medium text-saka-dark">Help & Support</span>
              </div>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="w-full py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
