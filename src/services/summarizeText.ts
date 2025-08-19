import { GoogleGenerativeAI } from "@google/generative-ai";

export const summarizeText = async (text: string, apiKey: string) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Transcripción del audio:
${text}

Tu tarea:
1. Genera un resumen conciso en español.
2. Extrae entre 3 y 5 puntos clave importantes.
3. Devuelve el resultado en el siguiente formato:

Resumen:
[tu resumen aquí]

Puntos clave:
- punto 1
- punto 2
- punto 3
`;

    const result = await model.generateContent(prompt);
    const output = result.response.text();

    const [summaryPart, pointsPart] = output.split("Puntos clave:");
    const summary = summaryPart?.replace("Resumen:", "").trim();
    const keyPoints = pointsPart
      ? pointsPart.split("\n").map((p) => p.replace("-", "").trim()).filter(Boolean)
      : [];

    return { summary, keyPoints };
  } catch (err) {
    console.error("Error resumiendo con Gemini:", err);
    return { summary: "", keyPoints: [] };
  }
};
