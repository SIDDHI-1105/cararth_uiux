import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContextualHelpProvider } from "@/components/contextual-help";
import Home from "./pages/home";
import CarDetail from "./pages/car-detail";
import MarketplaceListing from "./pages/marketplace-listing";
import SellCar from "./pages/sell-car";
import SellerSettings from "./pages/seller-settings";
import MessagesPage from "./pages/messages";
import Blog from "./pages/blog";
import AdminBlog from "./pages/admin-blog";
import AdminPartners from "./pages/admin-partners";
import AdminPartnerMonitor from "./pages/admin-partner-monitor";
import AdminReview from "./pages/admin-review";
import AdminSyndication from "./pages/admin-syndication";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/car/:id" component={CarDetail} />
      <Route path="/cars/:id" component={CarDetail} />
      <Route path="/marketplace/:id" component={MarketplaceListing} />
      <Route path="/sell" component={SellCar} />
      <Route path="/sell-car" component={SellCar} />
      <Route path="/sell-your-car" component={SellCar} />
      <Route path="/seller/settings" component={SellerSettings} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/admin/blog" component={AdminBlog} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ContextualHelpProvider>
          <Toaster />
          <Router />
        </ContextualHelpProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
