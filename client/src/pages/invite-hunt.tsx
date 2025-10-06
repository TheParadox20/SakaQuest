import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Copy, 
  Share2, 
  Mail, 
  Users, 
  MapPin, 
  Check,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema for sending invitations
const inviteEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteEmailForm = z.infer<typeof inviteEmailSchema>;

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

interface HuntInvitation {
  id: string;
  huntId: string;
  invitedUserId: string;
  invitedEmail: string;
  inviteToken: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
}

export default function InviteHuntPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Get hunt ID from URL params
  const huntId = new URLSearchParams(window.location.search).get("huntId");

  // Redirect if no hunt ID
  if (!huntId) {
    setLocation("/my-hunts");
    return null;
  }

  // Email invitation form
  const form = useForm<InviteEmailForm>({
    resolver: zodResolver(inviteEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Fetch hunt details
  const { data: hunt, isLoading: huntLoading, isError: huntError, refetch: refetchHunt } = useQuery<UserCreatedHunt>({
    queryKey: ["/api/user-hunts", huntId],
    retry: 2,
  });

  // Fetch existing invitations
  const { data: invitations = [], isLoading: invitationsLoading, isError: invitationsError, refetch: refetchInvitations } = useQuery<HuntInvitation[]>({
    queryKey: ["/api/user-hunts", huntId, "invitations"],
    retry: 2,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/user-hunts/${huntId}/invitations`, { invitedEmail: email });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "Your hunt invitation has been sent successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user-hunts", huntId, "invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error sending invitation",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteEmailForm) => {
    sendInvitationMutation.mutate(data.email);
  };

  const copyInviteCode = () => {
    if (hunt?.inviteCode) {
      navigator.clipboard.writeText(hunt.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: "Code copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const copyInviteLink = () => {
    if (hunt?.inviteCode) {
      const link = `${window.location.origin}/join-hunt/${hunt.inviteCode}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({
        title: "Link copied!",
        description: "Invite link copied to clipboard",
      });
    }
  };

  const shareInvite = () => {
    if (hunt && navigator.share) {
      navigator.share({
        title: `Join my hunt: ${hunt.title}`,
        text: `I've created an exciting scavenger hunt called "${hunt.title}". Join me!`,
        url: `${window.location.origin}/join-hunt/${hunt.inviteCode}`,
      });
    } else {
      copyInviteLink();
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
                {error?.message || "Something went wrong. Please check your connection and try again."}
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

  if (huntLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (huntError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <ErrorPanel 
            error={huntError} 
            onRetry={() => refetchHunt()}
            title="Failed to load hunt"
          />
        </div>
      </Layout>
    );
  }

  if (!hunt) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Hunt not found</h3>
              <p className="text-gray-600 mb-6">The hunt you're looking for doesn't exist or you don't have access to it.</p>
              <Link href="/my-hunts">
                <Button>Back to My Hunts</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/my-hunts">
              <Button variant="outline" size="sm">
                ← Back to My Hunts
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Friends</h1>
          <p className="text-gray-600">Share your hunt and invite others to join the adventure</p>
        </div>

        {/* Hunt Preview */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{hunt.title}</CardTitle>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getThemeColor(hunt.theme)} variant="outline">
                    {hunt.theme.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {hunt.isDraft && <Badge variant="outline">Draft</Badge>}
                  {hunt.isPublic && <Badge variant="secondary">Public</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{hunt.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Invite Code: {hunt.inviteCode}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Created {new Date(hunt.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Share */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Quick Share
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <div className="flex gap-2">
                  <Input
                    value={hunt.inviteCode}
                    readOnly
                    className="font-mono"
                    data-testid="input-invite-code"
                  />
                  <Button
                    variant="outline"
                    onClick={copyInviteCode}
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Share this code for others to join your hunt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/join-hunt/${hunt.inviteCode}`}
                    readOnly
                    className="text-sm"
                    data-testid="input-invite-link"
                  />
                  <Button
                    variant="outline"
                    onClick={copyInviteLink}
                    data-testid="button-copy-link"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={shareInvite}
                className="w-full"
                data-testid="button-share-invite"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Hunt
              </Button>
            </CardContent>
          </Card>

          {/* Email Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Email Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="friend@example.com"
                            data-testid="input-invite-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={sendInvitationMutation.isPending}
                    className="w-full"
                    data-testid="button-send-invitation"
                  >
                    {sendInvitationMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sent Invitations */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sent Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invitationsError ? (
              <ErrorPanel 
                error={invitationsError} 
                onRetry={() => refetchInvitations()}
                title="Failed to load invitations"
              />
            ) : invitationsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No invitations sent yet</p>
                <p className="text-sm text-gray-500">Send your first invitation above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-saka-orange text-white text-sm">
                          {invitation.invitedEmail.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{invitation.invitedEmail}</p>
                        <p className="text-sm text-gray-500">
                          Sent {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        invitation.status === "accepted" ? "default" : 
                        invitation.status === "declined" ? "destructive" : "outline"
                      }
                    >
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}