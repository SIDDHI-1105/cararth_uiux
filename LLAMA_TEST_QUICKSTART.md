# Quick Start: Llama 3.1 Fine-Tuning Test

## TL;DR
Test if Replit can fine-tune Llama 3.1 8B for Cararth.com in one command.

## Prerequisites (5 minutes)

1. **Accept Llama 3.1 license**: 
   - Go to: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct
   - Click "Agree and access repository"

2. **Get Hugging Face token**:
   - Go to: https://huggingface.co/settings/tokens
   - Create new token (read access is enough)
   - Copy the token

3. **Set token in Replit**:
   - Open Secrets tab (🔒 icon in left sidebar)
   - Add new secret:
     - Key: `HF_TOKEN`
     - Value: (paste your token)

## Run Test

```bash
./run_llama_test.sh
```

Or directly:
```bash
python llama_fine_tuning_feasibility.py
```

## What Happens

1. Installs packages automatically (2-3 min)
2. Generates 100 Indian car listings
3. Downloads Llama 3.1 8B (5-10 min, one-time)
4. Loads in 4-bit quantization
5. Trains for 200 steps (10-20 min)
6. Tests inference
7. Saves report

**Total time**: 20-35 minutes

## Check Results

```bash
cat feasibility_report.json
```

Look for:
- `"status": "SUCCESS"` or `"FAILED"`
- `"feasibility": "FEASIBLE"` or "NEEDS_INVESTIGATION"
- Read `recommendations` array for next steps

## Expected Output

### ✅ Success
```json
{
  "status": "SUCCESS",
  "feasibility": "FEASIBLE",
  "training": {
    "final_loss": 1.8,
    "training_time_seconds": 847
  },
  "recommendations": [
    "✅ Fine-tuning is feasible on Replit"
  ]
}
```

### ❌ Common Failure
```json
{
  "status": "FAILED",
  "error": "401 Unauthorized",
  "recommendations": [
    "🔐 Set HF_TOKEN environment variable"
  ]
}
```

## Files Generated

- `feasibility_report.json` - Full analysis
- `memory_profile.csv` - RAM/GPU usage timeline
- `sample_dataset.csv` - 100 car listings used for testing

## Need Help?

1. Check `LLAMA_FINETUNING_GUIDE.md` for detailed troubleshooting
2. Share `feasibility_report.json` if you need interpretation
3. Common issues:
   - Missing HF_TOKEN → Set in Secrets
   - OOM error → Expected on small RAM, see alternatives in report
   - Slow training → Normal on CPU-only Replit

## Quick Decisions

**If test succeeds**:
→ Collect real Cararth data (1000+ listings)
→ Train production model (500-1000 steps)
→ Deploy with vLLM

**If test fails (OOM)**:
→ Try Llama 3.2 3B (smaller model)
→ Use OpenAI/Gemini API instead
→ Consider cloud GPU (Replicate, Modal)

Ready? Run: `./run_llama_test.sh` 🚀
