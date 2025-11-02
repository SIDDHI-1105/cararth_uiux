# ÆTHER Operations Runbook

## Emergency Procedures

### 🚨 High Token Usage Alert

**Symptoms**: Daily token cap approaching limit, unexpected cost spike

**Immediate Actions**:
```bash
# 1. Check current usage
curl http://localhost:5000/api/aether/budget/stats

# 2. Lower daily cap temporarily
curl -X POST http://localhost:5000/api/aether/budget/set-cap \
  -H "Content-Type: application/json" \
  -H "x-aether-admin-key: $AETHER_ADMIN_KEY" \
  -d '{"cap": 5000}'

# 3. Review usage breakdown
tail -100 data/aether/token_usage.log | grep -v "mock"

# 4. Identify high-cost operations
cat data/aether/token_usage.log | jq -s 'group_by(.operation) | map({operation: .[0].operation, count: length, total_tokens: map(.tokens) | add})'
```

**Root Cause Investigation**:
- Check for runaway batch sweeps
- Review recent experiments
- Verify caching is working (cache hit rate should be >50%)

### 🚨 System Downtime

**Symptoms**: `/api/aether/health` returns 500 or times out

**Immediate Actions**:
```bash
# 1. Check server logs
tail -100 /tmp/logs/Start_application_*.log | grep AETHER

# 2. Check error log
tail -50 data/aether/error.log

# 3. Restart server
npm run dev

# 4. Verify health
curl http://localhost:5000/api/aether/health
```

**If restart fails**:
```bash
# Clear problematic cache
rm -rf .aether_cache/*

# Clear lock files
rm -f data/aether/.initial_sweep.lock

# Check file permissions
chmod -R 755 data/aether
chmod -R 755 .aether_cache

# Retry startup
npm run dev
```

### 🚨 Disable AETHER Immediately

**Use Case**: Emergency shutdown due to cost overrun or system issues

```bash
# Option 1: Environment variable (requires restart)
export AETHER_DAILY_TOKEN_CAP=0

# Option 2: API endpoint
curl -X POST http://localhost:5000/api/aether/budget/set-cap \
  -H "Content-Type: application/json" \
  -H "x-aether-admin-key: $AETHER_ADMIN_KEY" \
  -d '{"cap": 0}'

# Option 3: Disable cron jobs
export AETHER_CRON_ENABLED=false

# Option 4: Remove OpenAI key (forces mock mode)
unset OPENAI_API_KEY
npm run dev
```

## Operational Checks

### Daily Health Check

Run every morning:
```bash
#!/bin/bash
# daily-aether-check.sh

echo "=== AETHER Daily Health Check ==="
echo ""

# 1. System Health
echo "System Health:"
curl -s http://localhost:5000/api/aether/health | jq '.'

# 2. Token Budget
echo ""
echo "Token Budget:"
curl -s http://localhost:5000/api/aether/budget/stats | jq '.'

# 3. Cache Performance
echo ""
echo "Cache Stats:"
curl -s http://localhost:5000/api/aether/cache/stats | jq '.'

# 4. Recent Errors (last 10)
echo ""
echo "Recent Errors:"
tail -10 data/aether/error.log

# 5. Sweep Statistics
echo ""
echo "Sweep Stats:"
curl -s http://localhost:5000/api/aether/sweeps/stats | jq '.'

# 6. Check for anomalies
echo ""
echo "Anomaly Check:"
COST=$(curl -s http://localhost:5000/api/aether/sweeps/stats | jq -r '.totalCost')
if (( $(echo "$COST > 1.0" | bc -l) )); then
  echo "⚠️ WARNING: Total cost exceeds $1.00 ($COST)"
fi

echo ""
echo "=== Check Complete ==="
```

### Weekly Maintenance

