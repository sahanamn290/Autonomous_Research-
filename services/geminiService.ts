
import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, SYSTEM_PROMPTS } from "../constants";
import { ResearchSubTopic, StructuredReport, GroundingChunk } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const planResearch = async (topic: string): Promise<string[]> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Plan structured research for: "${topic}".`,
    config: {
      systemInstruction: SYSTEM_PROMPTS.RESEARCH_PLANNER,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [topic];
  }
};

// Add explicit return type and cast groundingChunks to GroundingChunk[] to fix downstream inference issues
export const searchGrounding = async (query: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Deep research query: "${query}"`,
    config: {
      systemInstruction: SYSTEM_PROMPTS.DEEP_RESEARCHER,
      tools: [{ googleSearch: {} }],
    }
  });

  return {
    text: response.text || "",
    sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || []
  };
};

export const synthesizeReport = async (topic: string, researchData: ResearchSubTopic[]): Promise<StructuredReport> => {
  const ai = getAIClient();
  
  // Flatten all sources for indexed citation
  const allSources = researchData.flatMap(d => d.sources);
  
  const context = researchData.map((r, i) => {
    return `[DATA BLOCK ${i}]:\nQUERY: ${r.query}\nFINDINGS: ${r.findings}`;
  }).join("\n\n");

  const sourceList = allSources.map((s, i) => `[Source ${i}]: ${s.web?.title} - ${s.web?.uri}`).join("\n");
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `TOPIC: ${topic}\n\nSOURCES:\n${sourceList}\n\nRESEARCH DATA:\n${context}`,
    config: {
      systemInstruction: SYSTEM_PROMPTS.SYNTHESIZER,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          executiveSummary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                body: { type: Type.STRING },
                keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
                citedSourceIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } }
              },
              required: ["heading", "body", "keyInsights", "citedSourceIndices"]
            }
          },
          keyDataPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.STRING }
              },
              required: ["label", "value"]
            }
          },
          technicalConfidence: { type: Type.INTEGER }
        },
        required: ["title", "executiveSummary", "sections", "keyDataPoints", "technicalConfidence"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse structured report");
  }
};
