/**
 * Dealership Benchmark Post Service
 * Generates Market Insight posts for dealership performance benchmarking
 */

import { generateDealershipBenchmark, type DealershipBenchmarkInput } from './dealershipBenchmarkService';
import type { CommunityPost } from './rssService';
import { db } from './db';
import { communityPosts } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface BenchmarkPostInput {
  oem: string;
  month: string; // 'YYYY-MM'
  mtdSales: number;
  dealerName?: string;
}

/**
 * Generate a Market Insight post from dealership benchmark data
 * Persists to database for retrieval in news feed
 */
export async function generateBenchmarkPost(input: BenchmarkPostInput, userId?: string): Promise<CommunityPost> {
  // Generate the benchmark report
  const report = await generateDealershipBenchmark({
    oem: input.oem,
    month: input.month,
    mtdSales: input.mtdSales
  });

  // Format as HTML content for the post
  const content = formatBenchmarkAsHTML(report, input);

  const postId = `dealership-benchmark-${input.oem}-${input.month}`.toLowerCase().replace(/\s+/g, '-');
  const title = `${input.oem} Dealership Performance Benchmark - ${formatMonthYear(input.month)}`;

  // Persist to database
  await db.insert(communityPosts).values({
    id: postId,
    authorId: userId || 'system',
    title,
    content,
    category: 'dealership_benchmark',
    isExternal: false,
    sourceUrl: `/news/${postId}`,
    sourceName: 'CarArth x AI Grok',
    attribution: `Powered by CarArth AI with ${report.forecast.forecastMethod} ML forecasting`,
    status: 'published'
  }).onConflictDoUpdate({
    target: communityPosts.id,
    set: {
      content,
      updatedAt: new Date()
    }
  });

  // Return as CommunityPost format for immediate use
  const post: CommunityPost = {
    id: postId,
    title,
    content,
    author: 'CarArth Market Intelligence',
    source: 'CarArth x AI Grok',
    sourceUrl: `/news/${postId}`,
    publishedAt: new Date(),
    category: 'Market Intelligence',
    attribution: `Powered by CarArth AI with ${report.forecast.forecastMethod} ML forecasting`,
    isExternal: false,
    coverImage: '/assets/benchmark-cover.png'
  };

  return post;
}

/**
 * Format benchmark report as HTML
 */
