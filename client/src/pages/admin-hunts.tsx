import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  price: string;
  coverImageUrl: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminHunts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteHuntId, setDeleteHuntId] = useState<string | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!getAuthToken(),
  });

  const { data: hunts = [], isLoading } = useQuery<Hunt[]>({
    queryKey: ["/api/admin/hunts"],
    enabled: !!getAuthToken(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (huntId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/hunts/${huntId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hunts"] });
      toast({
        title: "Hunt Deleted",
        description: "The hunt has been removed successfully.",
      });
      setDeleteHuntId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete hunt",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-saka-dark">Manage Hunts</h1>
                <p className="text-sm text-gray-500">View and edit all treasure hunts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="outline" className="gap-2" data-testid="button-exit-to-dashboard">
                  <i className="fas fa-times"></i>
                  Exit
                </Button>
              </Link>
              <Link href="/admin/hunts/new">
                <Button className="bg-gradient-to-r from-saka-orange to-saka-red text-white gap-2" data-testid="button-create-hunt">
                  <i className="fas fa-plus"></i>
                  Create New Hunt
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading hunts...</p>
          </div>
        ) : hunts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 card-shadow text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-map-marked-alt text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-saka-dark mb-2">No Hunts Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first treasure hunt to get started
            </p>
            <Link href="/admin/hunts/new">
              <Button className="bg-gradient-to-r from-saka-orange to-saka-red text-white">
                <i className="fas fa-plus mr-2"></i>
                Create Hunt
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hunts.map((hunt) => (
              <div key={hunt.id} className="bg-white rounded-2xl overflow-hidden card-shadow" data-testid={`hunt-card-${hunt.id}`}>
                <div className="relative h-48">
                  <img
                    src={hunt.coverImageUrl}
                    alt={hunt.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-saka-dark mb-2">{hunt.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {hunt.description}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-500">
                      <i className="fas fa-signal mr-1"></i>
                      {hunt.difficulty}
                    </span>
                    <span className="text-saka-gold font-semibold">
                      {hunt.price} KES
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/hunts/${hunt.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full gap-2" data-testid={`button-edit-${hunt.id}`}>
                        <i className="fas fa-edit"></i>
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                      onClick={() => setDeleteHuntId(hunt.id)}
                      data-testid={`button-delete-${hunt.id}`}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteHuntId} onOpenChange={() => setDeleteHuntId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hunt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this hunt and all its clues. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteHuntId && deleteMutation.mutate(deleteHuntId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Hunt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
