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
  telanganaRta: {
    official: {
      totalRecords: number;
      latestMonth: string;
      topBrands: Array<{
        brand: string;
        registrations: number;
        share: string;
      }>;
      fuelTrends: {
        petrol: string;
        diesel: string;
        cng: string;
        electric: string;
      };
      transmissionSplit: {
        manual: string;
        automatic: string;
      };
      popularDistricts: string[];
      dataSource: string;
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
    this.cachedData = await this.fetchLatestData();
    this.lastRefresh = new Date();
    
    return this.cachedData;
  }

  /**
   * Fetch latest market data from all sources
   * NOTE: In production, this would fetch from APIs. For now, using Oct 2025 baseline data.
   */
  private async fetchTelanganaRtaData() {
    try {
      const { db } = await import('./db.js');
      const { vehicleRegistrations } = await import('../shared/schema.js');
      const { sql } = await import('drizzle-orm');

      // Get latest stats and TOTAL registrations count (using SUM, not COUNT)
      const stats = await db
        .select({
          totalRecords: sql<number>`COALESCE(SUM(${vehicleRegistrations.registrationsCount}), 0)::int`,
          latestYear: sql<number>`MAX(${vehicleRegistrations.year})::int`,
          latestMonth: sql<number>`MAX(${vehicleRegistrations.month})::int`,
        })
        .from(vehicleRegistrations)
        .where(sql`${vehicleRegistrations.state} = 'Telangana'`);

      const totalRegistrations = stats[0]?.totalRecords || 0;

      // Get top brands
      const topBrands = await db
        .select({
          brand: vehicleRegistrations.brand,
          registrations: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
        })
        .from(vehicleRegistrations)
        .where(sql`${vehicleRegistrations.state} = 'Telangana'`)
        .groupBy(vehicleRegistrations.brand)
        .orderBy(sql`SUM(${vehicleRegistrations.registrationsCount}) DESC`)
        .limit(5);

      // Get fuel type distribution
      const fuelData = await db
        .select({
          fuelType: vehicleRegistrations.fuelType,
          count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
        })
        .from(vehicleRegistrations)
        .where(sql`${vehicleRegistrations.state} = 'Telangana'`)
        .groupBy(vehicleRegistrations.fuelType);

      // Get transmission split
      const transmissionData = await db
        .select({
          transmission: vehicleRegistrations.transmission,
          count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
        })
        .from(vehicleRegistrations)
        .where(sql`${vehicleRegistrations.state} = 'Telangana'`)
        .groupBy(vehicleRegistrations.transmission);

      // Get popular districts
      const districts = await db
        .select({
          city: vehicleRegistrations.city,
          count: sql<number>`SUM(${vehicleRegistrations.registrationsCount})::int`
        })
        .from(vehicleRegistrations)
        .where(sql`
          ${vehicleRegistrations.state} = 'Telangana' 
          AND ${vehicleRegistrations.city} IS NOT NULL
        `)
        .groupBy(vehicleRegistrations.city)
        .orderBy(sql`count DESC`)
        .limit(5);

      // Calculate percentages using FULL dataset totals, not just top 5
      const totalFuel = fuelData.reduce((sum, f) => sum + (f.count || 0), 0);
      const totalTransmission = transmissionData.reduce((sum, t) => sum + (t.count || 0), 0);

      return {
        totalRecords: totalRegistrations,
        latestMonth: `${stats[0]?.latestYear || 2025}-${String(stats[0]?.latestMonth || 1).padStart(2, '0')}`,
        topBrands: topBrands.map(b => ({
          brand: b.brand,
          registrations: b.registrations || 0,
          share: totalRegistrations > 0 
            ? `${((b.registrations || 0) / totalRegistrations * 100).toFixed(1)}%`
            : '0%'
        })),
        fuelTrends: {
          petrol: totalFuel > 0
            ? `${((fuelData.find(f => f.fuelType?.toLowerCase() === 'petrol')?.count || 0) / totalFuel * 100).toFixed(1)}%`
            : '0%',
          diesel: totalFuel > 0
            ? `${((fuelData.find(f => f.fuelType?.toLowerCase() === 'diesel')?.count || 0) / totalFuel * 100).toFixed(1)}%`
            : '0%',
          cng: totalFuel > 0
            ? `${((fuelData.find(f => f.fuelType?.toLowerCase() === 'cng')?.count || 0) / totalFuel * 100).toFixed(1)}%`
            : '0%',
          electric: totalFuel > 0
            ? `${((fuelData.find(f => f.fuelType?.toLowerCase().includes('electric') || f.fuelType?.toLowerCase() === 'ev')?.count || 0) / totalFuel * 100).toFixed(1)}%`
            : '0%'
        },
        transmissionSplit: {
          manual: totalTransmission > 0
            ? `${((transmissionData.find(t => t.transmission?.toLowerCase() === 'manual')?.count || 0) / totalTransmission * 100).toFixed(1)}%`
            : '0%',
          automatic: totalTransmission > 0
            ? `${((transmissionData.find(t => t.transmission?.toLowerCase().includes('auto'))?.count || 0) / totalTransmission * 100).toFixed(1)}%`
            : '0%'
        },
        popularDistricts: districts.map(d => d.city || 'Unknown'),
        dataSource: 'Telangana Open Data Portal'
      };
    } catch (error) {
      console.error('Error fetching Telangana RTA data:', error);
      return {
        totalRecords: 0,
        latestMonth: '2025-10',
        topBrands: [],
        fuelTrends: { petrol: '0%', diesel: '0%', cng: '0%', electric: '0%' },
        transmissionSplit: { manual: '0%', automatic: '0%' },
        popularDistricts: [],
        dataSource: 'Telangana Open Data Portal (unavailable)'
      };
    }
  }

  /**
   * Fetch latest market data from all sources
   * NOTE: In production, this would fetch from APIs. For now, using Oct 2025 baseline data.
   */
  private async fetchLatestData(): Promise<MarketDataSnapshot> {
    const now = new Date();
    const nextRefresh = new Date(now.getTime() + this.CACHE_DURATION_HOURS * 60 * 60 * 1000);

    // Fetch real Telangana RTA data
    const telanganaRtaData = await this.fetchTelanganaRtaData();

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
      telanganaRta: {
        official: telanganaRtaData
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
  async getFormattedDataForAI(): Promise<string> {
    const data = this.cachedData || await this.fetchLatestData();
    
    return `
SIAM Data (Sep 2025):
- Passenger Vehicle Wholesales: ${data.siam.passengerVehicleWholesales.sep2025.units.toLocaleString()} units (${data.siam.passengerVehicleWholesales.sep2025.yoyGrowth} YoY)
- Note: ${data.siam.passengerVehicleWholesales.sep2025.note}
- Used Market Growth: ${data.siam.passengerVehicleWholesales.usedMarketGrowth}

VAHAN Registrations:
- National: ${data.vahan.nationalRegistrations.may2025.total.toLocaleString()} (May 2025, ${data.vahan.nationalRegistrations.may2025.momChange} MoM)
- Telangana: ${data.vahan.telangana.urbanGrowth}
- Hyderabad: ${data.vahan.telangana.hyderabadFocus}

TELANGANA RTA OFFICIAL DATA (${data.telanganaRta.official.dataSource}):
- Total Records: ${data.telanganaRta.official.totalRecords.toLocaleString()} registrations
- Latest Data: ${data.telanganaRta.official.latestMonth}
- Top Brands: ${data.telanganaRta.official.topBrands.map(b => `${b.brand} (${b.share})`).join(', ')}
- Fuel Distribution: Petrol ${data.telanganaRta.official.fuelTrends.petrol}, Diesel ${data.telanganaRta.official.fuelTrends.diesel}, CNG ${data.telanganaRta.official.fuelTrends.cng}, Electric ${data.telanganaRta.official.fuelTrends.electric}
- Transmission: Manual ${data.telanganaRta.official.transmissionSplit.manual}, Automatic ${data.telanganaRta.official.transmissionSplit.automatic}
- Popular Districts: ${data.telanganaRta.official.popularDistricts.join(', ')}

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
