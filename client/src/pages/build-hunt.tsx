import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Eye, EyeOff, Trash2, Save, Users, Share2, Mail, Check, X, Rocket, Edit, Edit3, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Form schemas aligned with backend UserCreatedHunt schema
const huntInfoSchema = z.object({
  title: z.string().min(1, "Hunt title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  theme: z.enum(["city-walk", "heritage", "nature", "adventure", "cultural", "educational"]).optional(),
  isPublic: z.boolean().default(false),
  isDraft: z.boolean().default(true),
});

// Clue schema aligned with backend UserCreatedClue schema
const clueSchema = z.object({
  title: z.string().min(1, "Clue title is required"),
  clueText: z.string().min(10, "Clue text must be at least 10 characters"),
  narrative: z.string().optional(),
  challenge: z.string().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  locationHint: z.string().optional(),
  coordinates: z.string().optional(),
  order: z.number().min(1).default(1),
});

// Invitation schema
const inviteSchema = z.object({
  invitedEmail: z.string().email("Valid email is required"),
});

type HuntInfo = z.infer<typeof huntInfoSchema>;
type ClueInfo = z.infer<typeof clueSchema>;
type InviteInfo = z.infer<typeof inviteSchema>;

interface Clue extends ClueInfo {
  id: string;
}

interface Invitation {
  id: string;
  huntId: string;
  invitedEmail: string;
  status: string;
  createdAt: string;
}

interface UserCreatedHunt {
  id: string;
  title: string;
  description: string;
  theme: string;
  isPublic: boolean;
  isDraft: boolean;
  status: string;
  inviteCode: string;
  deploymentPrice: string;
  deployedAt: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export default function BuildHuntPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-hunts");
  const [clues, setClues] = useState<Clue[]>([]);
  const [editingClue, setEditingClue] = useState<Clue | null>(null);
  const [showClueForm, setShowClueForm] = useState(false);
  const [createdHuntId, setCreatedHuntId] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCreateHuntDialog, setShowCreateHuntDialog] = useState(false);
  const [createHuntStep, setCreateHuntStep] = useState<'info' | 'clues'>('info');

  // Hunt info form
  const huntForm = useForm<HuntInfo>({
    resolver: zodResolver(huntInfoSchema),
    defaultValues: {
      title: "",
      description: "",
      theme: "city-walk",
      isPublic: false,
      isDraft: true,
    },
  });

  // Clue form
  const clueForm = useForm<ClueInfo>({
    resolver: zodResolver(clueSchema),
    defaultValues: {
      title: "",
      clueText: "",
      narrative: "",
      challenge: "",
      correctAnswer: "",
      locationHint: "",
      coordinates: "",
      order: 1,
    },
  });

  // Invite form
  const inviteForm = useForm<InviteInfo>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      invitedEmail: "",
    },
  });

  // Fetch user's created hunts
  const { data: myHunts = [], isLoading: myHuntsLoading, refetch: refetchMyHunts } = useQuery<UserCreatedHunt[]>({
    queryKey: ["/api/user-hunts"],
  });

  // Fetch current hunt details (for invite code)
  const { data: currentHunt } = useQuery<UserCreatedHunt>({
    queryKey: ["/api/user-hunts", createdHuntId],
    enabled: !!createdHuntId,
  });

  // Fetch invitations for the current hunt
  const { data: invitations = [], refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: [`/api/user-hunts/${createdHuntId}/invitations`],
    enabled: !!createdHuntId && showInviteDialog,
  });

  // Create hunt with all clues mutation
  const createHuntMutation = useMutation({
    mutationFn: async ({ huntData, cluesList }: { huntData: HuntInfo; cluesList: Omit<Clue, 'id'>[] }) => {
      // First create the hunt
      const huntResponse = await apiRequest("POST", "/api/user-hunts", huntData);
      const hunt = await huntResponse.json();
      
      // Then batch create all clues
      if (cluesList.length > 0) {
        const cluePromises = cluesList.map((clue, index) =>
          apiRequest("POST", `/api/user-hunts/${hunt.id}/clues`, {
            ...clue,
            order: index + 1,
          })
        );
        await Promise.all(cluePromises);
      }
      
      return hunt;
    },
    onSuccess: (hunt) => {
      setCreatedHuntId(hunt.id);
      toast({
        title: "Hunt created successfully!",
        description: `Your hunt "${hunt.title}" has been saved with ${clues.length} clue(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
      // Move to preview tab
      setActiveTab("preview");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating hunt",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update hunt mutation
  const updateHuntMutation = useMutation({
    mutationFn: async (huntData: HuntInfo) => {
      if (!createdHuntId) {
        throw new Error("No hunt to update");
      }
      const response = await apiRequest("PUT", `/api/user-hunts/${createdHuntId}`, huntData);
      return await response.json();
    },
    onSuccess: (hunt) => {
      toast({
        title: "Progress saved!",
        description: `Your hunt "${hunt.title}" has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving progress",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Add clue to temporary array (no DB call)
  const addClueToList = (clueData: ClueInfo) => {
    const newClue: Clue = {
      ...clueData,
      id: `temp-${Date.now()}`, // Temporary ID
      order: clues.length + 1,
    };
    setClues([...clues, newClue]);
    clueForm.reset();
    setShowClueForm(false);
    toast({
      title: "Clue added",
      description: "Clue will be saved when you create the hunt.",
    });
  };

  // Create clue mutation (for editing existing hunts)
  const createClueMutation = useMutation({
    mutationFn: async (clueData: ClueInfo) => {
      if (!createdHuntId) {
        throw new Error("Hunt must be created first");
      }
      const response = await apiRequest("POST", `/api/user-hunts/${createdHuntId}/clues`, {
        ...clueData,
        order: clues.length + 1,
      });
      return await response.json();
    },
    onSuccess: (newClue) => {
      setClues([...clues, newClue]);
      clueForm.reset();
      setShowClueForm(false);
      toast({
        title: "Clue saved",
        description: "Your clue has been added to the hunt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts", createdHuntId, "clues"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving clue",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Update clue mutation
  const updateClueMutation = useMutation({
    mutationFn: async ({ clueId, clueData }: { clueId: string; clueData: Partial<ClueInfo> }) => {
      const response = await apiRequest("PUT", `/api/user-clues/${clueId}`, clueData);
      return await response.json();
    },
    onSuccess: (updatedClue) => {
      setClues(clues.map(c => c.id === updatedClue.id ? updatedClue : c));
      setEditingClue(null);
      clueForm.reset();
      setShowClueForm(false);
      toast({
        title: "Clue updated",
        description: "Your clue has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts", createdHuntId, "clues"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating clue",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Delete clue mutation
  const deleteClueMutation = useMutation({
    mutationFn: async (clueId: string) => {
      const response = await apiRequest("DELETE", `/api/user-clues/${clueId}`);
      return await response.json();
    },
    onSuccess: (_, clueId) => {
      setClues(clues.filter(c => c.id !== clueId));
      toast({
        title: "Clue deleted",
        description: "The clue has been removed from your hunt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts", createdHuntId, "clues"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting clue",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (inviteData: InviteInfo) => {
      if (!createdHuntId) {
        throw new Error("Hunt must be created first");
      }
      const response = await apiRequest("POST", `/api/user-hunts/${createdHuntId}/invitations`, inviteData);
      return await response.json();
    },
    onSuccess: () => {
      inviteForm.reset();
      refetchInvitations();
      toast({
        title: "Invitation sent",
        description: "Your friend has been invited to collaborate on this hunt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending invitation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Deploy hunt mutation
  const deployHuntMutation = useMutation({
    mutationFn: async ({ email, huntId, amount }: { email: string; huntId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/deploy-hunt", { email, huntId, amount });
      return await response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      if (data?.data?.authorization_url) {
        window.location.href = data.data.authorization_url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error initiating deployment",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
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
      // Reset form if deleted hunt was being edited
      if (createdHuntId && myHunts.find(h => h.id === createdHuntId)) {
        setCreatedHuntId(null);
        setClues([]);
        huntForm.reset();
        setActiveTab("my-hunts");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting hunt",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Save clue function with proper validation
  const onClueSubmit = (data: ClueInfo) => {
    if (editingClue) {
      // If editing an existing clue
      if (editingClue.id.startsWith('temp-')) {
        // Update in temporary array
        setClues(clues.map(c => c.id === editingClue.id ? { ...c, ...data } : c));
        setEditingClue(null);
        clueForm.reset();
        setShowClueForm(false);
        toast({
          title: "Clue updated",
          description: "Your clue has been updated.",
        });
      } else {
        // Update in database
        updateClueMutation.mutate({ clueId: editingClue.id, clueData: data });
      }
    } else {
      // Adding new clue
      if (!createdHuntId) {
        // Add to temporary array
        addClueToList(data);
      } else {
        // Save to database
        createClueMutation.mutate(data);
      }
    }
  };

  const editClue = (clue: Clue) => {
    setEditingClue(clue);
    clueForm.reset(clue);
    setShowClueForm(true);
  };

  const deleteClue = (clueId: string) => {
    if (clueId.startsWith('temp-')) {
      // Remove from temporary array
      setClues(clues.filter(c => c.id !== clueId));
      toast({
        title: "Clue removed",
        description: "The clue has been removed.",
      });
    } else {
      // Delete from database
      deleteClueMutation.mutate(clueId);
    }
  };

  const deleteHunt = (huntId: string) => {
    deleteHuntMutation.mutate(huntId);
  };

  const loadHuntForEditing = async (hunt: UserCreatedHunt) => {
    // Load hunt data into form
    setCreatedHuntId(hunt.id);
    huntForm.reset({
      title: hunt.title,
      description: hunt.description,
      theme: hunt.theme as any,
      isPublic: hunt.isPublic,
      isDraft: hunt.isDraft,
    });

    // Fetch and load clues using apiRequest for proper auth handling
    try {
      const huntClues = await apiRequest("GET", `/api/user-hunts/${hunt.id}/clues`);
      setClues(Array.isArray(huntClues) ? huntClues : []);
    } catch (error) {
      console.error('Error loading clues:', error);
      setClues([]);
      toast({
        title: "Error loading clues",
        description: "Could not load hunt clues. Please try again.",
        variant: "destructive",
      });
    }

    // Stay on current tab (will be handled by caller)
    
    toast({
      title: "Hunt loaded",
      description: `Editing "${hunt.title}"`,
    });
  };

  const startNewHunt = () => {
    setCreatedHuntId(null);
    setClues([]);
    huntForm.reset({
      title: "",
      description: "",
      theme: "city-walk",
      isPublic: false,
      isDraft: true,
    });
    setShowCreateHuntDialog(true);
    setCreateHuntStep('info');
    toast({
      title: "Ready to create",
      description: "Fill in your hunt details to get started",
    });
  };

  const onHuntSubmit = (data: HuntInfo) => {
    if (createdHuntId) {
      // Update existing hunt
      updateHuntMutation.mutate(data);
    } else {
      // For new hunts, just move to clues tab (don't save yet)
      setActiveTab("clues");
      toast({
        title: "Hunt info saved",
        description: "Now add clues to your hunt, then click 'Create Hunt'",
      });
    }
  };

  const handleCreateHunt = async () => {
    // Validate hunt form
    const huntData = huntForm.getValues();
    if (!huntData.title || !huntData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required hunt details",
        variant: "destructive",
      });
      return;
    }

    if (clues.length === 0) {
      toast({
        title: "No clues added",
        description: "Please add at least one clue before creating the hunt",
        variant: "destructive",
      });
      return;
    }

    // If hunt already exists (from Save Progress), just save the clues
    if (createdHuntId) {
      try {
        // Save only temporary clues
        const tempClues = clues.filter(c => c.id.startsWith('temp-'));
        if (tempClues.length > 0) {
          const cluePromises = tempClues.map((clue, index) =>
            apiRequest("POST", `/api/user-hunts/${createdHuntId}/clues`, {
              title: clue.title,
              clueText: clue.clueText,
              narrative: clue.narrative,
              challenge: clue.challenge,
              correctAnswer: clue.correctAnswer,
              locationHint: clue.locationHint,
              coordinates: clue.coordinates,
              order: clues.filter(c => !c.id.startsWith('temp-')).length + index + 1,
            })
          );
          await Promise.all(cluePromises);
        }
        
        // Update hunt to mark as complete (not draft anymore)
        await updateHuntMutation.mutateAsync({ ...huntData, isDraft: false });
        
        toast({
          title: "Hunt created successfully!",
          description: `Your hunt "${huntData.title}" has been saved with ${clues.length} clue(s).`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
        
        // Close dialog and navigate to preview
        setShowCreateHuntDialog(false);
        setCreateHuntStep('info');
        setActiveTab("preview");
      } catch (error: any) {
        toast({
          title: "Error creating hunt",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } else {
      // Create new hunt with all clues
      createHuntMutation.mutate({
        huntData: { ...huntData, isDraft: false },
        cluesList: clues.map(({ id, ...clue }) => clue), // Remove temporary IDs
      });
      
      // Close the create dialog
      setShowCreateHuntDialog(false);
      setCreateHuntStep('info');
    }
  };

  const handleSaveProgress = async () => {
    const huntData = huntForm.getValues();
    
    if (!huntData.title || !huntData.description) {
      toast({
        title: "Missing information",
        description: "Please fill in hunt title and description first",
        variant: "destructive",
      });
      return;
    }

    if (!createdHuntId) {
      // Create hunt as draft
      try {
        const response = await apiRequest("POST", "/api/user-hunts", { ...huntData, isDraft: true });
        const hunt = await response.json();
        setCreatedHuntId(hunt.id);
        
        // Save any temporary clues
        if (clues.length > 0) {
          const cluePromises = clues.map((clue, index) =>
            apiRequest("POST", `/api/user-hunts/${hunt.id}/clues`, {
              title: clue.title,
              clueText: clue.clueText,
              narrative: clue.narrative,
              challenge: clue.challenge,
              correctAnswer: clue.correctAnswer,
              locationHint: clue.locationHint,
              coordinates: clue.coordinates,
              order: index + 1,
            })
          );
          await Promise.all(cluePromises);
        }
        
        toast({
          title: "Progress saved!",
          description: `Your hunt has been saved as a draft${clues.length > 0 ? ` with ${clues.length} clue(s)` : ''}. You can continue editing later.`,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
      } catch (error: any) {
        toast({
          title: "Error saving progress",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } else {
      // Update existing hunt and save any new temporary clues
      try {
        await updateHuntMutation.mutateAsync(huntData);
        
        // Save any temporary clues (those with temp- IDs)
        const tempClues = clues.filter(c => c.id.startsWith('temp-'));
        if (tempClues.length > 0) {
          const cluePromises = tempClues.map((clue, index) =>
            apiRequest("POST", `/api/user-hunts/${createdHuntId}/clues`, {
              title: clue.title,
              clueText: clue.clueText,
              narrative: clue.narrative,
              challenge: clue.challenge,
              correctAnswer: clue.correctAnswer,
              locationHint: clue.locationHint,
              coordinates: clue.coordinates,
              order: clues.length + index + 1,
            })
          );
          await Promise.all(cluePromises);
          
          toast({
            title: "Progress saved!",
            description: `Hunt updated and ${tempClues.length} new clue(s) saved.`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Error saving progress",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }
  };

  const onInviteSubmit = (data: InviteInfo) => {
    sendInvitationMutation.mutate(data);
  };

  const handleDeployHunt = async () => {
    if (!createdHuntId) {
      toast({
        title: "No hunt to deploy",
        description: "Please create a hunt first.",
        variant: "destructive",
      });
      return;
    }

    if (clues.length === 0) {
      toast({
        title: "Cannot deploy hunt",
        description: "Please add at least one clue before deploying.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user email from auth
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to authenticate user');
      }
      
      const user = await userResponse.json();

      deployHuntMutation.mutate({
        email: user.email,
        huntId: createdHuntId,
        amount: 50, // 50 KES deployment fee
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate deployment",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = () => {
    if (!currentHunt?.inviteCode) return;
    
    const shareUrl = `${window.location.origin}/join-hunt/${currentHunt.inviteCode}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copied!",
        description: "Share this link with your friends to invite them to your hunt.",
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Accepted</Badge>;
      case "declined":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Declined</Badge>;
      default:
        return <Badge variant="secondary"><Mail className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Build Own Hunt</h1>
          <p className="text-gray-600">Create an engaging scavenger hunt for friends, family, or the community</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-hunts" data-testid="tab-my-hunts">
              My Hunts ({myHunts.length})
            </TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-preview">
              Preview & Deploy
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Hunts Tab */}
          <TabsContent value="my-hunts" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Hunts</h2>
              <Button onClick={startNewHunt} data-testid="button-create-new-hunt">
                <Plus className="h-4 w-4 mr-2" />
                Create New Hunt
              </Button>
            </div>

            {myHuntsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading your hunts...</p>
              </div>
            ) : myHunts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hunts yet</h3>
                  <p className="text-gray-600 mb-6">Create your first scavenger hunt to get started</p>
                  <Button onClick={startNewHunt} data-testid="button-start-first-hunt">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Hunt
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myHunts.map((hunt) => (
                  <Card key={hunt.id} data-testid={`card-hunt-${hunt.id}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{hunt.title}</h3>
                            {hunt.status === 'active' ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{hunt.description}</p>
                          <div className="flex gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {hunt.theme}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(hunt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadHuntForEditing(hunt)}
                            data-testid={`button-edit-hunt-${hunt.id}`}
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                                data-testid={`button-delete-hunt-${hunt.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Hunt?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{hunt.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteHunt(hunt.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Create New Hunt Form - Shown inline when creating */}
            {showCreateHuntDialog && createHuntStep === 'info' && (
              <Card className="border-2 border-orange-300">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Create New Hunt - Step 1: Hunt Information
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCreateHuntDialog(false);
                        setClues([]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...huntForm}>
                    <form onSubmit={huntForm.handleSubmit((data) => {
                      setCreateHuntStep('clues');
                      toast({ title: "Hunt info saved", description: "Now add clues to your hunt" });
                    })} className="space-y-4">
                      <FormField
                        control={huntForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hunt Title *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter a catchy title for your hunt"
                                data-testid="input-hunt-title"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={huntForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your hunt - what makes it special?"
                                className="min-h-[100px]"
                                data-testid="input-hunt-description"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={huntForm.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-hunt-theme">
                                  <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="city-walk">City Walk</SelectItem>
                                <SelectItem value="heritage">Heritage</SelectItem>
                                <SelectItem value="nature">Nature</SelectItem>
                                <SelectItem value="adventure">Adventure</SelectItem>
                                <SelectItem value="cultural">Cultural</SelectItem>
                                <SelectItem value="educational">Educational</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleSaveProgress}
                          className="flex-1"
                          data-testid="button-save-progress"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Progress
                        </Button>
                        <Button type="submit" className="flex-1" data-testid="button-next-to-clues">
                          Next: Add Clues
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Add Clues - Step 2 */}
            {showCreateHuntDialog && createHuntStep === 'clues' && (
              <div className="space-y-6">
                <Card className="border-2 border-orange-300">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Create New Hunt - Step 2: Add Clues
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateHuntStep('info')}
                        >
                          Back
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowCreateHuntDialog(false);
                            setClues([]);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          Add clues to guide participants through your hunt. You need at least one clue.
                        </p>
                        <Button 
                          onClick={() => setShowClueForm(true)}
                          data-testid="button-add-clue"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Clue
                        </Button>
                      </div>

                      {/* Clue Form */}
                      {showClueForm && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">{editingClue ? "Edit Clue" : "Add New Clue"}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...clueForm}>
                              <form onSubmit={clueForm.handleSubmit(onClueSubmit)} className="space-y-4">
                                <FormField
                                  control={clueForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Clue Title *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., The Starting Point" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={clueForm.control}
                                  name="clueText"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Clue Text *</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="The clue that participants will see"
                                          className="min-h-[80px]"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={clueForm.control}
                                  name="narrative"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Narrative (optional)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Background story or context for this clue"
                                          className="min-h-[60px]"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={clueForm.control}
                                  name="challenge"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Challenge (optional)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Additional challenge or task for this clue"
                                          className="min-h-[60px]"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={clueForm.control}
                                  name="correctAnswer"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Correct Answer *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="The answer participants must provide to unlock the next clue"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={clueForm.control}
                                  name="locationHint"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Location Hint (optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., Near the old clock tower" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="flex gap-2">
                                  <Button type="submit" data-testid="button-save-clue">
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingClue ? "Update Clue" : "Save Clue"}
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                      setShowClueForm(false);
                                      setEditingClue(null);
                                      clueForm.reset();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                      )}

                      {/* Clues List */}
                      <div className="space-y-3">
                        {clues.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">No clues added yet</p>
                          </div>
                        ) : (
                          clues.map((clue, index) => (
                            <Card key={clue.id}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline">Clue {index + 1}</Badge>
                                      <span className="font-medium">{clue.title}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">{clue.clueText}</p>
                                    {clue.locationHint && (
                                      <p className="text-xs text-gray-500 mt-1">📍 {clue.locationHint}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => editClue(clue)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => deleteClue(clue.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveProgress}
                          disabled={updateHuntMutation.isPending}
                          variant="outline"
                          className="flex-1"
                          data-testid="button-save-progress-clues"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateHuntMutation.isPending ? "Saving..." : "Save Progress"}
                        </Button>
                        
                        {clues.length > 0 && (
                          <Button
                            onClick={handleCreateHunt}
                            disabled={createHuntMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            data-testid="button-create-hunt"
                          >
                            <Rocket className="h-5 w-5 mr-2" />
                            {createHuntMutation.isPending ? "Creating..." : "Create Hunt"}
                          </Button>
                        )}
                      </div>

                      {clues.length > 0 && (
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-700">
                            You have <strong>{clues.length} clue{clues.length > 1 ? 's' : ''}</strong> ready. 
                            Click <strong>Create Hunt</strong> to save everything!
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Hunt Information Tab - Hidden from tab list but kept for editing */}
          <TabsContent value="info" className="space-y-6" style={{display: 'none'}}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...huntForm}>
                  <form onSubmit={huntForm.handleSubmit(onHuntSubmit)} className="space-y-4">
                    <FormField
                      control={huntForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hunt Title *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a catchy title for your hunt"
                              data-testid="input-hunt-title"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={huntForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your hunt - what makes it special?"
                              className="min-h-[100px]"
                              data-testid="input-hunt-description"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={huntForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-hunt-theme">
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="city-walk">City Walk</SelectItem>
                              <SelectItem value="heritage">Heritage</SelectItem>
                              <SelectItem value="nature">Nature</SelectItem>
                              <SelectItem value="adventure">Adventure</SelectItem>
                              <SelectItem value="cultural">Cultural</SelectItem>
                              <SelectItem value="educational">Educational</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <Button 
                      type="submit" 
                      disabled={createHuntMutation.isPending || updateHuntMutation.isPending}
                      data-testid="button-save-hunt-info"
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createHuntMutation.isPending || updateHuntMutation.isPending 
                        ? "Saving..." 
                        : createdHuntId 
                        ? "Save Progress" 
                        : "Next: Add Clues"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clues Tab */}
          <TabsContent value="clues" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Hunt Clues</h2>
              <Button 
                onClick={() => setShowClueForm(true)}
                data-testid="button-add-clue"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Clue
              </Button>
            </div>
            
            {!createdHuntId && clues.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  Add at least one clue, then click "Create Hunt" below to save everything.
                </p>
              </div>
            )}

            {/* Clue Form */}
            {showClueForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingClue ? "Edit Clue" : "Add New Clue"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...clueForm}>
                  <form onSubmit={clueForm.handleSubmit(onClueSubmit)} className="space-y-4">
                      <FormField
                        control={clueForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clue Title *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., The Historic Landmark"
                                data-testid="input-clue-title"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clueForm.control}
                        name="clueText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Clue Text *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What question or riddle will participants solve?"
                                data-testid="input-clue-text"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clueForm.control}
                        name="narrative"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Narrative (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Background story or context for this clue"
                                data-testid="input-clue-narrative"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clueForm.control}
                        name="challenge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Challenge (optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What specific challenge or task should participants complete?"
                                data-testid="input-clue-challenge"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clueForm.control}
                        name="locationHint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Hint (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="A helpful hint about the location"
                                data-testid="input-clue-location-hint"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={clueForm.control}
                        name="coordinates"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coordinates (optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., -1.286389, 36.817223"
                                data-testid="input-clue-coordinates"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={createClueMutation.isPending || updateClueMutation.isPending}
                          data-testid="button-save-clue"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {createClueMutation.isPending || updateClueMutation.isPending ? "Saving..." : editingClue ? "Update Clue" : "Save Clue"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowClueForm(false);
                            setEditingClue(null);
                            clueForm.reset();
                          }}
                          data-testid="button-cancel-clue"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Clues List */}
            <div className="space-y-4">
              {clues.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No clues added yet</p>
                    <p className="text-sm text-gray-500 mt-2">Add your first clue to get started</p>
                  </CardContent>
                </Card>
              ) : (
                clues.map((clue, index) => (
                  <Card key={clue.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Clue {index + 1}</Badge>
                            <h3 className="font-semibold">{clue.title}</h3>
                          </div>
                          <p className="text-gray-600 mb-2">{clue.clueText}</p>
                          {clue.narrative && (
                            <p className="text-sm text-gray-500 mb-1">
                              Narrative: <span className="font-medium">{clue.narrative}</span>
                            </p>
                          )}
                          {clue.challenge && (
                            <p className="text-sm text-gray-500 mb-1">
                              Challenge: <span className="font-medium">{clue.challenge}</span>
                            </p>
                          )}
                          {clue.locationHint && (
                            <p className="text-sm text-gray-500">
                              Location Hint: <span className="font-medium">{clue.locationHint}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => editClue(clue)}
                            data-testid={`button-edit-clue-${index}`}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteClue(clue.id)}
                            disabled={deleteClueMutation.isPending}
                            data-testid={`button-delete-clue-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Create Hunt Button - Only shown for new hunts */}
            {!createdHuntId && clues.length > 0 && (
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create Your Hunt?</h3>
                      <p className="text-gray-600">
                        You have {clues.length} clue{clues.length > 1 ? 's' : ''} ready. Click below to save your hunt!
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateHunt}
                      disabled={createHuntMutation.isPending}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
                      data-testid="button-create-hunt"
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      {createHuntMutation.isPending ? "Creating..." : "Create Hunt"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Privacy & Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...huntForm}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Public Hunt</h4>
                      <p className="text-sm text-gray-600">Make this hunt discoverable by other users</p>
                    </div>
                    <FormField
                      control={huntForm.control}
                      name="isPublic"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-hunt-public"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Invite Friends</h4>
                    <p className="text-sm text-gray-600">Share your hunt with specific people</p>
                  </div>
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={!createdHuntId}
                        data-testid="button-invite-friends"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Invite Friends</DialogTitle>
                        <DialogDescription>
                          Share this hunt with friends via email. They'll receive an invitation to collaborate.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...inviteForm}>
                        <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="space-y-4">
                          <FormField
                            control={inviteForm.control}
                            name="invitedEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="friend@example.com" 
                                    {...field} 
                                    data-testid="input-invite-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={sendInvitationMutation.isPending}
                            data-testid="button-send-invitation"
                          >
                            {sendInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
                          </Button>
                        </form>
                      </Form>

                      {invitations.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Sent Invitations</h4>
                            {invitations.map((invitation) => (
                              <div 
                                key={invitation.id} 
                                className="flex items-center justify-between p-2 rounded-lg border"
                                data-testid={`invitation-${invitation.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{invitation.invitedEmail}</span>
                                </div>
                                {getStatusBadge(invitation.status)}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Share Link</h4>
                    <p className="text-sm text-gray-600">Anyone with this link can view and join your hunt</p>
                  </div>
                  {currentHunt?.inviteCode ? (
                    <div className="flex gap-2">
                      <Input 
                        value={`${window.location.origin}/join-hunt/${currentHunt.inviteCode}`}
                        readOnly
                        className="font-mono text-sm"
                        data-testid="input-share-link"
                      />
                      <Button
                        onClick={copyShareLink}
                        variant="outline"
                        data-testid="button-copy-share-link"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Create your hunt first to get a shareable link</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Hunt Preview</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentHunt) {
                        // Load the hunt for editing
                        loadHuntForEditing(currentHunt);
                        // Open the edit dialog
                        setShowCreateHuntDialog(true);
                        setCreateHuntStep('clues');
                      }
                    }}
                    disabled={!currentHunt}
                    data-testid="button-edit-hunt"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Hunt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{huntForm.watch("title") || "Untitled Hunt"}</h3>
                    <p className="text-gray-600 mb-4">{huntForm.watch("description") || "No description"}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {huntForm.watch("theme") && (
                        <Badge variant="secondary">{huntForm.watch("theme")}</Badge>
                      )}
                      <Badge variant="outline">
                        {huntForm.watch("isPublic") ? "Public" : "Private"}
                      </Badge>
                      <Badge variant="outline">
                        {huntForm.watch("isDraft") ? "Draft" : "Published"}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-3">Clues ({clues.length})</h4>
                    {clues.length === 0 ? (
                      <p className="text-gray-500 text-sm">No clues added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {clues.map((clue, index) => (
                          <div key={clue.id} className="border-2 border-gray-200 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-orange-100">Clue {index + 1}</Badge>
                              <span className="font-semibold">{clue.title}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">Clue Text</p>
                                <p className="text-sm text-gray-700">{clue.clueText}</p>
                              </div>
                              
                              {clue.narrative && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase mt-2">Narrative</p>
                                  <p className="text-sm text-gray-600 italic">{clue.narrative}</p>
                                </div>
                              )}
                              
                              {clue.challenge && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase mt-2">Challenge</p>
                                  <p className="text-sm text-gray-600">{clue.challenge}</p>
                                </div>
                              )}
                              
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase mt-2">Correct Answer</p>
                                <p className="text-sm font-medium text-green-700">{clue.correctAnswer}</p>
                              </div>
                              
                              {clue.locationHint && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase mt-2">Location Hint</p>
                                  <p className="text-sm text-gray-600">{clue.locationHint}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                          <p className="text-blue-800">
                            <strong>Sequential Flow:</strong> Players will solve these clues one at a time. 
                            Each clue unlocks only after the previous one is answered correctly.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deploy Hunt Section - Only shown if hunt is created */}
            {createdHuntId && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Deploy?</h3>
                      <p className="text-gray-600">
                        Deploy your hunt to make it live and accessible to participants. Deployment costs 50 KES via M-Pesa.
                      </p>
                    </div>
                    <Button
                      onClick={handleDeployHunt}
                      disabled={!createdHuntId || clues.length === 0 || deployHuntMutation.isPending}
                      size="lg"
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
                      data-testid="button-deploy-hunt"
                    >
                      <Rocket className="h-5 w-5 mr-2" />
                      {deployHuntMutation.isPending ? "Processing..." : "Deploy Hunt (50 KES)"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}