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
import MessagesPage from "./pages/messages";
import Blog from "./pages/blog";
import AdminBlog from "./pages/admin-blog";
import News from "./pages/news";
import Community from "./pages/community";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/car/:id" component={CarDetail} />
      <Route path="/marketplace/:id" component={MarketplaceListing} />
      <Route path="/sell" component={SellCar} />
      <Route path="/sell-car" component={SellCar} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/news" component={News} />
      <Route path="/community" component={Community} />
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
