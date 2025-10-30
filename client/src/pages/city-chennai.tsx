import { CityLandingPage } from "@/components/city-landing-page";
import { CITY_CONFIG } from "@/config/city-data";

export default function ChennaiCityPage() {
  return <CityLandingPage cityData={CITY_CONFIG.chennai} />;
}
