import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAuthToken } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Hunt {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  price: string;
  coverImageUrl: string;
}

interface Clue {
  id?: string;
  huntId?: string;
  order: number;
  clueText: string;
  answer: string;
  hint?: string;
  locationHint: string;
  coordinates?: string;
  points: number;
  imageUrl?: string;
  narrative?: string;
}

interface User {
  id: string;
  isAdmin: boolean;
}

export default function AdminHuntForm() {
  const params = useParams();
  const huntId = params.huntId;
  const isEditMode = !!huntId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [price, setPrice] = useState("300");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [clues, setClues] = useState<Clue[]>([]);
  const [deleteClueId, setDeleteClueId] = useState<string | null>(null);
  const [isAddClueDialogOpen, setIsAddClueDialogOpen] = useState(false);
  const [newClue, setNewClue] = useState<Clue>({
    order: 1,
    clueText: "",
    answer: "",
    hint: "",
    locationHint: "",
    coordinates: "",
    points: 100,
    imageUrl: "",
    narrative: "",
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!getAuthToken(),
  });

  const { data: existingHunt, isLoading } = useQuery<Hunt>({
    queryKey: [`/api/admin/hunts/${huntId}`],
    enabled: isEditMode && !!getAuthToken(),
  });

  const { data: existingClues } = useQuery<Clue[]>({
    queryKey: [`/api/clues/${huntId}`],
    enabled: isEditMode && !!getAuthToken(),
  });

  useEffect(() => {
    if (existingHunt) {
      setTitle(existingHunt.title);
      setDescription(existingHunt.description);
      setDifficulty(existingHunt.difficulty);
      setPrice(existingHunt.price);
      setCoverImageUrl(existingHunt.coverImageUrl);
    }
  }, [existingHunt]);

  useEffect(() => {
    if (existingClues && existingClues.length > 0) {
      setClues(existingClues);
    }
  }, [existingClues]);

  const saveHuntMutation = useMutation({
    mutationFn: async (huntData: any) => {
      const url = isEditMode ? `/api/admin/hunts/${huntId}` : "/api/admin/hunts";
      const method = isEditMode ? "PUT" : "POST";
      const response = await apiRequest(method, url, huntData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hunts"] });
      toast({
        title: isEditMode ? "Hunt Updated" : "Hunt Created",
        description: isEditMode
          ? "Your changes have been saved successfully."
          : "New hunt created successfully!",
      });
      setLocation("/admin/hunts");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save hunt",
        variant: "destructive",
      });
    },
  });

  const saveCluesMutation = useMutation({
    mutationFn: async (cluesData: Clue[]) => {
      const response = await apiRequest("POST", `/api/admin/hunts/${huntId}/clues`, {
        clues: cluesData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clues", huntId] });
      toast({
        title: "Clues Saved",
        description: "All clues have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save clues",
        variant: "destructive",
      });
    },
  });

  const deleteClueMutation = useMutation({
    mutationFn: async (clueId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/clues/${clueId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clues", huntId] });
      toast({
        title: "Clue Deleted",
        description: "The clue has been removed successfully.",
      });
      setDeleteClueId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete clue",
        variant: "destructive",
      });
    },
  });

  const handleSaveHunt = () => {
    if (!title || !description || !coverImageUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    saveHuntMutation.mutate({
      title,
      description,
      difficulty,
      price,
      coverImageUrl,
    });
  };

  const handleSaveClues = () => {
    if (clues.length === 0) {
      toast({
        title: "No Clues",
        description: "Please add at least one clue before saving.",
        variant: "destructive",
      });
      return;
    }

    const isValid = clues.every(
      (clue) => clue.clueText && clue.answer && clue.locationHint
    );

    if (!isValid) {
      toast({
        title: "Incomplete Clues",
        description: "Please fill in all required fields for each clue.",
        variant: "destructive",
      });
      return;
    }

    saveCluesMutation.mutate(clues);
  };

  const openAddClueDialog = () => {
    setNewClue({
      order: clues.length + 1,
      clueText: "",
      answer: "",
      hint: "",
      locationHint: "",
      coordinates: "",
      points: 100,
      imageUrl: "",
      narrative: "",
    });
    setIsAddClueDialogOpen(true);
  };

  const addClue = () => {
    if (!newClue.clueText || !newClue.answer || !newClue.locationHint) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required clue fields (Clue Text, Answer, Location Hint).",
        variant: "destructive",
      });
      return;
    }
    setClues([...clues, { ...newClue, order: clues.length + 1 }]);
    setIsAddClueDialogOpen(false);
    toast({
      title: "Clue Added",
      description: "The clue has been added. Don't forget to save all clues when done.",
    });
  };

  const cancelAddClue = () => {
    setIsAddClueDialogOpen(false);
  };

  const updateNewClue = (field: keyof Clue, value: any) => {
    setNewClue({ ...newClue, [field]: value });
  };

  const updateClue = (index: number, field: keyof Clue, value: any) => {
    const updatedClues = [...clues];
    updatedClues[index] = { ...updatedClues[index], [field]: value };
    setClues(updatedClues);
  };

  const removeClue = (index: number) => {
    const clue = clues[index];
    if (clue.id) {
      setDeleteClueId(clue.id);
    } else {
      const updatedClues = clues.filter((_, i) => i !== index);
      updatedClues.forEach((clue, i) => (clue.order = i + 1));
      setClues(updatedClues);
    }
  };

  const confirmDeleteClue = () => {
    if (deleteClueId) {
      deleteClueMutation.mutate(deleteClueId);
      const updatedClues = clues.filter((c) => c.id !== deleteClueId);
      updatedClues.forEach((clue, i) => (clue.order = i + 1));
      setClues(updatedClues);
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  if (isEditMode && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hunt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saka-orange/5 to-saka-gold/5">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-saka-dark">
                  {isEditMode ? "Edit Hunt" : "Create New Hunt"}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode ? "Update hunt details and clues" : "Design a new treasure hunt"}
                </p>
              </div>
            </div>
            <Link href="/admin/hunts">
              <Button variant="outline" className="gap-2" data-testid="button-exit-to-hunts">
                <i className="fas fa-times"></i>
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hunt Details Section */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-saka-dark mb-6 flex items-center gap-2">
            <i className="fas fa-info-circle text-saka-orange"></i>
            Hunt Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hunt Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter hunt title..."
                data-testid="input-hunt-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the hunt..."
                rows={4}
                data-testid="input-hunt-description"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (KES) *
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  data-testid="input-hunt-price"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image URL *
              </label>
              <Input
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                data-testid="input-hunt-cover-image"
              />
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="mt-2 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveHunt}
                disabled={saveHuntMutation.isPending}
                className="bg-gradient-to-r from-saka-orange to-saka-red text-white"
                data-testid="button-save-hunt"
              >
                {saveHuntMutation.isPending ? "Saving..." : isEditMode ? "Update Hunt" : "Create Hunt"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Clues Section - Only show if editing existing hunt */}
        {isEditMode && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-saka-dark flex items-center gap-2">
                <i className="fas fa-map-signs text-saka-green"></i>
                Clues Management
              </h2>
              <Button
                onClick={openAddClueDialog}
                variant="outline"
                className="gap-2"
                data-testid="button-add-clue"
              >
                <i className="fas fa-plus"></i>
                Add Clue
              </Button>
            </div>

            {clues.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <i className="fas fa-map-signs text-gray-300 text-4xl mb-4"></i>
                <p className="text-gray-600 mb-4">No clues yet. Add your first clue to get started!</p>
                <Button onClick={openAddClueDialog} className="bg-saka-green text-white">
                  <i className="fas fa-plus mr-2"></i>
                  Add First Clue
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {clues.map((clue, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4" data-testid={`clue-card-${index}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-saka-dark">Clue {clue.order}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => removeClue(index)}
                        data-testid={`button-delete-clue-${index}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Clue Text *
                        </label>
                        <Textarea
                          value={clue.clueText}
                          onChange={(e) => updateClue(index, "clueText", e.target.value)}
                          placeholder="Enter the clue..."
                          rows={3}
                          data-testid={`input-clue-text-${index}`}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer *
                          </label>
                          <Input
                            value={clue.answer}
                            onChange={(e) => updateClue(index, "answer", e.target.value)}
                            placeholder="Correct answer"
                            data-testid={`input-clue-answer-${index}`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hint (optional)
                          </label>
                          <Input
                            value={clue.hint || ""}
                            onChange={(e) => updateClue(index, "hint", e.target.value)}
                            placeholder="Hint after 3 attempts"
                            data-testid={`input-clue-hint-${index}`}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location Hint *
                          </label>
                          <Input
                            value={clue.locationHint}
                            onChange={(e) => updateClue(index, "locationHint", e.target.value)}
                            placeholder="e.g. Near Kenyatta Avenue"
                            data-testid={`input-clue-location-${index}`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Coordinates (optional)
                          </label>
                          <Input
                            value={clue.coordinates || ""}
                            onChange={(e) => updateClue(index, "coordinates", e.target.value)}
                            placeholder="-1.2921,36.8219"
                            data-testid={`input-clue-coordinates-${index}`}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Points *
                          </label>
                          <Input
                            type="number"
                            value={clue.points}
                            onChange={(e) => updateClue(index, "points", Number(e.target.value))}
                            data-testid={`input-clue-points-${index}`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL (optional)
                          </label>
                          <Input
                            value={clue.imageUrl || ""}
                            onChange={(e) => updateClue(index, "imageUrl", e.target.value)}
                            placeholder="https://example.com/clue-image.jpg"
                            data-testid={`input-clue-image-${index}`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Narrative (optional)
                        </label>
                        <Textarea
                          value={clue.narrative || ""}
                          onChange={(e) => updateClue(index, "narrative", e.target.value)}
                          placeholder="Story or fact revealed after solving this clue..."
                          rows={3}
                          data-testid={`input-clue-narrative-${index}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveClues}
                    disabled={saveCluesMutation.isPending}
                    className="bg-gradient-to-r from-saka-green to-emerald-600 text-white"
                    data-testid="button-save-clues"
                  >
                    {saveCluesMutation.isPending ? "Saving..." : "Save All Clues"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Add Clue Dialog */}
      <Dialog open={isAddClueDialogOpen} onOpenChange={setIsAddClueDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Clue</DialogTitle>
            <DialogDescription>
              Fill in the details for your new clue. Required fields are marked with *.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clue Text *
              </label>
              <Textarea
                value={newClue.clueText}
                onChange={(e) => updateNewClue("clueText", e.target.value)}
                placeholder="Enter the clue..."
                rows={3}
                data-testid="input-new-clue-text"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer *
                </label>
                <Input
                  value={newClue.answer}
                  onChange={(e) => updateNewClue("answer", e.target.value)}
                  placeholder="Correct answer"
                  data-testid="input-new-clue-answer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hint (optional)
                </label>
                <Input
                  value={newClue.hint || ""}
                  onChange={(e) => updateNewClue("hint", e.target.value)}
                  placeholder="Hint after 3 attempts"
                  data-testid="input-new-clue-hint"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Hint *
                </label>
                <Input
                  value={newClue.locationHint}
                  onChange={(e) => updateNewClue("locationHint", e.target.value)}
                  placeholder="e.g. Near Kenyatta Avenue"
                  data-testid="input-new-clue-location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coordinates (optional)
                </label>
                <Input
                  value={newClue.coordinates || ""}
                  onChange={(e) => updateNewClue("coordinates", e.target.value)}
                  placeholder="-1.2921,36.8219"
                  data-testid="input-new-clue-coordinates"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points *
                </label>
                <Input
                  type="number"
                  value={newClue.points}
                  onChange={(e) => updateNewClue("points", Number(e.target.value))}
                  data-testid="input-new-clue-points"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <Input
                  value={newClue.imageUrl || ""}
                  onChange={(e) => updateNewClue("imageUrl", e.target.value)}
                  placeholder="https://example.com/clue-image.jpg"
                  data-testid="input-new-clue-image"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narrative (optional)
              </label>
              <Textarea
                value={newClue.narrative || ""}
                onChange={(e) => updateNewClue("narrative", e.target.value)}
                placeholder="Story or fact revealed after solving this clue..."
                rows={3}
                data-testid="input-new-clue-narrative"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelAddClue}
              data-testid="button-cancel-add-clue"
            >
              Cancel
            </Button>
            <Button
              onClick={addClue}
              className="bg-gradient-to-r from-saka-green to-emerald-600 text-white"
              data-testid="button-save-new-clue"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Clue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Clue Confirmation Dialog */}
      <AlertDialog open={!!deleteClueId} onOpenChange={() => setDeleteClueId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clue?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this clue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClue}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Clue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
