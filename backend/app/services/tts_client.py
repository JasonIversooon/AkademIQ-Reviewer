"""
Text-to-Speech service using Groq's PlayAI TTS API
"""
import os
import logging
import tempfile
from pathlib import Path
from groq import Groq
from app.core.config import get_settings

logger = logging.getLogger("app.services.tts_client")

# Voice mappings based on Groq PlayAI documentation
# Using 2 male and 2 female voices for variety
AVAILABLE_VOICES = {
    "male": [
        "Fritz-PlayAI",      # Male voice 1
        "Mikail-PlayAI",     # Male voice 2
    ],
    "female": [
        "Cheyenne-PlayAI",   # Female voice 1
        "Deedee-PlayAI",     # Female voice 2
    ]
}

# Voice option mappings for podcast generation
VOICE_OPTION_MAPPING = {
    "male-male": ("Fritz-PlayAI", "Mikail-PlayAI"),
    "female-female": ("Cheyenne-PlayAI", "Deedee-PlayAI"),
    "male-female": ("Fritz-PlayAI", "Cheyenne-PlayAI"),
}


def get_groq_client() -> Groq:
    """Get configured Groq client for TTS"""
    settings = get_settings()
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not configured")
    return Groq(api_key=settings.groq_api_key)


async def generate_speech(
    text: str,
    voice: str = "Fritz-PlayAI",
    model: str = "playai-tts",
    response_format: str = "wav"
) -> bytes:
    """
    Generate speech audio from text using Groq PlayAI TTS
    
    Args:
        text: Input text to convert to speech (max 10K characters)
        voice: Voice ID to use (see AVAILABLE_VOICES)
        model: TTS model to use (default: playai-tts)
        response_format: Audio format (default: wav)
    
    Returns:
        Audio bytes in the specified format
    
    Raises:
        RuntimeError: If TTS generation fails
    """
    if not text or len(text.strip()) == 0:
        raise ValueError("Text cannot be empty")
    
    # Enforce 10K character limit as per API docs
    if len(text) > 10000:
        logger.warning(f"Text length {len(text)} exceeds 10K limit, truncating")
        text = text[:10000]
    
    try:
        client = get_groq_client()
        
        logger.info(f"Generating speech with voice={voice}, length={len(text)} chars")
        
        # Use official Groq SDK method as per documentation
        response = client.audio.speech.create(
            model=model,
            voice=voice,
            input=text,
            response_format=response_format
        )
        
        # Use a temporary file to get the audio data
        # The response object has a write_to_file method
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{response_format}') as tmp_file:
            tmp_path = tmp_file.name
        
        # Write audio to temp file
        response.write_to_file(tmp_path)
        
        # Read the audio data
        with open(tmp_path, 'rb') as f:
            audio_data = f.read()
        
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        logger.info(f"Generated {len(audio_data)} bytes of audio data")
        return audio_data
        
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise RuntimeError(f"Failed to generate speech: {str(e)}")


async def generate_podcast_audio(
    dialogue_lines: list[dict],
    voice_option: str = "male-female",
    output_dir: str | None = None
) -> list[dict]:
    """
    Generate audio for each dialogue line in a podcast script
    
    Args:
        dialogue_lines: List of dialogue dicts with 'speaker' (1 or 2) and 'text'
        voice_option: Voice pairing option (male-male, female-female, male-female)
        output_dir: Optional directory to save audio files to disk
    
    Returns:
        List of dicts with speaker, text, audio_bytes, and optionally audio_path
    
    Example:
        dialogue = [
            {"speaker": 1, "text": "Welcome to our podcast!"},
            {"speaker": 2, "text": "Thanks for having me!"}
        ]
        audio_results = await generate_podcast_audio(dialogue, "male-female")
    """
    if voice_option not in VOICE_OPTION_MAPPING:
        raise ValueError(f"Invalid voice_option: {voice_option}. Must be one of {list(VOICE_OPTION_MAPPING.keys())}")
    
    voice1, voice2 = VOICE_OPTION_MAPPING[voice_option]
    
    logger.info(f"Generating podcast audio with voices: {voice1}, {voice2}")
    
    audio_results = []
    
    for i, line in enumerate(dialogue_lines):
        speaker = line.get("speaker", 1)
        text = line.get("text", "")
        
        if not text or len(text.strip()) == 0:
            logger.warning(f"Skipping empty dialogue line {i}")
            continue
        
        # Select voice based on speaker number
        voice = voice1 if speaker == 1 else voice2
        
        try:
            # Generate audio for this line
            audio_bytes = await generate_speech(text, voice=voice)
            
            result = {
                "index": i,
                "speaker": speaker,
                "text": text,
                "voice": voice,
                "audio_bytes": audio_bytes,
                "audio_size": len(audio_bytes)
            }
            
            # Optionally save to disk
            if output_dir:
                output_path = Path(output_dir)
                output_path.mkdir(parents=True, exist_ok=True)
                
                filename = f"line_{i:03d}_speaker{speaker}.wav"
                filepath = output_path / filename
                
                with open(filepath, "wb") as f:
                    f.write(audio_bytes)
                
                result["audio_path"] = str(filepath)
                logger.info(f"Saved audio to {filepath}")
            
            audio_results.append(result)
            
        except Exception as e:
            logger.error(f"Failed to generate audio for line {i}: {e}")
            # Continue with other lines even if one fails
            audio_results.append({
                "index": i,
                "speaker": speaker,
                "text": text,
                "error": str(e)
            })
    
    logger.info(f"Generated audio for {len(audio_results)} dialogue lines")
    return audio_results


def save_audio_to_file(audio_bytes: bytes, filepath: str) -> str:
    """
    Save audio bytes to a file
    
    Args:
        audio_bytes: Raw audio data
        filepath: Path where to save the file
    
    Returns:
        Absolute path to saved file
    """
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(path, "wb") as f:
        f.write(audio_bytes)
    
    logger.info(f"Saved {len(audio_bytes)} bytes to {path}")
    return str(path.absolute())
