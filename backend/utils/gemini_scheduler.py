"""
Gemini AI Integration for Film Production Scheduling
"""

import json
import os
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

class GeminiScheduler:
    """
    Integrates with Google Gemini AI for intelligent film production scheduling
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini scheduler with API key"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        
    def create_scheduling_prompt(self, scenes_data: Dict[str, Any]) -> str:
        """
        Create a comprehensive prompt for Gemini AI to generate optimal shooting schedule
        """
        scenes = scenes_data.get('shooting_schedule', {}).get('scenes', [])
        project_title = scenes_data.get('project_title', 'Film Project')
        
        # Extract key information
        locations = list(set(scene.get('location', '') for scene in scenes))
        actors = []
        for scene in scenes:
            for actor in scene.get('actors', []):
                actor_name = actor.get('name', '')
                if actor_name and actor_name not in actors:
                    actors.append(actor_name)
        
        # Build comprehensive prompt
        prompt = f"""
You are an expert film production scheduler. Create an optimal shooting schedule for "{project_title}" based on the following constraints and data:

## PROJECT DATA:
Total Scenes: {len(scenes)}
Locations: {', '.join(locations)}
Main Actors: {', '.join(actors)}

## SCENES TO SCHEDULE:
"""
        
        for scene in scenes:
            scene_actors = [actor.get('name', '') for actor in scene.get('actors', [])]
            scene_extras = scene.get('extras', [])
            
            prompt += f"""
Scene {scene.get('scene_number')}: {scene.get('scene_title', '')}
- Location: {scene.get('location', '')}
- Time of Day: {scene.get('time_of_day', '')}
- Duration: {scene.get('estimated_duration_minutes', 0)} minutes
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
    "daily_schedules": [
      {
        "day": 1,
        "date": "TBD",
        "location_focus": "Primary location for this day",
        "scenes": [
          {
            "scene_number": number,
            "scene_title": "string",
            "location": "string",
            "time_of_day": "string",
            "estimated_duration_minutes": number,
            "actors_needed": ["list of actor names"],
            "extras_needed": ["list of extra types"],
            "call_time": "08:00",
            "estimated_wrap": "calculated based on duration",
            "setup_notes": "Any special setup requirements"
          }
        ],
        "daily_summary": {
          "total_scenes": number,
          "total_duration_minutes": number,
          "primary_actors": ["main actors working this day"],
          "location_changes": number,
          "special_requirements": ["any special needs"]
        }
      }
    ],
    "actor_schedules": {
      "actor_name": {
        "total_working_days": number,
        "scenes": [list of scene numbers],
        "schedule_notes": "any conflicts or considerations"
      }
    },
    "location_schedule": {
      "location_name": {
        "days_needed": [list of day numbers],
        "total_scenes": number,
        "setup_requirements": "equipment/set dressing needs"
      }
    },
    "optimization_benefits": [
      "List of key benefits achieved by this schedule"
    ],
    "potential_risks": [
      "List of potential scheduling risks to consider"
    ]
  }
}
```

Generate the most efficient shooting schedule considering all constraints and provide detailed reasoning for your scheduling decisions.
"""
        
        return prompt
    
    def call_gemini_api(self, prompt: str) -> Dict[str, Any]:
        """
        Make API call to Gemini AI
        """
        if not self.api_key:
            return {
                "error": "Gemini API key not provided. Set GEMINI_API_KEY environment variable.",
                "mock_response": True,
                "optimized_schedule": self._generate_mock_schedule()
            }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.3,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 4096,
            }
        }
        
        try:
            url = f"{self.base_url}?key={self.api_key}"
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                content = result.get('candidates', [{}])[0].get('content', {})
                text_response = content.get('parts', [{}])[0].get('text', '')
                
                # Try to extract JSON from the response
                try:
                    # Find JSON block in the response
                    json_start = text_response.find('{')
                    json_end = text_response.rfind('}') + 1
                    
                    if json_start != -1 and json_end > json_start:
                        json_str = text_response[json_start:json_end]
                        return json.loads(json_str)
                    else:
                        return {
                            "error": "No valid JSON found in Gemini response",
                            "raw_response": text_response,
                            "optimized_schedule": self._generate_mock_schedule()
                        }
                        
                except json.JSONDecodeError:
                    return {
                        "error": "Failed to parse JSON from Gemini response",
                        "raw_response": text_response,
                        "optimized_schedule": self._generate_mock_schedule()
                    }
            else:
                return {
                    "error": f"Gemini API error: {response.status_code}",
                    "message": response.text,
                    "optimized_schedule": self._generate_mock_schedule()
                }
                
        except requests.exceptions.RequestException as e:
            return {
                "error": f"Network error calling Gemini API: {str(e)}",
                "optimized_schedule": self._generate_mock_schedule()
            }
    
    def _generate_mock_schedule(self) -> Dict[str, Any]:
        """
        Generate a mock schedule for testing when Gemini API is not available
        """
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
                            "setup_notes": "Golden hour lighting setup required"
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
                            "setup_notes": "Night lighting and atmospheric effects"
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
                            "setup_notes": "Interior lighting setup, practical radio equipment"
                        }
                    ],
                    "daily_summary": {
                        "total_scenes": 3,
                        "total_duration_minutes": 180,
                        "primary_actors": ["Maya", "Maya Chen"],
                        "location_changes": 2,
                        "special_requirements": ["Night shooting equipment", "Atmospheric effects"]
                    }
                }
            ],
            "actor_schedules": {
                "Maya": {
                    "total_working_days": 2,
                    "scenes": [3, 4, 5, 7, 8, 9],
                    "schedule_notes": "Primary character - appears in most scenes"
                },
                "Maya Chen": {
                    "total_working_days": 1,
                    "scenes": [2],
                    "schedule_notes": "Single scene appearance"
                }
            },
            "location_schedule": {
                "Radio Station Complex": {
                    "days_needed": [1],
                    "total_scenes": 3,
                    "setup_requirements": "Lighting equipment, atmospheric effects, practical radio gear"
                }
            },
            "optimization_benefits": [
                "Grouped Radio Station scenes for efficient setup",
                "Natural time progression (DUSK → NIGHT)",
                "Minimized location changes",
                "Optimized actor schedules"
            ],
            "potential_risks": [
                "Weather dependency for outdoor scenes",
                "Night shooting may require overtime pay",
                "Equipment availability for atmospheric effects"
            ]
        }
    
    def generate_schedule(self, scenes_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main method to generate optimized schedule using Gemini AI
        """
        try:
            # Create the prompt
            prompt = self.create_scheduling_prompt(scenes_data)
            
            # Call Gemini API
            result = self.call_gemini_api(prompt)
            
            # Add metadata
            result['generation_info'] = {
                'generated_at': datetime.now().isoformat(),
                'input_scenes': len(scenes_data.get('shooting_schedule', {}).get('scenes', [])),
                'ai_model': 'gemini-pro',
                'prompt_length': len(prompt)
            }
            
            return result
            
        except Exception as e:
            return {
                "error": f"Schedule generation failed: {str(e)}",
                "optimized_schedule": self._generate_mock_schedule(),
                "generation_info": {
                    'generated_at': datetime.now().isoformat(),
                    'error': str(e),
                    'fallback_used': True
                }
            }
