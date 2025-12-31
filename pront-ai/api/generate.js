export default async function handler(req, res) {
    // Só aceita requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    // Verifica se a chave foi configurada na Vercel
    if (!GROQ_KEY) {
        return res.status(500).json({ error: 'Erro de configuração: Chave API ausente na Vercel.' });
    }

    const sysPrompt = `Você é um Engenheiro de Prompts Sênior. 
    Transforme a entrada do usuário em um prompt profissional estruturado de alto impacto. 
    Use a estrutura: [PERSONA], [CONTEXTO], [TAREFA], [RESTRIÇÕES]. 
    Responda apenas com o texto do prompt gerado, sem comentários extras.`;

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
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Erro da Groq:", data.error);
            return res.status(500).json({ error: data.error.message });
        }

        const promptGerado = data.choices[0].message.content;
        return res.status(200).json({ prompt: promptGerado });

    } catch (error) {
        console.error("Erro na função API:", error);
        return res.status(500).json({ error: "Falha ao processar requisição." });
    }
}
