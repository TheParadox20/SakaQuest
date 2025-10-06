import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";

export default function PrivacyPolicyPage() {
  return (
    <Layout showBottomNav={false}>
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-saka-dark">Privacy Policy</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark">SAKA Privacy Agreement</CardTitle>
              <p className="text-gray-600">Last updated: January 2025</p>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed">
                At SAKA, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when 
                you use our scavenger hunt application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-info-circle text-saka-orange mr-2"></i>
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-saka-dark mb-2">Personal Information</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Name and email address</li>
                  <li>• Profile picture (optional)</li>
                  <li>• Account preferences and settings</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-saka-dark mb-2">Hunt Data</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Hunt progress and completion status</li>
                  <li>• Points earned and achievements</li>
                  <li>• Hunt preferences and favorites</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-saka-dark mb-2">Location Information</h4>
                <ul className="space-y-1 text-gray-700">
                  <li>• Location data when participating in location-based hunts</li>
                  <li>• General geographic region for hunt recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-cogs text-saka-orange mr-2"></i>
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li>• To provide and improve our hunt experiences</li>
                <li>• To track your progress and award achievements</li>
                <li>• To send notifications about hunts and updates (with your consent)</li>
                <li>• To personalize hunt recommendations</li>
                <li>• To process payments for premium hunts</li>
                <li>• To provide customer support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-share-alt text-saka-orange mr-2"></i>
                Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following cases:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• With your explicit consent</li>
                <li>• To comply with legal obligations</li>
                <li>• To protect our rights and safety</li>
                <li>• With trusted service providers who assist in operating our app (under strict confidentiality agreements)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-shield-alt text-saka-orange mr-2"></i>
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction. This includes encryption of 
                sensitive data, secure server infrastructure, and regular security audits.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-user-check text-saka-orange mr-2"></i>
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700">
                <li>• Access your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Delete your account and associated data</li>
                <li>• Download your data</li>
                <li>• Opt out of marketing communications</li>
                <li>• Control location sharing settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-cookie-bite text-saka-orange mr-2"></i>
                Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We use cookies and similar tracking technologies to enhance your experience, 
                remember your preferences, and analyze app usage. You can control cookie 
                settings through your browser, though some features may not work properly 
                if cookies are disabled.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-child text-saka-orange mr-2"></i>
                Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                SAKA is not intended for children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you become aware that 
                a child has provided us with personal information, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-edit text-saka-orange mr-2"></i>
                Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes by posting the new policy on this page and updating the 
                "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-saka-dark flex items-center">
                <i className="fas fa-envelope text-saka-orange mr-2"></i>
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> privacy@saka-app.com</p>
                <p><strong>Address:</strong> SAKA Privacy Team, 123 Heritage Street, Nairobi, Kenya</p>
                <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center pt-6">
            <Link to="/">
              <Button className="bg-saka-orange text-white hover:bg-orange-600 px-8 py-3 rounded-xl font-semibold">
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}