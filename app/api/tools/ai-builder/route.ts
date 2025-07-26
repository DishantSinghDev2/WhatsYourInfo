import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini'; // make sure it's your Google GenAI SDK instance

export async function POST(request: NextRequest) {
  try {
    const { firstName, keywords, tone, detail, humor } = await request.json();

    if (!firstName || !keywords || !tone || !detail || !humor) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `
Write a short bio (4–5 sentences) for a person named ${firstName}. 
Use a ${tone.toLowerCase()} tone, ${detail.toLowerCase()} level of detail, and ${humor === 'None' ? 'no humor' : `${humor.toLowerCase()} humor`}. 
Focus on these keywords: ${keywords}.
Avoid bullet points and keep it in paragraph format.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ bio: text });
  } catch (error) {
    console.error('AI Bio Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate bio' }, { status: 500 });
  }
}
