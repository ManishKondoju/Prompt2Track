import os
import openai
import random
import re
from datetime import datetime

class LyricsGenerator:
    def __init__(self):
        print("🎤 Initializing OpenAI-powered Lyrics Generator...")
        
        # Set OpenAI API key (make sure to set this in your environment)
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        if not openai.api_key:
            print("❌ OPENAI_API_KEY not found in environment variables!")
            print("💡 Set it with: export OPENAI_API_KEY='your-api-key-here'")
            raise ValueError("OpenAI API key is required")
        
        print("✅ OpenAI API key loaded successfully")
        
        self.load_song_templates()

    def load_song_templates(self):
        """Load song structure templates"""
        self.song_structures = {
            "pop": ["verse", "pre-chorus", "chorus", "verse", "pre-chorus", "chorus", "bridge", "chorus"],
            "rock": ["verse", "chorus", "verse", "chorus", "bridge", "chorus", "chorus"],
            "ballad": ["verse", "verse", "chorus", "verse", "chorus", "bridge", "chorus"],
            "electronic": ["intro", "verse", "chorus", "verse", "chorus", "bridge", "chorus"],
            "hip-hop": ["verse", "hook", "verse", "hook", "bridge", "hook"],
            "indie": ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
            "classical": ["verse", "verse", "chorus", "bridge", "chorus"]
        }

    def generate_lyrics(self, prompt, song_length="medium"):
        """Generate professional lyrics using OpenAI GPT-4"""
        print(f"🎤 Generating professional lyrics for: '{prompt}'")
        
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

            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",  # Good quality, affordable
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=600,
                temperature=0.8,  # Creative but not too random
                presence_penalty=0.3,  # Encourage new ideas
                frequency_penalty=0.3   # Reduce repetition
            )
            
            full_lyrics = response.choices[0].message.content.strip()
            print("✅ OpenAI generated high-quality lyrics!")
            
            # Parse the generated lyrics
            parsed_data = self.parse_openai_lyrics(full_lyrics, prompt)
            
            return parsed_data
            
        except Exception as e:
            print(f"❌ OpenAI lyrics generation failed: {e}")
            print("🔄 Using high-quality template fallback...")
            return self.generate_premium_fallback(prompt)

    def parse_openai_lyrics(self, full_lyrics, original_prompt):
        """Parse OpenAI-generated lyrics into structured format"""
        
        # Extract title (usually in # Title format or first line)
        title_match = re.search(r'#\s*(.+)', full_lyrics)
        if title_match:
            title = title_match.group(1).strip()
        else:
            # Extract from first meaningful line
            lines = [line.strip() for line in full_lyrics.split('\n') if line.strip()]
            title = lines[0] if lines else "Generated Song"
        
        # Clean title
        title = re.sub(r'[^\w\s\-\'\(\)]', '', title).strip()
        if len(title) > 50:
            title = title[:50].strip()
        
        # Detect theme, genre, mood from the generated content and original prompt
        theme = self.detect_theme_from_lyrics(full_lyrics, original_prompt)
        genre = self.detect_genre_from_prompt(original_prompt)
        mood = self.detect_mood_from_lyrics(full_lyrics, original_prompt)
        
        return {
            "title": title,
            "lyrics": full_lyrics,
            "theme": theme,
            "genre": genre,
            "mood": mood,
            "source": "openai_gpt4"
        }

    def generate_premium_fallback(self, prompt):
        """High-quality template fallback if API fails"""
        print("🎯 Generating premium template lyrics...")
        
        theme = self.extract_theme_from_prompt(prompt)
        genre = self.detect_genre_from_prompt(prompt)
        mood = self.detect_mood_from_prompt(prompt)
        
        # Premium template with better quality
        premium_templates = {
            "love": {
                "title": ["Endless Hearts", "Love's Symphony", "Forever Yours", "Heart's Desire", "Infinite Love"],
                "verse": [
                    "In the quiet of your eyes, I see tomorrow\nEvery whisper of your voice erases sorrow\nTime stands still when you're near, nothing else is clear\nIn this moment we disappear"
                ],
                "chorus": [
                    "You're my light in the darkness, my hope in the storm\nEvery beat of your heart keeps me safe and warm\nThis love we've found is larger than life\nYou're my song, my truth, my guiding light"
                ]
            },
            "dreams": {
                "title": ["Chasing Stars", "Vision Quest", "Tomorrow's Light", "Dream Walker", "Infinite Skies"],
                "verse": [
                    "Standing at the edge of what could be\nEvery step forward sets my spirit free\nThe road ahead is calling out my name\nI won't let fear extinguish my flame"
                ],
                "chorus": [
                    "I'm chasing dreams across the endless sky\nNothing's gonna stop me, I was born to fly\nEvery setback makes me stronger than before\nI'll keep pushing till I find what I'm looking for"
                ]
            }
        }
        
        template_data = premium_templates.get(theme, premium_templates["dreams"])
        title = random.choice(template_data["title"])
        verse = random.choice(template_data["verse"])
        chorus = random.choice(template_data["chorus"])
        
        lyrics = f"""# {title}

[Verse 1]
{verse}

[Chorus]
{chorus}

[Verse 2]
{verse.replace('your', 'my').replace('You', 'I')}

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
            "genre": genre, 
            "mood": mood,
            "source": "premium_template"
        }

    def detect_theme_from_lyrics(self, lyrics, prompt):
        """Detect theme from generated lyrics content"""
        lyrics_lower = lyrics.lower()
        prompt_lower = prompt.lower()
        
        themes = {
            "love": ["love", "heart", "forever", "together", "kiss", "embrace", "romance"],
            "dreams": ["dream", "hope", "future", "tomorrow", "aspire", "vision", "goal"],
            "freedom": ["free", "escape", "liberty", "break", "fly", "wings", "open"],
            "life": ["life", "living", "moment", "time", "experience", "journey"],
            "heartbreak": ["broken", "goodbye", "tears", "pain", "lost", "lonely"],
            "happiness": ["happy", "joy", "smile", "bright", "sunshine", "celebrate"]
        }
        
        # Check both lyrics and original prompt
        combined_text = lyrics_lower + " " + prompt_lower
        
        for theme, keywords in themes.items():
            if any(keyword in combined_text for keyword in keywords):
                return theme
        return "life"

    def detect_genre_from_prompt(self, prompt):
        """Detect genre from original prompt"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["rock", "metal", "guitar", "heavy"]):
            return "rock"
        elif any(word in prompt_lower for word in ["electronic", "edm", "synth", "dance"]):
            return "electronic"
        elif any(word in prompt_lower for word in ["pop", "catchy", "mainstream", "radio"]):
            return "pop"
        elif any(word in prompt_lower for word in ["ballad", "slow", "emotional", "piano"]):
            return "ballad"
        elif any(word in prompt_lower for word in ["hip hop", "rap", "urban", "beat"]):
            return "hip-hop"
        elif any(word in prompt_lower for word in ["indie", "alternative", "underground"]):
            return "indie"
        else:
            return "pop"

    def detect_mood_from_lyrics(self, lyrics, prompt):
        """Detect mood from lyrics and prompt"""
        combined_text = (lyrics + " " + prompt).lower()
        
        mood_keywords = {
            "happy": ["happy", "joy", "bright", "celebrate", "smile", "laugh", "fun"],
            "sad": ["sad", "cry", "tears", "broken", "lonely", "empty", "dark"],
            "energetic": ["energy", "power", "strong", "intense", "fire", "electric"],
            "calm": ["calm", "peace", "quiet", "gentle", "soft", "serene"],
            "romantic": ["love", "heart", "kiss", "tender", "sweet", "romantic"],
            "dark": ["dark", "shadow", "mystery", "deep", "haunting"]
        }
        
        for mood, keywords in mood_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                return mood
        return "balanced"

    def extract_theme_from_prompt(self, prompt):
        """Extract theme from original prompt"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["love", "romantic", "heart", "relationship"]):
            return "love"
        elif any(word in prompt_lower for word in ["dream", "future", "hope", "aspiration"]):
            return "dreams"
        elif any(word in prompt_lower for word in ["free", "escape", "liberty", "break"]):
            return "freedom"
        elif any(word in prompt_lower for word in ["sad", "heartbreak", "lost", "goodbye"]):
            return "heartbreak"
        elif any(word in prompt_lower for word in ["happy", "joy", "celebrate", "party"]):
            return "happiness"
        else:
            return "life"

    def save_lyrics(self, lyrics_data):
        """Save lyrics to file"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"assets/lyrics_{timestamp}.txt"
        os.makedirs("assets", exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(lyrics_data["lyrics"])
        
        print(f"💾 Lyrics saved to: {filename}")
        return filename