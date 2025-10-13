/**
 * Market Data Service - Real-time used car market intelligence
 * Sources: SIAM, VAHAN, CarDekho, Spinny, OLX, General Market Trends
 * Focus: Hyderabad/Telangana granular analysis (model, variant, color, transmission, fuel, location)
 */

export interface MarketDataSnapshot {
  siam: {
    passengerVehicleWholesales: {
      sep2025: { units: number; yoyGrowth: string; note: string };
      aug2025: { units: number; yoyGrowth: string };
      exports: { fyGrowth: string };
      usedMarketGrowth: string;
    };
  };
  vahan: {
    nationalRegistrations: {
      feb2025: { total: number; momChange: string };
      mar2025: { total: number; momChange: string };
      apr2025: { total: number; momChange: string };
      may2025: { total: number; momChange: string };
    };
    telangana: {
      urbanGrowth: string;
      hyderabadFocus: string;
    };
  };
  cardekho: {
    hyderabad: {
      totalListings: number;
      priceRange: string;
      popularModels: Array<{
        name: string;
        years: string;
        priceRange: string;
        details: string;
        colors: string;
      }>;
      insights: {
        suvListings: number;
        petrolShare: string;
        autoShare: string;
      };
    };
  };
  spinny: {
    hyderabad: {
      totalListings: number;
      minPrice: string;
      popularModels: Array<{
        name: string;
        price: string;
        specs: string;
      }>;
      insights: {
        manualShare: string;
        certifiedGrowth: string;
        evPremium: string;
      };
    };
  };
  olx: {
    hyderabad: {
      priceRange: string;
      examples: Array<{
        model: string;
        year: number;
        variant: string;
        fuel: string;
        transmission: string;
        color: string;
        mileage: string;
        price: string;
      }>;
      insights: {
        popularColors: string;
        fuelMix: string;
      };
    };
  };
  general: {
    marketSize2025: string;
    cagr: string;
    projectedSize2030: string;
    usedSales2030: string;
    hyderabadAvgPrice: string;
    trends: string[];
  };
  timestamp: string;
  nextRefresh: string;
}

export class MarketDataService {
  private cachedData: MarketDataSnapshot | null = null;
  private lastRefresh: Date | null = null;
  private readonly CACHE_DURATION_HOURS = 24;

  /**
   * Get latest market data (cached for 24 hours)
   */
  async getMarketData(): Promise<MarketDataSnapshot> {
    // Check if cache is valid
    if (this.cachedData && this.lastRefresh) {
      const hoursSinceRefresh = (Date.now() - this.lastRefresh.getTime()) / (1000 * 60 * 60);
      if (hoursSinceRefresh < this.CACHE_DURATION_HOURS) {
        return this.cachedData;
      }
    }

    // Refresh data
    this.cachedData = this.fetchLatestData();
    this.lastRefresh = new Date();
    
    return this.cachedData;
  }

