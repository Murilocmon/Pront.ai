export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_KEY) return res.status(500).json({ error: 'Falta a GROQ_API_KEY na Vercel.' });

    const sysPrompt = `Você é um Engenheiro de Prompts Sênior. 
    Transforme a entrada do usuário em um prompt profissional estruturado.
    Responda APENAS com o prompt gerado.`;

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
            res.status(200).json({ prompt: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: 'Resposta inválida da Groq' });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
}
