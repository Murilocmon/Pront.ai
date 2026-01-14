// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variáveis de Estado
let userData = { plan: 'Standart', usage: 0, history: [] };
let currentUser = null;

// DOM
const elements = {
    btnGoogle: document.getElementById('btnGoogle'),
    btnLogout: document.getElementById('btnLogout'),
    btnGenerate: document.getElementById('btnGenerate'),
    promptInput: document.getElementById('promptInput'),
    outputText: document.getElementById('outputText'),
    resultBox: document.getElementById('resultBox'),
    loader: document.getElementById('loader'),
    planLabel: document.getElementById('planLabel'),
    usageLabel: document.getElementById('usageLabel'),
    progressBar: document.getElementById('progressBar'),
    historyList: document.getElementById('historyList'),
    upgradeModal: document.getElementById('upgradeModal'),
    btnUpgrade: document.getElementById('btnUpgrade'),
    closeModal: document.getElementById('closeModal'),
    btnCopy: document.getElementById('btnCopy')
};

// --- AUTENTICAÇÃO ---
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        currentUser = session.user;
        document.body.classList.replace('auth-false', 'auth-true');
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url;
        await syncData();
    } else {
        document.body.classList.replace('auth-true', 'auth-false');
    }
    lucide.createIcons();
});

elements.btnGoogle.onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

elements.btnLogout.onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

// --- BANCO DE DATOS ---
async function syncData() {
    if (!currentUser) return;
    let { data, error } = await _supabase.from('users').select('*').eq('id', currentUser.id).single();

    if (error && error.code === 'PGRST116') {
        const { data: newUser } = await _supabase.from('users').insert([{ 
            id: currentUser.id, 
            email: currentUser.email,
            plan: 'Standart',
            usage: 0,
            history: []
        }]).select().single();
        userData = newUser;
    } else {
        userData = data || userData;
    }
    updateUI();
}

function updateUI() {
    const isPro = userData.plan === 'Pro';
    elements.planLabel.innerText = userData.plan.toUpperCase();
    
    if (isPro) {
        elements.usageLabel.innerText = "ILIMITADO";
        elements.progressBar.style.width = "100%";
        elements.progressBar.style.background = "var(--pro-color)";
        elements.btnUpgrade.classList.add('hidden');
    } else {
        elements.usageLabel.innerText = `${userData.usage}/2`;
        elements.progressBar.style.width = `${(userData.usage / 2) * 100}%`;
    }

    elements.historyList.innerHTML = userData.history.slice(-5).reverse().map(h => `
        <div class="history-item" onclick="document.getElementById('promptInput').value='${h}'">
            ${h.substring(0, 30)}...
        </div>
    `).join('');
}

// --- GERAÇÃO IA ---
elements.btnGenerate.onclick = async () => {
    const text = elements.promptInput.value.trim();
    if (!text || elements.btnGenerate.disabled) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
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
        const data = await response.json();

        if (data.prompt) {
            elements.outputText.innerText = data.prompt;
            elements.resultBox.classList.remove('hidden');

            const newUsage = userData.usage + 1;
            const newHistory = [...userData.history, text].slice(-10);

            const { data: updated } = await _supabase.from('users')
                .update({ usage: newUsage, history: newHistory })
                .eq('id', currentUser.id).select().single();

            userData = updated;
            updateUI();
            elements.resultBox.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (e) {
        alert("Erro na conexão com o servidor.");
    } finally {
        elements.loader.classList.add('hidden');
        elements.btnGenerate.disabled = false;
    }
};

// Eventos de Interface
elements.btnUpgrade.onclick = () => elements.upgradeModal.classList.remove('hidden');
elements.closeModal.onclick = () => elements.upgradeModal.classList.add('hidden');
elements.btnCopy.onclick = () => {
    navigator.clipboard.writeText(elements.outputText.innerText);
    alert("Copiado para a área de transferência!");
};

lucide.createIcons();
