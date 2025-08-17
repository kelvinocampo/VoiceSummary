import * as FileSystem from "expo-file-system";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const transcribeAudio = async (uri: string, apiKey: string) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Leer el archivo con expo-file-system
    const base64Audio = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "audio/m4a",
                data: base64Audio,
              },
            },
            {
              text: "Transcribe this audio into Spanish text.",
            },
          ],
        },
      ],
    });

    return result.response.text();
  } catch (error) {
    console.error("Error transcribiendo con Gemini:", error);
    throw error;
  }
};