function formatBenchmarkAsHTML(report: any, input: BenchmarkPostInput): string {
  const { comparison, forecast, insights } = report;

  // Build HTML sections
  const comparisonSection = `
    <div class="benchmark-comparison">
      <h3>📊 Performance Overview</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <span class="label">MTD Sales</span>
          <span class="value">${comparison.mtdSales}</span>
          <span class="sublabel">units</span>
        </div>
        <div class="metric-card ${comparison.vsTelanganaPct >= 0 ? 'positive' : 'negative'}">
          <span class="label">vs Telangana Avg</span>
          <span class="value">${comparison.vsTelanganaPct >= 0 ? '+' : ''}${comparison.vsTelanganaPct.toFixed(1)}%</span>
          <span class="sublabel">${comparison.telanganaAvg} units avg</span>
        </div>
        <div class="metric-card ${comparison.vsROIPct >= 0 ? 'positive' : 'negative'}">
          <span class="label">vs ROI Avg</span>
          <span class="value">${comparison.vsROIPct >= 0 ? '+' : ''}${comparison.vsROIPct.toFixed(1)}%</span>
          <span class="sublabel">${comparison.roiAvg} units avg</span>
        </div>
        ${comparison.momGrowth !== null ? `
        <div class="metric-card ${comparison.momGrowth >= 0 ? 'positive' : 'negative'}">
          <span class="label">MoM Growth</span>
          <span class="value">${comparison.momGrowth >= 0 ? '+' : ''}${comparison.momGrowth.toFixed(1)}%</span>
        </div>
        ` : ''}
        ${comparison.yoyGrowth !== null ? `
        <div class="metric-card ${comparison.yoyGrowth >= 0 ? 'positive' : 'negative'}">
          <span class="label">YoY Growth</span>
          <span class="value">${comparison.yoyGrowth >= 0 ? '+' : ''}${comparison.yoyGrowth.toFixed(1)}%</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  const forecastSection = `
    <div class="benchmark-forecast">
      <h3>🔮 ML-Powered Forecast</h3>
      <div class="forecast-card">
        <div class="forecast-main">
          <span class="label">Next Month Prediction</span>
          <span class="value">${forecast.nextMonthPrediction}</span>
          <span class="sublabel">units (${forecast.predictionChange >= 0 ? '+' : ''}${forecast.predictionChange.toFixed(1)}% change)</span>
        </div>
        <div class="forecast-meta">
          <div class="meta-item">
            <span class="label">Method:</span>
            <span class="value">${forecast.forecastMethod.toUpperCase()}</span>
          </div>
          <div class="meta-item">
            <span class="label">Confidence:</span>
            <span class="value">${forecast.confidence}%</span>
          </div>
          <div class="meta-item">
            <span class="label">Seasonal Trend:</span>
            <span class="value trend-${forecast.seasonalTrend}">${forecast.seasonalTrend.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const insightsSection = `
    <div class="benchmark-insights">
      <h3>💡 Actionable Intelligence</h3>
      <div class="insights-list">
        ${insights.map((insight: any) => `
          <div class="insight-card insight-${insight.type}">
            <div class="insight-icon">${getInsightIcon(insight.type)}</div>
            <div class="insight-content">
              <p class="insight-message">${insight.message}</p>
              <p class="insight-recommendation">${insight.recommendation}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const chartSection = `
    <div class="benchmark-chart">
      <h3>📈 Sales Trend Analysis</h3>
      <p class="chart-description">
        Historical performance with ML prediction for ${formatNextMonth(input.month)}
      </p>
      <div class="chart-data" data-chart-info='${JSON.stringify(report.chartData)}'>
        <!-- Chart will be rendered by frontend using this data -->
        <canvas id="benchmark-trend-chart"></canvas>
      </div>
    </div>
  `;

  const dataSourcesSection = `
    <div class="data-sources">
      <h4>Data Sources</h4>
      <ul>
        <li>Telangana RTA - Vehicle Registrations</li>
        <li>VAHAN - National Registration Data</li>
        ${comparison.siamYoY !== null ? '<li>SIAM - OEM Sales Benchmarks</li>' : ''}
        <li>CarArth ML Engine - ${forecast.forecastMethod} Forecasting</li>
      </ul>
    </div>
  `;

  return `
    <article class="dealership-benchmark-post">
      <div class="benchmark-header">
        <h2>${input.oem} Dealership Performance - ${formatMonthYear(input.month)}</h2>
        ${input.dealerName ? `<p class="dealer-name">Dealer: ${input.dealerName}</p>` : ''}
        <p class="benchmark-subtitle">
          Advanced ML forecasting powered by CarArth AI • 
          ${forecast.confidence}% confidence • 
          ${forecast.forecastMethod.toUpperCase()} model
        </p>
      </div>

      ${comparisonSection}
      ${forecastSection}
      ${insightsSection}
      ${chartSection}
      ${dataSourcesSection}

      <div class="benchmark-footer">
        <p class="attribution">
          Generated by <strong>CarArth x AI Grok</strong> using real market data from 
          Telangana RTA, VAHAN, and SIAM with hybrid ${forecast.forecastMethod} ML forecasting.
        </p>
      </div>
    </article>
  `;
}

/**
 * Helper: Get insight icon based on type
 */
function getInsightIcon(type: string): string {
  switch (type) {
    case 'warning': return '⚠️';
    case 'opportunity': return '🎯';
    case 'success': return '✅';
    default: return '💡';
  }
}

/**
 * Helper: Format month-year display
 */
function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

/**
 * Helper: Format next month for display
 */
function formatNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return formatMonthYear(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
}

/**
 * Get all stored benchmark posts from database
 */
export async function getAllBenchmarkPosts(): Promise<CommunityPost[]> {
  const posts = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.category, 'dealership_benchmark'))
    .orderBy(communityPosts.createdAt);

  return posts.map(post => ({
    id: post.id,
    title: post.title,
    content: post.content,
    author: 'CarArth Market Intelligence',
    source: post.sourceName || 'CarArth x AI Grok',
    sourceUrl: post.sourceUrl || `/news/${post.id}`,
    publishedAt: post.createdAt || new Date(),
    category: 'Market Intelligence',
    attribution: post.attribution || 'Powered by CarArth AI',
    isExternal: false
  }));
}
