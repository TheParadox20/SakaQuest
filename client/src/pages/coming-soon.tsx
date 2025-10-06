import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";

export default function ComingSoonPage() {
  return (
    <Layout showBottomNav={false} className="bg-gradient-to-br from-saka-orange via-saka-red to-purple-600">
      <div className="flex items-center justify-center px-4 min-h-[80vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-6">
              <i className="fas fa-hammer text-white text-3xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-lg text-white/90 leading-relaxed">
              We're working hard to bring you the ability to create your own custom hunts. 
              Stay tuned for this exciting feature!
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">What's Coming</h3>
              <ul className="text-left space-y-2 text-sm text-white/80">
                <li className="flex items-center">
                  <i className="fas fa-check text-saka-green mr-2"></i>
                  Custom hunt builder
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-saka-green mr-2"></i>
                  Share hunts with friends
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-saka-green mr-2"></i>
                  Community hunt marketplace
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-saka-green mr-2"></i>
                  Advanced clue types
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link to="/">
                <Button className="w-full bg-white text-saka-orange hover:bg-gray-100 py-3 px-6 rounded-xl font-semibold text-lg">
                  <i className="fas fa-home mr-2"></i>
                  Back to Home
                </Button>
              </Link>
              
              <Link to="/hunt-library">
                <Button 
                  variant="outline" 
                  className="w-full border-white text-white hover:bg-white/10 py-3 px-6 rounded-xl font-semibold"
                >
                  <i className="fas fa-map mr-2"></i>
                  Explore Existing Hunts
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-white/70 text-sm">
                Want to be notified when this feature launches?
              </p>
              <div className="mt-3 flex space-x-2">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:ring-2 focus:ring-white focus:border-transparent"
                />
                <Button className="bg-saka-green text-white hover:bg-emerald-600 px-4 py-2 rounded-lg">
                  Notify Me
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}