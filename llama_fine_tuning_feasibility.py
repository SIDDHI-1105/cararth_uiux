#!/usr/bin/env python3
"""
Llama 3.1 8B Fine-Tuning Feasibility Test for Cararth.com
Tests QLoRA fine-tuning on Replit infrastructure with Indian car listing data
"""

import sys
import subprocess
import json
import time
from datetime import datetime
import traceback

print("="*80)
print("🚗 Cararth.com - Llama 3.1 8B Fine-Tuning Feasibility Test")
print("="*80)

# Stage 1: Package Installation
print("\n📦 Stage 1: Installing required packages...")
print("-" * 80)

packages = [
    "torch",
    "transformers>=4.40.0",
    "peft>=0.10.0",
    "bitsandbytes>=0.43.0",
    "accelerate>=0.27.0",
    "datasets",
    "psutil",
    "pandas",
    "scipy"
]

try:
    for package in packages:
        print(f"Installing {package}...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", package],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE
        )
    print("✅ All packages installed successfully")
except Exception as e:
    print(f"❌ Package installation failed: {e}")
    sys.exit(1)

# Import packages after installation
print("\n📥 Importing libraries...")
try:
    import torch
    import psutil
    import pandas as pd
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        BitsAndBytesConfig,
        TrainingArguments,
        Trainer
    )
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from datasets import Dataset
    import numpy as np
    print("✅ All libraries imported successfully")
