/**
 * Internal Scheduler for Batch Ingestion - Cost-Optimized Workflow
 * Runs Firecrawl caching at 11AM & 11PM IST for lean operation
 * Configurable via CACHE_TIMES_IST environment variable
 */

import { scraperHealthMonitor } from './scraperHealthMonitor.js';

export class InternalScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private retryIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isExecuting = false;
  private lastRunTimes = new Map<number, string>(); // hour -> ISO date

  /**
   * Start the scheduler to run batch ingestion twice daily
   * Runs at 11 AM and 11 PM IST (configurable via CACHE_TIMES_IST)
   * Default: 11:00,23:00 for cost-optimized lean workflow
   */
  async start() {
    if (this.isRunning) {
      console.log('⏰ Scheduler already running');
      return;
    }

    // Initialize health monitor to load pending retries from database
    await scraperHealthMonitor.initialize();

    this.isRunning = true;
    const cacheTimesIST = this.getCacheSchedule();
    console.log(`⏰ Internal scheduler started - will run batch ingestion at ${cacheTimesIST.join(' & ')} IST`);
    
    // Check every hour if it's time to run
    this.intervalId = setInterval(() => {
      this.checkAndRunIngestion();
    }, 60 * 60 * 1000); // Check every hour

    // Also run immediately if it's been more than 12 hours since last run
    this.checkAndRunIngestion();
    
    // Start retry processing timer (checks every minute)
    this.retryIntervalId = setInterval(() => {
      this.processScraperRetries();
    }, 60 * 1000); // Check every minute for due retries
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏰ Internal scheduler stopped');
    }
    if (this.retryIntervalId) {
      clearInterval(this.retryIntervalId);
      this.retryIntervalId = null;
      console.log('⏰ Retry processor stopped');
    }
  }

  private getCacheSchedule(): string[] {
    const cacheTimesEnv = process.env.CACHE_TIMES_IST || '11:00,23:00';
    const times = cacheTimesEnv.split(',').map(time => time.trim());
    
    // Validate time format
    const validTimes = times.filter(time => {
      const match = time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
      if (!match) {
        console.warn(`⚠️ Invalid time format in CACHE_TIMES_IST: '${time}'. Expected HH:MM format.`);
        return false;
      }
      return true;
    });
    
    if (validTimes.length === 0) {
      console.warn('⚠️ No valid times found in CACHE_TIMES_IST, falling back to default: 11:00,23:00');
      return ['11:00', '23:00'];
    }
    
    return validTimes;
  }

  private getScheduleHours(): number[] {
    const times = this.getCacheSchedule();
    return times.map(time => parseInt(time.split(':')[0]));
  }
  
  private getISTTime(): { hour: number; minute: number; date: Date } {
    // Use timezone-aware calculation for IST
    const now = new Date();
    const istTimeString = now.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const [hour, minute] = istTimeString.split(':').map(num => parseInt(num));
    
    // Get full IST date for comparison
    const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    return { hour, minute, date: istDate };
  }

  private async checkAndRunIngestion() {
    // Prevent concurrent executions
    if (this.isExecuting) {
      console.log('⏳ Ingestion already executing, skipping check');
      return;
    }
    
    const { hour, minute, date: istTime } = this.getISTTime();
    const todayKey = istTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if current time matches any configured schedule (within ±5 minutes)
    const cacheSchedule = this.getCacheSchedule();
    let shouldRun = false;
    let matchedTime: string | null = null;
    
    for (const timeStr of cacheSchedule) {
      const [scheduleHour, scheduleMinute] = timeStr.split(':').map(num => parseInt(num));
      const timeDiffMinutes = Math.abs((hour * 60 + minute) - (scheduleHour * 60 + scheduleMinute));
      
      // Run within ±5 minutes of scheduled time
      if (timeDiffMinutes <= 5) {
        // Check if we already ran today for this hour
        const lastRun = this.lastRunTimes.get(scheduleHour);
        if (lastRun !== todayKey) {
          shouldRun = true;
          matchedTime = timeStr;
          break;
        }
      }
    }
    
    if (shouldRun && matchedTime) {
      this.isExecuting = true;
      const scheduleHour = parseInt(matchedTime.split(':')[0]);
      
      console.log(`⏰ Firecrawl cache refresh triggered at ${matchedTime} IST (${istTime.toISOString()})`);
      
      try {
        // Use new orchestrated ingestion for cost-optimized workflow
        const pipelineMode = process.env.AI_PIPELINE_MODE || 'lean_v1';
        console.log(`🔄 Running ${pipelineMode} ingestion pipeline`);
        
        if (pipelineMode === 'lean_v1') {
          // Import and run orchestrated ingestion
          const { orchestratedBatchIngestion } = await import('./orchestratedIngestion.js');
          
          // Run orchestrated ingestion (has internal concurrency handling)
          const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
          await orchestratedBatchIngestion.runIngestion(cities);
          console.log('✅ Orchestrated lean ingestion completed successfully');
          
          // ADDITIONAL SCRAPERS: Run forum and auction scrapers alongside lean pipeline
          console.log('🔄 Running additional forum and auction scrapers...');
          const { DatabaseStorage } = await import('./dbStorage.js');
          const storage = new DatabaseStorage();
          
          // Team-BHP classifieds (owner forum listings)
          const teamBhpRunId = await scraperHealthMonitor.startRun('Team-BHP', 'forum');
          try {
            const { teamBhpScraper } = await import('./teamBhpScraper.js');
            const result = await teamBhpScraper.scrapeLatestListings(storage.db);
            await scraperHealthMonitor.completeRun(teamBhpRunId, {
              success: true,
              totalFound: result.newListings || 0,
              newListingsSaved: result.newListings || 0
            });
            console.log(`✅ Team-BHP scraping: ${result.newListings} new listings from owner forums`);
          } catch (error) {
            await scraperHealthMonitor.completeRun(teamBhpRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Team-BHP scraping failed:', error);
          }
          
          // EauctionsIndia bank auctions
          const bankRunId = await scraperHealthMonitor.startRun('EauctionsIndia', 'auction');
          try {
            const { EauctionsIndiaScraper } = await import('./eauctionsIndiaScraper.js');
            const { cachedPortalListings } = await import('../shared/schema.js');
            const bankAuctionScraper = new EauctionsIndiaScraper();
            const result = await bankAuctionScraper.scrapeListings({ bank: 'all', maxPages: 2 });
            
            if (result.success && result.listings.length > 0) {
              // Persist authenticated listings to database
              let saved = 0;
              for (const listing of result.listings) {
                try {
                  // Skip listings without required fields
                  if (!listing.price || listing.price <= 0) {
                    console.log(`⚠️ Skipping bank auction listing without price: ${listing.title}`);
                    continue;
                  }
                  
                  const existing = await storage.db
                    .select()
                    .from(cachedPortalListings)
                    .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                    .limit(1);
                  
                  if (existing.length === 0) {
                    const hash = `bankauction-${listing.url}`;
                    
                    await storage.db.insert(cachedPortalListings).values({
                      portal: 'EauctionsIndia',
                      externalId: listing.id,
                      url: listing.url,
                      title: listing.title,
                      brand: listing.brand,
                      model: listing.model,
                      year: listing.year,
                      price: listing.price.toString(),
                      mileage: listing.mileage || null,
                      fuelType: listing.fuelType || null,
                      transmission: listing.transmission || null,
                      location: listing.location,
                      city: listing.city,
                      description: listing.description || null,
                      images: listing.images || [],
                      sellerType: 'bank',
                      verificationStatus: listing.verificationStatus || 'unverified',
                      listingDate: listing.listingDate,
                      hash: hash,
                      origin: 'scraped'
                    });
                    saved++;
                  }
                } catch (err) {
                  console.error(`❌ Failed to save bank auction listing: ${err}`);
                }
              }
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: true,
                totalFound: result.totalFound || 0,
                newListingsSaved: saved
              });
              console.log(`✅ EauctionsIndia bank auctions: ${saved} new listings saved (${result.authenticatedListings} authenticated from ${result.totalFound} found)`);
            } else if (!result.success) {
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: false,
                totalFound: 0,
                newListingsSaved: 0,
                error: result.errors?.join(', ')
              });
              console.error(`❌ EauctionsIndia scraping failed: ${result.errors?.join(', ')}`);
            } else {
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: true,
                totalFound: 0,
                newListingsSaved: 0
              });
              console.log(`✅ EauctionsIndia bank auctions: No new listings found`);
            }
          } catch (error) {
            await scraperHealthMonitor.completeRun(bankRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ EauctionsIndia scraping failed:', error);
          }
          
          console.log('✅ Additional scrapers completed');
        } else {
          // Fallback to legacy batch ingestion
          const { batchIngestionService } = await import('./batchIngestion.js');
          const status = batchIngestionService.getStatus();
          
          if (!status.isIngesting) {
            const cities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune', 'chennai'];
            await batchIngestionService.runIngestion(cities);
            console.log('✅ Legacy batch ingestion completed successfully');
          } else {
            console.log('⏳ Batch ingestion already in progress, skipping scheduled run');
          }
        }
        
        // Run forum/marketplace scraping once daily (first scheduled time only)
        if (scheduleHour === this.getScheduleHours()[0]) {
          const { DatabaseStorage } = await import('./dbStorage.js');
          const storage = new DatabaseStorage();
          
          // Team-BHP classifieds
          const teamBhpRunId = await scraperHealthMonitor.startRun('Team-BHP', 'forum');
          try {
            const { teamBhpScraper } = await import('./teamBhpScraper.js');
            const result = await teamBhpScraper.scrapeLatestListings(storage.db);
            await scraperHealthMonitor.completeRun(teamBhpRunId, {
              success: true,
              totalFound: result.newListings || 0,
              newListingsSaved: result.newListings || 0
            });
            console.log(`✅ Team-BHP scraping: ${result.newListings} new listings from owner forums`);
          } catch (error) {
            await scraperHealthMonitor.completeRun(teamBhpRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Team-BHP scraping failed:', error);
          }
          
          // TheAutomotiveIndia marketplace
          const automotiveRunId = await scraperHealthMonitor.startRun('TheAutomotiveIndia', 'marketplace');
          try {
            const { automotiveIndiaScraper } = await import('./automotiveIndiaScraper.js');
            const result = await automotiveIndiaScraper.scrapeLatestListings(storage.db);
            await scraperHealthMonitor.completeRun(automotiveRunId, {
              success: true,
              totalFound: result.newListings || 0,
              newListingsSaved: result.newListings || 0
            });
            console.log(`✅ TheAutomotiveIndia scraping: ${result.newListings} new listings from marketplace`);
          } catch (error) {
            await scraperHealthMonitor.completeRun(automotiveRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ TheAutomotiveIndia scraping failed:', error);
          }
          
          // Quikr Cars owner listings
          const quikrRunId = await scraperHealthMonitor.startRun('Quikr', 'marketplace');
          try {
            const { quikrScraper } = await import('./quikrScraper.js');
            const result = await quikrScraper.scrapeLatestListings(storage.db);
            await scraperHealthMonitor.completeRun(quikrRunId, {
              success: true,
              totalFound: result.newListings || 0,
              newListingsSaved: result.newListings || 0
            });
            console.log(`✅ Quikr scraping: ${result.newListings} new listings from owner classifieds`);
          } catch (error) {
            await scraperHealthMonitor.completeRun(quikrRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Quikr scraping failed:', error);
          }
          
          // Reddit r/CarsIndia buying/selling threads
          const redditRunId = await scraperHealthMonitor.startRun('Reddit r/CarsIndia', 'forum');
          try {
            const { redditScraper } = await import('./redditScraper.js');
            const result = await redditScraper.scrapeLatestListings(storage.db);
            await scraperHealthMonitor.completeRun(redditRunId, {
              success: true,
              totalFound: result.newListings || 0,
              newListingsSaved: result.newListings || 0
            });
            console.log(`✅ Reddit scraping: ${result.newListings} new listings from r/CarsIndia`);
          } catch (error) {
            await scraperHealthMonitor.completeRun(redditRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Reddit scraping failed:', error);
          }
          
          // Apify OLX scraping - Major cities
          const apiToken = process.env.APIFY_API_TOKEN;
          if (apiToken) {
            const { ApifyOlxScraper } = await import('./apifyOlxScraper.js');
            const olxScraper = new ApifyOlxScraper(apiToken, storage);
            const citiesToScrape = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune'];
            
            for (const city of citiesToScrape) {
              const olxRunId = await scraperHealthMonitor.startRun(`OLX ${city}`, 'marketplace');
              try {
                const result = await olxScraper.scrapeOlxCars(city, 50); // 50 listings per city
                await scraperHealthMonitor.completeRun(olxRunId, {
                  success: result.success,
                  totalFound: result.scrapedCount,
                  newListingsSaved: result.savedCount
                });
                console.log(`✅ OLX ${city} scraping: ${result.savedCount} new listings`);
              } catch (error) {
                await scraperHealthMonitor.completeRun(olxRunId, {
                  success: false,
                  totalFound: 0,
                  newListingsSaved: 0,
                  error: error instanceof Error ? error.message : String(error),
                  errorStack: error instanceof Error ? error.stack : undefined
                });
                console.error(`❌ OLX ${city} scraping failed:`, error);
              }
            }
          } else {
            console.warn('⚠️ Skipping OLX scraping: APIFY_API_TOKEN not configured');
          }
          
          // Apify Facebook Marketplace scraping - Major cities
          if (apiToken) {
            const { ApifyFacebookScraper } = await import('./apifyFacebookScraper.js');
            const facebookScraper = new ApifyFacebookScraper(apiToken, storage);
            const citiesToScrape = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune'];
            
            for (const city of citiesToScrape) {
              const fbRunId = await scraperHealthMonitor.startRun(`Facebook Marketplace ${city}`, 'marketplace');
              try {
                const result = await facebookScraper.scrapeFacebookCars(city, 50); // 50 listings per city
                await scraperHealthMonitor.completeRun(fbRunId, {
                  success: result.success,
                  totalFound: result.scrapedCount,
                  newListingsSaved: result.savedCount
                });
                console.log(`✅ Facebook Marketplace ${city} scraping: ${result.savedCount} new listings`);
              } catch (error) {
                await scraperHealthMonitor.completeRun(fbRunId, {
                  success: false,
                  totalFound: 0,
                  newListingsSaved: 0,
                  error: error instanceof Error ? error.message : String(error),
                  errorStack: error instanceof Error ? error.stack : undefined
                });
                console.error(`❌ Facebook Marketplace ${city} scraping failed:`, error);
              }
            }
          } else {
            console.warn('⚠️ Skipping Facebook Marketplace scraping: APIFY_API_TOKEN not configured');
          }
          
          // CarDekho scraping - Hyderabad focus to increase listings
          const { CarDekhoScraper } = await import('./carDekhoScraper.js');
          const carDekhoScraper = new CarDekhoScraper(storage);
          const carDekhoCities = ['hyderabad', 'bangalore', 'mumbai', 'delhi', 'pune'];
          
          for (const city of carDekhoCities) {
            const carDekhoRunId = await scraperHealthMonitor.startRun(`CarDekho ${city}`, 'marketplace');
            try {
              const result = await carDekhoScraper.scrapeCarDekhoCars(city, 50); // 50 listings per city
              await scraperHealthMonitor.completeRun(carDekhoRunId, {
                success: result.success,
                totalFound: result.scrapedCount,
                newListingsSaved: result.savedCount
              });
              console.log(`✅ CarDekho ${city} scraping: ${result.savedCount} new listings`);
            } catch (error) {
              await scraperHealthMonitor.completeRun(carDekhoRunId, {
                success: false,
                totalFound: 0,
                newListingsSaved: 0,
                error: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined
              });
              console.error(`❌ CarDekho ${city} scraping failed:`, error);
            }
          }
          
          // Hyundai H-Promise certified pre-owned
          const hyundaiRunId = await scraperHealthMonitor.startRun('Hyundai H-Promise', 'certified');
          try {
            const { HyundaiPromiseScraper } = await import('./hyundaiPromiseScraper.js');
            const { cachedPortalListings } = await import('../shared/schema.js');
            const hyundaiScraper = new HyundaiPromiseScraper();
            const result = await hyundaiScraper.scrapeListings({ maxPages: 3 });
            
            if (result.success && result.listings.length > 0) {
              // Persist authenticated listings to database
              let saved = 0;
              for (const listing of result.listings) {
                try {
                  // Skip listings without required fields
                  if (!listing.price || listing.price <= 0) {
                    console.log(`⚠️ Skipping Hyundai listing without price: ${listing.title}`);
                    continue;
                  }
                  
                  // Check if listing already exists
                  const existing = await storage.db
                    .select()
                    .from(cachedPortalListings)
                    .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                    .limit(1);
                  
                  if (existing.length === 0) {
                    // Calculate hash for deduplication
                    const hash = `hyundai-${listing.url}`;
                    
                    await storage.db.insert(cachedPortalListings).values({
                      portal: 'Hyundai H-Promise',
                      externalId: listing.id,
                      url: listing.url,
                      title: listing.title,
                      brand: listing.brand,
                      model: listing.model,
                      year: listing.year,
                      price: listing.price.toString(),
                      mileage: listing.mileage || null,
                      fuelType: listing.fuelType || null,
                      transmission: listing.transmission || null,
                      location: listing.location,
                      city: listing.city,
                      description: listing.description || null,
                      images: listing.images || [],
                      sellerType: listing.sellerType || 'dealer',
                      verificationStatus: listing.verificationStatus || 'unverified',
                      listingDate: listing.listingDate,
                      hash: hash,
                      origin: 'scraped'
                    });
                    saved++;
                  }
                } catch (err) {
                  console.error(`❌ Failed to save Hyundai listing: ${err}`);
                }
              }
              await scraperHealthMonitor.completeRun(hyundaiRunId, {
                success: true,
                totalFound: result.totalFound || 0,
                newListingsSaved: saved
              });
              console.log(`✅ Hyundai H-Promise scraping: ${saved} new listings saved (${result.authenticatedListings} authenticated from ${result.totalFound} found)`);
            } else if (!result.success) {
              await scraperHealthMonitor.completeRun(hyundaiRunId, {
                success: false,
                totalFound: 0,
                newListingsSaved: 0,
                error: result.errors?.join(', ')
              });
              console.error(`❌ Hyundai H-Promise scraping failed: ${result.errors?.join(', ')}`);
            } else {
              await scraperHealthMonitor.completeRun(hyundaiRunId, {
                success: true,
                totalFound: 0,
                newListingsSaved: 0
              });
              console.log(`✅ Hyundai H-Promise scraping: No new listings found`);
            }
          } catch (error) {
            await scraperHealthMonitor.completeRun(hyundaiRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Hyundai H-Promise scraping failed:', error);
          }
          
          // Mahindra First Choice certified pre-owned
          const mahindraRunId = await scraperHealthMonitor.startRun('Mahindra First Choice', 'certified');
          try {
            const { MahindraFirstChoiceScraper } = await import('./mahindraFirstChoiceScraper.js');
            const { cachedPortalListings } = await import('../shared/schema.js');
            const mahindraScraper = new MahindraFirstChoiceScraper();
            const result = await mahindraScraper.scrapeListings({ maxPages: 3 });
            
            if (result.success && result.listings.length > 0) {
              // Persist authenticated listings to database
              let saved = 0;
              for (const listing of result.listings) {
                try {
                  // Skip listings without required fields
                  if (!listing.price || listing.price <= 0) {
                    console.log(`⚠️ Skipping Mahindra listing without price: ${listing.title}`);
                    continue;
                  }
                  
                  const existing = await storage.db
                    .select()
                    .from(cachedPortalListings)
                    .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                    .limit(1);
                  
                  if (existing.length === 0) {
                    const hash = `mahindra-${listing.url}`;
                    
                    await storage.db.insert(cachedPortalListings).values({
                      portal: 'Mahindra First Choice',
                      externalId: listing.id,
                      url: listing.url,
                      title: listing.title,
                      brand: listing.brand,
                      model: listing.model,
                      year: listing.year,
                      price: listing.price.toString(),
                      mileage: listing.mileage || null,
                      fuelType: listing.fuelType || null,
                      transmission: listing.transmission || null,
                      location: listing.location,
                      city: listing.city,
                      description: listing.description || null,
                      images: listing.images || [],
                      sellerType: listing.sellerType || 'dealer',
                      verificationStatus: listing.verificationStatus || 'unverified',
                      listingDate: listing.listingDate,
                      hash: hash,
                      origin: 'scraped'
                    });
                    saved++;
                  }
                } catch (err) {
                  console.error(`❌ Failed to save Mahindra listing: ${err}`);
                }
              }
              await scraperHealthMonitor.completeRun(mahindraRunId, {
                success: true,
                totalFound: result.totalFound || 0,
                newListingsSaved: saved
              });
              console.log(`✅ Mahindra First Choice scraping: ${saved} new listings saved (${result.authenticatedListings} authenticated from ${result.totalFound} found)`);
            } else if (!result.success) {
              await scraperHealthMonitor.completeRun(mahindraRunId, {
                success: false,
                totalFound: 0,
                newListingsSaved: 0,
                error: result.errors?.join(', ')
              });
              console.error(`❌ Mahindra First Choice scraping failed: ${result.errors?.join(', ')}`);
            } else {
              await scraperHealthMonitor.completeRun(mahindraRunId, {
                success: true,
                totalFound: 0,
                newListingsSaved: 0
              });
              console.log(`✅ Mahindra First Choice scraping: No new listings found`);
            }
          } catch (error) {
            await scraperHealthMonitor.completeRun(mahindraRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ Mahindra First Choice scraping failed:', error);
          }
          
          // EauctionsIndia bank auctions
          const bankRunId = await scraperHealthMonitor.startRun('EauctionsIndia', 'auction');
          try {
            const { EauctionsIndiaScraper } = await import('./eauctionsIndiaScraper.js');
            const { cachedPortalListings } = await import('../shared/schema.js');
            const bankAuctionScraper = new EauctionsIndiaScraper();
            const result = await bankAuctionScraper.scrapeListings({ bank: 'all', maxPages: 2 });
            
            if (result.success && result.listings.length > 0) {
              // Persist authenticated listings to database
              let saved = 0;
              for (const listing of result.listings) {
                try {
                  // Skip listings without required fields
                  if (!listing.price || listing.price <= 0) {
                    console.log(`⚠️ Skipping bank auction listing without price: ${listing.title}`);
                    continue;
                  }
                  
                  const existing = await storage.db
                    .select()
                    .from(cachedPortalListings)
                    .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                    .limit(1);
                  
                  if (existing.length === 0) {
                    const hash = `bankauction-${listing.url}`;
                    
                    await storage.db.insert(cachedPortalListings).values({
                      portal: 'EauctionsIndia',
                      externalId: listing.id,
                      url: listing.url,
                      title: listing.title,
                      brand: listing.brand,
                      model: listing.model,
                      year: listing.year,
                      price: listing.price.toString(),
                      mileage: listing.mileage || null,
                      fuelType: listing.fuelType || null,
                      transmission: listing.transmission || null,
                      location: listing.location,
                      city: listing.city,
                      description: listing.description || null,
                      images: listing.images || [],
                      sellerType: 'bank',
                      verificationStatus: listing.verificationStatus || 'unverified',
                      listingDate: listing.listingDate,
                      hash: hash,
                      origin: 'scraped'
                    });
                    saved++;
                  }
                } catch (err) {
                  console.error(`❌ Failed to save bank auction listing: ${err}`);
                }
              }
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: true,
                totalFound: result.totalFound || 0,
                newListingsSaved: saved
              });
              console.log(`✅ EauctionsIndia bank auctions: ${saved} new listings saved (${result.authenticatedListings} authenticated from ${result.totalFound} found)`);
            } else if (!result.success) {
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: false,
                totalFound: 0,
                newListingsSaved: 0,
                error: result.errors?.join(', ')
              });
              console.error(`❌ EauctionsIndia scraping failed: ${result.errors?.join(', ')}`);
            } else {
              await scraperHealthMonitor.completeRun(bankRunId, {
                success: true,
                totalFound: 0,
                newListingsSaved: 0
              });
              console.log(`✅ EauctionsIndia bank auctions: No new listings found`);
            }
          } catch (error) {
            await scraperHealthMonitor.completeRun(bankRunId, {
              success: false,
              totalFound: 0,
              newListingsSaved: 0,
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined
            });
            console.error('❌ EauctionsIndia scraping failed:', error);
          }
        }
        
        // Mark this hour as executed for today
        this.lastRunTimes.set(scheduleHour, todayKey);
        
      } catch (error) {
        console.error('❌ Scheduled ingestion failed:', error);
      } finally {
        this.isExecuting = false;
      }
    }
  }

  private async processScraperRetries(): Promise<void> {
    try {
      const dueRetries = await scraperHealthMonitor.processRetries();
      
      if (dueRetries.length === 0) {
        return; // No retries due
      }

      const { DatabaseStorage } = await import('./dbStorage.js');
      const storage = new DatabaseStorage();

      for (const retry of dueRetries) {
        console.log(`🔄 Executing retry for ${retry.scraperName} (attempt ${retry.retryAttempt})`);
        
        // Execute the appropriate scraper
        await this.executeScraper(retry.scraperName, storage);
      }
    } catch (error) {
      console.error('❌ Retry processing failed:', error);
    }
  }

  private async executeScraper(scraperName: string, storage: any): Promise<void> {
    const { cachedPortalListings } = await import('../shared/schema.js');
    
    switch (scraperName) {
      case 'Team-BHP': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'forum');
        try {
          const { teamBhpScraper } = await import('./teamBhpScraper.js');
          const result = await teamBhpScraper.scrapeLatestListings(storage.db);
          await scraperHealthMonitor.completeRun(runId, {
            success: true,
            totalFound: result.newListings || 0,
            newListingsSaved: result.newListings || 0
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'TheAutomotiveIndia': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'marketplace');
        try {
          const { automotiveIndiaScraper } = await import('./automotiveIndiaScraper.js');
          const result = await automotiveIndiaScraper.scrapeLatestListings(storage.db);
          await scraperHealthMonitor.completeRun(runId, {
            success: true,
            totalFound: result.newListings || 0,
            newListingsSaved: result.newListings || 0
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'Quikr': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'marketplace');
        try {
          const { quikrScraper } = await import('./quikrScraper.js');
          const result = await quikrScraper.scrapeLatestListings(storage.db);
          await scraperHealthMonitor.completeRun(runId, {
            success: true,
            totalFound: result.newListings || 0,
            newListingsSaved: result.newListings || 0
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'Reddit r/CarsIndia': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'forum');
        try {
          const { redditScraper } = await import('./redditScraper.js');
          const result = await redditScraper.scrapeLatestListings(storage.db);
          await scraperHealthMonitor.completeRun(runId, {
            success: true,
            totalFound: result.newListings || 0,
            newListingsSaved: result.newListings || 0
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'Hyundai H-Promise': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'certified');
        try {
          const { HyundaiPromiseScraper } = await import('./hyundaiPromiseScraper.js');
          const hyundaiScraper = new HyundaiPromiseScraper();
          const result = await hyundaiScraper.scrapeListings({ maxPages: 3 });
          
          let saved = 0;
          if (result.success && result.listings.length > 0) {
            for (const listing of result.listings) {
              if (!listing.price || listing.price <= 0) continue;
              
              const existing = await storage.db
                .select()
                .from(cachedPortalListings)
                .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                .limit(1);
              
              if (existing.length === 0) {
                await storage.db.insert(cachedPortalListings).values({
                  portal: 'Hyundai H-Promise',
                  externalId: listing.id,
                  url: listing.url,
                  title: listing.title,
                  brand: listing.brand,
                  model: listing.model,
                  year: listing.year,
                  price: listing.price.toString(),
                  mileage: listing.mileage || null,
                  fuelType: listing.fuelType || null,
                  transmission: listing.transmission || null,
                  location: listing.location,
                  city: listing.city,
                  description: listing.description || null,
                  images: listing.images || [],
                  sellerType: listing.sellerType || 'dealer',
                  verificationStatus: listing.verificationStatus || 'unverified',
                  listingDate: listing.listingDate,
                  hash: `hyundai-${listing.url}`,
                  origin: 'scraped'
                });
                saved++;
              }
            }
          }
          
          await scraperHealthMonitor.completeRun(runId, {
            success: result.success,
            totalFound: result.totalFound || 0,
            newListingsSaved: saved,
            error: !result.success ? result.errors?.join(', ') : undefined
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'Mahindra First Choice': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'certified');
        try {
          const { MahindraFirstChoiceScraper } = await import('./mahindraFirstChoiceScraper.js');
          const mahindraScraper = new MahindraFirstChoiceScraper();
          const result = await mahindraScraper.scrapeListings({ maxPages: 3 });
          
          let saved = 0;
          if (result.success && result.listings.length > 0) {
            for (const listing of result.listings) {
              if (!listing.price || listing.price <= 0) continue;
              
              const existing = await storage.db
                .select()
                .from(cachedPortalListings)
                .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                .limit(1);
              
              if (existing.length === 0) {
                await storage.db.insert(cachedPortalListings).values({
                  portal: 'Mahindra First Choice',
                  externalId: listing.id,
                  url: listing.url,
                  title: listing.title,
                  brand: listing.brand,
                  model: listing.model,
                  year: listing.year,
                  price: listing.price.toString(),
                  mileage: listing.mileage || null,
                  fuelType: listing.fuelType || null,
                  transmission: listing.transmission || null,
                  location: listing.location,
                  city: listing.city,
                  description: listing.description || null,
                  images: listing.images || [],
                  sellerType: listing.sellerType || 'dealer',
                  verificationStatus: listing.verificationStatus || 'unverified',
                  listingDate: listing.listingDate,
                  hash: `mahindra-${listing.url}`,
                  origin: 'scraped'
                });
                saved++;
              }
            }
          }
          
          await scraperHealthMonitor.completeRun(runId, {
            success: result.success,
            totalFound: result.totalFound || 0,
            newListingsSaved: saved,
            error: !result.success ? result.errors?.join(', ') : undefined
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      case 'EauctionsIndia': {
        const runId = await scraperHealthMonitor.startRun(scraperName, 'auction');
        try {
          const { EauctionsIndiaScraper } = await import('./eauctionsIndiaScraper.js');
          const bankAuctionScraper = new EauctionsIndiaScraper();
          const result = await bankAuctionScraper.scrapeListings({ bank: 'all', maxPages: 2 });
          
          let saved = 0;
          if (result.success && result.listings.length > 0) {
            for (const listing of result.listings) {
              if (!listing.price || listing.price <= 0) continue;
              
              const existing = await storage.db
                .select()
                .from(cachedPortalListings)
                .where((eb: any) => eb.eq(cachedPortalListings.url, listing.url))
                .limit(1);
              
              if (existing.length === 0) {
                await storage.db.insert(cachedPortalListings).values({
                  portal: 'EauctionsIndia',
                  externalId: listing.id,
                  url: listing.url,
                  title: listing.title,
                  brand: listing.brand,
                  model: listing.model,
                  year: listing.year,
                  price: listing.price.toString(),
                  mileage: listing.mileage || null,
                  fuelType: listing.fuelType || null,
                  transmission: listing.transmission || null,
                  location: listing.location,
                  city: listing.city,
                  description: listing.description || null,
                  images: listing.images || [],
                  sellerType: 'bank',
                  verificationStatus: listing.verificationStatus || 'unverified',
                  listingDate: listing.listingDate,
                  hash: `bankauction-${listing.url}`,
                  origin: 'scraped'
                });
                saved++;
              }
            }
          }
          
          await scraperHealthMonitor.completeRun(runId, {
            success: result.success,
            totalFound: result.totalFound || 0,
            newListingsSaved: saved,
            error: !result.success ? result.errors?.join(', ') : undefined
          });
        } catch (error) {
          await scraperHealthMonitor.completeRun(runId, {
            success: false,
            totalFound: 0,
            newListingsSaved: 0,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
        }
        break;
      }
      
      default:
        console.warn(`⚠️ Unknown scraper for retry: ${scraperName}`);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: this.isRunning ? 'Every hour' : 'Stopped',
      cacheSchedule: this.getCacheSchedule(),
      scheduleHours: this.getScheduleHours(),
      pipelineMode: process.env.AI_PIPELINE_MODE || 'lean_v1'
    };
  }
}

// Export singleton instance
export const internalScheduler = new InternalScheduler();