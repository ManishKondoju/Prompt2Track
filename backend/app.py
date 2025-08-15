import os
import shutil
import random
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from generate_music import MusicGenerator
from generate_image import ImageGenerator

# Simple inline lyrics generator
class LyricsGenerator:
    def __init__(self):
        print("🎤 Initializing Simple Lyrics Generator...")
        self.load_templates()

    def load_templates(self):
        """Load creative lyric templates"""
        self.themes = {
            "love": {
                "titles": ["Endless Hearts", "Love's Symphony", "Forever Yours", "Heart's Desire", "Infinite Love", "Soul Connection", "Eternal Flame", "Perfect Harmony"],
                "verses": [
                    "In the quiet of your eyes, I see tomorrow\nEvery whisper of your voice erases sorrow\nTime stands still when you're near, nothing else is clear\nIn this moment we disappear",
                    "Walking through the starlit night, holding you so tight\nEvery step we take together makes everything feel right\nYour heartbeat is my melody, your love my harmony\nIn this dance of you and me",
                    "When the world feels cold and empty, you're my warming light\nEvery shadow disappears when you hold me tight\nIn your arms I find my home, never feel alone\nWith you I've truly grown"
                ],
                "chorus": [
                    "You're my light in the darkness, my hope in the storm\nEvery beat of your heart keeps me safe and warm\nThis love we've found is larger than life\nYou're my song, my truth, my guiding light",
                    "We're dancing through forever, hearts beating as one\nEvery moment feels like magic under the sun\nNothing else could matter more than what we share\nThis love beyond compare"
                ]
            },
            "dreams": {
                "titles": ["Chasing Stars", "Vision Quest", "Tomorrow's Light", "Dream Walker", "Infinite Dreams", "Sky Dancer", "Future Calling", "Rising Hope"],
                "verses": [
                    "Standing at the edge of what could be\nEvery step forward sets my spirit free\nThe road ahead is calling out my name\nI won't let fear extinguish my flame",
                    "In the mirror of the night sky, I see my dreams unfold\nEvery story yet untold, every secret yet to hold\nThe future's calling out to me, a symphony of possibility\nI'll chase it till I'm finally free",
                    "Mountains high and valleys low, I'll travel every road\nCarrying hope within my soul, sharing every load\nThe destination's not as important as the way\nI'm living for today"
                ],
                "chorus": [
                    "I'm chasing dreams across the endless sky\nNothing's gonna stop me, I was born to fly\nEvery setback makes me stronger than before\nI'll keep pushing till I find what I'm looking for",
                    "Rising up above the clouds, reaching for the stars\nNothing's gonna hold me down, I'll heal these scars\nEvery dream's within my reach if I believe\nThis is what I can achieve"
                ]
            },
            "energy": {
                "titles": ["Electric Fire", "Power Source", "Lightning Strikes", "Burning Bright", "Unstoppable Force", "Thunder Rising", "Ignition Point", "Pure Energy"],
                "verses": [
                    "Feel the energy coursing through my veins tonight\nEvery heartbeat is a war drum, every breath a battle cry\nI was born for this moment, I was made to touch the sky\nNothing's gonna hold me back now, watch me learn to fly",
                    "Thunder in my soul, lightning in my eyes\nEvery challenge that I face just makes me realize\nI'm stronger than I ever thought, more powerful than fear\nThe time has come to make my mark, my destiny is here",
                    "Fire burning deep inside, passion I can't hide\nEvery obstacle I face becomes my source of pride\nI'm electric, I'm alive, I'm ready for the fight\nI'm a beacon in the night"
                ],
                "chorus": [
                    "I'm on fire, burning bright with energy and desire\nTake me higher, fueled by dreams that never tire\nI'm electric, so magnetic, can't be stopped\nI'm kinetic, so energetic, rising to the top",
                    "Power flowing through my veins, breaking through the chains\nNothing left but what remains, passion through the pain\nI'm unstoppable, undeniable, force of nature strong\nThis is where I belong"
                ]
            },
            "calm": {
                "titles": ["Peaceful Waters", "Gentle Breeze", "Quiet Moments", "Serene Landscape", "Inner Peace", "Soft Whispers", "Tranquil Dawn", "Still Waters"],
                "verses": [
                    "In the stillness of the morning light, everything's serene\nGentle breezes carry whispers of the most beautiful scene\nTime moves slowly here, worries disappear\nIn this moment crystal clear",
                    "Floating on a sea of calm, peaceful and free\nEvery wave that rocks my soul brings tranquility\nIn the silence I can hear, everything I hold dear\nPeace is always near"
                ],
                "chorus": [
                    "Let the calm wash over me, like waves upon the shore\nIn this peace I find the key to everything and more\nGentle rhythms of the earth, remind me of my worth\nIn this quiet, sweet rebirth"
                ]
            }
        }

    def generate_lyrics(self, prompt):
        """Generate lyrics based on prompt"""
        print(f"🎤 Generating lyrics for: '{prompt}'")
        
        # Detect theme
        theme = self.detect_theme(prompt)
        template_data = self.themes.get(theme, self.themes["dreams"])
        
        # Generate components with variety
        title = random.choice(template_data["titles"])
        verse1 = random.choice(template_data["verses"])
        verse2 = random.choice([v for v in template_data["verses"] if v != verse1])
        chorus = random.choice(template_data["chorus"])
        
        # Create full lyrics with proper structure
        lyrics = f"""# {title}

[Verse 1]
{verse1}

[Chorus]
{chorus}

[Verse 2]
{verse2}

[Chorus]
{chorus}

[Bridge]
Maybe we were meant for something more
Than what we've seen and felt before
A different path, an open door
To everything we're fighting for

[Chorus]
{chorus}"""

        return {
            "title": title,
            "lyrics": lyrics,
            "theme": theme,
            "genre": self.detect_genre(prompt),
            "mood": self.detect_mood(prompt)
        }

    def detect_theme(self, prompt):
        """Detect theme from prompt"""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["love", "romantic", "heart", "romance", "valentine"]):
            return "love"
        elif any(word in prompt_lower for word in ["energy", "power", "intense", "rock", "metal", "strong", "fire", "electric"]):
            return "energy"
        elif any(word in prompt_lower for word in ["calm", "peaceful", "quiet", "serene", "meditation", "zen", "gentle"]):
            return "calm"
        else:
            return "dreams"

    def detect_genre(self, prompt):
        """Detect genre from prompt"""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["rock", "metal", "guitar"]):
            return "rock"
        elif any(word in prompt_lower for word in ["electronic", "edm", "synth", "techno"]):
            return "electronic"
        elif any(word in prompt_lower for word in ["pop", "mainstream", "radio"]):
            return "pop"
        elif any(word in prompt_lower for word in ["classical", "piano", "orchestral"]):
            return "classical"
        elif any(word in prompt_lower for word in ["jazz", "blues", "saxophone"]):
            return "jazz"
        else:
            return "indie"

    def detect_mood(self, prompt):
        """Detect mood from prompt"""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["happy", "joyful", "upbeat", "cheerful", "bright"]):
            return "happy"
        elif any(word in prompt_lower for word in ["sad", "melancholy", "emotional", "heartbreak"]):
            return "sad"
        elif any(word in prompt_lower for word in ["energetic", "intense", "powerful", "strong"]):
            return "energetic"
        elif any(word in prompt_lower for word in ["calm", "peaceful", "serene", "gentle"]):
            return "calm"
        elif any(word in prompt_lower for word in ["romantic", "love", "tender", "intimate"]):
            return "romantic"
        else:
            return "balanced"

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
            "music": "✅ MusicGen Small ready",
            "image": "✅ DALL-E 3 / Stable Diffusion ready",
            "lyrics": "✅ Lyrics generator ready"
        },
        "features": [
            "🎵 Music generation with synthetic data",
            "🎨 Artistic album covers", 
            "🎤 Creative lyrics generation",
            "✨ Complete song creation"
        ]
    }