except Exception as e:
    print(f"❌ Import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Memory tracking
memory_profile = []

def log_memory(stage):
    """Log current memory usage"""
    process = psutil.Process()
    ram_mb = process.memory_info().rss / 1024 / 1024
    
    memory_entry = {
        "timestamp": datetime.now().isoformat(),
        "stage": stage,
        "ram_mb": round(ram_mb, 2),
        "ram_percent": round(psutil.virtual_memory().percent, 2),
        "available_ram_mb": round(psutil.virtual_memory().available / 1024 / 1024, 2)
    }
    
    if torch.cuda.is_available():
        memory_entry["gpu_allocated_mb"] = round(torch.cuda.memory_allocated() / 1024 / 1024, 2)
        memory_entry["gpu_reserved_mb"] = round(torch.cuda.memory_reserved() / 1024 / 1024, 2)
    
    memory_profile.append(memory_entry)
    
    print(f"\n💾 Memory at '{stage}':")
    print(f"   RAM: {memory_entry['ram_mb']:.0f} MB ({memory_entry['ram_percent']}% used)")
    if torch.cuda.is_available():
        print(f"   GPU: {memory_entry['gpu_allocated_mb']:.0f} MB allocated")
    
    return memory_entry

# Stage 2: System Check
print("\n🔍 Stage 2: System Check")
print("-" * 80)

system_info = {
    "python_version": sys.version,
    "torch_version": torch.__version__,
    "cuda_available": torch.cuda.is_available(),
    "total_ram_gb": round(psutil.virtual_memory().total / 1024 / 1024 / 1024, 2),
    "cpu_count": psutil.cpu_count()
}

if torch.cuda.is_available():
    system_info["gpu_name"] = torch.cuda.get_device_name(0)
    system_info["gpu_memory_gb"] = round(torch.cuda.get_device_properties(0).total_memory / 1024 / 1024 / 1024, 2)

print(f"Python: {system_info['python_version'][:50]}")
print(f"PyTorch: {system_info['torch_version']}")
print(f"CUDA: {system_info['cuda_available']}")
print(f"RAM: {system_info['total_ram_gb']} GB")
print(f"CPUs: {system_info['cpu_count']}")
if torch.cuda.is_available():
    print(f"GPU: {system_info['gpu_name']}")
    print(f"GPU Memory: {system_info['gpu_memory_gb']} GB")

log_memory("initial")

# Stage 3: Generate Sample Dataset
print("\n📊 Stage 3: Generating Indian Car Listings Dataset")
print("-" * 80)

# Indian car market data
indian_car_data = {
    "Maruti Suzuki": ["Swift", "Baleno", "Alto", "WagonR", "Dzire", "Vitara Brezza", "Ertiga", "Ciaz"],
    "Hyundai": ["i20", "Creta", "Venue", "Verna", "Grand i10", "Santro", "Elantra", "Tucson"],
    "Tata": ["Nexon", "Harrier", "Tiago", "Altroz", "Safari", "Punch", "Tigor"],
    "Mahindra": ["XUV700", "Scorpio", "Thar", "Bolero", "XUV300", "Marazzo"],
    "Honda": ["City", "Amaze", "Jazz", "WR-V", "Civic"],
    "Toyota": ["Fortuner", "Innova Crysta", "Glanza", "Urban Cruiser"],
    "Kia": ["Seltos", "Sonet", "Carens", "Carnival"],
    "Renault": ["Kwid", "Duster", "Kiger", "Triber"]
}

cities = ["Hyderabad", "Mumbai", "Delhi", "Bangalore", "Chennai", "Pune", "Kolkata", "Ahmedabad"]
fuel_types = ["Petrol", "Diesel", "CNG", "Electric"]
transmissions = ["Manual", "Automatic"]

np.random.seed(42)

def generate_vin():
    """Generate realistic Indian VIN"""
    return f"MA{''.join([str(np.random.randint(0, 10)) for _ in range(15)])}"

dataset_rows = []
for i in range(100):
    make = np.random.choice(list(indian_car_data.keys()))
    model = np.random.choice(indian_car_data[make])
    year = np.random.randint(2015, 2025)
    price = np.random.randint(200000, 2000000)
    mileage = np.random.randint(5000, 150000)
    fuel = np.random.choice(fuel_types)
    transmission = np.random.choice(transmissions)
    city = np.random.choice(cities)
    vin = generate_vin()
    
    # Create instruction-response pairs for fine-tuning
    instruction = f"What is the price and details of this {make} {model}?"
    response = f"This {year} {make} {model} is available in {city} for ₹{price:,}. It has {mileage:,} km on the odometer, runs on {fuel}, and has a {transmission} transmission. VIN: {vin}"
    
    dataset_rows.append({
        "vin": vin,
        "make": make,
        "model": model,
        "year": year,
        "price": price,
        "mileage": mileage,
        "fuel_type": fuel,
        "transmission": transmission,
        "city": city,
        "instruction": instruction,
        "response": response
    })

# Save dataset
df = pd.DataFrame(dataset_rows)
df.to_csv("sample_dataset.csv", index=False)
print(f"✅ Generated {len(dataset_rows)} car listings")
print(f"✅ Sample saved to sample_dataset.csv")
print(f"\nSample listing:")
print(f"  {dataset_rows[0]['instruction']}")
print(f"  {dataset_rows[0]['response'][:100]}...")

log_memory("dataset_created")

# Stage 4: Model Configuration
print("\n🤖 Stage 4: Configuring Llama 3.1 8B with 4-bit Quantization")
print("-" * 80)

model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"

try:
    # Check if we need Hugging Face token
    print("⚠️  Note: Llama 3.1 requires Hugging Face authentication")
    print("   You'll need to:")
    print("   1. Accept the license at https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct")
    print("   2. Set HF_TOKEN environment variable or use `huggingface-cli login`")
    
    # 4-bit quantization config
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True
    )
    
    print("\n🔐 Attempting to load model (requires HF authentication)...")
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    
    print("✅ Tokenizer loaded")
    log_memory("tokenizer_loaded")
    
    # Load model with quantization
    print("📥 Loading model in 4-bit (this may take several minutes)...")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )
    
    print("✅ Model loaded in 4-bit quantization")
    log_memory("model_loaded")
    
    # Stage 5: QLoRA Configuration
    print("\n⚙️  Stage 5: Configuring QLoRA")
    print("-" * 80)
    
    model = prepare_model_for_kbit_training(model)
    
    lora_config = LoraConfig(
        r=16,  # LoRA rank
        lora_alpha=32,  # LoRA alpha
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    model = get_peft_model(model, lora_config)
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    
    print(f"✅ QLoRA configured")
    print(f"   Trainable params: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")
    print(f"   Total params: {total_params:,}")
    
    log_memory("qlora_configured")
    
    # Stage 6: Prepare Training Data
    print("\n📝 Stage 6: Preparing Training Data")
    print("-" * 80)
    
    def format_instruction(example):
        """Format data in Llama 3.1 chat template"""
        messages = [
            {"role": "user", "content": example["instruction"]},
            {"role": "assistant", "content": example["response"]}
        ]
        text = tokenizer.apply_chat_template(messages, tokenize=False)
        return {"text": text}
    
    # Create HuggingFace dataset
    hf_dataset = Dataset.from_pandas(df)
    hf_dataset = hf_dataset.map(format_instruction)
    
    # Tokenize
    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=512,
            padding="max_length"
        )
    
    tokenized_dataset = hf_dataset.map(tokenize_function, batched=True, remove_columns=hf_dataset.column_names)
    
    # Split train/eval
    split_dataset = tokenized_dataset.train_test_split(test_size=0.1, seed=42)
    train_dataset = split_dataset["train"]
    eval_dataset = split_dataset["test"]
    
    print(f"✅ Data prepared")
    print(f"   Training samples: {len(train_dataset)}")
    print(f"   Evaluation samples: {len(eval_dataset)}")
    
    log_memory("data_prepared")
    
    # Stage 7: Training
    print("\n🏋️  Stage 7: Training (200 steps)")
    print("-" * 80)
    
    training_args = TrainingArguments(
        output_dir="./llama_qlora_cararth",
        num_train_epochs=1,
        max_steps=200,
        per_device_train_batch_size=2,
        per_device_eval_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=5e-6,
        fp16=True,
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=50,
        save_strategy="steps",
        save_steps=100,
        warmup_steps=10,
        report_to="none",
        load_best_model_at_end=False,
        optim="paged_adamw_8bit"
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset
    )
    
    print("🚀 Starting training...")
    start_time = time.time()
    
    train_result = trainer.train()
    
    training_time = time.time() - start_time
    
    print(f"✅ Training completed in {training_time:.1f} seconds")
    print(f"   Final loss: {train_result.training_loss:.4f}")
    
    log_memory("training_complete")
    
    # Stage 8: Evaluation & Inference
    print("\n🧪 Stage 8: Evaluation & Test Inference")
    print("-" * 80)
    
    eval_results = trainer.evaluate()
    print(f"✅ Evaluation loss: {eval_results['eval_loss']:.4f}")
    
    # Test inference
    test_prompt = "What is the price and details of this Tata Nexon?"
    messages = [{"role": "user", "content": test_prompt}]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    print(f"\n🔮 Test inference:")
    print(f"   Prompt: {test_prompt}")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.7,
            do_sample=True
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"   Response: {response[-200:]}")
    
    log_memory("inference_complete")
    
    # Success report
    feasibility_report = {
        "status": "SUCCESS",
        "timestamp": datetime.now().isoformat(),
        "system_info": system_info,
        "model": {
            "name": model_name,
            "quantization": "4-bit NF4",
            "total_params": total_params,
            "trainable_params": trainable_params,
            "trainable_percent": round(100 * trainable_params / total_params, 2)
        },
        "dataset": {
            "total_samples": len(dataset_rows),
            "train_samples": len(train_dataset),
            "eval_samples": len(eval_dataset)
        },
        "training": {
            "steps": 200,
            "batch_size": 2,
            "gradient_accumulation": 4,
            "learning_rate": 5e-6,
            "training_time_seconds": round(training_time, 2),
            "final_loss": round(train_result.training_loss, 4),
            "eval_loss": round(eval_results['eval_loss'], 4)
        },
        "peak_memory": {
            "ram_mb": max(m["ram_mb"] for m in memory_profile),
            "ram_percent": max(m["ram_percent"] for m in memory_profile)
        },
        "feasibility": "FEASIBLE",
        "recommendations": [
            "✅ Llama 3.1 8B can be fine-tuned on Replit with 4-bit QLoRA",
            "✅ Memory usage is acceptable for Replit's environment",
            "✅ Training completed successfully with Indian car data",
            "📌 Recommended: Use batch size 1-2 with gradient accumulation 4-8",
            "📌 Recommended: Train for 500-1000 steps for production quality",
            "📌 Recommended: Use larger dataset (1000-10000 samples) for better results",
            "📌 Consider: Implement evaluation metrics specific to car listings",
            "📌 Consider: Add data augmentation for better generalization",
            "🔐 Required: Set up Hugging Face authentication for production"
        ],
        "next_steps": [
            "1. Collect larger dataset from Cararth.com production data",
            "2. Implement custom evaluation metrics (price accuracy, detail completeness)",
            "3. Fine-tune for 1000+ steps with early stopping",
            "4. Test inference quality on real user queries",
            "5. Benchmark against baseline (non-finetuned) Llama 3.1",
            "6. Deploy model with vLLM or TGI for production inference",
            "7. Implement continuous fine-tuning pipeline"
        ]
    }
    
    if torch.cuda.is_available():
        feasibility_report["peak_memory"]["gpu_allocated_mb"] = max(m.get("gpu_allocated_mb", 0) for m in memory_profile)

