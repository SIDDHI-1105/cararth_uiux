import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, FileText, Users, Globe } from "lucide-react";

export default function SyndicationTerms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Seller Syndication Terms & Authorization
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: January 2025 | Version 1.0
            </p>
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>DPDP Act 2023 Compliance:</strong> These terms comply with India's Digital Personal Data Protection Act, 2023. By accepting, you provide explicit consent for data processing and cross-platform syndication.
              </AlertDescription>
            </Alert>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6" />
                1. Syndication Service Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CarArth's Seller Syndication Service ("the Service") enables you to post your vehicle listing once on CarArth.com and automatically distribute it to multiple automotive marketplaces including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>OLX India</strong> - Leading classifieds platform</li>
                <li><strong>Quikr Cars</strong> - Automotive marketplace</li>
                <li><strong>Facebook Marketplace</strong> - Social commerce platform</li>
                <li>Additional platforms (added with prior notice)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                All syndicated listings include the attribution: <strong>"Powered by CarArth.com"</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6" />
                2. DPDP Act 2023 Consent & Data Processing
              </h2>
              
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">2.1 Explicit Consent</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By checking the consent box and submitting your listing, you provide <strong>free, specific, informed, and unambiguous consent</strong> to CarArth for:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 ml-4">
                    <li>Processing your personal data (name, phone number, email, location)</li>
                    <li>Processing vehicle data (make, model, year, price, images, description)</li>
                    <li>Sharing this data with third-party platforms (OLX, Quikr, Facebook)</li>
                    <li>Storing and maintaining syndication logs for compliance audit</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">2.2 Data Processing Details</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    <strong>Data Collected:</strong>
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Personal: Name, phone number, email address, city/location</li>
                    <li>Vehicle: Make, model, variant, year, km driven, price, condition</li>
                    <li>Media: Vehicle photos, documents (RC, insurance if provided)</li>
                    <li>Metadata: IP address, browser user agent, consent timestamp</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4 mb-2">
                    <strong>Processing Purpose:</strong> Cross-platform listing syndication to increase vehicle visibility and buyer reach.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    <strong>Data Recipients:</strong> OLX India, Quikr, Facebook Ireland Limited (for Marketplace)
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    <strong>Retention Period:</strong> Active listings retained until withdrawal; logs maintained for 3 years for compliance.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2">2.3 Your Data Rights (DPDP Act 2023)</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li><strong>Right to Access:</strong> Request copy of your data and syndication history</li>
                    <li><strong>Right to Correction:</strong> Update or correct your listing information</li>
                    <li><strong>Right to Erasure:</strong> Withdraw consent and request listing removal from all platforms</li>
                    <li><strong>Right to Grievance Redressal:</strong> Contact our Data Protection Officer at dpo@cararth.com</li>
                    <li><strong>Right to Nomination:</strong> Nominate representative for data management (post-death)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-6 w-6" />
                3. Platform-Specific Terms
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">3.1 OLX India</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By using this Service, you agree to comply with OLX India's Terms of Use and Posting Rules. CarArth is not responsible for OLX-specific policy violations. You may receive buyer inquiries directly on your registered phone/email from OLX users.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">3.2 Quikr Cars</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Quikr's Terms of Service and Privacy Policy apply to syndicated listings. Quikr may perform independent verification of vehicle details. Additional charges may apply for Quikr premium features (billed separately by Quikr).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">3.3 Facebook Marketplace</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Facebook's Commerce Policies and Community Standards apply. Listings must comply with Facebook's prohibited items list. Your Facebook profile may be visible to interested buyers. Facebook may remove listings that violate their policies without notice to CarArth.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-6 w-6" />
                4. AI-Powered Deduplication & Quality Assurance
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To prevent duplicate listings and ensure quality:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  <strong>Duplicate Detection:</strong> Our AI system (using Google Gemini, Anthropic Claude, and OpenAI) analyzes your listing against existing platform inventory to identify potential duplicates. If duplicates are found with ≥85% confidence, syndication to those platforms will be skipped.
                </li>
                <li>
                  <strong>Quality Scoring:</strong> Listings are scored for completeness, image quality, and compliance. Low-quality listings may be rejected or flagged for manual review.
                </li>
                <li>
                  <strong>Compliance Checks:</strong> AI validates against platform-specific ToS, copyright rules, and DPDP Act requirements before posting.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Syndication Process & Timeline</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Step 1:</strong> Submit listing with mandatory consent checkbox
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Step 2:</strong> AI deduplication check (2-5 minutes)
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Step 3:</strong> Compliance validation and quality scoring
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Step 4:</strong> Automated posting to approved platforms (5-15 minutes)
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Step 5:</strong> Email notification with platform URLs and syndication summary
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Total Time:</strong> 10-25 minutes for full syndication
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Withdrawal & Consent Revocation</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may withdraw your consent and remove your listing at any time:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the "Withdraw Listing" button in your seller dashboard</li>
                <li>Email withdrawal request to sellers@cararth.com with listing ID</li>
                <li>CarArth will initiate removal from all platforms within 24 hours</li>
                <li>Platform-specific removal timelines: OLX (immediate), Quikr (2-4 hours), Facebook (1-24 hours)</li>
                <li>Complete removal confirmation sent via email within 48 hours</li>
              </ul>
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>Important:</strong> Withdrawal removes the listing but does not delete historical syndication logs (retained for legal compliance). Personal data in logs is pseudonymized after 90 days.
                </AlertDescription>
              </Alert>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Fees & Charges</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-muted-foreground leading-relaxed mb-2">
                  <strong>CarArth Service Fee:</strong> ₹0 (Free for limited launch period - subject to change with 30 days notice)
                </p>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  <strong>Platform Charges:</strong> OLX, Quikr, and Facebook do not charge listing fees for basic posts. Premium features (featured ads, verified badges) are billed separately by each platform.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Transaction Fees:</strong> CarArth does not charge commission on vehicle sales. Any buyer-seller transaction fees are governed by the respective platform's terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Liability & Disclaimers</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>CarArth acts as a technical facilitator for cross-platform syndication. We are not responsible for platform-specific rejections, policy violations, or buyer disputes.</li>
                <li>Platform APIs may experience downtime. We provide best-effort syndication but do not guarantee 100% uptime or successful posting.</li>
                <li>Vehicle valuation, buyer verification, and transaction completion are solely between you and the buyer. CarArth is not a party to the sale.</li>
                <li>You are responsible for the accuracy of listing information. False or misleading information may result in account suspension and legal action.</li>
                <li>CarArth reserves the right to refuse syndication for listings that violate our quality standards or legal requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Governing Law & Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong>Grievance Redressal:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Email: grievance@cararth.com</li>
                <li>Response Time: Within 7 business days</li>
                <li>Data Protection Officer: dpo@cararth.com</li>
                <li>Escalation: Contact details available at cararth.com/contact</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms to reflect changes in law, platform integrations, or service features. Material changes will be notified via email 15 days in advance. Continued use after changes constitutes acceptance. Version history available at cararth.com/terms/history.
              </p>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Consent Statement</h2>
              <div className="bg-primary/10 p-6 rounded-lg border-l-4 border-primary">
                <p className="text-sm leading-relaxed mb-4">
                  <strong>By checking the consent box and submitting your vehicle listing, you acknowledge that:</strong>
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 ml-4">
                  <li>You have read and understood these Syndication Terms</li>
                  <li>You provide explicit consent for data processing and cross-platform sharing as described above</li>
                  <li>You understand your rights under DPDP Act 2023 including withdrawal and erasure</li>
                  <li>You agree to comply with platform-specific terms of OLX, Quikr, and Facebook</li>
                  <li>You authorize CarArth to act as your agent for automated listing syndication</li>
                  <li>You accept that consent metadata (IP address, timestamp, user agent) will be logged for legal compliance</li>
                </ul>
                <p className="text-sm leading-relaxed mt-4 font-medium">
                  This consent can be withdrawn at any time through your seller dashboard or by emailing sellers@cararth.com
                </p>
              </div>
            </section>

            <div className="bg-muted p-4 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Legal Compliance:</strong> These terms comply with the Digital Personal Data Protection Act, 2023 (DPDP Act), Information Technology Act, 2000, and Consumer Protection Act, 2019.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Document ID:</strong> SYNDICATION-TERMS-v1.0-JAN2025
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
