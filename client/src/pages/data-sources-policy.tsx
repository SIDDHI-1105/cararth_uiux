import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Database, Eye, RefreshCw } from "lucide-react";

export default function DataSourcesPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Data Sources Policy</CardTitle>
            <p className="text-center text-muted-foreground">
              Transparency in our data collection and aggregation practices
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Commitment to Authentic Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                cararth.com operates with zero tolerance for fake data. Every car listing on our platform is sourced from verified, publicly available channels and legitimate automotive marketplaces.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Collection Sources</h2>
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Database className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Verified Marketplace APIs</h3>
                    <p className="text-sm text-muted-foreground">
                      We collect data from authorized APIs of major automotive platforms including CarDekho, Cars24, CarWale, and other established marketplaces.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <Eye className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">Public Website Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Publicly available listings from legitimate dealers and certified platforms, collected through ethical web scraping practices.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <RefreshCw className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">RSS and News Feeds</h3>
                    <p className="text-sm text-muted-foreground">
                      Automotive news and content from reputable sources like Team-BHP, Autocar India, and CarAndBike for our Throttle Talk community.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Processing and Verification</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">AI-Powered Validation</h3>
                  <p className="text-muted-foreground">
                    Our platform uses advanced AI algorithms to analyze and score the authenticity of vehicle listings, helping users identify the most reliable information.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Real-Time Updates</h3>
                  <p className="text-muted-foreground">
                    Listings are continuously updated to reflect current availability, pricing, and market conditions across all connected sources.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Quality Filtering</h3>
                  <p className="text-muted-foreground">
                    We apply multiple filters to remove duplicate, outdated, or potentially fraudulent listings before displaying them to users.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">User-Generated Content</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  When users list their vehicles for sale through our platform, we require:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Authentic vehicle registration documents</li>
                  <li>Valid insurance certificates</li>
                  <li>Accurate vehicle specifications and condition details</li>
                  <li>Genuine contact information for verification</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Legal Compliance</h2>
              <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-medium text-primary">Compliance Standards</h3>
                  <div className="text-sm text-muted-foreground space-y-2 mt-2">
                    <p>• Information Technology Act, 2000 compliance</p>
                    <p>• Respect for intellectual property rights</p>
                    <p>• Adherence to robots.txt and website terms of service</p>
                    <p>• Copyright Act 1957 compliance</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Retention and Updates</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our data retention policies ensure accuracy and relevance:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Listing data is refreshed every 24-48 hours</li>
                  <li>Expired or sold vehicle listings are automatically removed</li>
                  <li>Historical price data is maintained for market analysis</li>
                  <li>User-generated content is retained as per our Privacy Policy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Third-Party Data Sources</h2>
              <p className="text-muted-foreground leading-relaxed">
                While we aggregate data from various third-party sources, we are not responsible for the accuracy of information provided by external platforms. We encourage users to verify all details independently and contact sellers directly for the most current information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Reporting Data Issues</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you encounter inaccurate, outdated, or inappropriate content, please report it to us immediately at:
                <br />
                <a href="mailto:connect@cararth.com" className="text-primary hover:underline">
                  connect@cararth.com
                </a>
              </p>
            </section>

            <div className="bg-muted p-4 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Last Updated:</strong> January 2025 | This policy is regularly reviewed and updated to reflect our current data practices and compliance requirements.
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