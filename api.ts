import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Recognizes the content of an image using Gemini.
 * @param base64ImageData The base64 encoded image data.
 * @returns A string describing the image content.
 */
export async function recognizeImage(base64ImageData: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: "What is this a simple drawing of? Be concise, one or two words." },
                    { inlineData: { mimeType: 'image/png', data: base64ImageData } }
                ]
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("API returned no text for image recognition.");
        }
        return text.trim();
    } catch (error) {
        console.error("Error in recognizeImage:", error);
        throw new Error("Failed to recognize the drawing. The AI might be busy. Please try again.");
    }
}

/**
 * Generates a coloring book page from a text prompt.
 * @param promptText The text prompt to generate the image from.
 * @returns A base64 encoded string of the generated PNG image data URL.
 */
export async function generateColoringPage(promptText: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const fullPrompt = `A simple, bold, black and white coloring book page for a 5-year-old of a ${promptText} with no text on it.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: fullPrompt }] },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            return imageUrl;
          }
        }
        throw new Error("API returned no image data for coloring page.");

    } catch (error) {
        console.error("Error in generateColoringPage:", error);
        throw new Error("Failed to generate the coloring page. The AI might be busy. Please try again.");
    }
}

/**
 * Generates a short, kid-friendly story from a text prompt and theme.
 * @param promptText The text prompt to generate the story from.
 * @param theme The selected theme for the story.
 * @returns A string containing the story.
 */
export async function generateStory(promptText: string, theme: string | null): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const themeInstruction = theme ? ` The story must have a ${theme} theme.` : '';
        const fullPrompt = `Write a short, fun, and realistic story for a 5-year-old child about a ${promptText}.${themeInstruction} The story must be 3 to 4 sentences and must end with a safety warning or advise.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        const story = response.text;
        if (!story) {
            throw new Error("API returned no text for the story.");
        }
        return story.trim();
    } catch (error) {
        console.error("Error in generateStory:", error);
        throw new Error("Failed to generate the story. The AI might be busy. Please try again.");
    }
}

/**
 * Generates speech from text.
 * @param text The text to convert to speech.
 * @returns A base64 encoded string of the audio data.
 */
export async function generateSpeech(text: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read this story in a gentle, friendly voice: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error("API returned no audio data for the speech.");
        }
        return audioData;
    } catch (error) {
        console.error("Error in generateSpeech:", error);
        throw new Error("Failed to generate speech. The AI might be busy. Please try again.");
    }
}

/**
 * Generates a colorful story illustration from a text prompt and theme.
 * @param promptText The text prompt to generate the image from.
 * @param theme The selected theme for the illustration.
 * @returns A base64 encoded string of the generated PNG image data URL.
 */
export async function generateStoryImage(promptText: string, theme: string | null): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const themeInstruction = theme ? ` The illustration must have a ${theme} theme.` : '';
        const fullPrompt = `A vibrant, colorful, and cheerful illustration for a children's story about: '${promptText}'.${themeInstruction} The style should be whimsical and friendly, like a page from a modern digital storybook, full of bright colors and soft details and no text on it.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: fullPrompt }] },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            return imageUrl;
          }
        }
        throw new Error("API returned no image data for the story illustration.");

    } catch (error) {
        console.error("Error in generateStoryImage:", error);
        throw new Error("Failed to generate the story illustration. The AI might be busy. Please try again.");
    }
}