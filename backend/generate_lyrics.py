import os
import random
import re
from datetime import datetime

class LyricsGenerator:
    def __init__(self):
        print("🎤 Initializing OpenAI-powered Lyrics Generator...")
        
        # Initialize OpenAI client (new API)
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("❌ OPENAI_API_KEY not found in environment variables!")
            raise ValueError("OpenAI API key is required")
        
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=api_key)
            print("✅ OpenAI client initialized (new API)")
        except Exception as e:
            print(f"❌ Failed to initialize OpenAI client: {e}")
            raise
        
        self.load_synthetic_data_patterns()

    def load_synthetic_data_patterns(self):
        """Load synthetic data generation patterns for lyrics enhancement"""
        self.genre_styles = {
            "jazz": ["smooth", "sophisticated", "improvisational", "soulful"],
            "rock": ["powerful", "driving", "rebellious", "energetic"],
            "electronic": ["futuristic", "atmospheric", "synthesized", "rhythmic"],
            "pop": ["catchy", "melodic", "accessible", "memorable"],
            "classical": ["elegant", "timeless", "orchestral", "refined"],
            "hip-hop": ["rhythmic", "urban", "storytelling", "expressive"],
            "indie": ["authentic", "alternative", "creative", "introspective"]
        }
        
        self.mood_descriptors = {
            "calm": ["peaceful", "serene", "tranquil", "meditative"],
            "energetic": ["dynamic", "intense", "vibrant", "powerful"],
            "romantic": ["tender", "passionate", "intimate", "loving"],
            "melancholic": ["reflective", "emotional", "nostalgic", "contemplative"],
            "happy": ["joyful", "uplifting", "celebratory", "bright"]
        }
        
        self.theme_contexts = {
            "love": ["relationships", "connection", "devotion", "romance"],
            "dreams": ["aspirations", "hope", "future", "possibilities"],
            "life": ["experiences", "journey", "growth", "moments"],
            "freedom": ["liberation", "independence", "breaking free", "self-expression"]
        }

    def generate_synthetic_prompt_variations(self, original_prompt):
        """Generate enhanced prompt variations using synthetic data techniques"""
        detected_genre = self.detect_genre_from_prompt(original_prompt)
        detected_mood = self.detect_mood_from_prompt(original_prompt)
        detected_theme = self.extract_theme_from_prompt(original_prompt)
        
        variations = []
        
        # Base variation
        variations.append(original_prompt)
        
        # Genre-enhanced variation
        if detected_genre in self.genre_styles:
            genre_descriptor = random.choice(self.genre_styles[detected_genre])
            variations.append(f"{genre_descriptor} {original_prompt}")
        
        # Mood-enhanced variation
        if detected_mood in self.mood_descriptors:
            mood_descriptor = random.choice(self.mood_descriptors[detected_mood])
            variations.append(f"{original_prompt} with {mood_descriptor} emotion")
        
        # Theme-enhanced variation
        if detected_theme in self.theme_contexts:
            theme_context = random.choice(self.theme_contexts[detected_theme])
            variations.append(f"{original_prompt} focusing on {theme_context}")
        
        # Combined enhancement
        style_elements = []
        if detected_genre in self.genre_styles:
            style_elements.append(random.choice(self.genre_styles[detected_genre]))
        if detected_mood in self.mood_descriptors:
            style_elements.append(random.choice(self.mood_descriptors[detected_mood]))
        
        if style_elements:
            combined_style = " and ".join(style_elements)
            variations.append(f"{combined_style} song about {original_prompt}")
        
        return variations

    def generate_lyrics(self, prompt, song_length="medium"):
        """Generate professional lyrics using OpenAI GPT-4 with synthetic data enhancement"""
        print(f"🎤 Generating professional lyrics for: '{prompt}'")
        
        # Generate synthetic prompt variations for better results
        prompt_variations = self.generate_synthetic_prompt_variations(prompt)
        enhanced_prompt = random.choice(prompt_variations)
        
        print(f"✨ Using enhanced prompt variation: '{enhanced_prompt}'")
        
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
            
            user_prompt = f"""Write complete song lyrics for: "{enhanced_prompt}"
            
            Create a song that captures the essence of this prompt with:
            - A compelling title that fits the theme
            - 2-3 verses that tell a story
            - A memorable chorus that people will sing along to
            - A bridge that adds depth or a new perspective
            - Appropriate mood and emotion for the theme
            
            Make it professional quality, like something you'd hear on Spotify or Apple Music."""

            # Use new OpenAI API
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
            print("✅ OpenAI generated high-quality lyrics!")
            
            # Parse the generated lyrics
            parsed_data = self.parse_openai_lyrics(full_lyrics, prompt)
            
            return parsed_data
            
        except Exception as e:
            print(f"❌ OpenAI lyrics generation failed: {e}")
            print("🔄 Attempting synthetic data recovery...")
            return self.generate_synthetic_lyrics_fallback(prompt)

    def generate_synthetic_lyrics_fallback(self, prompt):
        """Generate lyrics using synthetic data techniques when API fails"""
        print("🔄 Generating synthetic data-based lyrics...")
        
        # Analyze prompt for synthetic data generation
        detected_genre = self.detect_genre_from_prompt(prompt)
        detected_mood = self.detect_mood_from_prompt(prompt)
        detected_theme = self.extract_theme_from_prompt(prompt)
        
        # Generate synthetic title using detected characteristics
        genre_words = self.genre_styles.get(detected_genre, ["musical"])
        mood_words = self.mood_descriptors.get(detected_mood, ["emotional"])
        theme_words = self.theme_contexts.get(detected_theme, ["expressive"])
        
        title_components = [
            random.choice(genre_words).title(),
            random.choice(theme_words).title().split()[0],
            random.choice(mood_words).title()
        ]
        synthetic_title = " ".join(title_components[:2])
        
        # Generate synthetic lyrics structure
        verse_themes = self.generate_synthetic_verse_themes(detected_theme, detected_mood)
        chorus_theme = self.generate_synthetic_chorus_theme(detected_theme, detected_mood)
        bridge_theme = self.generate_synthetic_bridge_theme(detected_theme)
        
        synthetic_lyrics = f"""# {synthetic_title}

[Verse 1]
{verse_themes[0]}

[Chorus]
{chorus_theme}

[Verse 2]
{verse_themes[1] if len(verse_themes) > 1 else verse_themes[0]}

[Chorus]
{chorus_theme}

[Bridge]
{bridge_theme}

[Chorus]
{chorus_theme}"""

        return {
            "title": synthetic_title,
            "lyrics": synthetic_lyrics,
            "theme": detected_theme,
            "genre": detected_genre,
            "mood": detected_mood,
            "source": "synthetic_data"
        }

    def generate_synthetic_verse_themes(self, theme, mood):
        """Generate synthetic verse content based on theme and mood"""
        synthetic_verses = {
            "love": [
                "Every moment with you feels like a dream come true\nIn your eyes I see the future that we're walking to\nTime moves differently when you're by my side\nIn this feeling I can't hide",
                "Through the storms and sunny days we'll find our way\nEvery challenge that we face just makes us stronger every day\nHand in hand we'll write our story in the stars\nNothing can keep us apart"
            ],
            "dreams": [
                "Looking up at the endless sky I see my path\nEvery step I take today will be worth the aftermath\nThe future's calling out my name with crystal clarity\nI'm ready for this journey",
                "Mountains high and oceans wide won't slow me down\nEvery obstacle I face becomes my solid ground\nWith determination burning bright inside my soul\nI'm moving toward my goal"
            ],
            "life": [
                "Every sunrise brings a chance to start anew\nEvery lesson learned becomes a part of what I do\nIn the rhythm of the days I find my pace\nLiving in this space",
                "Through the laughter and the tears I grow each day\nEvery moment teaches me there's always another way\nIn the simple things I find the greatest joy\nNothing can destroy"
            ]
        }
        
        return synthetic_verses.get(theme, synthetic_verses["life"])

    def generate_synthetic_chorus_theme(self, theme, mood):
        """Generate synthetic chorus content"""
        synthetic_choruses = {
            "love": "This is our moment, this is our time\nEvery heartbeat tells me that you're mine\nNothing else matters when we're together\nWe'll face whatever, now and forever",
            "dreams": "I'm reaching higher than I've ever been before\nEvery dream I chase just opens up another door\nNothing's gonna stop me from becoming who I'm meant to be\nThis is my destiny",
            "life": "Every day's a gift, every breath's a chance\nTo live with purpose, to join the dance\nOf life and love and everything between\nLiving in the scene"
        }
        
        return synthetic_choruses.get(theme, synthetic_choruses["life"])

    def generate_synthetic_bridge_theme(self, theme):
        """Generate synthetic bridge content"""
        synthetic_bridges = {
            "love": "When the world gets complicated\nAnd everything feels jaded\nYour love reminds me who I am\nThis is where I take my stand",
            "dreams": "Sometimes the path gets unclear\nSometimes I'm filled with fear\nBut deep inside I know it's true\nThere's nothing I can't do",
            "life": "In the quiet moments when I reflect\nOn all the ways that I connect\nWith the beauty that surrounds us all\nI hear the call"
        }
        
        return synthetic_bridges.get(theme, synthetic_bridges["life"])

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

    def detect_theme_from_lyrics(self, lyrics, prompt):
        """Detect theme from generated lyrics content"""
        lyrics_lower = lyrics.lower()
        prompt_lower = prompt.lower()
        
        themes = {
            "love": ["love", "heart", "forever", "together", "romance"],
            "dreams": ["dream", "hope", "future", "tomorrow", "aspire"],
            "freedom": ["free", "escape", "liberty", "break", "fly"],
            "life": ["life", "living", "moment", "time", "experience"],
            "calm": ["peace", "quiet", "serene", "tranquil", "gentle"]
        }
        
        combined_text = lyrics_lower + " " + prompt_lower
        
        for theme, keywords in themes.items():
            if any(keyword in combined_text for keyword in keywords):
                return theme
        return "life"

    def detect_genre_from_prompt(self, prompt):
        """Detect genre from original prompt"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["jazz", "blues", "saxophone"]):
            return "jazz"
        elif any(word in prompt_lower for word in ["rock", "metal", "guitar"]):
            return "rock"
        elif any(word in prompt_lower for word in ["electronic", "edm", "synth"]):
            return "electronic"
        elif any(word in prompt_lower for word in ["pop", "catchy", "mainstream"]):
            return "pop"
        elif any(word in prompt_lower for word in ["classical", "orchestral", "piano"]):
            return "classical"
        elif any(word in prompt_lower for word in ["hip hop", "rap", "urban"]):
            return "hip-hop"
        else:
            return "indie"

    def detect_mood_from_lyrics(self, lyrics, prompt):
        """Detect mood from lyrics and prompt"""
        combined_text = (lyrics + " " + prompt).lower()
        
        mood_keywords = {
            "calm": ["calm", "peace", "quiet", "gentle", "serene", "study", "chill"],
            "happy": ["happy", "joy", "bright", "celebrate", "smile"],
            "sad": ["sad", "melancholy", "tears", "lonely", "empty"],
            "energetic": ["energy", "power", "strong", "intense", "electric"],
            "romantic": ["love", "heart", "tender", "sweet", "romantic"]
        }
        
        for mood, keywords in mood_keywords.items():
            if any(keyword in combined_text for keyword in keywords):
                return mood
        return "balanced"

    def extract_theme_from_prompt(self, prompt):
        """Extract theme from original prompt"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["love", "romantic", "heart"]):
            return "love"
        elif any(word in prompt_lower for word in ["dream", "future", "hope"]):
            return "dreams"
        elif any(word in prompt_lower for word in ["calm", "chill", "study", "peaceful"]):
            return "calm"
        elif any(word in prompt_lower for word in ["life", "living", "experience"]):
            return "life"
        else:
            return "life"

    def detect_mood_from_prompt(self, prompt):
        """Detect mood from original prompt"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["calm", "chill", "peaceful", "study"]):
            return "calm"
        elif any(word in prompt_lower for word in ["happy", "joyful", "upbeat"]):
            return "happy"
        elif any(word in prompt_lower for word in ["sad", "melancholy", "emotional"]):
            return "sad"
        elif any(word in prompt_lower for word in ["energetic", "intense", "powerful"]):
            return "energetic"
        elif any(word in prompt_lower for word in ["romantic", "love", "tender"]):
            return "romantic"
        else:
            return "balanced"

    def save_lyrics(self, lyrics_data):
        """Save lyrics to file"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"assets/lyrics_{timestamp}.txt"
        os.makedirs("assets", exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(lyrics_data["lyrics"])
        
        print(f"💾 Lyrics saved to: {filename}")
        return filename