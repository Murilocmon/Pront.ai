// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userData = { plan: 'Standart', usage: 0, history: [] };
let currentUser = null;

// ESCUTADOR DE LOGIN
_supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth Event:", event);
    if (session) {
        currentUser = session.user;
        document.body.className = 'auth-true';
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name || currentUser.email;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url;
        await syncData();
    } else {
        document.body.className = 'auth-false';
    }
    lucide.createIcons();
});

async function syncData() {
    if (!currentUser) return;
    try {
        let { data, error } = await _supabase.from('users').select('*').eq('id', currentUser.id).single();

        if (error && error.code === 'PGRST116') {
            const { data: newUser } = await _supabase.from('users').insert([{ 
                id: currentUser.id, email: currentUser.email, plan: 'Standart', usage: 0, history: [] 
            }]).select().single();
            userData = newUser;
        } else if (data) {
            userData = data;
        }
        updateUI();
    } catch (e) {
        console.error("Erro no Sync:", e);
    }
}

function updateUI() {
    if (!userData) return;
    const isPro = userData.plan === 'Pro';
    document.getElementById('planLabel').innerText = userData.plan.toUpperCase();
    document.getElementById('aiBadge').innerText = isPro ? "MODELO: LLAMA 3.3 TURBO" : "MODELO: LLAMA BÁSICO";

    const usageLabel = document.getElementById('usageLabel');
    const progressBar = document.getElementById('progressBar');
    const btnUpgrade = document.getElementById('btnUpgrade');

    if (isPro) {
        usageLabel.innerText = "ILIMITADO";
        progressBar.style.width = "100%";
        btnUpgrade.classList.add('hidden');
    } else {
        usageLabel.innerText = `${userData.usage}/2`;
        progressBar.style.width = `${(userData.usage / 2) * 100}%`;
        btnUpgrade.classList.remove('hidden');
    }

    const hList = document.getElementById('historyList');
    hList.innerHTML = (userData.history || []).slice(-5).reverse().map(h => `
        <div class="h-item" onclick="document.getElementById('promptInput').value='${h}'">
            ${h.substring(0, 30)}...
        </div>
    `).join('');
}

// CLIQUES
document.getElementById('btnGoogle').onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

document.getElementById('btnLogout').onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

document.getElementById('btnGenerate').onclick = async () => {
    const input = document.getElementById('promptInput').value.trim();
    const btn = document.getElementById('btnGenerate');
    
    if (!input || btn.disabled) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
        document.getElementById('upgradeModal').classList.remove('hidden');
        return;
    }

    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('resultBox').classList.add('hidden');
    btn.disabled = true;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input, plan: userData.plan })
        });
        const data = await res.json();

        if (data.prompt) {
            document.getElementById('outputText').innerText = data.prompt;
            document.getElementById('resultBox').classList.remove('hidden');

            const newHistory = [...(userData.history || []), input].slice(-10);
            const { data: updated } = await _supabase.from('users')
                .update({ usage: userData.usage + 1, history: newHistory })
                .eq('id', currentUser.id).select().single();

            if (updated) {
                userData = updated;
                updateUI();
            }
        }
    } catch (e) {
        alert("Erro na IA.");
    } finally {
        document.getElementById('loader').classList.add('hidden');
        btn.disabled = false;
        lucide.createIcons();
    }
};

document.getElementById('btnUpgrade').onclick = () => document.getElementById('upgradeModal').classList.remove('hidden');
document.getElementById('closeModal').onclick = () => document.getElementById('upgradeModal').classList.add('hidden');
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('outputText').innerText);
    alert("Copiado!");
};
