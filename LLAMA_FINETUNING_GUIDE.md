# Llama 3.1 8B Fine-Tuning Feasibility Test for Cararth.com

## Overview
This script tests whether Replit's infrastructure can support fine-tuning Meta's Llama 3.1 8B model with QLoRA (4-bit quantization) for Indian used-car search engine use cases.

## Prerequisites

### 1. Hugging Face Authentication (REQUIRED)
Llama 3.1 is a gated model. You need to:

1. **Accept the license**: Visit https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct and request access
2. **Get your token**: Go to https://huggingface.co/settings/tokens and create a token
3. **Set the token in Replit**:
   ```bash
   # Option 1: Environment variable (in Replit Secrets)
   # Add HF_TOKEN with your token value
   
   # Option 2: Login via CLI
   pip install huggingface_hub
   huggingface-cli login
   ```

### 2. System Requirements
- **RAM**: Minimum 16GB recommended for Llama 8B in 4-bit
- **Storage**: ~5GB for model download
- **Time**: Initial run takes 10-30 minutes (model download + training)

## Running the Test

### Quick Start
```bash
python llama_fine_tuning_feasibility.py
```

The script will:
1. ✅ Install all required packages automatically
2. ✅ Check system resources (RAM, GPU, CPU)
3. ✅ Generate 100 sample Indian car listings
4. ✅ Load Llama 3.1 8B in 4-bit quantization
5. ✅ Configure QLoRA (LoRA rank 16, alpha 32)
6. ✅ Train for 200 steps
7. ✅ Monitor memory usage throughout
8. ✅ Generate test inference
9. ✅ Output comprehensive feasibility report

### Output Files

After completion, you'll get:

1. **feasibility_report.json** - Complete feasibility analysis with recommendations
2. **memory_profile.csv** - Memory usage timeline
3. **sample_dataset.csv** - 100 generated Indian car listings
4. **llama_qlora_cararth/** - Model checkpoints (if training succeeds)

## Expected Results

### Success Scenario
```json
{
  "status": "SUCCESS",
  "feasibility": "FEASIBLE",
  "model": {
    "trainable_params": "20,971,520 (0.25%)",
    "total_params": "8,030,261,248"
  },
  "training": {
    "steps": 200,
    "training_time_seconds": 600-1800,
    "final_loss": 1.5-2.5
  },
  "recommendations": [
    "✅ Fine-tuning is feasible on Replit",
    "📌 Use batch size 1-2 with gradient accumulation 4-8",
    "📌 Train for 500-1000 steps for production"
  ]
}
```

### Common Failures

#### 1. Authentication Error
```
Error: HuggingFaceHubHTTPError: 401 Unauthorized
Solution: Set HF_TOKEN environment variable or run huggingface-cli login
```

#### 2. Out of Memory (OOM)
```
Error: CUDA out of memory / RuntimeError
Solution: Reduce batch size to 1, or use smaller model (Llama 3.2 3B)
```

#### 3. No GPU Available
```
Note: Training will use CPU (very slow but possible)
Solution: Request GPU access from Replit support, or use for testing only
```

## Interpreting Results

### Memory Usage
- **RAM < 12GB**: ✅ Excellent - can scale to larger batches
- **RAM 12-16GB**: ⚠️ Acceptable - stick to batch size 2
- **RAM > 16GB**: ❌ Reduce batch size or use smaller model

### Training Speed
- **With GPU**: ~600-1200 seconds for 200 steps (acceptable)
- **CPU Only**: 3000-6000 seconds for 200 steps (too slow for production)

### Loss Values
- **< 1.0**: Possible overfitting, reduce steps
- **1.5-2.5**: ✅ Good training progress
- **> 3.0**: Needs more training or learning rate adjustment

## Production Recommendations

### If Test SUCCEEDS:
1. ✅ Collect 1000-10000 real Cararth.com listings
2. ✅ Train for 500-1000 steps with early stopping
3. ✅ Implement custom metrics (price accuracy, detail completeness)
4. ✅ Deploy with vLLM or text-generation-inference
5. ✅ Set up continuous fine-tuning pipeline

### If Test FAILS:
1. 🔄 Try smaller model: Llama 3.2 3B (1/3 the size)
2. 🔄 Use API-based solution: OpenAI GPT-4 Turbo / Gemini Pro
3. 🔄 Consider cloud GPU: Replicate, Modal, RunPod
4. 🔄 Wait for Replit GPU tier availability

## Alternative Approaches

If fine-tuning isn't feasible on Replit:

### 1. API-Based (Easiest)
```python
# OpenAI GPT-4 with system prompt
# Already integrated in Cararth.com
# Cost: ~$0.01-0.03 per query
```

### 2. Smaller Models
```python
# Llama 3.2 3B (1/3 size, faster)
# Mistral 7B (good quality/performance ratio)
# Phi-3 Mini (Microsoft, 3.8B params)
```

### 3. Cloud Fine-Tuning
```python
# Replicate: $0.023/minute GPU
# Modal: Pay-per-second GPU
# RunPod: $0.14/hr for RTX 4090
```

## Cost Estimation

### One-time Fine-Tuning Costs:
- **Replit (if succeeds)**: Included in plan
- **Replicate**: $2-5 per full fine-tune
- **Modal**: $1-3 per full fine-tune
- **OpenAI Fine-tuning**: $8 per 1M tokens training

### Inference Costs:
- **Self-hosted on Replit**: Included
- **OpenAI API**: $0.01 per query
- **Replicate**: $0.0005 per query

## Troubleshooting

### Script hangs at "Loading model"
- Normal! First download takes 5-15 minutes
- Model is ~5GB compressed, ~16GB in memory

### "No module named 'bitsandbytes'"
- Script auto-installs, but may fail on some systems
- Manual: `pip install bitsandbytes --force-reinstall`

### "CUDA driver version is insufficient"
- You're on CPU-only Replit
- Training will work but be very slow
- Consider GPU-enabled Replit tier

## Next Steps

1. **Run the test**: `python llama_fine_tuning_feasibility.py`
2. **Review report**: Check `feasibility_report.json`
3. **Analyze memory**: Open `memory_profile.csv`
4. **Make decision**: Follow recommendations in report
5. **Contact me**: Share results if you need interpretation

## Support

Questions? Share:
- `feasibility_report.json` contents
- Error messages from console
- Memory profile data

Good luck! 🚗🤖
