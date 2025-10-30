import { CityLandingPage } from "@/components/city-landing-page";
import { CITY_CONFIG } from "@/config/city-data";

export default function MumbaiCityPage() {
  return <CityLandingPage cityData={CITY_CONFIG.mumbai} />;
}
