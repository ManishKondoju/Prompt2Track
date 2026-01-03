import os
import shutil
import random
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from generate_music import MusicGenerator
from generate_image import ImageGenerator
from generate_lyrics import LyricsGenerator

# Create FastAPI app
app = FastAPI()

# Initialize all generators
print("🎵 Initializing Music Generator...")
musicgen = MusicGenerator()

print("🎨 Initializing Image Generator...")
imagegen = ImageGenerator()

print("🎤 Initializing Lyrics Generator...")
lyricsgen = LyricsGenerator()

print("✅ All generators ready!")

# Define static folder
STATIC_DIR = "./static"
os.makedirs(STATIC_DIR, exist_ok=True)

# CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "🎵 Complete Music Generator API is running!", 
        "status": "healthy",
        "components": {
            "music": "✅ MusicGen ready",
            "image": "✅ DALL-E 3 ready",
            "lyrics": "✅ GPT-4 Lyrics ready"
        }
    }

@app.post("/generate")
async def generate(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        duration = int(body.get("duration", 15))

        print(f"🎵 Generating complete song for: '{prompt}' ({duration}s)")
        
        # Initialize result containers
        audio_path = None
        image_path = None
        lyrics_data = None
        
        # Generate lyrics using GPT-4 API
        try:
            print(f"🎤 Creating lyrics with GPT-4...")
            lyrics_data = lyricsgen.generate_lyrics(prompt)
            print(f"✅ Lyrics generated: {lyrics_data['title']}")
        except Exception as e:
            print(f"⚠️ GPT-4 lyrics generation failed: {e}")
            print("🔄 Using template fallback...")
            lyrics_data = lyricsgen.generate_premium_fallback(prompt)
        
        # Generate music (working well)
        try:
            print(f"🎵 Composing music...")
            audio_path = musicgen.generate(prompt, duration)
            audio_filename = os.path.basename(audio_path)
            audio_static_path = os.path.join(STATIC_DIR, audio_filename)
            shutil.copy(audio_path, audio_static_path)
            print(f"✅ Music generated: {audio_filename}")
        except Exception as e:
            print(f"❌ Music generation failed: {e}")
            raise Exception("Music generation failed - cannot continue without audio")

        # Try image generation with graceful failure
        try:
            print(f"🎨 Creating album artwork...")
            image_path = imagegen.generate(prompt)
            image_filename = os.path.basename(image_path)
            image_static_path = os.path.join(STATIC_DIR, image_filename)
            shutil.copy(image_path, image_static_path)
            print(f"✅ Image generated: {image_filename}")
        except Exception as e:
            print(f"⚠️ Image generation failed (network issue): {e}")
            print("🔄 Continuing without album artwork...")
            image_filename = None

        # Prepare response
        response_data = {
            "audio_url": f"http://127.0.0.1:7860/static/{audio_filename}",
            "original_prompt": prompt,
            "duration": duration,
            "lyrics": {
                "title": lyrics_data["title"],
                "content": lyrics_data["lyrics"],
                "theme": lyrics_data["theme"],
                "genre": lyrics_data["genre"],
                "mood": lyrics_data["mood"],
                "source": lyrics_data.get("source", "api")
            }
        }

        # Add image URL if generation succeeded
        if image_filename:
            response_data["image_url"] = f"http://127.0.0.1:7860/static/{image_filename}"
            response_data["status"] = "complete"
            print(f"✅ Complete song generated successfully!")
        else:
            response_data["image_url"] = None
            response_data["status"] = "partial"
            print(f"⚠️ Partial song generated (music + lyrics, no artwork)")

        return JSONResponse(response_data)
        
    except Exception as e:
        print(f"❌ Error generating song: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/static/{filename}")
async def serve_static(filename: str):
    file_path = os.path.join(STATIC_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return JSONResponse(status_code=404, content={"error": "File not found"})

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "components": {
            "music_generator": "ready",
            "image_generator": "ready", 
            "lyrics_generator": "ready"
        }
    }