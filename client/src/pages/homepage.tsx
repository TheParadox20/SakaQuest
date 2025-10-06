import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { PaymentModal } from "@/components/payment-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/authUtils";
import { Layout } from "@/components/layout";
import { AdminBanner } from "@/components/admin-banner";

interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  durationMinutes: number;
  coverImageUrl: string;
  price: string;
  unlocked: boolean;
}

const heroImages = [
  "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
  "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
  "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
  "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
  "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
  "https://images.unsplash.com/photo-1539650116574-75c0c6d7e9ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=600",
];

export default function Homepage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
  const { user } = useAuth();

  const { data: hunts = [], isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
    enabled: !!getAuthToken(),
  });

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-saka-green";
      case "medium": return "bg-saka-gold";
      case "hard": return "bg-saka-red";
      default: return "bg-gray-500";
    }
  };

  const featuredHunts = hunts.slice(0, 4);

  const handlePurchaseClick = (hunt: Hunt) => {
    setSelectedHunt(hunt);
    setPaymentModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Saka...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <AdminBanner />

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40"></div>
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-6 max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Welcome to Saka
            </h2>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Explore cities, enjoy the fun of curated chaos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/hunt-library">
                <Button className="bg-saka-orange hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold">
                  Start Exploring
                </Button>
              </Link>
              <Link to="/build-hunt">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-saka-dark px-8 py-3 rounded-xl font-semibold bg-black/20 backdrop-blur-sm">
                  Build My Hunt
                </Button>
              </Link>
              <Button 
                onClick={() => window.open('https://forms.gle/opc4o2iqiEGWM1kh6', '_blank')}
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-saka-dark px-8 py-3 rounded-xl font-semibold bg-black/20 backdrop-blur-sm"
              >
                <i className="fas fa-plus mr-2"></i>
                Request a Hunt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Hunts Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-saka-dark mb-2">Featured Adventures</h3>
          <p className="text-gray-600">Discover amazing experiences curated just for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredHunts.map((hunt) => (
            <div key={hunt.id} className="bg-white rounded-2xl overflow-hidden card-shadow hover:shadow-xl transition-all transform hover:scale-[1.02]">
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={hunt.coverImageUrl} 
                  alt={hunt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  {parseFloat(hunt.price) === 0 ? (
                    <Badge className="bg-saka-green text-white">
                      <i className="fas fa-gift mr-1"></i> FREE
                    </Badge>
                  ) : (
                    <Badge className="bg-saka-gold text-white">
                      <i className="fas fa-crown mr-1"></i> KES {hunt.price}
                    </Badge>
                  )}
                </div>
                <div className="absolute top-3 right-3">
                  <Badge className={`${getDifficultyColor(hunt.difficulty)} text-white text-xs`}>
                    {hunt.difficulty.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="p-5">
                <div className="mb-2">
                  <span className="text-xs font-medium text-saka-orange bg-saka-orange/10 px-2 py-1 rounded-full">
                    {hunt.category}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-saka-dark mb-2">{hunt.title}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{hunt.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <i className="fas fa-clock mr-1"></i>
                    {hunt.durationMinutes} min
                  </div>
                  {hunt.unlocked ? (
                    <Link to={`/hunt/${hunt.id}`}>
                      <Button size="sm" className="bg-saka-green hover:bg-emerald-600 text-white">
                        Start
                      </Button>
                    </Link>
                  ) : parseFloat(hunt.price) > 0 ? (
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchaseClick(hunt)}
                      className="bg-saka-gold hover:bg-yellow-600 text-white"
                    >
                      KES {hunt.price}
                    </Button>
                  ) : (
                    <Link to={`/hunt/${hunt.id}`}>
                      <Button size="sm" className="bg-saka-green hover:bg-emerald-600 text-white">
                        Start
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/hunt-library">
            <Button className="bg-gradient-to-r from-saka-orange to-saka-red text-white px-8 py-3 rounded-xl font-semibold text-lg">
              See More Adventures
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-saka-dark text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-300">© Saka 2025</p>
            <div className="mt-2">
              <Link to="/privacy-policy">
                <button className="text-gray-300 hover:text-white text-sm underline">
                  Privacy Agreement / Policy
                </button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        hunt={selectedHunt}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </Layout>
  );
}