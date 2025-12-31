export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Apenas requisições POST são aceitas.' });
    }

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
        return res.status(500).json({ error: 'Configuração Incompleta: GROQ_API_KEY não encontrada.' });
    }

    const sysPrompt = `Você é um Engenheiro de Prompts Sênior. Sua tarefa é transformar a entrada do usuário em um prompt profissional estruturado. Responda apenas com o prompt gerado.`;

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
                    { role: "system", content: sysPrompt },
                    { role: "user", content: userInput }
                ]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            return res.status(200).json({ prompt: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: 'Falha na resposta da IA.' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno ao processar a IA.' });
    }
}
