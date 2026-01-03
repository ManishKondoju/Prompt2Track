import os
import time
import random
import requests
from datetime import datetime
from PIL import Image


class ImageGenerator:
    """
    API-only album cover generator using OpenAI's DALL·E 3.
    Features:
    - 'chaos' dial for wilder prompts (0–10).
    - Rich, surreal, high-contrast prompt building.
    """

    def __init__(self):
        print("🎨 Initializing OpenAI (DALL·E) for album covers...")
        self._init_openai_client()

    def _init_openai_client(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("❌ OPENAI_API_KEY not found in environment variables.")

        try:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=api_key)
            self._openai_mode = "client"  # new API
            print("✅ OpenAI client initialized (new API)")
        except Exception:
            import openai
            openai.api_key = api_key
            self._openai = openai
            self._openai_mode = "legacy"  # old API
            print("✅ OpenAI client initialized (legacy API)")

    def generate(self, prompt, style_hint=None, mood=None, chaos=8, size=1024):
        """
        Generate an album cover via DALL·E.
        chaos: 0..10, higher = wilder prompts
        """
        chaos = max(0, min(int(chaos), 10))
        dalle_prompt = self._create_dalle_prompt(prompt, style_hint=style_hint, mood=mood, chaos=chaos)

        print(f"🎭 Prompt → {dalle_prompt[:200]}...")
        start = time.time()

        image_bytes = None
        try:
            if getattr(self, "_openai_mode", None) == "client":
                # FIXED: Use the new API format correctly
                result = self._openai_client.images.generate(
                    model="dall-e-3",
                    prompt=dalle_prompt,
                    size=f"{size}x{size}",
                    quality="hd",
                    n=1,
                    response_format="url"  # Get URL instead of base64
                )
                
                # Download from the URL
                image_url = result.data[0].url
                print(f"🔗 Downloading from: {image_url}")
                
                response = requests.get(image_url, timeout=60)
                response.raise_for_status()
                image_bytes = response.content
                
            else:
                # Legacy API handling
                resp = self._openai.Image.create(
                    prompt=dalle_prompt,
                    model="dall-e-3",
                    n=1,
                    size=f"{size}x{size}",
                    quality="hd"
                )
                if hasattr(resp.data[0], "url") and resp.data[0].url:
                    image_url = resp.data[0].url
                    r = requests.get(image_url, timeout=60)
                    r.raise_for_status()
                    image_bytes = r.content
                else:
                    import base64
                    image_bytes = base64.b64decode(resp.data[0].b64_json)

        except requests.exceptions.RequestException as e:
            print(f"❌ Network error downloading image: {e}")
            # Try with retry mechanism
            return self._download_with_retry(image_url if 'image_url' in locals() else None, dalle_prompt, size)
            
        except Exception as e:
            raise RuntimeError(f"❌ DALL·E generation failed: {e}")

        os.makedirs("assets", exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = f"assets/cover_{ts}.png"
        with open(filename, "wb") as f:
            f.write(image_bytes)

        print(f"✅ DALL·E cover saved → {filename} ({time.time()-start:.2f}s)")
        return filename

    def _download_with_retry(self, image_url, dalle_prompt, size, max_retries=3):
        """Retry mechanism for network issues"""
        if not image_url:
            # Regenerate if no URL available
            try:
                result = self._openai_client.images.generate(
                    model="dall-e-3",
                    prompt=dalle_prompt,
                    size=f"{size}x{size}",
                    quality="hd",
                    n=1,
                    response_format="url"
                )
                image_url = result.data[0].url
            except Exception as e:
                raise RuntimeError(f"❌ Failed to regenerate image: {e}")
        
        for attempt in range(max_retries):
            try:
                print(f"🔄 Download attempt {attempt + 1}/{max_retries}")
                response = requests.get(
                    image_url, 
                    timeout=30,
                    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
                )
                response.raise_for_status()
                
                # Save the image
                os.makedirs("assets", exist_ok=True)
                ts = datetime.now().strftime("%Y%m%d-%H%M%S")
                filename = f"assets/cover_{ts}.png"
                with open(filename, "wb") as f:
                    f.write(response.content)
                
                print(f"✅ Image downloaded successfully after {attempt + 1} attempts")
                return filename
                
            except Exception as e:
                print(f"❌ Download attempt {attempt + 1} failed: {e}")
                if attempt == max_retries - 1:
                    raise RuntimeError(f"❌ Failed to download image after {max_retries} attempts: {e}")
                time.sleep(2 ** attempt)  # Exponential backoff

    def _create_dalle_prompt(self, music_prompt, style_hint=None, mood=None, chaos=8):
        detected_mood = mood or self._detect_mood(music_prompt)
        detected_genre = self._detect_genre(music_prompt)

        style_packs = [
            "surreal, cinematic, ultra-dramatic lighting, volumetric fog, lens flares, anamorphic bokeh, dream logic, glossy highlights, reflective surfaces",
            "abstract expressionism with digital glitch, neon diffraction, VHS scanlines, shattered geometry, fluorescent inks, paint splatter",
            "vaporwave retro-futurism, holographic gradients, iridescent chrome, collage cutouts, grid horizon, sunburst",
            "dark fantasy graphic novel, bold inky line art, halftone shading, electric rim light, arcane symbols, chiaroscuro",
            "maximalist bio-organic forms, fractal tendrils, liquid metal, coral-like growths, opalescent textures, hyper-detailed macro surfaces"
        ]

        palettes_by_mood = {
            "happy": ["neon magenta & electric cyan", "golden orange & hot pink"],
            "sad": ["deep indigo & midnight blue", "storm gray & teal"],
            "energetic": ["infrared red & electric blue", "acid yellow & black"],
            "calm": ["sage & powder blue", "lavender & periwinkle"],
            "romantic": ["rose quartz & lilac", "blush pink & warm gold"],
            "dark": ["onyx & ultraviolet", "oil-slick iridescence"],
            "balanced": ["copper & teal", "amber & cobalt"]
        }
        palette_choices = palettes_by_mood.get(detected_mood, palettes_by_mood["balanced"])

        comps = ["extreme low-angle hero shot", "wide-angle distortion", "long exposure motion trails", "macro shot", "Dutch tilt"]
        lights = ["volumetric god rays", "neon bounce light", "rim light with scattering", "glowing particles"]
        textures = ["glass shards", "thick paint", "velvet + steel", "smoke layers", "film grain"]
        movements = ["Salvador Dalí surrealism", "Afrofuturism", "Psychedelic poster art", "Op art"]

        n_comp = 1 + chaos // 4
        n_light = 1 + chaos // 4
        n_tex = 1 + min(2, chaos // 3)

        style_pack = random.choice(style_packs if chaos >= 5 else style_packs[:3])
        picked_comps = ", ".join(random.sample(comps, n_comp))
        picked_lights = ", ".join(random.sample(lights, n_light))
        picked_textures = ", ".join(random.sample(textures, n_tex))
        picked_palette = random.choice(palette_choices)
        picked_movement = random.choice(movements)

        subject_hint = self._extract_visual_concept(music_prompt)

        dalle_prompt = (
            f"{subject_hint}; {style_pack}; {picked_comps}; {picked_lights}; {picked_textures}; "
            f"color palette: {picked_palette}; {picked_movement}; "
            f"ultra-detailed, high contrast, kinetic composition; album cover design, square format, no text"
        )
        if style_hint:
            dalle_prompt += f"; emphasized style: {style_hint}"
        dalle_prompt += f"; subtle nod to {detected_genre} music aesthetics"

        return dalle_prompt

    def _extract_visual_concept(self, prompt):
        p = prompt.lower()
        if "ocean" in p or "waves" in p: return "surging neon ocean waves"
        if "city" in p: return "impossibly tall neon-drenched cityscape"
        if "forest" in p: return "enchanted forest with glowing flora"
        if "space" in p: return "cosmic vista with swirling galaxies"
        if "storm" in p: return "thunderstorm panorama with electric rain"
        return f"surreal scene inspired by '{prompt}'"

    def _detect_mood(self, prompt):
        p = prompt.lower()
        if any(w in p for w in ["happy", "joyful"]): return "happy"
        if any(w in p for w in ["sad", "melancholy"]): return "sad"
        if any(w in p for w in ["energetic", "powerful"]): return "energetic"
        if any(w in p for w in ["calm", "peaceful"]): return "calm"
        if any(w in p for w in ["romantic", "love"]): return "romantic"
        if any(w in p for w in ["dark", "mysterious"]): return "dark"
        return "balanced"

    def _detect_genre(self, prompt):
        p = prompt.lower()
        if "rock" in p: return "rock"
        if "electronic" in p or "edm" in p: return "electronic"
        if "jazz" in p: return "jazz"
        if "classical" in p: return "classical"
        if "hip hop" in p: return "hip-hop"
        if "indie" in p: return "indie"
        return "pop"