import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";

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
    category: string;
  };
}

interface Purchase {
  id: string;
  huntId: string;
  amountPaid: string;
  paymentStatus: string;
  createdAt: string;
}

interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  coverImageUrl: string;
  price: string;
  unlocked: boolean;
}

export default function MyAccountPage() {
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState("/api/placeholder/100/100");

  const { data: completedHunts = [] } = useQuery<CompletedHunt[]>({
    queryKey: ["/api/progress"],
    enabled: !!user,
  });

  const { data: purchases = [] } = useQuery<Purchase[]>({
    queryKey: ["/api/purchases"],
    enabled: !!user,
  });

  const { data: allHunts = [] } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
    enabled: !!user,
  });

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

  const totalPoints = completedHunts.reduce((sum, hunt) => sum + hunt.totalPoints, 0);
  const purchasedHunts = allHunts.filter(hunt => 
    purchases.some(purchase => purchase.huntId === hunt.id && purchase.paymentStatus === 'completed')
  );
  const pendingHunts = purchasedHunts.filter(hunt => 
    !completedHunts.some(completed => completed.hunt.id === hunt.id)
  );

  const badges = [
    { name: "Heritage Explorer", icon: "fas fa-medal", earned: completedHunts.length > 0 },
    { name: "Navigator", icon: "fas fa-compass", earned: completedHunts.length >= 2 },
    { name: "Speed Hunter", icon: "fas fa-fire", earned: totalPoints >= 500 },
    { name: "Culture Enthusiast", icon: "fas fa-star", earned: completedHunts.length >= 5 },
    { name: "Adventure Master", icon: "fas fa-trophy", earned: completedHunts.length >= 10 },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-r from-saka-orange to-saka-red">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white">My Account</h2>
          </div>
          
          {/* Profile Section */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 border-4 border-white">
                <AvatarImage src={profilePicture} alt={user.name} />
                <AvatarFallback className="bg-white text-saka-orange text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-camera text-saka-orange text-sm"></i>
              </button>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white">{user.name}</h3>
              <p className="text-white/80">{user.email}</p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{completedHunts.length}</p>
                <p className="text-sm text-white/80">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{pendingHunts.length}</p>
                <p className="text-sm text-white/80">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalPoints}</p>
                <p className="text-sm text-white/80">Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hunts Completed */}
        {completedHunts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-trophy text-saka-gold mr-2"></i>
                Hunts Completed ({completedHunts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedHunts.map((completion) => (
                  <div key={completion.id} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                    <img 
                      src={completion.hunt.coverImageUrl} 
                      alt={completion.hunt.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-semibold text-saka-dark">{completion.hunt.title}</h5>
                      <p className="text-sm text-gray-600">{completion.hunt.category}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <i className="fas fa-star text-saka-gold text-sm"></i>
                        <span className="text-sm font-medium text-saka-gold">{completion.totalPoints} points</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <i className="fas fa-check-circle text-saka-green text-xl"></i>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Hunts */}
        {pendingHunts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-clock text-saka-orange mr-2"></i>
                Pending Hunts ({pendingHunts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingHunts.map((hunt) => (
                  <div key={hunt.id} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                    <img 
                      src={hunt.coverImageUrl} 
                      alt={hunt.title}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-semibold text-saka-dark">{hunt.title}</h5>
                      <p className="text-sm text-gray-600">{hunt.category}</p>
                      <Badge className="mt-1 bg-saka-orange text-white text-xs">
                        Ready to start
                      </Badge>
                    </div>
                    <Link to={`/hunt/${hunt.id}`}>
                      <Button size="sm" className="bg-saka-green text-white hover:bg-emerald-600">
                        Start
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchased Hunts */}
        {purchases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-shopping-cart text-saka-gold mr-2"></i>
                Purchased Hunts ({purchases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {purchases.map((purchase) => {
                  const hunt = allHunts.find(h => h.id === purchase.huntId);
                  return (
                    <div key={purchase.id} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                      <div className="w-16 h-16 bg-saka-gold/10 rounded-xl flex items-center justify-center">
                        <i className="fas fa-crown text-saka-gold text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-saka-dark">
                          {hunt?.title || "Premium Hunt"}
                        </h5>
                        <p className="text-sm text-gray-600">${purchase.amountPaid}</p>
                        <Badge 
                          variant={purchase.paymentStatus === 'completed' ? 'default' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          {purchase.paymentStatus}
                        </Badge>
                      </div>
                      {hunt && (
                        <Link to={`/hunt/${hunt.id}`}>
                          <Button 
                            size="sm"
                            className="bg-saka-gold text-white hover:bg-yellow-600"
                          >
                            Start
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges Earned */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-award text-saka-orange mr-2"></i>
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {badges.map((badge) => (
                <div key={badge.name} className={`rounded-xl p-4 text-center transition-all ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-saka-gold/20 to-yellow-100 border-2 border-saka-gold/30' 
                    : 'bg-gray-100 border-2 border-gray-200 grayscale'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    badge.earned
                      ? 'bg-gradient-to-br from-saka-gold to-yellow-600 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    <i className={`${badge.icon}`}></i>
                  </div>
                  <p className={`text-xs font-medium ${
                    badge.earned ? 'text-saka-dark' : 'text-gray-500'
                  }`}>
                    {badge.name}
                  </p>
                  {!badge.earned && (
                    <p className="text-xs text-gray-400 mt-1">Locked</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empty States */}
        {completedHunts.length === 0 && pendingHunts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-map-marked-alt text-gray-400 text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Adventures Yet</h4>
              <p className="text-gray-600 mb-4">Start your first hunt to begin your journey!</p>
              <Link to="/hunt-library">
                <Button className="bg-saka-orange text-white hover:bg-orange-600">
                  Explore Hunts
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

    </Layout>
  );
}