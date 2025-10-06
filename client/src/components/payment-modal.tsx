import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getAuthToken } from "@/lib/authUtils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hunt: {
    id: string;
    title: string;
    price: string;
    coverImageUrl: string;
    durationMinutes: number;
  } | null;
  onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, hunt, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user || !hunt) {
        throw new Error("Authentication required");
      }

      setIsProcessing(true);
      
      // Initialize payment with Paystack
      const response = await apiRequest("POST", "/api/pay", {
        email: user.email,
        amount: parseFloat(hunt.price),
        huntId: hunt.id,
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
                title: "Payment Successful!",
                description: `You now have access to ${hunt.title}`,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/hunts"] });
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
        throw new Error("Failed to initialize payment");
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!hunt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Purchase Hunt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Hunt Summary */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
            <img 
              src={hunt.coverImageUrl} 
              alt={hunt.title}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1">
              <h4 className="font-semibold text-saka-dark">{hunt.title}</h4>
              <p className="text-sm text-gray-600">Premium experience • {hunt.durationMinutes} minutes</p>
              <p className="text-lg font-bold text-saka-gold mt-1">KES {hunt.price}</p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label className="block text-sm font-medium text-saka-dark">Payment Method</Label>
            
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-mobile-alt text-white text-sm"></i>
                </div>
                <Label htmlFor="mpesa" className="flex-1 cursor-pointer">
                  <span className="font-medium text-saka-dark">M-Pesa</span>
                  <p className="text-sm text-gray-500">Pay with mobile money</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <i className="fas fa-credit-card text-white text-sm"></i>
                </div>
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <span className="font-medium text-saka-dark">Credit Card</span>
                  <p className="text-sm text-gray-500">Visa, MasterCard, Amex</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={() => purchaseMutation.mutate()}
            disabled={purchaseMutation.isPending || isProcessing}
            className="w-full bg-gradient-to-r from-saka-gold to-yellow-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all"
          >
            {purchaseMutation.isPending || isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                {isProcessing ? "Waiting for payment..." : "Processing..."}
              </>
            ) : (
              <>
                <i className="fas fa-credit-card mr-2"></i>
                Pay with Paystack - KES {hunt.price}
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            {isProcessing ? "Complete payment in the popup window" : "Secure payment • Cancel anytime • Instant access"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
