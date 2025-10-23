#!/bin/bash
# Quick runner for Llama fine-tuning feasibility test

echo "🚗 Cararth.com - Llama 3.1 8B Fine-Tuning Feasibility Test"
echo "=========================================================="
echo ""
echo "⚠️  IMPORTANT: Before running, ensure you have:"
echo "   1. Accepted Llama 3.1 license at: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct"
echo "   2. Created HF token at: https://huggingface.co/settings/tokens"
echo "   3. Set HF_TOKEN in Replit Secrets"
echo ""
echo "This test will:"
echo "  • Install ML packages (torch, transformers, etc.)"
echo "  • Generate 100 sample Indian car listings"
echo "  • Load Llama 3.1 8B in 4-bit quantization"
echo "  • Train for 200 steps with QLoRA"
echo "  • Monitor memory usage"
echo "  • Generate feasibility report"
echo ""
echo "Estimated time: 10-30 minutes"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

python3 llama_fine_tuning_feasibility.py

echo ""
echo "=========================================================="
echo "Test complete! Check the following files:"
echo "  📊 feasibility_report.json - Full analysis"
echo "  💾 memory_profile.csv - Memory usage data"
echo "  📁 sample_dataset.csv - Generated car listings"
echo "=========================================================="
