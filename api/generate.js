export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { userInput, plan } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    // Standart: Llama 8B | Pro: Llama 3.3 70B (Turbo)
    const modelToUse = plan === "Pro" ? "llama-3.3-70b-versatile" : "llama3-8b-8192";

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelToUse,
                messages: [
                    { role: "system", content: "Você é um Engenheiro de Prompts Sênior. Gere um prompt profissional estruturado." },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
            res.status(200).json({ prompt: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "Erro na resposta da Groq" });
        }
    } catch (error) {
        res.status(500).json({ error: "Falha na conexão com a IA" });
    }
}
