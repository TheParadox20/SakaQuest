import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getAuthToken } from "@/lib/authUtils";

interface Clue {
  id: string;
  huntId: string;
  clueText: string;
  order: number;
  locationHint: string;
  points: number;
  coordinates?: string;
  imageUrl?: string;
  narrative?: string;
}

interface Hunt {
  id: string;
  title: string;
  description: string;
}

export default function ClueScreen() {
  const params = useParams();
  const huntId = params.huntId;
  const [, setLocation] = useLocation();
  const [currentClueIndex, setCurrentClueIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentNarrative, setCurrentNarrative] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [canBypass, setCanBypass] = useState(false);
  const [bypassMessage, setBypassMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Cleanup speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const { data: hunt } = useQuery<Hunt>({
    queryKey: ["/api/hunts", huntId],
    enabled: !!huntId && !!getAuthToken(),
  });

  const { data: clues = [], isLoading } = useQuery<Clue[]>({
    queryKey: ["/api/clues", huntId],
    enabled: !!huntId && !!getAuthToken(),
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const currentClue = clues[currentClueIndex];
      const response = await apiRequest("POST", `/api/clues/${currentClue.id}/answer`, {
        answer: answer.trim(),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.correct) {
        setTotalPoints(data.totalPoints);
        setCurrentNarrative(data.narrative);
        setShowSuccess(true);
        setUserAnswer("");
        
        // Reset hint/bypass state for next clue
        setAttempts(0);
        setHint(null);
        setShowHint(false);
        setCanBypass(false);
        setBypassMessage("");
        
        if (data.bypassed) {
          toast({
            title: "Clue Bypassed",
            description: `The answer was: ${data.correctAnswer}. Moving to next clue.`,
          });
        } else {
          toast({
            title: "Correct!",
            description: `You earned ${data.points} points!`,
          });
        }

        if (data.completed) {
          // Hunt completed
          setTimeout(() => {
            setLocation(`/hunt/${huntId}/complete`);
          }, 2000);
        }
      } else {
        // Update attempts and hint information
        setAttempts(data.attempts || 0);
        
        if (data.showHint && data.hint) {
          setHint(data.hint);
          setShowHint(true);
          toast({
            title: "Hint Available!",
            description: "A hint has been revealed to help you.",
          });
        } else if (data.hint) {
          setHint(data.hint);
        }
        
        if (data.canBypass) {
          setCanBypass(true);
          setBypassMessage(data.bypassMessage || "");
        }
        
        toast({
          title: "Incorrect Answer",
          description: data.attempts ? `Attempt ${data.attempts}. Try again!` : "Try again! Think about the clue carefully.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bypassClueMutation = useMutation({
    mutationFn: async () => {
      const currentClue = clues[currentClueIndex];
      const response = await apiRequest("POST", `/api/clues/${currentClue.id}/answer`, {
        bypass: true,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.correct && data.bypassed) {
        setTotalPoints(data.totalPoints);
        setCurrentNarrative(data.narrative);
        setShowSuccess(true);
        setUserAnswer("");
        
        // Reset hint/bypass state
        setAttempts(0);
        setHint(null);
        setShowHint(false);
        setCanBypass(false);
        setBypassMessage("");
        
        toast({
          title: "Clue Bypassed",
          description: `The answer was: ${data.correctAnswer}. No points awarded.`,
        });

        if (data.completed) {
          setTimeout(() => {
            setLocation(`/hunt/${huntId}/complete`);
          }, 2000);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNextClue = () => {
    setShowSuccess(false);
    setCurrentNarrative(null);
    setCurrentClueIndex((prev) => prev + 1);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const openGoogleMaps = (coordinates?: string) => {
    if (!coordinates) return;
    const [lat, lng] = coordinates.split(',');
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  const readClueText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any existing speech
      window.speechSynthesis.cancel();
      
      if (isReading) {
        setIsReading(false);
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice selection for natural, engaging female voice
      const voices = window.speechSynthesis.getVoices();
      
      // Prioritize Kenyan/African English female voices, then natural female voices
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        voice.name.toLowerCase().includes('female') &&
        (voice.name.toLowerCase().includes('kenyan') || 
         voice.name.toLowerCase().includes('african') ||
         voice.name.toLowerCase().includes('south african'))
      ) || voices.find(voice => 
        voice.lang.includes('en') && 
        (voice.name.toLowerCase().includes('female') ||
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('karen') ||
         voice.name.toLowerCase().includes('victoria') ||
         voice.name.toLowerCase().includes('susan'))
      ) || voices.find(voice => 
        voice.lang.includes('en') && !voice.name.toLowerCase().includes('male')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Optimized settings for natural, conversational speech
      utterance.rate = 0.85; // Natural conversational pace
      utterance.pitch = 1.1; // Slightly higher pitch for warmth
      utterance.volume = 1;
      
      utterance.onstart = () => setIsReading(true);
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => {
        setIsReading(false);
        toast({
          title: "Audio Error",
          description: "Unable to play audio. Please check your browser settings.",
          variant: "destructive",
        });
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Audio Not Supported",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !hunt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hunt...</p>
        </div>
      </div>
    );
  }

  if (clues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
          <h2 className="text-xl font-bold text-saka-dark mb-2">No Clues Available</h2>
          <p className="text-gray-600 mb-4">This hunt doesn't have any clues yet.</p>
          <Button onClick={() => setLocation("/")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  const currentClue = clues[currentClueIndex];
  const progress = ((currentClueIndex + 1) / clues.length) * 100;

  if (!currentClue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
          <h2 className="text-xl font-bold text-saka-dark mb-2">Clue Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load the current clue.</p>
          <Button onClick={() => setLocation("/")}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation("/")}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <i className="fas fa-arrow-left text-saka-dark"></i>
            </button>
            <div className="text-center">
              <h3 className="font-semibold text-saka-dark">{hunt.title}</h3>
              <p className="text-sm text-gray-500">
                Clue {currentClueIndex + 1} of {clues.length}
              </p>
            </div>
            <button 
              onClick={() => currentClue && readClueText(`Clue ${currentClue.order}: ${currentClue.clueText}`)}
              className={`p-2 transition-colors ${
                isReading 
                  ? 'text-saka-orange bg-saka-orange/10 rounded-full' 
                  : 'hover:bg-gray-100 rounded-full'
              }`}
              title={isReading ? 'Stop reading' : 'Read clue aloud'}
            >
              <i className={`fas ${isReading ? 'fa-stop' : 'fa-volume-up'} ${isReading ? 'text-saka-orange' : 'text-gray-600'}`}></i>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        {showSuccess ? (
          /* Success State with Narrative */
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-saka-green to-emerald-600 rounded-full">
              <i className="fas fa-trophy text-white text-3xl"></i>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-saka-dark mb-2">You Did It!</h2>
              <p className="text-gray-600">Great detective work!</p>
            </div>
            
            {/* Points Card */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-500">Points Earned</p>
                <p className="text-4xl font-bold text-saka-gold">+{currentClue.points}</p>
              </div>
            </div>

            {/* Narrative Card */}
            {currentNarrative && (
              <div className="bg-gradient-to-br from-saka-orange/5 to-saka-gold/5 rounded-2xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-saka-orange/10 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-book-open text-saka-orange"></i>
                    </div>
                    <h3 className="text-lg font-bold text-saka-dark">Did You Know?</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => readClueText(currentNarrative)}
                    className={`transition-colors ${
                      isReading 
                        ? 'bg-saka-orange text-white border-saka-orange' 
                        : 'hover:bg-saka-orange hover:text-white hover:border-saka-orange'
                    }`}
                  >
                    <i className={`fas ${isReading ? 'fa-stop' : 'fa-volume-up'} mr-2`}></i>
                    {isReading ? 'Stop' : 'Listen'}
                  </Button>
                </div>
                <p className="text-gray-700 leading-relaxed text-left">
                  {currentNarrative}
                </p>
              </div>
            )}
            
            <Button 
              onClick={handleNextClue}
              className="w-full bg-saka-green text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-emerald-600 transition-all"
            >
              {currentClueIndex + 1 < clues.length ? "Next Clue" : "Complete Hunt"}
            </Button>
          </div>
        ) : (
          /* Active Clue State */
          <div className="space-y-6">
            {/* Clue Content */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="space-y-4">
                {currentClue.imageUrl && (
                  <img 
                    src={currentClue.imageUrl} 
                    alt="Clue location"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-saka-dark">
                      Clue {currentClue.order}
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => readClueText(currentClue.clueText)}
                      className={`transition-colors ${
                        isReading 
                          ? 'bg-saka-orange text-white border-saka-orange' 
                          : 'hover:bg-saka-orange hover:text-white hover:border-saka-orange'
                      }`}
                    >
                      <i className={`fas ${isReading ? 'fa-stop' : 'fa-volume-up'} mr-2`}></i>
                      {isReading ? 'Stop' : 'Listen'}
                    </Button>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {currentClue.clueText}
                  </p>
                </div>
              </div>
            </div>

            {/* Map Integration */}
            {currentClue.coordinates && (
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-saka-green/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-map-marker-alt text-saka-green"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-saka-dark">Location Hint</p>
                      <p className="text-sm text-gray-500">{currentClue.locationHint}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => openGoogleMaps(currentClue.coordinates)}
                    className="bg-saka-green text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-600 transition-all"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    View Map
                  </Button>
                </div>
              </div>
            )}

            {/* Hint Display */}
            {hint && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 card-shadow border-2 border-yellow-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-lightbulb text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-2">💡 Hint</h4>
                    <p className="text-amber-800 leading-relaxed">
                      {hint}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Answer Input */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-saka-dark mb-2">Your Answer</label>
                  {attempts > 0 && (
                    <p className="text-sm text-gray-500 mb-2">
                      Attempts: {attempts}
                    </p>
                  )}
                  <Input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your answer here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-saka-orange focus:border-transparent transition-all"
                    data-testid="input-answer"
                  />
                </div>
                
                <Button 
                  onClick={() => submitAnswerMutation.mutate(userAnswer)}
                  disabled={!userAnswer.trim() || submitAnswerMutation.isPending}
                  className="w-full bg-gradient-to-r from-saka-orange to-saka-red text-white py-3 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all"
                  data-testid="button-submit-answer"
                >
                  {submitAnswerMutation.isPending ? "Checking..." : "Submit Answer"}
                </Button>

                {/* Bypass Button */}
                {canBypass && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 mb-3 text-center">
                      {bypassMessage}
                    </p>
                    <Button 
                      onClick={() => bypassClueMutation.mutate()}
                      disabled={bypassClueMutation.isPending}
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6 rounded-xl font-medium transition-all"
                      data-testid="button-bypass-clue"
                    >
                      {bypassClueMutation.isPending ? "Skipping..." : "Skip This Clue"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Hunt Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="text-lg font-bold text-saka-dark">{formatTime(elapsedTime)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <p className="text-sm text-gray-500 mb-1">Clue</p>
                <p className="text-lg font-bold text-saka-green">
                  {currentClueIndex + 1}/{clues.length}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center card-shadow">
                <p className="text-sm text-gray-500 mb-1">Points</p>
                <p className="text-lg font-bold text-saka-gold">{totalPoints}</p>
              </div>
            </div>

            {/* Quit Hunt Button */}
            <div className="text-center pt-4">
              <button 
                onClick={() => setLocation("/")}
                className="text-gray-500 hover:text-saka-red font-medium text-sm"
              >
                Back to Library
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
