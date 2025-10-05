
"""
Gemini AI Integration for Film Production Scheduling (Google Generative AI SDK version)
"""

import json
import os
import time
from typing import Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()


class GeminiScheduler:
    """
    Integrates with Google Gemini AI for intelligent film production scheduling
    """

    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini scheduler with API key"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

        if not self.api_key:
            print("Warning: No GEMINI_API_KEY found in environment. Using mock responses.")
        else:
            genai.configure(api_key=self.api_key)

        # Rate limit control — 4 seconds between each API call
        self.last_call_time = 0

    def _respect_rate_limit(self):
        """Ensure at least 4 seconds gap between calls"""
        elapsed = time.time() - self.last_call_time
        if elapsed < 4:
            time.sleep(4 - elapsed)
        self.last_call_time = time.time()

    def create_scheduling_prompt(self, scenes_data: Dict[str, Any]) -> str:
        """Create a comprehensive prompt for Gemini AI to generate optimal shooting schedule"""
        scenes = scenes_data.get("shooting_schedule", {}).get("scenes", [])
        project_title = scenes_data.get("project_title", "Film Project")

        locations = list(set(scene.get("location", "") for scene in scenes))
        actors = []
        for scene in scenes:
            for actor in scene.get("actors", []):
                actor_name = actor.get("name", "")
                if actor_name and actor_name not in actors:
                    actors.append(actor_name)

        prompt = f"""
You are an expert film production scheduler. Create an optimal shooting schedule for "{project_title}" based on the following constraints and data:

## PROJECT DATA:
Total Scenes: {len(scenes)}
Locations: {', '.join(locations)}
Main Actors: {', '.join(actors)}

## SCENES TO SCHEDULE:
"""
        for scene in scenes:
            scene_actors = [actor.get("name", "") for actor in scene.get("actors", [])]
            scene_extras = scene.get("extras", [])
            prompt += f"""
Scene {scene.get("scene_number")}: {scene.get("scene_title", "")}
- Location: {scene.get("location", "")}
- Time of Day: {scene.get("time_of_day", "")}
- Duration: {scene.get("estimated_duration_minutes", 0)} minutes
- Actors: {', '.join(scene_actors) if scene_actors else 'None'}
- Extras: {', '.join(scene_extras) if scene_extras else 'None'}
"""

        prompt += """

## SCHEDULING CONSTRAINTS:
1. **Location Efficiency**: Group scenes by location to minimize setup/teardown time and costs
2. **Actor Availability**: Consider actor scheduling conflicts and minimize their total working days
3. **Time of Day Logic**: Schedule DAY scenes first, then DUSK, then NIGHT within each location
4. **Equipment Sharing**: Consider shared equipment needs between similar scenes
5. **Weather Dependencies**: Outdoor scenes should be grouped and have backup indoor options
6. **Crew Efficiency**: Minimize crew overtime by balancing daily workloads

## ADDITIONAL CONSIDERATIONS:
- Radio Station scenes (Control Room, Parking Area, Abandoned) should be scheduled together
- Maya appears in multiple scenes - optimize her schedule to minimize her working days
- Government facility scenes may require special permissions/security clearance
- Desert highway scenes are weather-dependent

## REQUIRED OUTPUT FORMAT:
Please provide a JSON response with the following structure:

```json
{
  "optimized_schedule": {
    "scheduling_strategy": "Brief explanation of the optimization strategy used",
    "total_shooting_days": number,
    "daily_schedules": [...],
    "actor_schedules": {...},
    "location_schedule": {...},
    "optimization_benefits": [...],
    "potential_risks": [...]
  }
}
```
Generate the most efficient shooting schedule considering all constraints and provide detailed reasoning for your scheduling decisions.
"""
        return prompt

    def call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """Make API call to Google Generative AI (Gemini)"""
        if not self.api_key:
            return {
                "error": "Gemini API key not provided. Set GEMINI_API_KEY environment variable.",
                "mock_response": True,
                "optimized_schedule": self._generate_mock_schedule(),
            }

        self._respect_rate_limit()

        try:
            model = genai.GenerativeModel("gemini-2.5-flash-lite")

            response = model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "top_k": 40,
                    "top_p": 0.95,
                    "max_output_tokens": 4096,
                },
            )

            if not response.text:
                return {
                    "error": "Empty response from Gemini API",
                    "optimized_schedule": self._generate_mock_schedule(),
                }

            text_response = response.text

            try:
                json_start = text_response.find("{")
                json_end = text_response.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    json_str = text_response[json_start:json_end]
                    return json.loads(json_str)
                else:
                    return {
                        "error": "No valid JSON found in Gemini response",
                        "raw_response": text_response,
                        "optimized_schedule": self._generate_mock_schedule(),
                    }

            except json.JSONDecodeError:
                return {
                    "error": "Failed to parse JSON from Gemini response",
                    "raw_response": text_response,
                    "optimized_schedule": self._generate_mock_schedule(),
                }

        except Exception as e:
            return {
                "error": f"Error calling Gemini API: {str(e)}",
                "optimized_schedule": self._generate_mock_schedule(),
            }

    def _generate_mock_schedule(self) -> Dict[str, Any]:
        """Generate a mock schedule for testing when Gemini API is not available"""
        return {
            "scheduling_strategy": "Mock AI-optimized schedule - Location clustering with time-of-day optimization",
            "total_shooting_days": 3,
            "daily_schedules": [
                {
                    "day": 1,
                    "date": "TBD",
                    "location_focus": "Radio Station Complex",
                    "scenes": [
                        {
                            "scene_number": 9,
                            "scene_title": "EXT. RADIO STATION - PARKING AREA - DUSK",
                            "location": "Radio Station Parking Area",
                            "time_of_day": "DUSK",
                            "estimated_duration_minutes": 60,
                            "actors_needed": ["Maya"],
                            "extras_needed": [],
                            "call_time": "17:00",
                            "estimated_wrap": "18:00",
                            "setup_notes": "Golden hour lighting setup required",
                        },
                        {
                            "scene_number": 1,
                            "scene_title": "EXT. ABANDONED RADIO STATION - NIGHT",
                            "location": "Abandoned Radio Station",
                            "time_of_day": "NIGHT",
                            "estimated_duration_minutes": 60,
                            "actors_needed": [],
                            "extras_needed": [],
                            "call_time": "19:00",
                            "estimated_wrap": "20:00",
                            "setup_notes": "Night lighting and atmospheric effects",
                        },
                        {
                            "scene_number": 2,
                            "scene_title": "INT. RADIO STATION - CONTROL ROOM - NIGHT",
                            "location": "Radio Station Control Room",
                            "time_of_day": "NIGHT",
                            "estimated_duration_minutes": 60,
                            "actors_needed": ["Maya Chen"],
                            "extras_needed": [],
                            "call_time": "20:30",
                            "estimated_wrap": "21:30",
                            "setup_notes": "Interior lighting setup, practical radio equipment",
                        },
                    ],
                    "daily_summary": {
                        "total_scenes": 3,
                        "total_duration_minutes": 180,
                        "primary_actors": ["Maya", "Maya Chen"],
                        "location_changes": 2,
                        "special_requirements": ["Night shooting equipment", "Atmospheric effects"],
                    },
                }
            ],
            "actor_schedules": {
                "Maya": {
                    "total_working_days": 2,
                    "scenes": [3, 4, 5, 7, 8, 9],
                    "schedule_notes": "Primary character - appears in most scenes",
                },
                "Maya Chen": {
                    "total_working_days": 1,
                    "scenes": [2],
                    "schedule_notes": "Single scene appearance",
                },
            },
            "location_schedule": {
                "Radio Station Complex": {
                    "days_needed": [1],
                    "total_scenes": 3,
                    "setup_requirements": "Lighting equipment, atmospheric effects, practical radio gear",
                }
            },
            "optimization_benefits": [
                "Grouped Radio Station scenes for efficient setup",
                "Natural time progression (DUSK → NIGHT)",
                "Minimized location changes",
                "Optimized actor schedules",
            ],
            "potential_risks": [
                "Weather dependency for outdoor scenes",
                "Night shooting may require overtime pay",
                "Equipment availability for atmospheric effects",
            ],
        }

    def generate_schedule(self, scenes_data: Dict[str, Any]) -> Dict[str, Any]:
        """Main method to generate optimized schedule using Gemini AI"""
        try:
            prompt = self.create_scheduling_prompt(scenes_data)
            result = self.call_gemini_api(prompt)
            result["generation_info"] = {
                "generated_at": datetime.now().isoformat(),
                "input_scenes": len(scenes_data.get("shooting_schedule", {}).get("scenes", [])),
                "ai_model": "gemini-pro (via google-generativeai SDK)",
                "prompt_length": len(prompt),
            }
            return result

        except Exception as e:
            return {
                "error": f"Schedule generation failed: {str(e)}",
                "optimized_schedule": self._generate_mock_schedule(),
                "generation_info": {
                    "generated_at": datetime.now().isoformat(),
                    "error": str(e),
                    "fallback_used": True,
                },
            }