@app.post("/generate")
async def generate(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        duration = int(body.get("duration", 15))

        print(f"🎵 Generating complete song for: '{prompt}' ({duration}s)")
        
        # Generate lyrics
        print(f"🎤 Creating lyrics...")
        lyrics_data = lyricsgen.generate_lyrics(prompt)
        
        # Generate music with synthetic data generation
        print(f"🎵 Composing music...")
        audio_path = musicgen.generate(prompt, duration)
        audio_filename = os.path.basename(audio_path)
        audio_static_path = os.path.join(STATIC_DIR, audio_filename)
        shutil.copy(audio_path, audio_static_path)

        # Generate artistic album cover
        print(f"🎨 Creating album artwork...")
        image_path = imagegen.generate(prompt)
        image_filename = os.path.basename(image_path)
        image_static_path = os.path.join(STATIC_DIR, image_filename)
        shutil.copy(image_path, image_static_path)

        print(f"✅ Complete song generated successfully!")
        print(f"   🎵 Audio: {audio_filename}")
        print(f"   🎤 Lyrics: {lyrics_data['title']}")
        print(f"   🎨 Cover: {image_filename}")

        return JSONResponse({
            "audio_url": f"http://127.0.0.1:7860/static/{audio_filename}",
            "image_url": f"http://127.0.0.1:7860/static/{image_filename}",
            "original_prompt": prompt,
            "duration": duration,
            "lyrics": {
                "title": lyrics_data["title"],
                "content": lyrics_data["lyrics"],
                "theme": lyrics_data["theme"],
                "genre": lyrics_data["genre"],
                "mood": lyrics_data["mood"]
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating complete song: {e}")
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