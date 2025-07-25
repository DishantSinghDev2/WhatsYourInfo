import { NextRequest, NextResponse } from 'next/server';
// This assumes you have a configured GenAI client
import { genAI } from '@/lib/gemini'; 

export async function POST(request: NextRequest) {
  try {
    const { firstName, keywords, tone } = await request.json();
    const prompt = `Write a professional bio for a person named ${firstName}. The bio should be in a ${tone} tone and focus on the following keywords: ${keywords}. The bio should be around 4-5 sentences long.`;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ bio: text });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
  }
}