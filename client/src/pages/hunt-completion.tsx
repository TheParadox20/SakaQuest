import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { getAuthToken } from "@/lib/authUtils";

interface Hunt {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  coverImageUrl: string;
}

export default function HuntCompletion() {
  const params = useParams();
  const huntId = params.huntId;
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(true);

  const { data: hunt } = useQuery<Hunt>({
    queryKey: ["/api/hunts", huntId],
    enabled: !!huntId && !!getAuthToken(),
  });

  const handleFeedbackClick = () => {
    window.open('https://forms.gle/pjdFubUJNn38yGw46', '_blank');
    setShowFeedbackPrompt(false);
  };

  if (!hunt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saka-orange mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Completion Celebration */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-saka-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-trophy text-white text-4xl"></i>
          </div>
          <h1 className="text-3xl font-bold text-saka-dark mb-2">Congratulations!</h1>
          <p className="text-xl text-gray-600 mb-4">
            You've successfully completed <span className="font-semibold text-saka-dark">{hunt.title}</span>
          </p>
          <div className="bg-gradient-to-r from-saka-orange/10 to-saka-red/10 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center space-x-6 text-center">
              <div>
                <p className="text-2xl font-bold text-saka-orange">🎯</p>
                <p className="text-sm text-gray-600">Hunt Completed</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <p className="text-2xl font-bold text-saka-gold">⭐</p>
                <p className="text-sm text-gray-600">Experience Gained</p>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <p className="text-2xl font-bold text-saka-green">🏆</p>
                <p className="text-sm text-gray-600">Achievement Unlocked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Prompt */}
        {showFeedbackPrompt && (
          <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-saka-orange to-saka-red rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-comment-dots text-white text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-saka-dark mb-2">
                Help us serve you better – would you like to give feedback?
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Your feedback helps us create even better hunt experiences for you and other adventurers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleFeedbackClick}
                  className="bg-saka-orange hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-semibold"
                >
                  <i className="fas fa-heart mr-2"></i>
                  Yes, Give Feedback
                </Button>
                <Button 
                  onClick={() => setShowFeedbackPrompt(false)}
                  variant="outline"
                  className="px-6 py-2 rounded-xl font-semibold"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Next Actions */}
        <div className="space-y-4">
          <Link to="/hunt-library">
            <Button className="w-full bg-gradient-to-r from-saka-green to-emerald-600 text-white py-3 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all">
              <i className="fas fa-compass mr-2"></i>
              Explore More Hunts
            </Button>
          </Link>
          
          <Link to="/">
            <Button 
              variant="outline"
              className="w-full py-3 rounded-xl font-semibold text-lg"
            >
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Social Sharing */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm mb-4">Share your achievement with friends!</p>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => {
                const text = `I just completed the "${hunt.title}" hunt on Saka! 🎯 Join me for more adventures!`;
                if (navigator.share) {
                  navigator.share({ text, url: window.location.origin });
                } else {
                  navigator.clipboard.writeText(text + ' ' + window.location.origin);
                }
              }}
              className="text-saka-dark hover:text-saka-orange"
            >
              <i className="fas fa-share-alt mr-2"></i>
              Share
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}