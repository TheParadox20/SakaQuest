import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { getAuthToken } from "@/lib/authUtils";

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

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  onPurchaseClick: (hunt: Hunt) => void;
}

export function CategoryModal({ 
  isOpen, 
  onClose, 
  categoryName, 
  categoryIcon, 
  categoryColor,
  onPurchaseClick 
}: CategoryModalProps) {
  const { data: hunts = [], isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/hunts/category", categoryName],
    enabled: !!getAuthToken() && isOpen && !!categoryName,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return "bg-saka-green";
      case "medium": return "bg-saka-gold";
      case "hard": return "bg-saka-red";
      default: return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className={`w-12 h-12 bg-gradient-to-r ${categoryColor} rounded-xl flex items-center justify-center`}>
              <i className={`${categoryIcon} text-white text-lg`}></i>
            </div>
            <span className="text-saka-dark">{categoryName} Hunts</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading hunts...</p>
            </div>
          ) : hunts.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  {hunts.length} hunt{hunts.length !== 1 ? 's' : ''} found in {categoryName}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hunts.map((hunt) => (
                  <div key={hunt.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all relative">
                    {/* Lock overlay for paid hunts */}
                    {!hunt.unlocked && parseFloat(hunt.price) > 0 && (
                      <div 
                        onClick={() => {
                          onPurchaseClick(hunt);
                          onClose();
                        }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl cursor-pointer hover:bg-black/60 transition-colors"
                      >
                        <div className="text-center text-white pointer-events-none">
                          <i className="fas fa-lock text-2xl mb-2 opacity-80"></i>
                          <p className="font-semibold">KES {hunt.price}</p>
                          <p className="text-xs opacity-80">Unlock this hunt</p>
                        </div>
                      </div>
                    )}

                    <div className="h-32 relative overflow-hidden">
                      <img 
                        src={hunt.coverImageUrl} 
                        alt={hunt.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        {parseFloat(hunt.price) === 0 ? (
                          <Badge className="bg-saka-green text-white text-xs">
                            <i className="fas fa-gift mr-1"></i> FREE
                          </Badge>
                        ) : (
                          <Badge className="bg-saka-gold text-white text-xs">
                            <i className="fas fa-crown mr-1"></i> PREMIUM
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 space-y-1">
                        <div className="bg-black/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs">
                          <i className="fas fa-clock mr-1"></i> {hunt.durationMinutes} min
                        </div>
                        <Badge className={`${getDifficultyColor(hunt.difficulty)} text-white text-xs`}>
                          {hunt.difficulty.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-md font-bold text-saka-dark mb-2">{hunt.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{hunt.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-star text-saka-gold text-xs"></i>
                          <i className="fas fa-star text-saka-gold text-xs"></i>
                          <i className="fas fa-star text-saka-gold text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                          <i className="fas fa-star text-gray-300 text-xs"></i>
                        </div>
                        {hunt.unlocked ? (
                          <Link to={`/hunt/${hunt.id}`}>
                            <Button 
                              size="sm"
                              onClick={onClose}
                              className="bg-saka-green text-white hover:bg-emerald-600 text-xs px-3 py-1"
                            >
                              Start Hunt
                            </Button>
                          </Link>
                        ) : parseFloat(hunt.price) > 0 ? (
                          <Button 
                            size="sm"
                            onClick={() => {
                              onPurchaseClick(hunt);
                              onClose();
                            }}
                            className="bg-saka-gold text-white hover:bg-yellow-600 text-xs px-3 py-1"
                          >
                            KES {hunt.price}
                          </Button>
                        ) : (
                          <Link to={`/hunt/${hunt.id}`}>
                            <Button 
                              size="sm"
                              onClick={onClose}
                              className="bg-saka-green text-white hover:bg-emerald-600 text-xs px-3 py-1"
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
            </>
          ) : (
            <div className="text-center py-12">
              <div className={`w-16 h-16 bg-gradient-to-r ${categoryColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <i className="fas fa-tools text-white text-2xl"></i>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Updates Underway</h4>
              <p className="text-gray-600 mb-4">
                We're working on adding exciting new hunts to {categoryName}. Check back soon!
              </p>
              <Button 
                onClick={onClose}
                className="bg-saka-orange text-white hover:bg-orange-600"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}