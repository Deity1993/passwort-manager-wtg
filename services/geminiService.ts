
export async function analyzeSecurity(passwordsCount: number, recentChangesCount: number) {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a brief security health check for a password manager vault. 
      Context: ${passwordsCount} stored credentials, ${recentChangesCount} changes in the last 24 hours.
      Provide a 2-sentence summary of recommendations for the user. Be professional and brief.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Security analysis failed", error);
    return "Keep your master password safe and rotate critical accounts regularly.";
  }
}

export async function checkPasswordStrength(password: string): Promise<string> {
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rate this password strength from 1-10 and explain why in one short sentence: "${password}"`,
    });
    return response.text;
  } catch (error) {
    return "Strength check currently unavailable.";
  }
}
