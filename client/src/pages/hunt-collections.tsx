import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { PaymentModal } from "@/components/payment-modal";
import { CategoryModal } from "@/components/category-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/authUtils";
import { Layout } from "@/components/layout";

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

const categories = [
  { name: "History", icon: "fas fa-landmark", color: "from-amber-500 to-orange-500" },
  { name: "Food", icon: "fas fa-utensils", color: "from-green-500 to-emerald-500" },
  { name: "Art", icon: "fas fa-palette", color: "from-purple-500 to-pink-500" },
  { name: "Cultural Heritage", icon: "fas fa-mosque", color: "from-blue-500 to-indigo-500" },
  { name: "Wildlife", icon: "fas fa-paw", color: "from-yellow-500 to-amber-500" },
  { name: "Photography", icon: "fas fa-camera", color: "from-red-500 to-pink-500" },
  { name: "Coffee & Café Culture", icon: "fas fa-coffee", color: "from-brown-500 to-amber-600" },
  { name: "Fashion & Design", icon: "fas fa-tshirt", color: "from-pink-500 to-purple-500" },
  { name: "Tea Lovers", icon: "fas fa-leaf", color: "from-green-600 to-teal-500" },
];

export default function HuntCollections() {
  const params = useParams();
  const categoryParam = params.category;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || "");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedHunt, setSelectedHunt] = useState<Hunt | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryData, setSelectedCategoryData] = useState<{
    name: string;
    icon: string;
    color: string;
  } | null>(null);

  // Decode category name
  const decodedCategory = categoryParam 
    ? categoryParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : "";

  const { data: hunts = [], isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts"],
    enabled: !!getAuthToken(),
  });

  const filteredHunts = hunts.filter((hunt) => {
    const matchesSearch = hunt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hunt.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || hunt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchaseClick = (hunt: Hunt) => {
    setSelectedHunt(hunt);
    setPaymentModalOpen(true);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (categoryName === "") {
      setSelectedCategory("");
      return;
    }
    
    const category = categories.find(cat => cat.name === categoryName);
    if (category) {
      setSelectedCategoryData({
        name: category.name,
        icon: category.icon,
        color: category.color
      });
      setCategoryModalOpen(true);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-saka-green";
      case "medium": return "bg-saka-gold";
      case "hard": return "bg-saka-red";
      default: return "bg-gray-500";
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
    return category?.color || "from-gray-500 to-gray-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hunt collections...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-saka-dark">
              {decodedCategory || "Hunt Collections"}
            </h2>
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <Input
                type="search"
                placeholder="Search hunts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent text-sm w-48"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Category Filter */}
        {!categoryParam && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-saka-dark mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <button
                onClick={() => handleCategoryClick("")}
                className={`p-4 rounded-xl border transition-all ${
                  selectedCategory === "" 
                    ? "border-saka-orange bg-saka-orange/10" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <i className="fas fa-globe text-white"></i>
                  </div>
                  <p className="text-sm font-medium text-saka-dark">All</p>
                </div>
              </button>
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                      <i className={`${category.icon} text-white`}></i>
                    </div>
                    <p className="text-sm font-medium text-saka-dark">{category.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {filteredHunts.length} hunt{filteredHunts.length !== 1 ? 's' : ''} found
              {decodedCategory && ` in ${decodedCategory}`}
            </p>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-saka-orange focus:border-transparent">
              <option>Sort by: Featured</option>
              <option>Sort by: Price</option>
              <option>Sort by: Difficulty</option>
              <option>Sort by: Duration</option>
            </select>
          </div>
        </div>

        {/* Hunt Grid */}
        {filteredHunts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHunts.map((hunt) => (
              <div key={hunt.id} className="bg-white rounded-2xl overflow-hidden card-shadow hover:shadow-xl transition-all transform hover:scale-[1.02] relative">
                {/* Lock overlay for paid hunts */}
                {!hunt.unlocked && parseFloat(hunt.price) > 0 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                    <div className="text-center text-white">
                      <i className="fas fa-lock text-3xl mb-2 opacity-80"></i>
                      <p className="font-semibold">${hunt.price}</p>
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
                  <div className="absolute top-3 left-3">
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
                  <div className="absolute top-3 right-3 space-y-1">
                    <div className="bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                      <i className="fas fa-clock mr-1"></i> {hunt.durationMinutes} min
                    </div>
                    <Badge className={`${getDifficultyColor(hunt.difficulty)} text-white text-xs`}>
                      {hunt.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="mb-3">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(hunt.category)} text-white`}>
                      {hunt.category}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-saka-dark mb-2">{hunt.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hunt.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-star text-saka-gold text-sm"></i>
                        <i className="fas fa-star text-saka-gold text-sm"></i>
                        <i className="fas fa-star text-saka-gold text-sm"></i>
                        <i className="fas fa-star text-gray-300 text-sm"></i>
                        <i className="fas fa-star text-gray-300 text-sm"></i>
                      </div>
                    </div>
                    {hunt.unlocked ? (
                      <Link to={`/hunt/${hunt.id}`}>
                        <Button 
                          size="sm"
                          className="bg-saka-green text-white hover:bg-emerald-600"
                        >
                          Start Hunt
                        </Button>
                      </Link>
                    ) : parseFloat(hunt.price) > 0 ? (
                      <Button 
                        size="sm"
                        onClick={() => handlePurchaseClick(hunt)}
                        className="bg-saka-gold text-white hover:bg-yellow-600"
                      >
                        ${hunt.price}
                      </Button>
                    ) : (
                      <Link to={`/hunt/${hunt.id}`}>
                        <Button 
                          size="sm"
                          className="bg-saka-green text-white hover:bg-emerald-600"
                        >
                          Start Hunt
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-gray-400 text-2xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hunts found</h4>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or browse different categories
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
              className="bg-saka-orange text-white hover:bg-orange-600"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        hunt={selectedHunt}
        onSuccess={() => {
          window.location.reload();
        }}
      />

      {selectedCategoryData && (
        <CategoryModal
          isOpen={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          categoryName={selectedCategoryData.name}
          categoryIcon={selectedCategoryData.icon}
          categoryColor={selectedCategoryData.color}
          onPurchaseClick={handlePurchaseClick}
        />
      )}
    </Layout>
  );
}