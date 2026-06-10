/**
 * Declaración de tipo mínima para @google/genai
 * Eliminar este archivo después de instalar: npm install @google/genai
 */

declare module '@google/genai' {
  export class GoogleGenAI {
    constructor(options: { apiKey: string });
    models: {
      generateContent(options: {
        model: string;
        contents: string;
      }): Promise<{ text?: string }>;
    };
  }
}
