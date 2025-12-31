export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

    const { userInput } = req.body;
    const GROQ_KEY = process.env.GROQ_API_KEY;

    const sysPrompt = `Você é um Engenheiro de Prompt Sênior. 
    Transforme a entrada do usuário em um prompt profissional de alto nível usando os blocos: 
    [PERSONA], [CONTEXTO], [TAREFA], [RESTRIÇÕES]. 
    Responda apenas com o prompt gerado.`;

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
        const finalPrompt = data.choices[0].message.content;
        res.status(200).json({ prompt: finalPrompt });
    } catch (error) {
        res.status(500).json({ error: "Erro ao processar a IA" });
    }
}
