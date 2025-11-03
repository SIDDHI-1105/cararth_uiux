# AETHER Learning Mode Documentation

## Overview
AETHER Learning Mode is a self-improving SEO audit system that uses **exponential smoothing (α=0.1)** to continuously optimize the impact weighting of audit modules based on historical performance data.

## How It Works

### Learning Algorithm
The system uses **exponential moving average** to adapt module weights:

```
new_weight = (1 - α) × old_weight + α × observed_performance
where α = 0.1 (learning rate)
```

### Trigger Points
Learning updates occur at two points:

1. **Real-time**: After each successful audit completion (when enabled)
2. **Scheduled**: Every Monday at 3:00 AM UTC (weekly batch optimization)

### Data Flow
```
Audit Runs → Performance Metrics → Learning Algorithm → Updated Weights → Next Audit Uses New Weights
```

## Enabling AETHER Learning Mode

### Step 1: Set Environment Variable
Add to your `.replit` file or Secrets:

```bash
AETHER_LEARNING_MODE=true
```

### Step 2: Enable Cron Scheduler (Optional)
For weekly batch learning:

```bash
AETHER_CRON_ENABLED=true
```

### Step 3: Restart Application
The workflow will automatically restart and you'll see:

```
[AETHER_LEARN] ✅ AETHER LEARNING MODE ENABLED
[Scheduler] AETHER weekly learning scheduled for Mondays at 3 AM UTC
```

## UI Indicators

### Learning Active Badge
When enabled, the Audit Page displays a **purple gradient badge** in the top-right:

```
🧠 Learning Active ⚡
```

This confirms that the system is actively learning from audit results.

## API Endpoints

### GET /api/aether/weights
Returns current learning weights and status:

```json
{
  "weights": {
    "indexability": 0.2,
    "schema": 0.2,
    "content": 0.25,
    "performance": 0.2,
    "geoCorrelation": 0.15,
    "lastUpdated": "2025-11-03T06:14:00.000Z",
    "version": "1.0.0"
  },
  "learningEnabled": true,
  "description": "Adaptive weights for SEO audit module impact correlation"
}
```

### POST /api/aether/weights/reset
Resets learning weights to defaults (admin only):

```bash
curl -X POST https://cararth.com/api/aether/weights/reset
```

## Data Files

### seo_weights.json
Location: `data/aether/seo_weights.json`

Stores current learned weights (auto-initialized from `server/config/auditWeights.json`).

### learning.log
Location: `data/aether/learning.log`

Logs all learning events with timestamps and weight changes.

## Testing & Verification

### Test 1: Verify Flag Status
```bash
# Check that learning is enabled
curl https://cararth.com/api/aether/weights
```

### Test 2: Run Manual Audit
1. Navigate to `/admin/aether`
2. Verify "Learning Active" badge appears
3. Run an audit
4. Check console logs for: `[AuditEngine] Triggering AETHER learning update...`

### Test 3: Inspect Learned Weights
```bash
# View current weights
cat data/aether/seo_weights.json

# View learning history
cat data/aether/learning.log
```

## Performance Characteristics

- **Learning Rate**: α = 0.1 (conservative, stable convergence)
- **Update Frequency**: Real-time per audit + weekly batch
- **Computation Cost**: O(n) where n = number of modules
- **Storage**: ~1KB per weights file

## Acceptance Criteria Status

✅ **AC1**: Exponential smoothing with α=0.1 implemented  
✅ **AC2**: Real-time learning after successful audits  
✅ **AC3**: Weekly cron scheduler (Mondays 3 AM UTC)  
✅ **AC4**: GET /api/aether/weights endpoint  
✅ **AC5**: POST /api/aether/weights/reset endpoint  
✅ **AC6**: "Learning Active" UI badge  
✅ **AC7**: Environment flag gating (AETHER_LEARNING_MODE)  
✅ **AC8**: Persistent storage (seo_weights.json)  
✅ **AC9**: Learning event logging (learning.log)

## Production Deployment

### Recommended Settings
```bash
# Production
AETHER_LEARNING_MODE=true
AETHER_CRON_ENABLED=true

# Staging
AETHER_LEARNING_MODE=false  # Manual testing only
AETHER_CRON_ENABLED=false
```

### Monitoring
Monitor these logs for learning activity:

```bash
# Real-time learning
grep "AETHER_LEARN" data/aether/agent.log

# Scheduler activity
grep "Scheduler" data/aether/agent.log

# Weight updates
cat data/aether/learning.log
```

## Troubleshooting

### Learning Not Triggering
**Symptom**: No "Learning Active" badge, no learning logs

**Solution**:
```bash
# Verify environment variable
echo $AETHER_LEARNING_MODE  # Should be "true"

# Check API response
curl https://cararth.com/api/aether/weights | jq .learningEnabled
```

### Cron Job Not Scheduling
**Symptom**: No weekly learning jobs in scheduler

**Solution**:
```bash
# Verify both flags are enabled
echo $AETHER_LEARNING_MODE  # Must be "true"
echo $AETHER_CRON_ENABLED   # Must be "true"

# Restart application
```

### Weights Not Updating
**Symptom**: Weights unchanged after multiple audits

**Solution**:
1. Check audit completion: `grep "Audit completed" data/aether/agent.log`
2. Verify learning logs: `cat data/aether/learning.log`
3. Ensure α=0.1 is small (slow convergence by design)

## Future Enhancements

- [ ] Configurable learning rate (per environment)
- [ ] A/B testing framework for weight optimization
- [ ] Learning dashboard with trend visualization
- [ ] Export learning data to ML pipeline
- [ ] Multi-site comparative learning

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              AETHER Learning Pipeline                │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Audit Completion → learnFromAudits()                │
│          │                                            │
│          ├─→ Load historical audits                  │
│          ├─→ Calculate performance scores            │
│          ├─→ updateWeights(α=0.1)                    │
│          ├─→ Normalize to sum=1.0                    │
│          ├─→ Save to seo_weights.json                │
│          └─→ Log to learning.log                     │
│                                                       │
│  Weekly Cron (Mondays 3 AM) → Same pipeline          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Contact & Support

For issues related to AETHER Learning Mode:
1. Check this documentation first
2. Review logs in `data/aether/`
3. Verify environment variables
4. Check scheduler status via logs

---

**Last Updated**: November 3, 2025  
**Version**: 1.0.0  
**Component**: AETHER Learning Mode  
**Status**: Production Ready ✅
