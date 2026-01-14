// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userData = { plan: 'Standart', usage: 0, history: [] };
let currentUser = null;

// ELEMENTOS DOM
const dom = {
    btnGenerate: document.getElementById('btnGenerate'),
    btnLogout: document.getElementById('btnLogout'),
    btnGoogle: document.getElementById('btnGoogle'),
    promptInput: document.getElementById('promptInput'),
    outputText: document.getElementById('outputText'),
    resultBox: document.getElementById('resultBox'),
    loader: document.getElementById('loader'),
    planLabel: document.getElementById('planLabel'),
    usageLabel: document.getElementById('usageLabel'),
    progressBar: document.getElementById('progressBar'),
    historyList: document.getElementById('historyList'),
    upgradeModal: document.getElementById('upgradeModal'),
    aiBadge: document.getElementById('aiBadge') // Adicionado para trocar o texto do modelo
};

_supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        currentUser = session.user;
        document.body.className = 'auth-true';
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url;
        await syncData();
    } else {
        document.body.className = 'auth-false';
    }
    lucide.createIcons();
});

async function syncData() {
    if (!currentUser) return;
    let { data, error } = await _supabase.from('users').select('*').eq('id', currentUser.id).single();

    if (error && error.code === 'PGRST116') {
        const { data: newUser } = await _supabase.from('users').insert([{ id: currentUser.id, email: currentUser.email }]).select().single();
        userData = newUser;
    } else if (data) {
        userData = data;
    }
    updateUI();
}

function updateUI() {
    const isPro = userData.plan === 'Pro';
    dom.planLabel.innerText = userData.plan.toUpperCase();
    
    // Atualiza o Badge do Modelo na tela
    dom.aiBadge.innerText = isPro ? "MODELO: LLAMA 3.3 TURBO" : "MODELO: LLAMA BÁSICO";

    if (isPro) {
        dom.usageLabel.innerText = "ILIMITADO";
        dom.progressBar.style.width = "100%";
        document.getElementById('btnUpgrade').classList.add('hidden');
    } else {
        dom.usageLabel.innerText = `${userData.usage}/2`;
        dom.progressBar.style.width = `${(userData.usage / 2) * 100}%`;
        document.getElementById('btnUpgrade').classList.remove('hidden');
    }

    dom.historyList.innerHTML = userData.history.slice(-5).reverse().map(h => `
        <div class="history-item" onclick="document.getElementById('promptInput').value='${h}'">${h.substring(0, 30)}...</div>
    `).join('');
}

dom.btnGenerate.onclick = async () => {
    const input = dom.promptInput.value.trim();
    if (!input || dom.btnGenerate.disabled) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
        dom.upgradeModal.classList.remove('hidden');
        return;
    }

    // Inicia carregamento
    dom.loader.classList.remove('hidden');
    dom.resultBox.classList.add('hidden');
    dom.btnGenerate.disabled = true;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userInput: input,
                plan: userData.plan // Envia o plano para a API decidir o modelo
            })
        });
        
        const data = await res.json();

        if (data.prompt) {
            dom.outputText.innerText = data.prompt;
            dom.resultBox.classList.remove('hidden');

            // ATUALIZAÇÃO NO SUPABASE
            const newHistory = [...userData.history, input].slice(-10);
            const { data: updated, error } = await _supabase.from('users')
                .update({ 
                    usage: userData.usage + 1, 
                    history: newHistory 
                })
                .eq('id', currentUser.id)
                .select()
                .single();

            if (updated) {
                userData = updated;
                updateUI();
            }
        }
    } catch (e) {
        alert("Erro na conexão.");
    } finally {
        // CORREÇÃO: Esconde o loader SEMPRE, dando certo ou errado
        dom.loader.classList.add('hidden');
        dom.btnGenerate.disabled = false;
    }
};

// Logout
document.getElementById('btnLogout').onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

dom.btnGoogle.onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

document.getElementById('btnUpgrade').onclick = () => dom.upgradeModal.classList.remove('hidden');
document.getElementById('closeModal').onclick = () => dom.upgradeModal.classList.add('hidden');
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(dom.outputText.innerText);
    alert("Copiado!");
};

lucide.createIcons();
