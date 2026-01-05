import os
import time
import requests
from datetime import datetime


class ImageGenerator:
    """
    Super literal image generator - creates exactly what you describe.
    No abstract art, no artistic interpretation - just literal scenes.
    """

    def __init__(self):
        print("🎨 Initializing LITERAL OpenAI (DALL·E) generator...")
        self._init_openai_client()

    def _init_openai_client(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("❌ OPENAI_API_KEY not found")

        try:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=api_key)
            self._api_mode = "new"
            print("✅ OpenAI client initialized")
        except ImportError:
            import openai
            openai.api_key = api_key
            self._openai = openai
            self._api_mode = "legacy"
            print("✅ OpenAI legacy client initialized")

    def generate(self, prompt, chaos=0, size=1024):
        """
        Generate LITERAL album cover - shows exactly what you describe.
        chaos=0 for maximum literalness
        """
        # Force literal interpretation
        dalle_prompt = self._force_literal_prompt(prompt)
        
        print(f"🎭 LITERAL Prompt → {dalle_prompt}")
        start = time.time()

        try:
            if self._api_mode == "new":
                image_bytes = self._generate_new_api(dalle_prompt, size)
            else:
                image_bytes = self._generate_legacy_api(dalle_prompt, size)
        except Exception as e:
            raise RuntimeError(f"❌ Generation failed: {e}")

        # Save image
        os.makedirs("assets", exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"assets/literal_{ts}.png"
        
        with open(filename, "wb") as f:
            f.write(image_bytes)

        print(f"✅ LITERAL image saved → {filename} ({time.time()-start:.2f}s)")
        return filename

    def _force_literal_prompt(self, music_prompt):
        """
        Force DALL-E to create literal scenes, not abstract art.
        """
        # Remove abstract trigger words and force photorealistic scene
        dalle_prompt = "Photorealistic movie scene showing "
        
        # Parse the music prompt literally
        if "dragon battle" in music_prompt.lower():
            dalle_prompt += "a large dragon fighting knights in a stone mountain fortress, "
            dalle_prompt += "with a full symphony orchestra playing instruments in the background, "
            
        elif "tribal drums and flutes" in music_prompt.lower():
            dalle_prompt += "actual wooden tribal drums and bamboo flutes "
            if "temple" in music_prompt.lower():
                dalle_prompt += "inside an ancient stone temple with carved pillars, "
                
        elif "piano concert" in music_prompt.lower():
            dalle_prompt += "a grand piano with a pianist performing "
            if "theater" in music_prompt.lower() or "hall" in music_prompt.lower():
                dalle_prompt += "on stage in an elegant concert hall with audience, "
                
        elif "jazz saxophone" in music_prompt.lower():
            dalle_prompt += "a saxophone player performing "
            if "nightclub" in music_prompt.lower():
                dalle_prompt += "in a dimly lit jazz club with tables and smoke, "
                
        elif "guitar" in music_prompt.lower():
            dalle_prompt += "a person playing guitar "
            if "campfire" in music_prompt.lower():
                dalle_prompt += "around a campfire under starry night sky, "
            elif "rock" in music_prompt.lower():
                dalle_prompt += "on a concert stage with amplifiers and lights, "
                
        elif "violin" in music_prompt.lower():
            dalle_prompt += "a violinist playing violin "
            if "cathedral" in music_prompt.lower():
                dalle_prompt += "inside a gothic cathedral with stained glass windows, "
                
        elif "electronic" in music_prompt.lower() or "synthesizer" in music_prompt.lower():
            dalle_prompt += "electronic synthesizer keyboards and DJ equipment "
            if "futuristic" in music_prompt.lower():
                dalle_prompt += "in a high-tech studio with neon lights, "
                
        elif "harp" in music_prompt.lower():
            dalle_prompt += "a large golden harp being played "
            if "forest" in music_prompt.lower():
                dalle_prompt += "in a sunlit forest clearing with trees, "
                
        elif "orchestra" in music_prompt.lower():
            dalle_prompt += "a full symphony orchestra with musicians playing various instruments "
            if "concert hall" in music_prompt.lower():
                dalle_prompt += "on stage in an elegant concert hall, "
                
        else:
            # Generic fallback - still be literal
            dalle_prompt += f"a realistic scene depicting {music_prompt}, "
        
        # Force photorealistic style, prevent abstract art
        dalle_prompt += "cinematic lighting, detailed and realistic, "
        dalle_prompt += "NOT abstract art, NOT artistic interpretation, "
        dalle_prompt += "photorealistic movie scene style, album cover format, square composition"
        
        return dalle_prompt

    def _generate_new_api(self, prompt, size):
        """New OpenAI API"""
        response = self._openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=f"{size}x{size}",
            quality="hd",
            n=1,
        )
        
        image_url = response.data[0].url
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        return img_response.content

    def _generate_legacy_api(self, prompt, size):
        """Legacy OpenAI API"""
        response = self._openai.Image.create(
            prompt=prompt,
            model="dall-e-3",
            n=1,
            size=f"{size}x{size}",
            quality="hd"
        )
        
        image_url = response['data'][0]['url']
        img_response = requests.get(image_url, timeout=60)
        img_response.raise_for_status()
        return img_response.content


def test_literal_prompts():
    """Test with problematic prompts"""
    generator = ImageGenerator()
    
    problem_prompts = [
        "Dragon battle music with full orchestra in mountain fortress",
        "Tribal drums and flutes for an ancient temple exploration", 
        "Jazz saxophone performance in a smoky nightclub",
        "Classical piano concert in a grand theater hall"
    ]
    
    for prompt in problem_prompts:
        print(f"\n🎬 Testing: {prompt}")
        try:
            filename = generator.generate(prompt)
            print(f"✅ Generated literal scene: {filename}")
        except Exception as e:
            print(f"❌ Failed: {e}")


if __name__ == "__main__":
    test_literal_prompts()