except Exception as e:
    # Failure report
    error_trace = traceback.format_exc()
    print(f"\n❌ Error during execution: {e}")
    print(f"\n{error_trace}")
    
    feasibility_report = {
        "status": "FAILED",
        "timestamp": datetime.now().isoformat(),
        "system_info": system_info,
        "error": str(e),
        "error_trace": error_trace,
        "stage_reached": memory_profile[-1]["stage"] if memory_profile else "unknown",
        "feasibility": "NEEDS_INVESTIGATION",
        "recommendations": [
            "❌ Fine-tuning failed - see error details above",
            "🔍 Common issues:",
            "   - Missing Hugging Face authentication (set HF_TOKEN)",
            "   - Insufficient RAM (requires ~16GB for Llama 8B 4-bit)",
            "   - CUDA compatibility issues",
            "   - Package version conflicts",
            "📌 Try: Reduce batch size to 1",
            "📌 Try: Use smaller model (Llama 3.2 3B)",
            "📌 Try: Increase swap space on Replit",
            "💡 Alternative: Use OpenAI/Gemini API for production instead of self-hosted LLM"
        ],
        "next_steps": [
            "1. Review error trace and fix authentication/dependency issues",
            "2. Test with smaller model (Llama 3.2 3B or Mistral 7B)",
            "3. Contact Replit support about RAM/GPU availability",
            "4. Consider cloud GPU alternatives (Replicate, RunPod, Modal)",
            "5. Evaluate API-based solutions (OpenAI GPT-4, Gemini Pro)"
        ]
    }

# Save reports
print("\n" + "="*80)
print("📊 FINAL FEASIBILITY REPORT")
print("="*80)

with open("feasibility_report.json", "w") as f:
    json.dump(feasibility_report, f, indent=2)

memory_df = pd.DataFrame(memory_profile)
memory_df.to_csv("memory_profile.csv", index=False)

print(json.dumps(feasibility_report, indent=2))

print("\n📁 Files saved:")
print("   - feasibility_report.json (detailed report)")
print("   - memory_profile.csv (memory usage timeline)")
print("   - sample_dataset.csv (100 car listings)")

print("\n" + "="*80)
print(f"{'✅ TEST PASSED' if feasibility_report['status'] == 'SUCCESS' else '❌ TEST FAILED'}")
print("="*80)
