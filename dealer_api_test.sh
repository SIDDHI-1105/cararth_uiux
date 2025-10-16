#!/bin/bash

# Cararth Dealer API Test Script
# This script tests the dealer inventory upload system

BASE_URL="http://localhost:5000"
DEALER_ID="test-dealer-123"
API_KEY="your-api-key-here"

echo "======================================"
echo "Cararth Dealer API Test Script"
echo "======================================"
echo ""

# Test 1: Create dealer account
echo "Test 1: Creating dealer account..."
curl -X POST "$BASE_URL/api/dealer/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Auto Dealers",
    "email": "dealer@premiumauto.com",
    "phone": "+919876543210",
    "businessAddress": "123 MG Road, Hyderabad, Telangana 500001",
    "gstNumber": "29ABCDE1234F1Z5"
  }' | jq '.'

echo -e "\n\n"

# Test 2: Quick Add - Single Vehicle Upload
echo "Test 2: Quick Add - Uploading single vehicle..."
curl -X POST "$BASE_URL/api/dealer/$DEALER_ID/upload" \
  -H "X-API-Key: $API_KEY" \
  -F "vin=1HGBH41JXMN109186" \
  -F "make=Honda" \
  -F "model=Accord" \
  -F "year=2021" \
  -F "mileage=25000" \
  -F "price=1500000" \
  -F "fuelType=Petrol" \
  -F "transmission=Automatic" \
  -F "color=Silver" \
  -F "city=Hyderabad" \
  -F "state=Telangana" \
  -F "description=Well-maintained Honda Accord with full service history" \
  -F "images=@test_car_front.jpg" \
  -F "images=@test_car_rear.jpg" | jq '.'

echo -e "\n\n"

# Test 3: Bulk CSV Upload
echo "Test 3: Bulk CSV upload..."
curl -X POST "$BASE_URL/api/dealer/$DEALER_ID/upload/bulk" \
  -H "X-API-Key: $API_KEY" \
  -F "csvFile=@dealer_upload_template.csv" \
  -F "imageZip=@dealer_images.zip" | jq '.'

echo -e "\n\n"

# Test 4: Get validation report
echo "Test 4: Fetching validation report..."
UPLOAD_ID="upload-id-from-previous-response"
curl -X GET "$BASE_URL/api/dealer/$DEALER_ID/validation/$UPLOAD_ID" \
  -H "X-API-Key: $API_KEY" | jq '.'

echo -e "\n\n"

# Test 5: Get Google Vehicle Listing feed preview
echo "Test 5: Google Vehicle Listing feed preview..."
curl -X GET "$BASE_URL/api/dealer/$DEALER_ID/feed/preview" \
  -H "X-API-Key: $API_KEY" | jq '.'

echo -e "\n\n"

echo "======================================"
echo "Tests completed!"
echo "======================================"
