
import { SportType, User } from '../types';
import { supabase } from './supabase';

// SECURITY: Gemini API is now called via Edge Function (supabase/functions/gemini-proxy)
// This prevents API key exposure in client-side bundle
const GEMINI_EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;

// Helper function to call Gemini via Edge Function
async function callGeminiAPI(prompt: string, config?: any): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(GEMINI_EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        prompt,
        config: config || {},
        userId: session?.user?.id || 'anonymous',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Gemini API call failed');
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('Gemini Edge Function Error:', error);
    throw error;
  }
}

export const generateIcebreaker = async (fromUser: User, toUser: User, vibe?: string): Promise<string> => {
  try {
    // Calculate shared interests
    const sharedInterests = fromUser.interests.filter(i => toUser.interests.includes(i));
    const interestFocus = sharedInterests.length > 0 ? sharedInterests.join(', ') : toUser.interests[0];

    const prompt = `Generate a ${vibe || 'witty'} dating app icebreaker message.
    
    Sender Profile:
    - Name: ${fromUser.name}
    - Interests: ${fromUser.interests.join(', ')}
    - Bio: ${fromUser.bio}
    
    Recipient Profile:
    - Name: ${toUser.name}
    - Interests: ${toUser.interests.join(', ')}
    - Bio: ${toUser.bio}
    
    Context:
    - Shared Interests: ${sharedInterests.length > 0 ? sharedInterests.join(', ') : 'None direct'}
    
    Guidelines:
    - Tone: ${vibe || 'Casual but confident'}.
    - Keep it under 25 words.
    - Mention a shared sport or specific detail from the recipient's bio.
    - Do NOT use hashtags.
    - If it's a "Super Like", make it slightly more enthusiastic.`;

    const text = await callGeminiAPI(prompt);
    return text.trim() || `Hey ${toUser.name}, saw you're into ${interestFocus}. Want to connect?`;
  } catch (error) {
    console.error("Gemini Icebreaker Error:", error);
    return `Hey ${toUser.name}, looks like we both enjoy sports!`;
  }
};

export const enhanceBio = async (currentBio: string, interests: SportType[]): Promise<string> => {
  try {
    const prompt = `Rewrite the following dating app bio to make it more appealing, energetic, and professional. 
    The user loves: ${interests.join(', ')}.
    Current Bio: "${currentBio}"
    Keep it under 40 words. No hashtags.`;

    const text = await callGeminiAPI(prompt);
    return text.trim() || currentBio;
  } catch (error) {
    console.error("Gemini Bio Enhance Error:", error);
    return currentBio;
  }
};

export const enhanceTrainerBio = async (currentBio: string, specialties: string[]): Promise<string> => {
  try {
    const prompt = `Rewrite this professional personal trainer's biography to be more motivating, authoritative, and client-focused.
    
    Specialties to highlight: ${specialties.join(', ')}.
    Current Bio: "${currentBio}"
    
    Requirements:
    - Make it sound high-energy and expert.
    - Focus on results and helping the client.
    - Keep it under 50 words.
    - No hashtags.`;

    const text = await callGeminiAPI(prompt);
    return text.trim() || currentBio;
  } catch (error) {
    console.error("Gemini Trainer Bio Enhance Error:", error);
    return currentBio;
  }
};

export const checkSafety = async (message: string): Promise<boolean> => {
  try {
    const prompt = `Is the following message safe and appropriate for a dating app? 
    Respond with strictly "SAFE" or "UNSAFE".
    Message: "${message}"`;

    const text = await callGeminiAPI(prompt);
    return text.trim().toUpperCase().includes("SAFE");
  } catch (error) {
    console.error("Gemini Safety Check Error:", error);
    return true; // Fail open to avoid blocking legitimate messages
  }
};

export const analyzeProfile = async (userProfile: any): Promise<{ persona: string, summary: string }> => {
  try {
    const prompt = `Analyze this user profile for a sports dating app. 
    User Data: ${JSON.stringify(userProfile)}.
    
    Create a cool "Sport Persona" title (max 3 words) and a 1-sentence summary of their vibe.
    Return ONLY JSON with format: {"persona": "...", "summary": "..."}`;

    const config = {
      responseMimeType: "application/json"
    };

    const text = await callGeminiAPI(prompt, config);
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error", error);
    return {
      persona: "The Mystery Athlete",
      summary: "A versatile athlete ready for anything."
    };
  }
};

