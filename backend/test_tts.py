#!/usr/bin/env python3
"""
Test script for TTS (Text-to-Speech) functionality
Minimal test to verify TTS is working (free-tier friendly)
"""
import asyncio
import sys
import os
from pathlib import Path

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.services.tts_client import (
    generate_speech,
    save_audio_to_file,
    AVAILABLE_VOICES,
)


async def test_basic_tts():
    """Test basic TTS functionality with minimal API calls"""
    print("\n" + "="*60)
    print("TTS Basic Functionality Test (Free-Tier Friendly)")
    print("="*60)
    
    # Very short test text to minimize token usage
    test_text = "Hello world!"
    test_voice = "Fritz-PlayAI"
    
    print(f"\n✓ Available voices:")
    print(f"  Male: {AVAILABLE_VOICES['male']}")
    print(f"  Female: {AVAILABLE_VOICES['female']}")
    
    print(f"\nTest Configuration:")
    print(f"  Text: '{test_text}' ({len(test_text)} chars)")
    print(f"  Voice: {test_voice}")
    print(f"  Generating audio...")
    
    try:
        audio_bytes = await generate_speech(test_text, voice=test_voice)
        print(f"\n✓ SUCCESS! Generated {len(audio_bytes):,} bytes of audio")
        
        # Save to file
        output_path = "./test_output/test_basic.wav"
        saved_path = save_audio_to_file(audio_bytes, output_path)
        print(f"✓ Saved to: {saved_path}")
        
        # Quick validation
        if len(audio_bytes) > 1000:  # WAV files should be at least a few KB
            print(f"✓ Audio size looks valid")
            return True
        else:
            print(f"⚠️  Audio size seems too small")
            return False
            
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False


async def main():
    """Run minimal test"""
    print("="*60)
    print("TTS Test Suite (Minimal - Free-Tier Friendly)")
    print("="*60)
    
    # Check environment
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("\n✗ ERROR: GROQ_API_KEY not found in environment")
        print("  Please set it in your .env file or environment variables")
        return
    
    print(f"\n✓ GROQ_API_KEY configured (length: {len(groq_key)})")
    
    # Create output directory
    Path("./test_output").mkdir(exist_ok=True)
    
    # Run single test
    success = await test_basic_tts()
    
    # Final summary
    print("\n" + "="*60)
    print("RESULT")
    print("="*60)
    
    if success:
        print("✓ PASS: TTS is working correctly!")
        print("\n🎉 Your TTS implementation is ready to use!")
        print("\nNext steps:")
        print("  1. Start your backend: uvicorn app.main:app --reload")
        print("  2. Test the API endpoints")
        print("  3. Integrate with frontend")
    else:
        print("✗ FAIL: TTS test failed")
        print("\nPlease check:")
        print("  1. GROQ_API_KEY is correct")
        print("  2. Terms were accepted at console.groq.com")
        print("  3. Your Groq account has TTS access")


if __name__ == "__main__":
    asyncio.run(main())