Run every Sunday:
```bash
#!/bin/bash
# weekly-aether-maintenance.sh

echo "=== AETHER Weekly Maintenance ==="

# 1. Archive old logs
DATE=$(date +%Y%m%d)
mkdir -p data/aether/archives/$DATE
cp data/aether/*.log data/aether/archives/$DATE/

# 2. Rotate logs (keep last 1000 lines)
for log in data/aether/*.log; do
  tail -1000 "$log" > "$log.tmp"
  mv "$log.tmp" "$log"
done

# 3. Clean old cache (older than 30 days)
find .aether_cache -type f -mtime +30 -delete

# 4. Backup critical files
tar -czf data/aether/archives/$DATE/backup.tar.gz \
  data/aether/prompts.json \
  data/aether/weights.json \
  data/aether/experiments.json

# 5. Generate weekly report
echo "Weekly Stats:"
curl -s http://localhost:5000/api/aether/sweeps/stats | jq '.'
curl -s http://localhost:5000/api/aether/experiments/stats | jq '.'

echo "=== Maintenance Complete ==="
```

## Token Budgeting

### Cost Estimation

**Token-to-Cost Conversion (gpt-4o-mini)**:
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average: ~$0.30 per 1M tokens

**Example Budget Planning**:
```
Daily Cap: 20,000 tokens
Estimated Cost: 20,000 * $0.30 / 1,000,000 = $0.006/day
Monthly Cost: $0.006 * 30 = $0.18/month
```

### Adjust Budget Based on Usage

**Low Usage** (< 25% of cap):
```bash
# Can safely increase cap
curl -X POST http://localhost:5000/api/aether/budget/set-cap \
  -d '{"cap": 50000}'
```

**High Usage** (> 80% of cap):
```bash
# Reduce cap or investigate cause
curl -X POST http://localhost:5000/api/aether/budget/set-cap \
  -d '{"cap": 15000}'
```

### Monitor Token Usage Trends

```bash
# Daily usage over last 7 days
for i in {0..6}; do
  DATE=$(date -d "$i days ago" +%Y-%m-%d)
  TOKENS=$(grep "$DATE" data/aether/token_usage.log | jq -s 'map(.tokens) | add')
  echo "$DATE: $TOKENS tokens"
done
```

## Rollback Procedures

### Rollback to Previous Weights

```bash
# 1. List available backups
ls -lt data/aether/archives/*/weights.json

# 2. Restore from backup
cp data/aether/archives/20251102/weights.json data/aether/weights.json

# 3. Restart server to reload
npm run dev
```

### Rollback Experiments

```bash
# 1. Backup current state
cp data/aether/experiments.json data/aether/experiments.backup.json

# 2. Remove recent experiments
cat data/aether/experiments.json | jq 'map(select(.createdAt < "2025-11-02"))' > data/aether/experiments.new.json

# 3. Replace file
mv data/aether/experiments.new.json data/aether/experiments.json

# 4. Verify
cat data/aether/experiments.json | jq 'length'
```

### Complete System Reset

**⚠️ WARNING: This deletes all AETHER data**

```bash
# 1. Stop server
pkill -f "tsx server/index.ts"

# 2. Backup current state
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p data/aether/rollback_$DATE
cp -r data/aether/* data/aether/rollback_$DATE/

# 3. Clear operational data (keep prompts)
rm -f data/aether/sweeps.json
rm -f data/aether/experiments.json
rm -f data/aether/.initial_sweep.lock
rm -f data/aether/*.log
rm -rf .aether_cache/*

# 4. Reset weights to defaults
cat > data/aether/weights.json << 'EOF'
{
  "promptWeights": {},
  "categoryWeights": {
    "general_search": 1.0,
    "location_specific": 1.0,
    "trust_safety": 1.2
  },
  "learningRate": 0.1,
  "lastUpdated": null
}
EOF

# 5. Recreate empty files
echo '[]' > data/aether/sweeps.json
echo '[]' > data/aether/experiments.json

# 6. Restart server
npm run dev

# 7. Verify reset
curl http://localhost:5000/api/aether/health
```

## Performance Optimization

### Cache Optimization

**Target**: >70% cache hit rate

```bash
# Check current hit rate
curl http://localhost:5000/api/aether/cache/stats | jq '.hitRate'

# If low (<50%), investigate:
# 1. Are prompts too varied?
# 2. Is temperature changing between calls?
# 3. Are models switching?

# Clear cache to reset hit rate tracking
curl -X POST http://localhost:5000/api/aether/cache/clear
```

### Reduce Token Consumption

