import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Zap } from "lucide-react";

interface DeploymentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hunt: {
    id: string;
    title: string;
    description?: string;
    deploymentPrice: string;
    status: string;
  } | null;
  onSuccess: () => void;
}

export function DeploymentPaymentModal({ isOpen, onClose, hunt, onSuccess }: DeploymentPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deploymentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !hunt) {
        throw new Error("Authentication required");
      }

      setIsProcessing(true);
      
      // Initialize deployment payment with Paystack
      const response = await apiRequest("POST", "/api/deploy-hunt", {
        email: user.email,
        huntId: hunt.id,
        amount: parseFloat(hunt.deploymentPrice),
      });
      
      const paymentData = await response.json();
      
      // Open Paystack popup or redirect
      if (paymentData.data && paymentData.data.authorization_url) {
        window.open(paymentData.data.authorization_url, '_blank', 'width=600,height=600');
        
        // Poll for payment verification
        const reference = paymentData.data.reference;
        const pollVerification = async () => {
          try {
            const verifyResponse = await apiRequest("GET", `/api/verify/${reference}`);
            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              setIsProcessing(false);
              toast({
                title: "Hunt Deployed Successfully!",
                description: `${hunt.title} is now live and participants can join`,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/user-hunts"] });
              onSuccess();
              onClose();
            } else {
              // Continue polling
              setTimeout(pollVerification, 3000);
            }
          } catch (error) {
            // Continue polling on error (payment might still be processing)
            setTimeout(pollVerification, 3000);
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollVerification, 5000);
      } else {
        throw new Error("Failed to initialize deployment payment");
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hunt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto" data-testid="deployment-payment-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-saka-orange" />
            Deploy Hunt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Hunt Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900" data-testid="hunt-title">{hunt.title}</h3>
                {hunt.description && (
                  <p className="text-sm text-gray-600 mt-1" data-testid="hunt-description">
                    {hunt.description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="ml-2" data-testid="hunt-status">
                {hunt.status === 'draft' ? 'Draft' : 'Active'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="font-medium text-gray-900">Deployment Price:</span>
              <span className="text-xl font-bold text-saka-orange" data-testid="deployment-price">
                KES {parseFloat(hunt.deploymentPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">After deployment:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-green-500" />
                <span>Hunt becomes live and playable</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Participants can join using invite codes</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-saka-orange" />
                <span>Real-time multiplayer functionality enabled</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" data-testid="mpesa-option" />
                <Label htmlFor="mpesa" className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">M-Pesa</span>
                  <span className="text-sm text-gray-500">(Mobile Money)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deploymentMutation.mutate()}
              disabled={isProcessing}
              className="flex-1 bg-saka-orange hover:bg-saka-orange/90"
              data-testid="button-deploy"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Hunt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}