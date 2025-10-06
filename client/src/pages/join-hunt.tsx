import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Users, 
  Clock,
  Play,
  RefreshCw,
  AlertTriangle,
  Search,
  Check
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Type definitions
interface UserCreatedHunt {
  id: string;
  title: string;
  description: string;
  theme: string;
  isPublic: boolean;
  isDraft: boolean;
  inviteCode: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export default function JoinHuntPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [inviteCode, setInviteCode] = useState("");
  const [searchMode, setSearchMode] = useState(false);

  // Get invite code from URL params
  const urlInviteCode = new URLSearchParams(window.location.search).get("code") || 
                       window.location.pathname.split("/").pop();

  useEffect(() => {
    if (urlInviteCode && urlInviteCode !== "join-hunt") {
      setInviteCode(urlInviteCode);
      setSearchMode(true);
    }
  }, [urlInviteCode]);

  // Fetch hunt by invite code
  const { data: hunt, isLoading: huntLoading, isError: huntError, refetch: refetchHunt } = useQuery<UserCreatedHunt>({
    queryKey: ["/api/user-hunts/invite", inviteCode],
    enabled: !!inviteCode && searchMode,
    retry: 1,
  });

  // Join hunt mutation
  const joinHuntMutation = useMutation({
    mutationFn: async (huntId: string) => {
      return await apiRequest('POST', `/api/user-hunts/${huntId}/join`);
    },
    onSuccess: (data, huntId) => {
      toast({
        title: "Joined hunt successfully!",
        description: "You can now start the hunt adventure.",
      });
      
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/user-hunts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-hunts', huntId] });
      
      // For now, redirect to the build hunt page or homepage
      // In the future, this would redirect to the actual hunt start page
      setLocation('/build-hunt');
    },
    onError: (error: any) => {
      toast({
        title: "Error joining hunt",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (inviteCode.trim()) {
      setSearchMode(true);
      refetchHunt();
    } else {
      toast({
        title: "Invalid invite code",
        description: "Please enter a valid invite code",
        variant: "destructive",
      });
    }
  };

  const handleJoinHunt = () => {
    if (hunt) {
      joinHuntMutation.mutate(hunt.id);
    }
  };

  const getThemeColor = (theme: string) => {
    const colors = {
      "city-walk": "bg-blue-100 text-blue-800",
      "heritage": "bg-purple-100 text-purple-800", 
      "nature": "bg-green-100 text-green-800",
      "adventure": "bg-orange-100 text-orange-800",
      "cultural": "bg-pink-100 text-pink-800",
      "educational": "bg-indigo-100 text-indigo-800",
    };
    return colors[theme as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  // Error panel component
  const ErrorPanel = ({ error, onRetry, title }: { error: any, onRetry: () => void, title: string }) => (
    <Card className="border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">{title}</h3>
              <p className="text-sm text-red-700">
                {error?.message || "Hunt not found or invite code expired. Please check the code and try again."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            data-testid="button-retry-error"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Hunt</h1>
          <p className="text-gray-600">Enter an invite code to join an exciting scavenger hunt</p>
        </div>

        {/* Invite Code Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Invite Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-character invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono text-center text-lg tracking-widest"
                maxLength={6}
                data-testid="input-invite-code"
              />
              <Button 
                onClick={handleSearch}
                disabled={!inviteCode.trim() || huntLoading}
                data-testid="button-search-hunt"
              >
                {huntLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Invite codes are 6 characters long and case-insensitive
            </p>
          </CardContent>
        </Card>

        {/* Hunt Results */}
        {searchMode && (
          <>
            {huntLoading && (
              <Card>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {huntError && (
              <ErrorPanel 
                error={huntError} 
                onRetry={() => refetchHunt()}
                title="Hunt not found"
              />
            )}

            {hunt && !huntLoading && !huntError && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{hunt.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getThemeColor(hunt.theme)} variant="outline">
                          {hunt.theme.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        {hunt.isDraft && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                            Draft
                          </Badge>
                        )}
                        {hunt.isPublic && <Badge variant="secondary">Public</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-gray-700 mb-4">{hunt.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Created {new Date(hunt.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Invite Code: {hunt.inviteCode}</span>
                      </div>
                    </div>
                  </div>

                  {hunt.isDraft ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Hunt in Progress</h4>
                          <p className="text-sm text-yellow-700">
                            This hunt is still being created. Check back later or contact the creator.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-600" />
                          <div>
                            <h4 className="font-medium text-green-800">Ready to Join!</h4>
                            <p className="text-sm text-green-700">
                              This hunt is ready for participants. Click below to join the adventure.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleJoinHunt}
                          disabled={joinHuntMutation.isPending}
                          className="flex-1"
                          data-testid="button-join-hunt"
                        >
                          {joinHuntMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Join Hunt
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          disabled
                          data-testid="button-start-session"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        Multiplayer sessions coming soon! For now, you can join individual hunts.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {searchMode && !hunt && !huntLoading && !huntError && (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hunt found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find a hunt with that invite code. Please check the code and try again.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchMode(false);
                      setInviteCode("");
                    }}
                    data-testid="button-try-again"
                  >
                    Try Another Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        {!searchMode && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Need an invite code?</h3>
              <p className="text-gray-600 mb-6">
                Ask a friend who created a hunt to share their invite code with you, or browse public hunts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/hunt-library">
                  <Button variant="outline" data-testid="button-browse-hunts">
                    <MapPin className="h-4 w-4 mr-2" />
                    Browse Public Hunts
                  </Button>
                </Link>
                <Link href="/build-hunt">
                  <Button data-testid="button-create-hunt">
                    <Play className="h-4 w-4 mr-2" />
                    Create Your Own Hunt
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}