import { CityLandingPage } from "@/components/city-landing-page";
import { CITY_CONFIG } from "@/config/city-data";

export default function DelhiCityPage() {
  return <CityLandingPage cityData={CITY_CONFIG["delhi-ncr"]} />;
}
