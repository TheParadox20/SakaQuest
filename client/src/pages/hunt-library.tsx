import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PaymentModal } from "@/components/payment-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/authUtils";
import { Layout } from "@/components/layout";
import { AdminBanner } from "@/components/admin-banner";

interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  coverImageUrl: string;
  price: string;
  unlocked: boolean;
}

export default function HuntLibrary() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: hunts = [], isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
    enabled: !!getAuthToken(),
  });

  const filteredHunts = hunts.filter((hunt) => {
    const matchesSearch = hunt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" || 
      (filter === "free" && parseFloat(hunt.price) === 0) ||
      (filter === "paid" && parseFloat(hunt.price) > 0);
    
    return matchesSearch && matchesFilter;
  });

  const handlePurchaseClick = (hunt: Hunt) => {
    setSelectedHunt(hunt);
    setPaymentModalOpen(true);
  };

  const handleStartHunt = (hunt: Hunt) => {
    setLocation(`/hunt/${hunt.id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-saka-green";
      case "medium": return "bg-saka-gold";
      case "hard": return "bg-saka-red";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hunts...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout className="bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminBanner />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-saka-dark">Hunt Library</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <Input
                  type="search"
                  placeholder="Search hunts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent text-sm w-40"
                />
              </div>
              <Link to="/profile">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <i className="fas fa-user-circle text-2xl text-saka-dark"></i>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Hunt Cards */}
        <div className="space-y-4">
          {filteredHunts.map((hunt) => (
            <div key={hunt.id} className="bg-white rounded-2xl overflow-hidden card-shadow hover:shadow-xl transition-all transform hover:scale-[1.02] relative">
              {/* Lock overlay for paid hunts */}
              {!hunt.unlocked && parseFloat(hunt.price) > 0 && (
                <div 
                  onClick={() => handlePurchaseClick(hunt)}
                  className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl cursor-pointer hover:bg-black/60 transition-colors"
                >
                  <div className="text-center text-white pointer-events-none">
                    <i className="fas fa-lock text-4xl mb-3 opacity-80"></i>
                    <p className="font-semibold text-lg">KES {hunt.price}</p>
                    <p className="text-sm opacity-80">Unlock this hunt</p>
                  </div>
                </div>
              )}

              <div className="h-48 relative overflow-hidden">
                <img 
                  src={hunt.coverImageUrl} 
                  alt={hunt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  {parseFloat(hunt.price) === 0 ? (
                    <Badge className="bg-saka-green text-white">
                      <i className="fas fa-gift mr-1"></i> FREE
                    </Badge>
                  ) : (
                    <Badge className="bg-saka-gold text-white">
                      <i className="fas fa-crown mr-1"></i> PREMIUM
                    </Badge>
                  )}
                </div>
                <div className="absolute top-4 right-4 space-y-1">
                  <div className="bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                    <i className="fas fa-clock mr-1"></i> {hunt.durationMinutes} min
                  </div>
                  <Badge className={`${getDifficultyColor(hunt.difficulty)} text-white text-xs`}>
                    {hunt.difficulty.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-saka-dark">{hunt.title}</h3>
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-star text-saka-gold"></i>
                    <i className="fas fa-star text-saka-gold"></i>
                    <i className="fas fa-star text-gray-300"></i>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">{hunt.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i className="fas fa-map-marker-alt mr-1"></i> Various locations</span>
                  </div>
                  {hunt.unlocked ? (
                    <Button 
                      onClick={() => handleStartHunt(hunt)}
                      className="bg-saka-green text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-all"
                    >
                      Start Hunt
                    </Button>
                  ) : parseFloat(hunt.price) > 0 ? (
                    <Button 
                      onClick={() => handlePurchaseClick(hunt)}
                      className="bg-saka-gold text-white px-6 py-2 rounded-xl font-semibold hover:bg-yellow-600 transition-all"
                    >
                      KES {hunt.price}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleStartHunt(hunt)}
                      className="bg-saka-green text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-all"
                    >
                      Start Hunt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-center space-x-1 bg-white rounded-full p-1 card-shadow">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === "all" 
                ? "bg-saka-orange text-white" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("free")}
            className={`flex-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === "free" 
                ? "bg-saka-orange text-white" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`flex-1 px-4 py-2 rounded-full font-medium text-sm transition-all ${
              filter === "paid" 
                ? "bg-saka-orange text-white" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        hunt={selectedHunt}
        onSuccess={() => {
          // Refresh hunts to update unlock status
          window.location.reload();
        }}
      />
    </Layout>
  );
}
