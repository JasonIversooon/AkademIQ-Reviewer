#!/usr/bin/env python3
"""
Debug script to inspect Groq API structure for TTS
"""
import os
from dotenv import load_dotenv
load_dotenv()

from groq import Groq

def inspect_groq_client():
    """Inspect the Groq client to understand its structure"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("❌ GROQ_API_KEY not found")
        return
    
    print("✓ GROQ_API_KEY found")
    print("\n" + "="*60)
    print("Inspecting Groq Client Structure")
    print("="*60)
    
    client = Groq(api_key=api_key)
    
    print("\n1. Client attributes:")
    attrs = [a for a in dir(client) if not a.startswith('_')]
    for attr in attrs:
        print(f"   - {attr}")
    
    print("\n2. Checking for 'audio' attribute:")
    if hasattr(client, 'audio'):
        print("   ✓ client.audio exists")
        audio = client.audio
        audio_attrs = [a for a in dir(audio) if not a.startswith('_')]
        print("   Audio attributes:")
        for attr in audio_attrs:
            print(f"      - {attr}")
        
        print("\n3. Checking for 'audio.speech' attribute:")
        if hasattr(audio, 'speech'):
            print("   ✓ client.audio.speech exists")
            speech = audio.speech
            speech_attrs = [a for a in dir(speech) if not a.startswith('_')]
            print("   Speech attributes:")
            for attr in speech_attrs:
                print(f"      - {attr}")
        else:
            print("   ❌ client.audio.speech does NOT exist")
            print(f"   Type of audio: {type(audio)}")
    else:
        print("   ❌ client.audio does NOT exist")
    
    print("\n4. Available client methods/properties:")
    for attr in attrs:
        obj = getattr(client, attr)
        print(f"   - {attr}: {type(obj).__name__}")
    
    print("\n5. Trying to inspect documentation:")
    if hasattr(client, '__doc__'):
        print(f"   Client doc: {client.__doc__}")
    
    # Try to find TTS-related methods
    print("\n6. Searching for TTS-related methods:")
    tts_related = [a for a in dir(client) if 'audio' in a.lower() or 'speech' in a.lower() or 'tts' in a.lower()]
    if tts_related:
        print(f"   Found: {tts_related}")
    else:
        print("   No TTS-related attributes found at top level")
    
    print("\n" + "="*60)
    print("Recommendation:")
    print("="*60)
    print("Based on the Groq documentation you provided, the API call should be:")
    print("   response = client.audio.speech.create(...)")
    print("\nIf this fails, the issue might be:")
    print("   1. Groq library version mismatch")
    print("   2. TTS feature not available in your account")
    print("   3. Different API endpoint needed")

if __name__ == "__main__":
    inspect_groq_client()
