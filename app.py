import os
import shutil
import openai
import random
import re
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from generate_music import MusicGenerator
from generate_image import ImageGenerator

class LyricsGenerator:
    def __init__(self):
        print("🎤 Initializing OpenAI-powered Lyrics Generator...")
        
        # Set OpenAI API key
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        if not self.api_key:
            print("❌ OPENAI_API_KEY not found in environment variables!")
            print("💡 Set it with: export OPENAI_API_KEY='your-api-key-here'")
            raise ValueError("OpenAI API key is required")
        
        # Initialize OpenAI client
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)
            self.api_mode = "new"
            print("✅ OpenAI client initialized (new API)")
        except ImportError:
            openai.api_key = self.api_key
            self.api_mode = "legacy"
            print("✅ OpenAI client initialized (legacy API)")
        
        self.load_fallback_templates()

    def load_fallback_templates(self):
        """Load fallback templates in case OpenAI fails"""
        self.fallback_themes = {
            "love": {
                "titles": ["Endless Hearts", "Love's Symphony", "Forever Yours"],
                "verses": ["In the quiet of your eyes, I see tomorrow\nEvery whisper of your voice erases sorrow"],
                "chorus": ["You're my light in the darkness, my hope in the storm\nEvery beat of your heart keeps me safe and warm"]
            },
            "dreams": {
                "titles": ["Chasing Stars", "Vision Quest", "Tomorrow's Light"],
                "verses": ["Standing at the edge of what could be\nEvery step forward sets my spirit free"],
                "chorus": ["I'm chasing dreams across the endless sky\nNothing's gonna stop me, I was born to fly"]
            }
        }

    def generate_lyrics(self, prompt, song_length="medium"):
        """Generate professional lyrics using OpenAI GPT-4"""
        print(f"🎤 Generating AI lyrics for: '{prompt}'")
        
        try:
            # Create comprehensive prompt for OpenAI
            system_prompt = """You are a professional songwriter and lyricist who has written hits for major artists. 
            Create complete song lyrics with proper structure including verses, chorus, and bridge.
            
            Requirements:
            - Use proper song structure with [Verse 1], [Chorus], [Bridge] labels
            - Create memorable, singable lyrics with good rhythm
            - Include emotional depth and storytelling
            - Make the chorus catchy and repeatable
            - Ensure rhyme schemes work well
            - Keep it radio-friendly and commercially viable
            
            Format example:
            # Song Title
            
            [Verse 1]
            Line 1 of verse
            Line 2 of verse
            Line 3 of verse
            Line 4 of verse
            
            [Chorus]
            Chorus line 1
            Chorus line 2
            Chorus line 3
            Chorus line 4"""
            
            user_prompt = f"""Write complete song lyrics for: "{prompt}"
            
            Create a song that captures the essence of this prompt with:
            - A compelling title that fits the theme
            - 2-3 verses that tell a story
            - A memorable chorus that people will sing along to
            - A bridge that adds depth or a new perspective
            - Appropriate mood and emotion for the theme
            
            Make it professional quality, like something you'd hear on Spotify or Apple Music."""

            if self.api_mode == "new":
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=600,
                    temperature=0.8,
                    presence_penalty=0.3,
                    frequency_penalty=0.3
                )
                full_lyrics = response.choices[0].message.content.strip()
            else:
                response = openai.ChatCompletion.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=600,
                    temperature=0.8,
                    presence_penalty=0.3,
                    frequency_penalty=0.3
                )
                full_lyrics = response.choices[0].message.content.strip()
            
            print("✅ OpenAI generated high-quality lyrics!")
            
            # Parse the generated lyrics
            parsed_data = self.parse_openai_lyrics(full_lyrics, prompt)
            return parsed_data
            
        except Exception as e:
            print(f"❌ OpenAI lyrics generation failed: {e}")
            print("🔄 Using fallback template...")
            return self.generate_fallback_lyrics(prompt)

    def parse_openai_lyrics(self, full_lyrics, original_prompt):
        """Parse OpenAI-generated lyrics into structured format"""
        
        # Extract title
        title_match = re.search(r'#\s*(.+)', full_lyrics)
        if title_match:
            title = title_match.group(1).strip()
        else:
            lines = [line.strip() for line in full_lyrics.split('\n') if line.strip()]
            title = lines[0] if lines else "Generated Song"
        
        # Clean title
        title = re.sub(r'[^\w\s\-\'\(\)]', '', title).strip()
        if len(title) > 50:
            title = title[:50].strip()
        
        # Detect attributes
        theme = self.detect_theme_from_content(full_lyrics, original_prompt)
        genre = self.detect_genre_from_prompt(original_prompt)
        mood = self.detect_mood_from_content(full_lyrics, original_prompt)
        
        return {
            "title": title,
            "lyrics": full_lyrics,
            "theme": theme,
            "genre": genre,
            "mood": mood,
            "source": "openai_gpt4"
        }

    def generate_fallback_lyrics(self, prompt):
        """Fallback template generator if OpenAI fails"""
        print("🎯 Using fallback template...")
        
        theme = self.detect_theme_from_prompt(prompt)
        template_data = self.fallback_themes.get(theme, self.fallback_themes["dreams"])
        
        title = random.choice(template_data["titles"])
        verse = random.choice(template_data["verses"])
        chorus = random.choice(template_data["chorus"])
        
        lyrics = f"""# {title}

[Verse 1]
{verse}

[Chorus]
{chorus}

[Verse 2]
{verse}

[Chorus]
{chorus}

[Bridge]
Maybe we were meant for something more
Than what we've seen and felt before

[Chorus]
{chorus}"""

        return {
            "title": title,
            "lyrics": lyrics,
            "theme": theme,
            "genre": self.detect_genre_from_prompt(prompt),
            "mood": self.detect_mood_from_prompt(prompt),
            "source": "fallback_template"
        }

    def detect_theme_from_content(self, lyrics, prompt):
        """Detect theme from generated lyrics and prompt"""
        combined_text = (lyrics + " " + prompt).lower()
        
        themes = {
            "love": ["love", "heart", "forever", "together", "romance"],
            "dreams": ["dream", "hope", "future", "tomorrow", "aspire"],
            "freedom": ["free", "escape", "liberty", "fly", "wings"],
            "heartbreak": ["broken", "goodbye", "tears", "pain", "lost"],
            "happiness": ["happy", "joy", "smile", "bright", "celebrate"]
        }
        
        for theme, keywords in themes.items():
            if any(keyword in combined_text for keyword in keywords):
                return theme
        return "life"

    def detect_theme_from_prompt(self, prompt):
        """Detect theme from prompt only (fallback)"""
        prompt_lower = prompt.lower()
        if any(word in prompt_lower for word in ["love", "romantic", "heart"]):
            return "love"
        elif any(word in prompt_lower for word in ["dream", "hope", "future"]):
            return "dreams"
        else:
            return "dreams"

    def detect_genre_from_prompt(self, prompt):
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
        elif any(word in prompt_lower for word in ["indie", "alternative"]):
            return "indie"
        else:
            return "pop"

    def detect_mood_from_content(self, lyrics, prompt):
        """Detect mood from lyrics and prompt"""
        combined_text = (lyrics + " " + prompt).lower()
        
        mood_keywords = {
            "happy": ["happy", "joy", "bright", "celebrate", "smile"],
            "sad": ["sad", "cry", "tears", "broken", "lonely"],
            "energetic": ["energy", "power", "strong", "intense", "fire"],
            "calm": ["calm", "peace", "quiet", "gentle", "serene"],
            "romantic": ["love", "heart", "tender", "sweet", "romantic"],
            "dark": ["dark", "shadow", "mystery", "haunting"]
        }
        
        for mood, keywords in mood_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                return mood
        return "balanced"

    def detect_mood_from_prompt(self, prompt):
        """Detect mood from prompt only (fallback)"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["happy", "joyful", "upbeat"]):
            return "happy"
        elif any(word in prompt_lower for word in ["sad", "melancholy", "emotional"]):
            return "sad"
        elif any(word in prompt_lower for word in ["energetic", "intense", "powerful"]):
            return "energetic"
        elif any(word in prompt_lower for word in ["calm", "peaceful", "serene"]):
            return "calm"
        elif any(word in prompt_lower for word in ["romantic", "love", "tender"]):
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

print("🎤 Initializing OpenAI Lyrics Generator...")
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
            "lyrics": "✅ OpenAI GPT-4 Lyrics ready"
        },
        "features": [
            "🎵 AI Music generation",
            "🎨 AI Album covers", 
            "🎤 AI Lyrics with OpenAI GPT-4",
            "✨ Complete song creation"
        ]
    }

@app.post("/generate")
async def generate(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt", "")
        duration = int(body.get("duration", 15))

        print(f"🎵 Generating complete AI song for: '{prompt}' ({duration}s)")
        
        # Generate lyrics using OpenAI
        print(f"🎤 Creating AI lyrics...")
        lyrics_data = lyricsgen.generate_lyrics(prompt)
        
        # Generate music
        print(f"🎵 Composing music...")
        audio_path = musicgen.generate(prompt, duration)
        audio_filename = os.path.basename(audio_path)
        audio_static_path = os.path.join(STATIC_DIR, audio_filename)
        shutil.copy(audio_path, audio_static_path)

        # Generate album cover
        print(f"🎨 Creating album artwork...")
        image_path = imagegen.generate(prompt)
        image_filename = os.path.basename(image_path)
        image_static_path = os.path.join(STATIC_DIR, image_filename)
        shutil.copy(image_path, image_static_path)

        print(f"✅ Complete AI song generated!")
        print(f"   🎵 Audio: {audio_filename}")
        print(f"   🎤 Lyrics: {lyrics_data['title']} ({lyrics_data['source']})")
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
                "mood": lyrics_data["mood"],
                "source": lyrics_data["source"]
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
            "lyrics_generator": "openai_ready"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)