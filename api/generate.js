export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    // Log para depuração na Vercel
    console.log("Recebido input:", userInput);
    console.log("Chave configurada?", !!GROQ_KEY);

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "Você é um especialista em engenharia de prompt. Transforme a ideia do usuário em um prompt profissional estruturado em português. Responda apenas o prompt." 
                    },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro da API Groq:", data);
            return res.status(response.status).json({ 
                error: data.error?.message || "Erro na comunicação com a Groq" 
            });
        }

        return res.status(200).json({ prompt: data.choices[0].message.content });

    } catch (error) {
        console.error("Erro interno no servidor:", error);
        return res.status(500).json({ error: "Erro interno: " + error.message });
    }
}
