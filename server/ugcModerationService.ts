/**
 * UGC Moderation Service
 * Uses xAI Grok to moderate user-submitted car stories for quality and safety
 */

export interface ModerationResult {
  status: 'approved' | 'rejected' | 'flagged';
  notes: string;
  suggestedCararthLinks: Array<{
    listingId?: string;
    searchUrl: string;
    reason: string;
  }>;
  qualityScore: number; // 0-100
  flags: string[];
}

interface StoryContent {
  title: string;
  content: string;
  carBrand?: string;
  carModel?: string;
  city?: string;
}

class UGCModerationService {
  private readonly apiKey: string | undefined;
  private readonly apiUrl = 'https://api.x.ai/v1/chat/completions';
  private readonly model = 'grok-beta';

  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Moderate user-submitted car story using AI
   */
  async moderateStory(story: StoryContent): Promise<ModerationResult> {
    // Check if API key is configured
    if (!this.isConfigured()) {
      console.warn('⚠️ Grok API key not configured - auto-flagging for manual review');
      return {
        status: 'flagged',
        notes: 'AI moderation unavailable - requires manual review',
        suggestedCararthLinks: [],
        qualityScore: 50,
        flags: ['ai_moderation_unavailable']
      };
    }

    try {
      const prompt = this.buildModerationPrompt(story);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a content moderation specialist for CarArth, India\'s used car search engine. Your job is to review user-submitted car stories for quality, safety, and relevance. Be helpful but firm - approve good stories, flag suspicious ones, reject spam/inappropriate content.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Low temperature for consistent moderation
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Grok API error:', errorText);
        throw new Error(`Grok API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from Grok AI');
      }

      return this.parseModerationResponse(aiResponse);
      
    } catch (error) {
      console.error('❌ UGC moderation failed:', error);
      
      // Fallback: Auto-flag for manual review if AI fails
      return {
        status: 'flagged',
        notes: 'AI moderation failed - requires manual review',
        suggestedCararthLinks: [],
        qualityScore: 50,
        flags: ['ai_moderation_failed']
      };
    }
  }

  /**
   * Build comprehensive moderation prompt
   */
  private buildModerationPrompt(story: StoryContent): string {
    return `Review this user-submitted car story for CarArth's "Road Tales" section:

**Title:** ${story.title}
**Car:** ${story.carBrand || 'Not specified'} ${story.carModel || ''}
**Location:** ${story.city || 'Not specified'}

**Story:**
${story.content}

---

**Moderation Criteria:**
1. **Safety**: No personal contact info (phone/email), no hate speech, no illegal activities
2. **Authenticity**: Genuine car ownership experience, not marketing/spam
3. **Quality**: Well-written, specific details, engaging narrative (min 100 chars)
4. **Relevance**: Related to used cars, car ownership, or automotive experiences in India
5. **CarArth Value**: Could link to relevant listings on our platform

**Task:** Analyze this story and respond with a JSON object:
{
  "status": "approved" | "rejected" | "flagged",
  "notes": "Brief explanation of your decision",
  "qualityScore": 0-100,
  "flags": ["array of issues found, e.g., 'contains_phone_number', 'spam_detected', 'low_quality'"],
  "suggestedLinks": [
    {
      "searchUrl": "CarArth search URL for similar cars",
      "reason": "Why this link is relevant"
    }
  ]
}

**Examples:**
- Approved: Genuine stories about buying/selling cars, road trips, maintenance experiences
- Flagged: Borderline quality, needs human review, minor issues
- Rejected: Spam, promotional content, inappropriate language, personal info

Respond with ONLY valid JSON.`;
  }

  /**
   * Parse Grok's moderation response
   */
  private parseModerationResponse(response: string): ModerationResult {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        status: parsed.status || 'flagged',
        notes: parsed.notes || 'No moderation notes provided',
        suggestedCararthLinks: (parsed.suggestedLinks || []).map((link: any) => ({
          searchUrl: link.searchUrl || '',
          reason: link.reason || ''
        })),
        qualityScore: parsed.qualityScore || 50,
        flags: parsed.flags || []
      };
      
    } catch (error) {
      console.error('Failed to parse moderation response:', error);
      
      // Fallback parsing - be conservative
      const lowerResponse = response.toLowerCase();
      
      if (lowerResponse.includes('reject') || lowerResponse.includes('spam')) {
        return {
          status: 'rejected',
          notes: 'Flagged by AI moderation',
          suggestedCararthLinks: [],
          qualityScore: 20,
          flags: ['parse_error']
        };
      }
      
      if (lowerResponse.includes('approve')) {
        return {
          status: 'approved',
          notes: 'Approved by AI moderation',
          suggestedCararthLinks: [],
          qualityScore: 70,
          flags: []
        };
      }
      
      return {
        status: 'flagged',
        notes: 'Requires manual review - AI parsing failed',
        suggestedCararthLinks: [],
        qualityScore: 50,
        flags: ['parse_error']
      };
    }
  }

  /**
   * Batch moderate multiple stories (for admin review)
   */
  async moderateMultiple(stories: StoryContent[]): Promise<ModerationResult[]> {
    return Promise.all(stories.map(story => this.moderateStory(story)));
  }
}

export const ugcModerationService = new UGCModerationService();
