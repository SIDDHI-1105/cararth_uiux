import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Mobility Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our automotive marketplace aggregator platform and Throttle Talk community.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">2.1 Personal Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Email address (via Google OAuth authentication)</li>
                    <li>Name and profile information from social login providers</li>
                    <li>Communication preferences and contact information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">2.2 Car Listing Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Vehicle details you provide when selling a car</li>
                    <li>Uploaded documents (registration, insurance certificates)</li>
                    <li>Search preferences and marketplace interactions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">2.3 Automatically Collected Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Device information, IP address, and browser type</li>
                    <li>Usage patterns and platform interaction data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide and maintain our marketplace aggregation services</li>
                <li>Authenticate users and manage accounts</li>
                <li>Facilitate car buying and selling transactions</li>
                <li>Improve our platform through analytics and user feedback</li>
                <li>Send important updates about our services</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share information in these limited circumstances:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>With service providers who assist our operations (under strict confidentiality)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security assessments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your account and data</li>
                <li>Withdraw consent for data processing</li>
                <li>Data portability where technically feasible</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform integrates with third-party services including car marketplace APIs and social authentication providers. Each service has its own privacy policy governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of any changes by posting the new policy on this page and updating the "last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy, please contact us at:
                <br />
                <a href="mailto:connect@cararth.com" className="text-primary hover:underline">
                  connect@cararth.com
                </a>
              </p>
            </section>

            <div className="bg-muted p-4 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Compliance:</strong> This policy is designed to comply with the Information Technology Act, 2000, and the Personal Data Protection Bill of India.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Cararth.com is a unit of Aaro7 Fintech Private Limited
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}