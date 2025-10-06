import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { DeploymentPaymentModal } from "@/components/deployment-payment-modal";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Users, 
  Clock, 
  MapPin, 
  Share2, 
  Play, 
  Mail,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Zap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Type definitions based on backend schema
interface UserCreatedHunt {
  id: string;
  title: string;
  description: string;
  theme: string;
  isPublic: boolean;
  isDraft: boolean;
  status: string; // "draft" | "active"
  inviteCode: string;
  deploymentPrice: string;
  deployedAt: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

interface HuntInvitation {
  id: string;
  huntId: string;
  invitedUserId: string;
  invitedEmail: string;
  inviteToken: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
  hunt: UserCreatedHunt;
}

export default function MyHuntsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-hunts");
  const [deploymentModalOpen, setDeploymentModalOpen] = useState(false);
  const [selectedHuntForDeployment, setSelectedHuntForDeployment] = useState<UserCreatedHunt | null>(null);

  // Fetch user's created hunts
  const { 
    data: myHunts = [], 
    isLoading: myHuntsLoading, 
    isError: myHuntsError, 
    error: myHuntsErrorDetails,
    refetch: refetchMyHunts 
  } = useQuery<UserCreatedHunt[]>({
    queryKey: ["/api/user-hunts"],
    retry: 2,
  });

  // Fetch user's hunt invitations
  const { 
    data: invitations = [], 
    isLoading: invitationsLoading, 
    isError: invitationsError, 
    error: invitationsErrorDetails,
    refetch: refetchInvitations 
  } = useQuery<HuntInvitation[]>({
    queryKey: ["/api/user-invitations"],
    retry: 2,
  });

  // Delete hunt mutation
  const deleteHuntMutation = useMutation({
    mutationFn: async (huntId: string) => {
      return await apiRequest("DELETE", `/api/user-hunts/${huntId}`);
    },
    onSuccess: () => {
      toast({
        title: "Hunt deleted",
        description: "Your hunt has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting hunt",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Respond to invitation mutation
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ inviteToken, status }: { inviteToken: string; status: "accepted" | "declined" }) => {
      return await apiRequest("POST", `/api/invitations/${inviteToken}/respond`, { status });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "accepted" ? "Invitation accepted" : "Invitation declined",
        description: `You have ${variables.status} the hunt invitation.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error responding to invitation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteHunt = (huntId: string) => {
    deleteHuntMutation.mutate(huntId);
  };

  const respondToInvitation = (inviteToken: string, status: "accepted" | "declined") => {
    respondToInvitationMutation.mutate({ inviteToken, status });
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

  const handleRetryMyHunts = () => {
    refetchMyHunts();
    toast({
      title: "Retrying...",
      description: "Attempting to reload your hunts.",
    });
  };

  const handleRetryInvitations = () => {
    refetchInvitations();
    toast({
      title: "Retrying...",
      description: "Attempting to reload your invitations.",
    });
  };

  // Error component for reusability
  const ErrorPanel = ({ 
    title, 
    description, 
    onRetry, 
    testId 
  }: { 
    title: string; 
    description: string; 
    onRetry: () => void; 
    testId: string; 
  }) => (
    <Card className="border-red-200">
      <CardContent className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="border-red-300 text-red-700 hover:bg-red-50"
          data-testid={testId}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Hunts</h1>
            <p className="text-gray-600">Manage your created hunts and invitations</p>
          </div>
          <Link href="/build-hunt">
            <Button data-testid="button-create-new-hunt">
              <Plus className="h-4 w-4 mr-2" />
              Create New Hunt
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-hunts" data-testid="tab-my-hunts">
              My Hunts ({myHunts.length})
            </TabsTrigger>
            <TabsTrigger value="invitations" data-testid="tab-invitations">
              Invitations ({invitations.filter(inv => inv.status === "pending").length})
            </TabsTrigger>
          </TabsList>

          {/* My Hunts Tab */}
          <TabsContent value="my-hunts" className="space-y-6">
            {myHuntsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myHuntsError ? (
              <ErrorPanel
                title="Failed to load your hunts"
                description={`There was an error loading your hunts: ${myHuntsErrorDetails?.message || 'Network connection issue'}. Please check your connection and try again.`}
                onRetry={handleRetryMyHunts}
                testId="error-panel-my-hunts"
              />
            ) : myHunts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hunts created yet</h3>
                  <p className="text-gray-600 mb-6">Start building your first custom hunt today!</p>
                  <Link href="/build-hunt">
                    <Button data-testid="button-create-first-hunt">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Hunt
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myHunts.map((hunt) => (
                  <Card key={hunt.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg line-clamp-2">{hunt.title}</CardTitle>
                        <div className="flex items-center gap-1">
                          {hunt.isDraft && <Badge variant="outline">Draft</Badge>}
                          {hunt.isPublic && <Badge variant="secondary">Public</Badge>}
                        </div>
                      </div>
                      <Badge className={getThemeColor(hunt.theme)} variant="outline">
                        {hunt.theme.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {hunt.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(hunt.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="h-4 w-4" />
                          <span>{hunt.inviteCode}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/build-hunt?edit=${hunt.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-edit-hunt-${hunt.id}`}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled
                          data-testid={`button-view-stats-${hunt.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Stats
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={deleteHuntMutation.isPending}
                              data-testid={`button-delete-hunt-${hunt.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Hunt</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{hunt.title}"? This action cannot be undone and will remove all associated clues and data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deleteHuntMutation.isPending}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteHunt(hunt.id)}
                                disabled={deleteHuntMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deleteHuntMutation.isPending ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            {invitationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                          <div className="h-8 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : invitationsError ? (
              <ErrorPanel
                title="Failed to load invitations"
                description={`There was an error loading your hunt invitations: ${invitationsErrorDetails?.message || 'Network connection issue'}. Please check your connection and try again.`}
                onRetry={handleRetryInvitations}
                testId="error-panel-invitations"
              />
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No invitations</h3>
                  <p className="text-gray-600">You don't have any hunt invitations at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <Card key={invitation.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-saka-orange text-white text-sm">
                                {invitation.hunt.title.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{invitation.hunt.title}</h3>
                              <p className="text-sm text-gray-600">by Hunt Creator</p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {invitation.hunt.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <Badge className={getThemeColor(invitation.hunt.theme)} variant="outline">
                              {invitation.hunt.theme.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                            <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                            <Badge 
                              variant={
                                invitation.status === "accepted" ? "default" : 
                                invitation.status === "declined" ? "destructive" : "outline"
                              }
                            >
                              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {invitation.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => respondToInvitation(invitation.inviteToken, "accepted")}
                              disabled={respondToInvitationMutation.isPending}
                              data-testid={`button-accept-invitation-${invitation.id}`}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => respondToInvitation(invitation.inviteToken, "declined")}
                              disabled={respondToInvitationMutation.isPending}
                              data-testid={`button-decline-invitation-${invitation.id}`}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {invitation.status === "accepted" && (
                          <Button
                            disabled
                            data-testid={`button-join-hunt-${invitation.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Join Hunt
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Deployment Payment Modal */}
        <DeploymentPaymentModal
          isOpen={deploymentModalOpen}
          onClose={() => {
            setDeploymentModalOpen(false);
            setSelectedHuntForDeployment(null);
          }}
          hunt={selectedHuntForDeployment}
          onSuccess={() => {
            refetchMyHunts();
            setDeploymentModalOpen(false);
            setSelectedHuntForDeployment(null);
          }}
        />
      </div>
    </Layout>
  );
}