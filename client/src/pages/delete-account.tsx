import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { removeAuthToken } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Layout } from "@/components/layout";
import axios from "axios";

export default function DeleteAccountPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [confirmationText, setConfirmationText] = useState("");
  const [acknowledgedData, setAcknowledgedData] = useState(false);
  const [acknowledgedPermanent, setAcknowledgedPermanent] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete('/api/account/delete', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      removeAuthToken();
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.response?.data?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = () => {
    if (!acknowledgedData || !acknowledgedPermanent) {
      toast({
        title: "Acknowledgment Required",
        description: "Please acknowledge all confirmations before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (confirmationText.toLowerCase().trim() !== "delete my account") {
      toast({
        title: "Confirmation Failed",
        description: 'Please type "DELETE MY ACCOUNT" exactly as shown.',
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmDialog(false);
    deleteAccountMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isFormValid = acknowledgedData && acknowledgedPermanent && confirmationText.toLowerCase().trim() === "delete my account";

  return (
    <Layout showBottomNav={false}>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/settings">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <i className="fas fa-arrow-left text-saka-dark"></i>
              </button>
            </Link>
            <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Warning Banner */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl mt-1"></i>
              <div>
                <h3 className="font-bold text-red-900 mb-2">Warning: This Action is Permanent</h3>
                <p className="text-red-800">
                  Deleting your account is permanent and cannot be undone. All your data will be permanently removed from our systems.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Will Be Deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-database text-red-600 mr-2"></i>
              What Will Be Deleted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <i className="fas fa-user text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Profile Information</h4>
                  <p className="text-sm text-gray-600">Your name, email, and all account settings</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-chart-line text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Hunt Progress & Achievements</h4>
                  <p className="text-sm text-gray-600">All hunt completions, points earned, and badges</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-shopping-bag text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Purchase History</h4>
                  <p className="text-sm text-gray-600">All payment records and purchased hunts</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-crown text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Subscriptions</h4>
                  <p className="text-sm text-gray-600">Active subscription will be cancelled</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-map text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Created Hunts</h4>
                  <p className="text-sm text-gray-600">All hunts you've created and their clues</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-envelope text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Hunt Invitations</h4>
                  <p className="text-sm text-gray-600">All sent and received hunt invitations</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <i className="fas fa-users text-gray-600 mt-1"></i>
                <div>
                  <h4 className="font-semibold text-saka-dark">Hunt Sessions</h4>
                  <p className="text-sm text-gray-600">All multiplayer hunt sessions and participation records</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternatives */}
        <Card>
          <CardHeader>
            <CardTitle className="text-saka-dark flex items-center">
              <i className="fas fa-lightbulb text-saka-orange mr-2"></i>
              Consider These Alternatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-saka-dark mb-1">Download Your Data</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Export all your hunt data, progress, and achievements before deleting.
                </p>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    <i className="fas fa-download mr-2"></i>
                    Download Data
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-saka-dark mb-1">Update Privacy Settings</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Control what data is shared and how your account is used.
                </p>
                <Link to="/settings">
                  <Button variant="outline" size="sm">
                    <i className="fas fa-shield-alt mr-2"></i>
                    Privacy Settings
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-saka-dark mb-1">Contact Support</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Have concerns? Our support team is here to help.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:support@sakaquest.com">
                    <i className="fas fa-envelope mr-2"></i>
                    Contact Us
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <i className="fas fa-trash-alt mr-2"></i>
              Confirm Account Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Acknowledgment Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acknowledge-data"
                  checked={acknowledgedData}
                  onCheckedChange={(checked) => setAcknowledgedData(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="acknowledge-data"
                  className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                >
                  I understand that all my hunt progress, achievements, purchases, and created hunts will be permanently deleted.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acknowledge-permanent"
                  checked={acknowledgedPermanent}
                  onCheckedChange={(checked) => setAcknowledgedPermanent(checked as boolean)}
                  className="mt-1"
                />
                <label
                  htmlFor="acknowledge-permanent"
                  className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                >
                  I understand that this action is permanent and cannot be reversed. My data cannot be recovered once deleted.
                </label>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <Label htmlFor="confirm-text" className="block text-sm font-medium text-saka-dark mb-2">
                Type "DELETE MY ACCOUNT" to confirm
              </Label>
              <Input
                id="confirm-text"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-2">
                This confirmation is case-insensitive
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/settings" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-3 px-6 rounded-xl font-semibold border-gray-300 hover:bg-gray-50"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Cancel
                </Button>
              </Link>

              <Button
                type="button"
                onClick={handleDeleteClick}
                disabled={!isFormValid || deleteAccountMutation.isPending}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt mr-2"></i>
                    Delete My Account
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy Link */}
        <div className="text-center text-sm text-gray-600">
          <p>
            For more information about how we handle your data, see our{" "}
            <Link to="/privacy" className="text-saka-orange hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Final Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold">
                Are you absolutely sure you want to delete your account?
              </p>
              <p>
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and account settings</li>
                <li>All hunt progress and achievements</li>
                <li>Purchase history and subscriptions</li>
                <li>Created hunts and invitations</li>
              </ul>
              <p className="font-semibold text-red-600">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

