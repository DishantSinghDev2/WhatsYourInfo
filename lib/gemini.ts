import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from './auth';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateBio(userInfo: {
  firstName: string;
  lastName: string;
  profession?: string;
  interests?: string[];
  experience?: string;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Generate a professional and engaging bio for a user profile. 
    User details:
    - Name: ${userInfo.firstName} ${userInfo.lastName}
    - Profession: ${userInfo.profession || 'Professional'}
    - Interests: ${userInfo.interests?.join(', ') || 'Various interests'}
    - Experience: ${userInfo.experience || 'Experienced professional'}
    
    Keep the bio concise (2-3 sentences), professional yet personable, and suitable for a public profile page. 
    Make it sound natural and avoid clichés.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return `${userInfo.firstName} ${userInfo.lastName} is a dedicated professional with expertise in their field. They are passionate about making meaningful connections and sharing knowledge with others.`;
  }
}

interface EnhancedProfile {
  bio: string;
  headline: string;
  skills: string[];
  tips: string[];
}




export async function enhanceProfile(profileData: User): Promise<EnhancedProfile> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this user profile and suggest improvements:
    ${JSON.stringify(profileData, null, 2)}
    
    Provide suggestions for:
    1. Better bio if current one is weak
    2. Professional headline
    3. Relevant skills to highlight
    4. Social media optimization tips
    
    Return as JSON with structure: { bio, headline, skills, tips }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    try {
      return JSON.parse(response.text());
    } catch {
      return {
        bio: profileData.bio,
        headline: `${profileData.firstName} ${profileData.lastName}`,
        skills: [],
        tips: ['Complete your profile with professional information', 'Add relevant social media links']
      };
    }
  } catch (error) {
    console.error('Profile enhancement error:', error);
  }
}