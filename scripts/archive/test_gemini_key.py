import google.generativeai as genai
import os

key = "AIzaSyDAq3daQgchgIHwmHfMh0vuFjkLzb-8LaY"

print(f"Testing Key: {key}")
genai.configure(api_key=key)

try:
    print("Listing Models...")
    models = genai.list_models()
    found = False
    for m in models:
        if 'gemini' in m.name:
            print(f"- {m.name}")
            if 'flash' in m.name: found = True
            
    print("---")
    print("Testing Generation with gemini-2.0-flash-lite...")
    model = genai.GenerativeModel('gemini-2.0-flash-lite')
    response = model.generate_content("Hello, can you hear me? Respond in Polish.")
    print(f"Response: {response.text}")
    print("✅ SUCCESS")

except Exception as e:
    print(f"❌ ERROR: {e}")