1. **Use Cache Aggressively**: Identical prompts reuse cached responses
2. **Lower Max Tokens**: Set `AETHER_MAX_TOKENS_PER_PROMPT=800`
3. **Batch Similar Requests**: Group related prompts
4. **Use Mock Mode for Testing**: Unset `OPENAI_API_KEY` during development

### Experiment Performance Tuning

```bash
# Get learning weights stats
curl http://localhost:5000/api/aether/learn/stats

# Adjust learning rate (0.1 = conservative, 0.3 = aggressive)
curl -X POST http://localhost:5000/api/aether/learn/set-rate \
  -H "Content-Type: application/json" \
  -d '{"rate": 0.15}'
```

## Monitoring & Alerts

### Key Metrics to Track

1. **Token Usage**: Should stay under 80% of daily cap
2. **Cache Hit Rate**: Target >70%
3. **Error Rate**: Should be <1% of total requests
4. **Response Time**: Average <2 seconds for cached, <5s for uncached
5. **GEO Mention Rate**: Baseline ~0%, improvements tracked

### Set Up Alerts

```bash
# Add to cron (runs every hour)
0 * * * * /path/to/alert-script.sh

# alert-script.sh
#!/bin/bash
BUDGET=$(curl -s http://localhost:5000/api/aether/budget/stats | jq -r '.usagePercentage' | tr -d '%')

if (( $(echo "$BUDGET > 90" | bc -l) )); then
  echo "⚠️ ALERT: Token budget at ${BUDGET}%" | mail -s "AETHER Alert" admin@cararth.com
fi

ERRORS=$(tail -100 data/aether/error.log | wc -l)
if [ "$ERRORS" -gt 10 ]; then
  echo "⚠️ ALERT: $ERRORS errors in last 100 log entries" | mail -s "AETHER Alert" admin@cararth.com
fi
```

## Scaling Considerations

### When to Scale Up

**Signs**:
- Token budget consistently at >90%
- Cache hit rate drops below 50%
- Response times exceed 10 seconds
- Queue backlog building up

**Actions**:
1. Increase `AETHER_DAILY_TOKEN_CAP`
2. Add horizontal replicas (load balance /api/aether)
3. Move from JSON to PostgreSQL storage
4. Implement Redis for distributed caching

### When to Scale Down

**Signs**:
- Token usage consistently <25% of cap
- Cache growing unbounded (>1GB)
- Weekly sweeps not providing value

**Actions**:
1. Reduce `AETHER_DAILY_TOKEN_CAP`
2. Disable cron: `AETHER_CRON_ENABLED=false`
3. Clear old cache entries
4. Archive old sweep data

## Contact & Escalation

### Self-Service Recovery
- Check `/api/aether/health` endpoint
- Review `data/aether/error.log`
- Restart server with `npm run dev`

### Escalation Path
1. **Level 1**: Check this runbook
2. **Level 2**: Review `README_AETHER.md`
3. **Level 3**: Check system logs (`/tmp/logs`)
4. **Level 4**: Contact development team

## Maintenance Schedule

### Daily
- ✅ Check `/api/aether/health`
- ✅ Monitor token usage
- ✅ Review error logs (last 10 entries)

### Weekly
- ✅ Rotate logs (keep last 1000 lines)
- ✅ Clean old cache (>30 days)
- ✅ Backup critical files
- ✅ Review experiment stats

### Monthly
- ✅ Archive all logs
- ✅ Review and optimize weights
- ✅ Analyze cost trends
- ✅ Plan capacity adjustments

## Appendix: Useful Commands

```bash
# Quick status check
curl -s http://localhost:5000/api/aether/health | jq '.ok'

# Token usage today
curl -s http://localhost:5000/api/aether/budget/stats | jq '.tokensUsed'

# Recent errors
tail -20 data/aether/error.log | jq '.'

# Cache size
du -sh .aether_cache

# Total sweeps
curl -s http://localhost:5000/api/aether/sweeps/stats | jq '.totalSweeps'

# Experiment success rate
curl -s http://localhost:5000/api/aether/experiments/stats | jq '.successRate'

# Clear initial sweep lock
rm data/aether/.initial_sweep.lock

# Force mock mode (testing)
unset OPENAI_API_KEY && npm run dev
```
