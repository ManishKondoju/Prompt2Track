import replicate
import os
import requests
import time
from datetime import datetime
import random
from dotenv import load_dotenv

class MusicGenerator:
    def __init__(self):
        print("🎵 Initializing Replicate MusicGen Large...")
        
        # Load environment variables
        load_dotenv()
        
        # Check for Replicate API token - REQUIRED
        replicate_token = os.getenv("REPLICATE_API_TOKEN")
        
        if not replicate_token:
            print("❌ REPLICATE_API_TOKEN not found in environment!")
            print("💡 Add to .env file: REPLICATE_API_TOKEN=r8_your-token-here")
            print("🌐 Get your token from: https://replicate.com/account/api-tokens")
            raise ValueError("Replicate API token is required")
        
        # Set environment variable for replicate
        os.environ["REPLICATE_API_TOKEN"] = replicate_token
        print("✅ Replicate API configured for MusicGen Large")
        
        # Load prompt optimization
        self.load_prompt_patterns()

    def load_prompt_patterns(self):
        """Load prompt optimization patterns for MusicGen Large"""
        self.genre_enhancers = {
            "electronic": ["synthesized", "digital", "electronic beats", "synth"],
            "rock": ["guitar-driven", "electric guitar", "rock drums", "bass"],
            "pop": ["catchy", "melodic", "mainstream", "radio-friendly"],
            "classical": ["orchestral", "piano", "strings", "symphony"],
            "jazz": ["jazz", "saxophone", "swing", "improvisation"],
            "ambient": ["atmospheric", "ambient", "soundscape", "ethereal"]
        }
        
        self.mood_enhancers = {
            "happy": ["upbeat", "cheerful", "joyful", "bright"],
            "sad": ["melancholic", "emotional", "somber", "reflective"],
            "energetic": ["powerful", "dynamic", "driving", "intense"],
            "calm": ["peaceful", "gentle", "serene", "relaxing"],
            "romantic": ["tender", "intimate", "smooth", "loving"]
        }

    def optimize_prompt(self, prompt):
        """Optimize prompt for MusicGen Large"""
        # Keep original if it's already detailed
        if len(prompt.split()) >= 5:
            return prompt
        
        # Add enhancements for basic prompts
        prompt_lower = prompt.lower()
        enhanced = prompt
        
        # Add genre enhancement
        for genre, enhancers in self.genre_enhancers.items():
            if genre in prompt_lower:
                enhancer = random.choice(enhancers)
                if enhancer not in prompt_lower:
                    enhanced = f"{enhancer} {enhanced}"
                break
        
        # Add mood enhancement
        for mood, enhancers in self.mood_enhancers.items():
            if mood in prompt_lower:
                enhancer = random.choice(enhancers)
                if enhancer not in prompt_lower:
                    enhanced = f"{enhancer} {enhanced}"
                break
        
        return enhanced

    def generate(self, prompt, duration=15):
        """Generate music using Replicate MusicGen Large"""
        print(f"🚀 Generating with Replicate MusicGen Large: '{prompt}' ({duration}s)")
        
        # Optimize prompt
        optimized_prompt = self.optimize_prompt(prompt)
        print(f"✨ Optimized prompt: '{optimized_prompt}'")
        
        try:
            start_time = time.time()
            
            # Call Replicate MusicGen Large
            output = replicate.run(
                "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
                input={
                    "prompt": optimized_prompt,
                    "model_version": "stereo-large",
                    "output_format": "wav", 
                    "normalization_strategy": "loudness",
                    "duration": duration
                }
            )
            
            generation_time = time.time() - start_time
            print(f"⚡ Replicate generation completed in {generation_time:.2f} seconds")
            
            # Download and save the audio
            if output:
                return self.download_audio(output)
            else:
                raise Exception("No audio output from Replicate")
                
        except Exception as e:
            print(f"❌ Replicate generation failed: {e}")
            raise e

    def download_audio(self, audio_url):
        """Download audio file from Replicate"""
        print(f"📥 Downloading audio from Replicate...")
        
        try:
            response = requests.get(audio_url, timeout=60)
            response.raise_for_status()
            
            # Save the audio file
            timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            filename = f"assets/audio_{timestamp}_replicate.wav"
            os.makedirs("assets", exist_ok=True)
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content) / 1024 / 1024
            print(f"✅ Downloaded Replicate audio: {filename} ({file_size:.2f} MB)")
            
            return filename
            
        except Exception as e:
            print(f"❌ Failed to download audio: {e}")
            raise e