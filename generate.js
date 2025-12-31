export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: 'Erro: A chave GROQ_API_KEY não foi configurada na Vercel.' });
    }

    const systemMsg = `Você é um Engenheiro de Prompts Sênior. 
    Transforme a entrada do usuário em um prompt profissional estruturado com:
    [PERSONA], [CONTEXTO], [TAREFA] e [RESTRIÇÕES]. 
    Responda apenas com o prompt final em texto puro.`;

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
                    { role: "system", content: systemMsg },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            return res.status(200).json({ prompt: data.choices[0].message.content });
        } else {
            console.error("Erro Groq:", data);
            return res.status(500).json({ error: 'Falha na comunicação com a IA.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}

