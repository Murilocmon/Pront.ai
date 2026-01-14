// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema Pront.ai iniciado.");

    const elements = {
        btnGoogle: document.getElementById('btnGoogle'),
        btnLogout: document.getElementById('btnLogout'),
        btnGenerate: document.getElementById('btnGenerate'),
        promptInput: document.getElementById('promptInput'),
        outputText: document.getElementById('outputText'),
        resultBox: document.getElementById('resultBox'),
        loader: document.getElementById('loader'),
        historyList: document.getElementById('historyList'),
        planName: document.getElementById('planName'),
        usageCount: document.getElementById('usageCount'),
        usageProgress: document.getElementById('usageProgress'),
        btnOpenUpgrade: document.getElementById('btnOpenUpgrade'),
        upgradeModal: document.getElementById('upgradeModal'),
        closeModal: document.getElementById('closeModal'),
        btnNew: document.getElementById('btnNew'),
        btnCopy: document.getElementById('btnCopy')
    };

    // --- GERENCIAMENTO DE SESSÃO ---
    _supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Estado Auth:", event);
        if (session) {
            currentUser = session.user;
            document.body.classList.remove('auth-false');
            document.body.classList.add('auth-true');
            document.getElementById('uName').innerText = currentUser.user_metadata.full_name || "Usuário";
            document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url || "";
            await syncUserData();
        } else {
            document.body.classList.remove('auth-true');
            document.body.classList.add('auth-false');
        }
        lucide.createIcons();
    });

    // Login
    elements.btnGoogle?.addEventListener('click', async () => {
        await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    });

    // Logout (Independente da API)
    elements.btnLogout?.addEventListener('click', async () => {
        console.log("Botão Sair clicado.");
        await _supabase.auth.signOut();
        window.location.href = window.location.origin;
    });

    // --- BANCO DE DATOS ---
    async function syncUserData() {
        if (!currentUser) return;
        try {
            let { data, error } = await _supabase.from('users').select('*').eq('id', currentUser.id).single();
            if (error && error.code === 'PGRST116') {
                const { data: newUser } = await _supabase.from('users').insert([{ id: currentUser.id, email: currentUser.email }]).select().single();
                userData = newUser;
            } else { userData = data; }
            updateUI();
        } catch (e) { console.error("Erro DB:", e); }
    }

    function updateUI() {
        if (!userData) return;
        const isPro = userData.plan === 'Pro';
        elements.planName.innerText = userData.plan;
        if (isPro) {
            elements.usageCount.innerText = "Ilimitado";
            elements.usageProgress.style.width = "100%";
            elements.btnOpenUpgrade.classList.add('hidden');
        } else {
            elements.usageCount.innerText = `${userData.usage} / 2 usos`;
            elements.usageProgress.style.width = `${(userData.usage / 2) * 100}%`;
            elements.btnOpenUpgrade.classList.remove('hidden');
        }
        elements.historyList.innerHTML = "";
        userData.history?.slice().reverse().forEach(text => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerText = text;
            item.onclick = () => elements.promptInput.value = text;
            elements.historyList.appendChild(item);
        });
    }

    // --- GERAÇÃO (Onde estava o erro 404) ---
    elements.btnGenerate?.addEventListener('click', async () => {
        const text = elements.promptInput.value.trim();
        if (!text) return;

        if (userData?.plan === "Standart" && userData.usage >= 2) {
            elements.upgradeModal.classList.remove('hidden');
            return;
        }

        elements.loader.classList.remove('hidden');
        elements.resultBox.classList.add('hidden');
        elements.btnGenerate.disabled = true;

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userInput: text })
            });

            if (response.status === 404) throw new Error("A API não foi encontrada pela Vercel. Verifique o vercel.json.");

            const data = await response.json();
            if (data.prompt) {
                elements.outputText.innerText = data.prompt;
                elements.resultBox.classList.remove('hidden');
                // Salva no Supabase
                const newUsage = userData.usage + 1;
                const newHistory = [...(userData.history || []), text].slice(-10);
                const { data: updated } = await _supabase.from('users').update({ usage: newUsage, history: newHistory }).eq('id', currentUser.id).select().single();
                userData = updated;
                updateUI();
            }
        } catch (e) {
            alert("Erro: " + e.message);
        } finally {
            elements.loader.classList.add('hidden');
            elements.btnGenerate.disabled = false;
        }
    });

    // Interface
    elements.btnCopy?.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.outputText.innerText);
        alert("Copiado!");
    });
    elements.btnNew?.addEventListener('click', () => {
        elements.promptInput.value = "";
        elements.resultBox.classList.add('hidden');
    });
    elements.btnOpenUpgrade?.addEventListener('click', () => elements.upgradeModal.classList.remove('hidden'));
    elements.closeModal?.addEventListener('click', () => elements.upgradeModal.classList.add('hidden'));

    lucide.createIcons();
});
