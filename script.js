// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userData = { plan: 'Standart', usage: 0, history: [] };
let currentUser = null;

// --- GERENCIADOR DE AUTH ---
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

// Logout Direto e Funcional
document.getElementById('btnLogout').onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

document.getElementById('btnGoogle').onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

// --- SINCRONIZAÇÃO ---
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
    const planLabel = document.getElementById('planLabel');
    const progressBar = document.getElementById('progressBar');
    
    planLabel.innerText = userData.plan.toUpperCase();
    
    if (isPro) {
        document.getElementById('usageLabel').innerText = "ILIMITADO";
        progressBar.style.width = "100%";
        progressBar.style.background = "var(--accent)";
        document.getElementById('btnUpgrade').style.display = 'none';
        document.getElementById('planCard').classList.add('pro-highlight');
    } else {
        document.getElementById('usageLabel').innerText = `${userData.usage}/2`;
        progressBar.style.width = `${(userData.usage / 2) * 100}%`;
    }

    // Histórico com design limpo
    document.getElementById('historyList').innerHTML = userData.history.slice(-5).reverse().map(h => `
        <div class="hist-item" style="padding:10px; font-size:0.75rem; color:var(--text-dim); cursor:pointer; border-radius:8px; margin-bottom:5px; background:rgba(255,255,255,0.02);" onclick="document.getElementById('promptInput').value='${h}'">
            ${h.substring(0, 30)}...
        </div>
    `).join('');
}

// --- GERAÇÃO IA ---
document.getElementById('btnGenerate').onclick = async () => {
    const input = document.getElementById('promptInput').value.trim();
    if (!input) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
        document.getElementById('upgradeModal').classList.remove('hidden');
        return;
    }

    // Loader Visual
    document.getElementById('btnGenerate').innerText = "PROCESSANDO...";
    
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });
        const data = await res.json();

        if (data.prompt) {
            document.getElementById('outputText').innerText = data.prompt;
            document.getElementById('resultBox').classList.remove('hidden');

            // Salvar no Banco
            const newHistory = [...userData.history, input].slice(-10);
            const { data: updated } = await _supabase.from('users')
                .update({ usage: userData.usage + 1, history: newHistory })
                .eq('id', currentUser.id).select().single();

            if (updated) {
                userData = updated;
                updateUI();
            }
        }
    } catch (e) {
        alert("Erro na conexão.");
    } finally {
        document.getElementById('btnGenerate').innerHTML = `GERAR AGORA <i data-lucide="zap"></i>`;
        lucide.createIcons();
    }
};

// Modais
document.getElementById('btnUpgrade').onclick = () => document.getElementById('upgradeModal').classList.remove('hidden');
document.getElementById('closeModal').onclick = () => document.getElementById('upgradeModal').classList.add('hidden');
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('outputText').innerText);
    alert("Copiado!");
};
