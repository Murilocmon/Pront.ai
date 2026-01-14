// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userData = { plan: 'Standart', usage: 0, history: [] };
let currentUser = null;

// Escutador Central de Login
_supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
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
}

function updateUI() {
    const isPro = userData.plan === 'Pro';
    document.getElementById('planLabel').innerText = userData.plan.toUpperCase();
    document.getElementById('aiBadge').innerText = isPro ? "MODELO: LLAMA 3.3 TURBO" : "MODELO: LLAMA BÁSICO";

    if (isPro) {
        document.getElementById('usageLabel').innerText = "ILIMITADO";
        document.getElementById('progressBar').style.width = "100%";
        document.getElementById('btnUpgrade').classList.add('hidden');
    } else {
        document.getElementById('usageLabel').innerText = `${userData.usage}/2`;
        document.getElementById('progressBar').style.width = `${(userData.usage / 2) * 100}%`;
        document.getElementById('btnUpgrade').classList.remove('hidden');
    }

    document.getElementById('historyList').innerHTML = (userData.history || []).slice(-5).reverse().map(h => `
        <div style="padding:10px; font-size:0.8rem; color:#8B949E; cursor:pointer; border-radius:8px;" onclick="document.getElementById('promptInput').value='${h}'">
            ${h.substring(0, 30)}...
        </div>
    `).join('');
}

// Botões de Ação
document.getElementById('btnGoogle').onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};

document.getElementById('btnLogout').onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

document.getElementById('btnGenerate').onclick = async () => {
    const input = document.getElementById('promptInput').value.trim();
    if (!input || document.getElementById('btnGenerate').disabled) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
        document.getElementById('upgradeModal').classList.remove('hidden');
        return;
    }

    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('resultBox').classList.add('hidden');
    document.getElementById('btnGenerate').disabled = true;

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
        alert("Erro na conexão.");
    } finally {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('btnGenerate').disabled = false;
        lucide.createIcons();
    }
};

document.getElementById('btnUpgrade').onclick = () => document.getElementById('upgradeModal').classList.remove('hidden');
document.getElementById('closeModal').onclick = () => document.getElementById('upgradeModal').classList.add('hidden');
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('outputText').innerText);
    alert("Copiado!");
};