export const calculateCompatibility = async (currentUser: User, matchProfile: User): Promise<{ matchPercentage: number, matchReason: string, keyFactors: string[] }> => {
  try {
    const prompt = `Analyze the compatibility between these two users for a sports dating app.
    
    User 1 (Me):
    - Interests: ${currentUser.interests.join(', ')}
    - Level: ${currentUser.level}
    - Location: ${currentUser.location}
    - Bio: "${currentUser.bio}"
    - Workout Time: ${currentUser.workoutTimePreference || 'Any'}

    User 2 (Potential Match):
    - Interests: ${matchProfile.interests.join(', ')}
    - Level: ${matchProfile.level}
    - Location: ${matchProfile.location}
    - Distance: ${matchProfile.distance || 'Unknown'}
    - Bio: "${matchProfile.bio}"
    - Workout Time: ${matchProfile.workoutTimePreference || 'Any'}

    Determine a Match Percentage (0-100) based on:
    1. Shared sports interests (Highest Weight).
    2. Skill level compatibility (Similar levels are good).
    3. Location/Proximity.
    4. Vibe check from Bio.
    5. Workout time preference overlap.

    Provide:
    1. matchPercentage (integer)
    2. matchReason (string) - A detailed 2-3 sentence explanation of why these two users would get along, highlighting commonalities.
    3. keyFactors (array of strings, max 3) - Short, punchy reasons for the match (e.g., "Morning Runners", "Tennis Doubles", "Nearby").

    Return JSON only with format: {"matchPercentage": 0, "matchReason": "...", "keyFactors": ["..."]}`;

    const config = {
      responseMimeType: "application/json"
    };

    const text = await callGeminiAPI(prompt, config);
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Compatibility Error", error);
    return {
      matchPercentage: 70,
      matchReason: "Potential sports connection based on profile data.",
      keyFactors: ["Shared Interests", "Good Vibe"]
    };
  }
};

export const generateSharedWorkoutPlan = async (user1: User, user2: Partial<User>, sport?: string): Promise<string> => {
    // Prioritize shared interests or manual selection
    const commonInterests = user1.interests.filter(i => user2.interests?.includes(i));
    const focusSport = sport || (commonInterests.length > 0 ? commonInterests[0] : (user2.interests?.[0] || user1.interests[0] || 'General Fitness'));
  
    try {
      const prompt = `Create a fun, 1-hour collaborative workout plan for two people focusing on **${focusSport}**.
      
      User 1 (Me): Level ${user1.level}, Interests: ${user1.interests.join(', ')}.
      User 2 (Partner): Level ${user2.level || 'Intermediate'}, Interests: ${user2.interests?.join(', ') || 'Fitness'}.
      
      The plan must be interactive and designed for two people to do together.
      
      Output Format (Markdown):
      **TITLE: [Fun Title related to ${focusSport}]**
      
      🔥 **Warm-up (10m)**
      [3 bullets]
      
      ⚔️ **The Workout (40m)**
      [3 bullets - include specific partner drills or challenges]
      
      🧊 **Cool-down (10m)**
      [2 bullets]
      
      Keep it motivating!`;
  
      const text = await callGeminiAPI(prompt);
      return text.trim() || `Let's do a ${focusSport} session together!`;
    } catch (error) {
      console.error("Gemini Workout Plan Error:", error);
      return `
    💪 **${focusSport} Buddy Session**
    
    🔥 **Warm-up (10 mins)**
    • Dynamic stretching (Arm circles, leg swings)
    • Light jog or skipping to get sync'd
    
    ⚔️ **Main Activity (40 mins)**
    • ${focusSport} Drills: Focus on technique
    • Friendly Match: First to 10 points
    • Collaborative Challenge: Keep the rally going
    
    🧊 **Cool-down (10 mins)**
    • Static stretching & walk
    • Hydration & recap
    `;
    }
};

