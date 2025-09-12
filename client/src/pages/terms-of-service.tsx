import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: January 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using The Mobility Hub platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Mobility Hub is an automotive marketplace aggregator that collects and displays used car listings from multiple verified sources. We also provide Throttle Talk, a community platform for automotive enthusiasts with RSS-aggregated content and user-generated posts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">3.1 Account Security</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Use only your own authentic social media accounts for login</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">3.2 Content and Conduct</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Provide accurate information when listing vehicles for sale</li>
                    <li>Upload only authentic documents and vehicle images</li>
                    <li>Respect other users and maintain civil discourse</li>
                    <li>Do not post spam, fraudulent, or misleading content</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Accuracy and Disclaimer</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  While we strive to provide accurate information from verified sources, we cannot guarantee the complete accuracy of all car listings. Users should:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Verify vehicle details independently before making purchase decisions</li>
                  <li>Conduct proper due diligence including physical inspection</li>
                  <li>Understand that prices and availability may change</li>
                  <li>Use our platform as a starting point for research, not the sole basis for transactions</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Mobility Hub platform, including its design, functionality, and content aggregation algorithms, is protected by copyright and other intellectual property laws. Users may not reproduce, distribute, or create derivative works without explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using our service, you consent to the collection and use of information as outlined in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Using the platform for any unlawful purpose</li>
                <li>Attempting to interfere with platform security or functionality</li>
                <li>Posting false, misleading, or fraudulent vehicle listings</li>
                <li>Harvesting user data or contact information</li>
                <li>Creating fake accounts or impersonating others</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Mobility Hub serves as an information aggregator and platform facilitator. We are not responsible for the accuracy of third-party listings, the quality of vehicles, or the conduct of users. Our liability is limited to the maximum extent permitted by Indian law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to terminate or suspend access to our service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users or our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting updates on this page. Continued use of the platform after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Service are governed by the laws of India. Any disputes will be subject to the jurisdiction of Indian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at:
                <br />
                <a href="mailto:connect@cararth.com" className="text-primary hover:underline">
                  connect@cararth.com
                </a>
              </p>
            </section>

            <div className="bg-muted p-4 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Legal Compliance:</strong> These terms comply with the Information Technology Act, 2000, and Indian Contract Act, 1872.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}