  /**
   * Fetch latest market data from all sources
   * NOTE: In production, this would fetch from APIs. For now, using Oct 2025 baseline data.
   */
  private fetchLatestData(): MarketDataSnapshot {
    const now = new Date();
    const nextRefresh = new Date(now.getTime() + this.CACHE_DURATION_HOURS * 60 * 60 * 1000);

    return {
      siam: {
        passengerVehicleWholesales: {
          sep2025: {
            units: 381437,
            yoyGrowth: '+5.4%',
            note: 'Festive demand boost'
          },
          aug2025: {
            units: 321840,
            yoyGrowth: '-8.8%'
          },
          exports: {
            fyGrowth: '+19% FY25'
          },
          usedMarketGrowth: '8-10% YoY'
        }
      },
      vahan: {
        nationalRegistrations: {
          feb2025: { total: 1923311, momChange: '-17.16%' },
          mar2025: { total: 2155592, momChange: '+12.08%' },
          apr2025: { total: 2317801, momChange: '+7.53%' },
          may2025: { total: 2236419, momChange: '-3.51%' }
        },
        telangana: {
          urbanGrowth: 'Rising petrol/EV adoption in urban areas',
          hyderabadFocus: 'Strong used car registration growth in metro'
        }
      },
      cardekho: {
        hyderabad: {
          totalListings: 2851,
          priceRange: '₹30,000 - ₹2.75 Cr',
          popularModels: [
            {
              name: 'Hyundai Verna',
              years: '2020-2025',
              priceRange: '₹4.5L - ₹8L',
              details: 'Petrol manual ~₹5L, Diesel auto ~₹6.5L',
              colors: 'White, Red most common'
            },
            {
              name: 'Tata Nexon',
              years: '2025',
              priceRange: '₹13L',
              details: 'Creative DCA, Petrol auto, 5,000 km',
              colors: 'Multiple options'
            },
            {
              name: 'Maruti Swift',
              years: '2021-2023',
              priceRange: '₹4L - ₹6L',
              details: 'ZXI, Petrol manual, 20-50K km',
              colors: 'White preferred'
            }
          ],
          insights: {
            suvListings: 1052,
            petrolShare: '70%',
            autoShare: '50%'
          }
        }
      },
      spinny: {
        hyderabad: {
          totalListings: 1014,
          minPrice: '₹4L+',
          popularModels: [
            {
              name: 'Maruti Swift',
              price: '₹4L',
              specs: 'Petrol manual, 2020-2022'
            },
            {
              name: 'Hyundai Venue',
              price: '₹7.91L',
              specs: '2021 SX, Petrol auto'
            },
            {
              name: 'Tata Nexon EV',
              price: '₹10-13L',
              specs: 'EV models command +15% premium'
            }
          ],
          insights: {
            manualShare: '60%',
            certifiedGrowth: '+15.5% YoY',
            evPremium: '+15% over ICE equivalents'
          }
        }
      },
      olx: {
        hyderabad: {
          priceRange: '₹40,000 - ₹46L',
          examples: [
            {
              model: 'Hyundai Verna',
              year: 2020,
              variant: 'Fluidic',
              fuel: 'Petrol',
              transmission: 'Manual',
              color: 'Silver',
              mileage: '40,000 km',
              price: '₹4.8L'
            },
            {
              model: 'Maruti Swift',
              year: 2022,
              variant: 'VXI',
              fuel: 'Petrol',
              transmission: 'Automatic',
              color: 'White',
              mileage: '25,000 km',
              price: '₹5.2L'
            },
            {
              model: 'Tata Nexon',
              year: 2023,
              variant: 'XZ',
              fuel: 'Diesel',
              transmission: 'Manual',
              color: 'Blue',
              mileage: '30,000 km',
              price: '₹11L'
            }
          ],
          insights: {
            popularColors: 'White, Red dominate listings',
            fuelMix: 'Balanced Petrol/Diesel demand'
          }
        }
      },
      general: {
        marketSize2025: 'USD 36.39 Billion',
        cagr: '14.95%',
        projectedSize2030: 'USD 73.52 Billion',
        usedSales2030: '10.8 Million units (13% CAGR)',
        hyderabadAvgPrice: '>₹5 Lakh',
        trends: [
          'EV and hybrid models gaining traction',
          'Festive season rebound (Sep/Oct 2025)',
          'Certified pre-owned growth accelerating',
          'Digital platforms dominating discovery',
          'Hyderabad metro showing strong used car demand'
        ]
      },
      timestamp: now.toISOString(),
      nextRefresh: nextRefresh.toISOString()
    };
  }

  /**
   * Get formatted data for Grok AI prompt
   */
  getFormattedDataForAI(): string {
    const data = this.cachedData || this.fetchLatestData();
    
    return `
SIAM Data (Sep 2025):
- Passenger Vehicle Wholesales: ${data.siam.passengerVehicleWholesales.sep2025.units.toLocaleString()} units (${data.siam.passengerVehicleWholesales.sep2025.yoyGrowth} YoY)
- Note: ${data.siam.passengerVehicleWholesales.sep2025.note}
- Used Market Growth: ${data.siam.passengerVehicleWholesales.usedMarketGrowth}

VAHAN Registrations:
- National: ${data.vahan.nationalRegistrations.may2025.total.toLocaleString()} (May 2025, ${data.vahan.nationalRegistrations.may2025.momChange} MoM)
- Telangana: ${data.vahan.telangana.urbanGrowth}
- Hyderabad: ${data.vahan.telangana.hyderabadFocus}

CarDekho Hyderabad:
- Total Listings: ${data.cardekho.hyderabad.totalListings.toLocaleString()}
- Price Range: ${data.cardekho.hyderabad.priceRange}
- SUV Listings: ${data.cardekho.hyderabad.insights.suvListings} (popular segment)
- Fuel: ${data.cardekho.hyderabad.insights.petrolShare} Petrol, Transmission: ${data.cardekho.hyderabad.insights.autoShare} Automatic
- Hot Models: ${data.cardekho.hyderabad.popularModels.map(m => `${m.name} (${m.priceRange})`).join(', ')}

Spinny Hyderabad:
- Listings: ${data.spinny.hyderabad.totalListings}
- Manual: ${data.spinny.hyderabad.insights.manualShare}, Certified Growth: ${data.spinny.hyderabad.insights.certifiedGrowth}
- EV Premium: ${data.spinny.hyderabad.insights.evPremium}

OLX Hyderabad Examples:
${data.olx.hyderabad.examples.map(e => 
  `- ${e.year} ${e.model} ${e.variant} ${e.fuel} ${e.transmission} ${e.color} (${e.mileage}): ${e.price}`
).join('\n')}

Market Trends:
- Market Size 2025: ${data.general.marketSize2025} (CAGR: ${data.general.cagr})
- Hyderabad Avg Price: ${data.general.hyderabadAvgPrice}
- Key Trends: ${data.general.trends.join('; ')}
`;
  }
}

export const marketDataService = new MarketDataService();
