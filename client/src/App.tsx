import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContextualHelpProvider } from "@/components/contextual-help";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initGA4 } from "@/lib/ga4";
import { usePageTracking } from "@/hooks/use-ga4";
import Home from "./pages/home";
import CarDetail from "./pages/car-detail";
import MarketplaceListing from "./pages/marketplace-listing";
import SellCar from "./pages/sell-car";
import SellPage from "./pages/sell";
import SellerSettings from "./pages/seller-settings";
import MessagesPage from "./pages/messages";
import Blog from "./pages/blog";
import AdminBlog from "./pages/admin-blog";
import AdminPartners from "./pages/admin-partners";
import AdminPartnerMonitor from "./pages/admin-partner-monitor";
import AdminReview from "./pages/admin-review";
import AdminSyndication from "./pages/admin-syndication";
import AdminDiagnostics from "./pages/AdminDiagnostics";
import ProductionSync from "./pages/ProductionSync";
import Aether from "./pages/Aether";
import PartnerInvite from "./pages/partner-invite";
import PartnerDashboard from "./pages/partner-dashboard";
import DealerDashboard from "./pages/DealerDashboard";
import OemAnalyticsDashboard from "./pages/OemAnalyticsDashboard";
import MonthlyOEMReport from "./pages/MonthlyOEMReport";
import ThrottleTalk from "./pages/news";
import NewsDetail from "./pages/news-detail";
import Community from "./pages/community";
import PrivacyPolicy from "./pages/privacy-policy";
import TermsOfService from "./pages/terms-of-service";
import SyndicationTerms from "./pages/terms";
import DataSourcesPolicy from "./pages/data-sources-policy";
import ApiCompliance from "./pages/api-compliance";
import AiTrainingDashboard from "./pages/ai-training-dashboard";
import FinancingPage from "./pages/financing";
import ScraperStatus from "./pages/scraper-status";
import SpinnyDeals from "./pages/spinny-deals";
import FAQPage from "./pages/faq";
import RTADataImport from "./pages/RTADataImport";
import MarketIntelligenceDashboard from "./pages/MarketIntelligenceDashboard";
import AIVerificationGuide from "./pages/guide-ai-verification";
import BestUsedCars2025Guide from "./pages/guide-best-used-cars-2025";
import UsedCarMarketAnalysis2025 from "./pages/guide-market-analysis-2025";
import HyderabadUsedCarsGuide2025 from "./pages/guide-hyderabad-2025";
import SwiftHyderabadGuide2025 from "./pages/guide-swift-hyderabad-2025";
import CretaIndiaGuide2025 from "./pages/guide-creta-india-2025";
import InnovaIndiaGuide2025 from "./pages/guide-innova-india-2025";
import DealersHyderabadGuide2025 from "./pages/guide-dealers-hyderabad-2025";
import UsedElectricCarsGuide2025 from "./pages/guide-used-electric-cars-2025";
import VerificationEconomyGuide from "./pages/guide-verification-economy";
import HyderabadCityPage from "./pages/city-hyderabad";
import DelhiCityPage from "./pages/city-delhi";
import MumbaiCityPage from "./pages/city-mumbai";
import BangaloreCityPage from "./pages/city-bangalore";
import PuneCityPage from "./pages/city-pune";
import ChennaiCityPage from "./pages/city-chennai";
import CityLandingPage from "./pages/city-landing-page";
import MockupPreview from "./pages/mockup-preview";
import NotFound from "@/pages/not-found";
import Results from "./pages/results";
import ListingDetail from "./pages/listing-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mockup-preview" component={MockupPreview} />
      <Route path="/results" component={Results} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/car/:id" component={CarDetail} />
      <Route path="/cars/:id" component={CarDetail} />
      <Route path="/marketplace/:id" component={MarketplaceListing} />
      <Route path="/sell" component={SellPage} />
      <Route path="/sell-car" component={SellCar} />
      <Route path="/sell-your-car" component={SellCar} />
      <Route path="/seller/settings" component={SellerSettings} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/diagnostics" component={AdminDiagnostics} />
      <Route path="/admin/production-sync" component={ProductionSync} />
      <Route path="/admin/aether" component={Aether} />
      <Route path="/admin/partners" component={AdminPartners} />
      <Route path="/admin/partners/:sourceId/monitor" component={AdminPartnerMonitor} />
      <Route path="/admin/review" component={AdminReview} />
      <Route path="/admin/syndication" component={AdminSyndication} />
      <Route path="/partner/invite/:token" component={PartnerInvite} />
      <Route path="/partner/dashboard" component={PartnerDashboard} />
      <Route path="/dealer/dashboard" component={DealerDashboard} />
      <Route path="/dealer-dashboard" component={DealerDashboard} />
      <Route path="/news/oem-report" component={MonthlyOEMReport} />
      <Route path="/news/monthly-report" component={MonthlyOEMReport} />
      <Route path="/news/oem-analytics" component={OemAnalyticsDashboard} />
      <Route path="/news/analytics" component={OemAnalyticsDashboard} />
      <Route path="/news/:id" component={NewsDetail} />
      <Route path="/news" component={ThrottleTalk} />
      <Route path="/community" component={Community} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={SyndicationTerms} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/data-sources-policy" component={DataSourcesPolicy} />
      <Route path="/api-compliance" component={ApiCompliance} />
      <Route path="/ai-training-dashboard" component={AiTrainingDashboard} />
      <Route path="/financing" component={FinancingPage} />
      <Route path="/admin/scraper-status" component={ScraperStatus} />
      <Route path="/admin/rta-import" component={RTADataImport} />
      <Route path="/analytics/market-intelligence" component={MarketIntelligenceDashboard} />
      <Route path="/market-intelligence" component={MarketIntelligenceDashboard} />
      <Route path="/spinny-deals-hyderabad" component={SpinnyDeals} />
      <Route path="/guides/ai-verified-used-car-trust-india" component={AIVerificationGuide} />
      <Route path="/guides/best-used-cars-india-2025" component={BestUsedCars2025Guide} />
      <Route path="/guides/used-car-market-india-2025" component={UsedCarMarketAnalysis2025} />
      <Route path="/guides/used-cars-hyderabad-2025" component={HyderabadUsedCarsGuide2025} />
      <Route path="/guides/used-swift-hyderabad-2025" component={SwiftHyderabadGuide2025} />
      <Route path="/guides/used-creta-india-2025" component={CretaIndiaGuide2025} />
      <Route path="/guides/used-innova-india-2025" component={InnovaIndiaGuide2025} />
      <Route path="/guides/used-car-dealers-hyderabad-2025" component={DealersHyderabadGuide2025} />
      <Route path="/guides/used-electric-cars-2025" component={UsedElectricCarsGuide2025} />
      <Route path="/guides/the-verification-economy-india-used-cars" component={VerificationEconomyGuide} />
      <Route path="/used-cars-hyderabad" component={HyderabadCityPage} />
      <Route path="/used-cars-delhi-ncr" component={DelhiCityPage} />
      <Route path="/used-cars-mumbai" component={MumbaiCityPage} />
      <Route path="/used-cars-bangalore" component={BangaloreCityPage} />
      <Route path="/used-cars-pune" component={PuneCityPage} />
      <Route path="/used-cars-chennai" component={ChennaiCityPage} />
      <Route path="/used-cars/:city" component={CityLandingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize GA4 on app mount
  useEffect(() => {
    const ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    if (ga4Id) {
      initGA4(ga4Id);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ContextualHelpProvider>
            <AppWithTracking />
          </ContextualHelpProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppWithTracking() {
  const [location] = useLocation();
  usePageTracking(location);

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
