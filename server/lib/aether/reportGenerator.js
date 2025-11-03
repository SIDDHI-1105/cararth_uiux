import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PDF Report Generator for ÆTHER Audits
 */
export class ReportGenerator {
  /**
   * Generate PDF report for audit
   */
  async generatePDF(audit) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24)
           .fillColor('#1a1a1a')
           .text('ÆTHER SEO Audit Report', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
           .fillColor('#666')
           .text(`Generated: ${new Date(audit.timestamp).toLocaleString()}`, { align: 'center' });
        
        doc.moveDown(1);
        
        // URL and Score
        doc.fontSize(14)
           .fillColor('#1a1a1a')
           .text('Audited URL:', 50, doc.y);
        
        doc.fontSize(12)
           .fillColor('#0066cc')
           .text(audit.url, 50, doc.y);
        
        doc.moveDown(1.5);
        
        // Overall Score
        const scoreColor = this.getScoreColor(audit.score);
        doc.fontSize(18)
           .fillColor('#1a1a1a')
           .text('Overall SEO Health Score', { align: 'center' });
        
        doc.fontSize(48)
           .fillColor(scoreColor)
           .text(`${audit.score}/100`, { align: 'center' });
        
        doc.fontSize(12)
           .fillColor('#666')
           .text(this.getScoreLabel(audit.score), { align: 'center' });
        
        doc.moveDown(2);
        
        // Module Scores
        doc.fontSize(16)
           .fillColor('#1a1a1a')
           .text('Category Breakdown', 50, doc.y);
        
        doc.moveDown(0.5);
        
        if (audit.modules) {
          for (const [moduleName, moduleData] of Object.entries(audit.modules)) {
            const score = moduleData.categoryScore || 0;
            const barColor = this.getScoreColor(score);
            
            // Module name
            doc.fontSize(12)
               .fillColor('#1a1a1a')
               .text(this.capitalize(moduleName), 50, doc.y);
            
            // Score bar
            const barY = doc.y;
            const barWidth = 400;
            const filledWidth = (score / 100) * barWidth;
            
            // Background bar
            doc.rect(150, barY, barWidth, 15)
               .fillColor('#e0e0e0')
               .fill();
            
            // Filled bar
            doc.rect(150, barY, filledWidth, 15)
               .fillColor(barColor)
               .fill();
            
            // Score text
            doc.fillColor('#1a1a1a')
               .fontSize(11)
               .text(`${score}`, 560, barY + 2);
            
            doc.moveDown(1);
          }
        }
        
        doc.moveDown(1.5);
        
        // Top Issues
        doc.addPage();
        doc.fontSize(18)
           .fillColor('#1a1a1a')
           .text('Top Priority Issues', 50, 50);
        
        doc.moveDown(1);
        
        if (audit.impactMatrix && audit.impactMatrix.length > 0) {
          const topIssues = audit.impactMatrix.slice(0, 10);
          
          for (let i = 0; i < topIssues.length; i++) {
            const issue = topIssues[i];
            
            // Check if we need a new page
            if (doc.y > 700) {
              doc.addPage();
            }
            
            // Issue number and severity
            doc.fontSize(14)
               .fillColor(this.getSeverityColor(issue.severity))
               .text(`${i + 1}. [${issue.severity.toUpperCase()}]`, 50, doc.y);
            
            doc.moveDown(0.3);
            
            // Description
            doc.fontSize(12)
               .fillColor('#1a1a1a')
               .text(issue.description, 50, doc.y, { width: 500 });
            
            doc.moveDown(0.3);
            
            // Page
            doc.fontSize(10)
               .fillColor('#666')
               .text(`Page: ${issue.page}`, 60, doc.y);
            
            doc.moveDown(0.3);
            
            // Suggested fix
            doc.fontSize(11)
               .fillColor('#0066cc')
               .text(`Fix: ${issue.suggested_fix}`, 60, doc.y, { width: 490 });
            
            doc.moveDown(0.5);
            
            // Expected uplift
            const uplift = this.calculateExpectedUplift(issue.impact_score);
            doc.fontSize(10)
               .fillColor('#00aa00')
               .text(`Expected SEO uplift: +${uplift}%`, 60, doc.y);
            
            doc.moveDown(1.5);
          }
        } else {
          doc.fontSize(12)
             .fillColor('#666')
             .text('No critical issues found. Great work!', 50, doc.y);
        }
        
        // Footer
        doc.fontSize(10)
           .fillColor('#999')
           .text(
             'Generated by ÆTHER (Adaptive Engine for Trust, Heuristics & Evolving Rankings)',
             50,
             750,
             { align: 'center', width: 500 }
           );
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get color for score
   */
  getScoreColor(score) {
    if (score >= 90) return '#00aa00';
    if (score >= 75) return '#66bb00';
    if (score >= 60) return '#ffaa00';
    if (score >= 40) return '#ff6600';
    return '#cc0000';
  }

  /**
   * Get score label
   */
  getScoreLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical Issues';
  }

  /**
   * Get color for severity
   */
  getSeverityColor(severity) {
    const colors = {
      critical: '#cc0000',
      high: '#ff6600',
      medium: '#ffaa00',
      low: '#0066cc'
    };
    return colors[severity] || '#666';
  }

  /**
   * Calculate expected uplift percentage
   */
  calculateExpectedUplift(impactScore) {
    // Convert impact score (0-1) to percentage uplift (1-20%)
    return Math.round(impactScore * 20);
  }

  /**
   * Capitalize first letter
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export const reportGenerator = new ReportGenerator();
