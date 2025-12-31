export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: 'Configuração Incompleta: GROQ_API_KEY não encontrada na Vercel.' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // MODELO ATUALIZADO PARA LLAMA 3.3
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "Você é um Engenheiro de Prompts Sênior. Sua tarefa é transformar a entrada do usuário em um prompt profissional estruturado em blocos: [PERSONA], [CONTEXTO], [TAREFA], [RESTRIÇÕES]. Responda apenas com o prompt gerado em português." 
                    },
                    { role: "user", content: userInput }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || "Erro na Groq" });
        }

        return res.status(200).json({ prompt: data.choices[0].message.content });

    } catch (error) {
        return res.status(500).json({ error: "Erro interno: " + error.message });
    }
}
