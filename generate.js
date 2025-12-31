// Dependência: @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { userInput } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY; // Você configurará isso no painel da Vercel

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      Você é um Engenheiro de Prompts Sênior. 
      Sua missão é transformar a entrada do usuário em um prompt profissional e estruturado.
      Siga o formato:
      [PERSONA]: Defina o especialista ideal.
      [CONTEXTO]: Explique o cenário.
      [TAREFA]: Instrução detalhada.
      [RESTRIÇÕES]: O que evitar e tom de voz.
      Responda APENAS o prompt gerado.
    `;

    const result = await model.generateContent(`${systemPrompt}\n\nEntrada: ${userInput}`);
    const response = await result.response;
    
    return res.status(200).json({ text: response.text() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}