export const generateStructuredWorkout = async (user1: User, user2: Partial<User>, sport?: string): Promise<any> => {
    // Prioritize shared interests or manual selection
    const commonInterests = user1.interests.filter(i => user2.interests?.includes(i));
    const focusSport = sport || (commonInterests.length > 0 ? commonInterests[0] : (user2.interests?.[0] || user1.interests[0] || 'General Fitness'));
  
    try {
      const prompt = `Create a structured workout plan for two people focusing on **${focusSport}**.
      
      User 1: Level ${user1.level}, Interests: ${user1.interests.join(', ')}.
      User 2: Level ${user2.level || 'Intermediate'}, Interests: ${user2.interests?.join(', ') || 'Fitness'}.
      
      Return ONLY a valid JSON object (no markdown, no explanations) in this exact format:
      {
        "title": "Fun workout title",
        "focus": "${focusSport}",
        "difficulty": "Beginner" or "Intermediate" or "Advanced",
        "duration": "45-60 mins",
        "exercises": [
          {
            "name": "Exercise name",
            "sets": 3,
            "reps": "12-15",
            "rest": "60s"
          }
        ]
      }
      
      Include 5-8 exercises appropriate for two people training together.`;
  
      const text = await callGeminiAPI(prompt);
      
      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Failed to parse workout JSON:", parseError);
      }
      
      // Fallback structured workout
      return {
        title: `${focusSport} Partner Workout`,
        focus: focusSport,
        difficulty: user1.level === 'Beginner' ? 'Beginner' : user1.level === 'Pro' ? 'Advanced' : 'Intermediate',
        duration: '45-60 mins',
        exercises: [
          { name: 'Warm-up: Dynamic stretches', sets: 1, reps: '5 mins', rest: '0s' },
          { name: `${focusSport} Technique drills`, sets: 3, reps: '10-12', rest: '60s' },
          { name: 'Partner challenge', sets: 3, reps: '15', rest: '90s' },
          { name: 'Cardio interval', sets: 4, reps: '30s', rest: '30s' },
          { name: 'Cool-down: Static stretches', sets: 1, reps: '5 mins', rest: '0s' }
        ]
      };
    } catch (error) {
      console.error("Gemini Structured Workout Error:", error);
      return {
        title: `${focusSport} Partner Workout`,
        focus: focusSport,
        difficulty: 'Intermediate',
        duration: '45-60 mins',
        exercises: [
          { name: 'Warm-up', sets: 1, reps: '5 mins', rest: '0s' },
          { name: `${focusSport} drills`, sets: 3, reps: '12', rest: '60s' },
          { name: 'Partner exercise', sets: 3, reps: '15', rest: '90s' },
          { name: 'Cool-down', sets: 1, reps: '5 mins', rest: '0s' }
        ]
      };
    }
};

export const chatWithAICoach = async (userProfile: User, message: string, history: {role: 'user' | 'model', parts: [{text: string}]}[]): Promise<string> => {
    try {
        const systemInstruction = `You are SportPulse AI, an elite Personal Trainer, Nutritionist, and Sports Coach.
        
        Your Client (User):
        - Name: ${userProfile.name}
        - Age: ${userProfile.age}
        - Level: ${userProfile.level}
        - Interests: ${userProfile.interests.join(', ')}
        - Bio: ${userProfile.bio}
        
        Your Capabilities:
        1. Create specific workout plans (Sets, Reps, Rest).
        2. Provide nutrition advice and meal plans based on their goals.
        3. Give sports-specific technique tips.
        4. Motivate the user with high energy.
        
        Tone: Energetic, Professional, Encouraging, and Direct.
        Formatting: Use Markdown (bolding, lists) to make plans readable.
        
        If the user asks for a program, break it down clearly.
        Keep responses concise but high value. Avoid generic advice.`;

        const prompt = `${systemInstruction}\n\nConversation History:\n${JSON.stringify(history)}\n\nUser Message: ${message}`;
        
        const text = await callGeminiAPI(prompt);
        return text || "I'm ready to train! What's next?";
    } catch (error) {
        console.error("Gemini PT Error:", error);
        return "I'm having trouble connecting to the server. Let's try that again in a moment.";
    }
};

export const analyzeImage = async (imageBase64: string, userPrompt: string): Promise<string> => {
    try {
        // Remove header if present (e.g., data:image/jpeg;base64,)
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

        const prompt = `You are an expert fitness and nutrition coach. Analyze this image. 
        User Question: "${userPrompt}".
        
        If it's food: Estimate calories and protein.
        If it's equipment: Explain how to use it briefly.
        If it's irrelevant: Make a gym-related joke about it.
        
        Keep response under 60 words.
        
        Image Data (base64): ${cleanBase64.substring(0, 100)}...`;

        const text = await callGeminiAPI(prompt);
        return text.trim() || "I couldn't analyze that image properly.";
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        return "Error analyzing image. Please try again.";
    }
};
