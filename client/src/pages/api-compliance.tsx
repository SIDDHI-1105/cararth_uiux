import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield, FileText, Globe } from "lucide-react";

export default function ApiCompliance() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">API Compliance</CardTitle>
            <p className="text-center text-muted-foreground">
              Our commitment to legal and ethical data practices
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Compliance Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                cararth.com operates under strict legal and ethical guidelines when accessing and aggregating automotive data. We prioritize compliance with Indian and international laws governing data collection, usage, and distribution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Legal Framework Compliance</h2>
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <FileText className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Information Technology Act, 2000</h3>
                    <p className="text-sm text-muted-foreground">
                      Full compliance with Indian IT laws governing digital platforms, data protection, and electronic commerce.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Shield className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Copyright Act, 1957</h3>
                    <p className="text-sm text-muted-foreground">
                      Respect for intellectual property rights and fair use practices in data aggregation and content curation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Globe className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Personal Data Protection</h3>
                    <p className="text-sm text-muted-foreground">
                      Adherence to emerging data protection regulations and international best practices for user privacy.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">API Access Standards</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Authorized API Usage</h3>
                    <p className="text-sm text-muted-foreground">
                      We only access APIs through official, documented endpoints and maintain proper authentication credentials.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Rate Limiting Compliance</h3>
                    <p className="text-sm text-muted-foreground">
                      All API calls respect rate limits and usage policies set by data providers to ensure fair access.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Terms of Service Adherence</h3>
                    <p className="text-sm text-muted-foreground">
                      We strictly follow the terms of service of all platforms from which we aggregate data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-medium">Robots.txt Compliance</h3>
                    <p className="text-sm text-muted-foreground">
                      All web scraping activities respect robots.txt files and website crawling guidelines.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Handling Practices</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Minimal Data Collection</h3>
                  <p className="text-muted-foreground">
                    We collect only the minimum data necessary to provide our aggregation services, focusing on publicly available vehicle listings and specifications.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Secure Data Storage</h3>
                  <p className="text-muted-foreground">
                    All collected data is stored securely with encryption and access controls, following industry-standard security practices.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Data Anonymization</h3>
                  <p className="text-muted-foreground">
                    Personal identifiers are removed or anonymized from aggregated data to protect individual privacy while maintaining data utility.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Third-Party Relationships</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our relationships with data providers are built on mutual respect and legal compliance:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Written agreements where required by data providers</li>
                  <li>Regular compliance audits and reviews</li>
                  <li>Prompt response to any compliance concerns</li>
                  <li>Collaboration with platforms to ensure ethical data use</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User Data Protection</h2>
              <div className="bg-primary/10 p-4 rounded-lg">
                <h3 className="font-medium text-primary mb-2">Privacy by Design</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• User authentication data is handled through secure OAuth providers</p>
                  <p>• Personal information is encrypted both in transit and at rest</p>
                  <p>• Access to user data is logged and monitored</p>
                  <p>• Users maintain control over their data and can request deletion</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Monitoring and Auditing</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We maintain comprehensive monitoring of our compliance practices:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Compliance monitoring dashboards and alerts</li>
                  <li>Legal review of data collection practices</li>
                  <li>Staff training on compliance requirements</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Incident Response</h2>
              <p className="text-muted-foreground leading-relaxed">
                In the event of any compliance concern or data security incident, we have established procedures for immediate response, investigation, and remediation. We are committed to transparency and will notify relevant parties as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Compliance Reporting</h2>
              <p className="text-muted-foreground leading-relaxed">
                For compliance-related inquiries, concerns, or to report potential violations, please contact our legal compliance team at:
                <br />
                <a href="mailto:connect@cararth.com" className="text-primary hover:underline">
                  connect@cararth.com
                </a>
              </p>
            </section>

            <div className="bg-muted p-4 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Compliance Certification:</strong> This page reflects our current compliance practices as of January 2025. Our compliance framework is regularly reviewed and updated to maintain the highest standards of legal and ethical operation.
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