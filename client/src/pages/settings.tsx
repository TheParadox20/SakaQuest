import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { removeAuthToken } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: false,
    huntReminders: true,
    achievements: true,
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    shareProgress: false,
    locationTracking: true,
  });

  const [profilePicture, setProfilePicture] = useState("/api/placeholder/100/100");

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // In a real app, this would call a backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notifications) => {
      // In a real app, this would call a backend API
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    },
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: typeof privacy) => {
      // In a real app, this would call a backend API
      await new Promise(resolve => setTimeout(resolve, 500));
      return settings;
    },
    onSuccess: () => {
      toast({
        title: "Privacy Updated",
        description: "Your privacy settings have been saved.",
      });
    },
  });

  const handleLogout = () => {
    removeAuthToken();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
  };

  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    const newSettings = { ...notifications, [key]: value };
    setNotifications(newSettings);
    updateNotificationsMutation.mutate(newSettings);
  };

  const handlePrivacyChange = (key: keyof typeof privacy, value: boolean) => {
    const newSettings = { ...privacy, [key]: value };
    setPrivacy(newSettings);
    updatePrivacyMutation.mutate(newSettings);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <i className="fas fa-arrow-left text-saka-dark"></i>
              </button>
            </Link>
            <h2 className="text-xl font-bold text-saka-dark">Settings</h2>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-user text-saka-orange mr-2"></i>
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="w-24 h-24 border-4 border-saka-orange/20">
                  <AvatarImage src={profilePicture} alt={user.name} />
                  <AvatarFallback className="bg-saka-orange text-white text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-saka-orange rounded-full flex items-center justify-center shadow-lg hover:bg-orange-600 transition-colors">
                  <i className="fas fa-camera text-white text-sm"></i>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Click to update profile picture</p>
            </div>

            {/* Profile Form */}
            <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-saka-dark mb-2">Name</Label>
                <Input
                  id="name"
                  {...profileForm.register("name")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent"
                />
                {profileForm.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-saka-dark mb-2">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register("email")}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent"
                />
                {profileForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full bg-saka-orange text-white hover:bg-orange-600 py-3 px-6 rounded-xl font-semibold"
              >
                {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-bell text-saka-orange mr-2"></i>
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive instant updates on your device</p>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={(value) => handleNotificationChange('pushNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Email Notifications</h4>
                <p className="text-sm text-gray-600">Get updates via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Hunt Reminders</h4>
                <p className="text-sm text-gray-600">Reminders for ongoing hunts</p>
              </div>
              <Switch
                checked={notifications.huntReminders}
                onCheckedChange={(value) => handleNotificationChange('huntReminders', value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Achievement Alerts</h4>
                <p className="text-sm text-gray-600">Celebrate your accomplishments</p>
              </div>
              <Switch
                checked={notifications.achievements}
                onCheckedChange={(value) => handleNotificationChange('achievements', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-shield-alt text-saka-orange mr-2"></i>
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Public Profile</h4>
                <p className="text-sm text-gray-600">Allow others to see your profile</p>
              </div>
              <Switch
                checked={privacy.profileVisible}
                onCheckedChange={(value) => handlePrivacyChange('profileVisible', value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Share Progress</h4>
                <p className="text-sm text-gray-600">Let friends see your hunt progress</p>
              </div>
              <Switch
                checked={privacy.shareProgress}
                onCheckedChange={(value) => handlePrivacyChange('shareProgress', value)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="font-medium text-saka-dark">Location Tracking</h4>
                <p className="text-sm text-gray-600">Enable location for hunt features</p>
              </div>
              <Switch
                checked={privacy.locationTracking}
                onCheckedChange={(value) => handlePrivacyChange('locationTracking', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-cog text-saka-orange mr-2"></i>
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full py-3 px-6 rounded-xl font-semibold border-gray-300 hover:bg-gray-50"
            >
              <i className="fas fa-key mr-2"></i>
              Change Password
            </Button>

            <Button 
              variant="outline" 
              className="w-full py-3 px-6 rounded-xl font-semibold border-gray-300 hover:bg-gray-50"
            >
              <i className="fas fa-download mr-2"></i>
              Download My Data
            </Button>

            <Button 
              onClick={handleLogout}
              variant="outline" 
              className="w-full py-3 px-6 rounded-xl font-semibold border-red-300 text-red-600 hover:bg-red-50"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Logout
            </Button>

            <Button 
              variant="outline" 
              className="w-full py-3 px-6 rounded-xl font-semibold border-red-500 text-red-600 hover:bg-red-50"
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

    </Layout>
  );
}