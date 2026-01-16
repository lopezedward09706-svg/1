
import { GoogleGenAI, Modality } from "@google/genai";
import { THE_PAPER_CONTEXT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const askTheory = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Context: ${THE_PAPER_CONTEXT}\n\nUser Question: ${prompt}`,
    config: {
      thinkingConfig: { thinkingBudget: 16000 },
      systemInstruction: "You are a world-leading theoretical physicist specializing in the R-QNT framework. Explain complex concepts clearly but with mathematical rigor where requested."
    },
  });
  return response.text;
};

export const generateTheorySpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say in a professional academic voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Simple raw PCM decoding
    const dataInt16 = new Int16Array(audioBytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = audioContext.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
    return true;
  } catch (error) {
    console.error("TTS Error:", error);
    return false;
  }
};
