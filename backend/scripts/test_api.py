#!/usr/bin/env python
"""
Test script to check API endpoints
"""
import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_api_endpoints():
    """Test basic API endpoints to verify the API is working"""
    
    # Test healthcheck
    print("Testing healthcheck endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/healthcheck")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print("  ✅ API is responding to healthcheck")
        else:
            print(f"  ❌ API returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error connecting to API: {str(e)}")
        return False
    
    # Test videos endpoint
    print("\nTesting videos endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/videos/?limit=1")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Videos endpoint working, found {len(data['videos'])} videos")
        else:
            print(f"  ❌ Videos endpoint returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error connecting to videos endpoint: {str(e)}")
        return False
    
    # Test channels endpoint
    print("\nTesting channels endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/channels/")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print("  ✅ Channels endpoint working")
        else:
            print(f"  ❌ Channels endpoint returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error connecting to channels endpoint: {str(e)}")
        return False
    
    # Test categories endpoint  
    print("\nTesting categories endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/categories/")
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            print("  ✅ Categories endpoint working")
        else:
            print(f"  ❌ Categories endpoint returned status code {response.status_code}")
            return False
    except Exception as e:
        print(f"  ❌ Error connecting to categories endpoint: {str(e)}")
        return False
    
    print("\n✅ All API endpoints are working!")
    return True

if __name__ == "__main__":
    # Give the API a moment to start up
    time.sleep(2)
    test_api_endpoints()
