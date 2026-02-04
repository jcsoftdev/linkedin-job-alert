import OpenAI from 'openai';
import type { JobAnalyzer, JobAnalysisResult } from '../domain/JobAnalyzer';

export class OpenAIJobAnalyzer implements JobAnalyzer {
  private readonly openai: OpenAI;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1') {
    const url = baseURL;
    console.log(`Initializing OpenAI with BaseURL: ${url}`);
    this.openai = new OpenAI({ 
      apiKey,
      baseURL: url,
      defaultHeaders: {
        "HTTP-Referer": "https://linkedin-alert-job.local",
        "X-Title": "LinkedIn Alert Job",
      }
    });
  }

  private static readonly SYSTEM_INSTRUCTION = `
    You are a job posting analyzer.
    Analyze the LinkedIn post text provided by the user and determine if it is a JOB OFFER or JOB OPPORTUNITY.
    If it is, extract the following details:
    - Job Title
    - Company Name
    - Location
    - Summary Description: A concise 1-2 sentence summary of the role's responsibilities or main goal, tailored for a developer's interest.
    - Tech Stack: A complete list of technologies, languages, and frameworks mentioned.
    - Main Stack: The primary or most important technology/language from the stack (e.g., "React", "Python", "Go").
    
    Return ONLY a JSON object with this format:
    {
      "isJobOffer": boolean,
      "title": "string or null",
      "company": "string or null",
      "location": "string or null",
      "description": "string or null",
      "techStack": ["string"],
      "mainStack": "string or null"
    }

    Important: 
    - If you are not sure about a field, use null or an empty array for techStack. 
    - Extract the actual Company Name if mentioned in the text.
    - Do not invent information.
    - Your response must be a valid JSON object. Do not include any explanation or markdown formatting.
  `;

  async analyze(content: string): Promise<JobAnalysisResult> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: "system", content: OpenAIJobAnalyzer.SYSTEM_INSTRUCTION },
          { role: "user", content: `Text:\n"${content}"` }
        ],
        model: "openai/gpt-oss-120b",
      });

      let responseContent = completion.choices[0].message.content || '{}';
      
      // Clean up markdown if present
      if (responseContent.includes('```json')) {
        responseContent = responseContent.split('```json')[1].split('```')[0].trim();
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.split('```')[1].split('```')[0].trim();
      }

      const result = JSON.parse(responseContent);
      return {
        isJobOffer: result.isJobOffer || false,
        title: result.title || undefined,
        company: result.company || undefined,
        location: result.location || undefined,
        description: result.description || undefined,
        techStack: result.techStack || [],
        mainStack: result.mainStack || undefined,
      };
    } catch (error) {
      console.error('AI Analysis failed:', error);
      // Fallback: assume not a job offer if AI fails
      return { isJobOffer: false };
    }
  }
}
