// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements (Atualizados para a nova UI)
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loader = document.getElementById('loader');
const historyList = document.getElementById('historyList');
// Novos elementos da UI Pro
const planNameUI = document.getElementById('planName');
const usageCountUI = document.getElementById('usageCount');
const usageProgressUI = document.getElementById('usageProgress');
const btnOpenUpgrade = document.getElementById('btnOpenUpgrade');
const upgradeModal = document.getElementById('upgradeModal');
const closeModal = document.getElementById('closeModal');
const btnNew = document.getElementById('btnNew');
const btnCopy = document.getElementById('btnCopy');

let userData = null;
let currentUser = null;

// --- SESSÃO ---
_supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        currentUser = session.user;
        document.body.classList.replace('auth-false', 'auth-true');
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url;
        await syncUserData();
        lucide.createIcons(); // Recarrega ícones após login
    } else {
        document.body.classList.replace('auth-true', 'auth-false');
    }
});

btnGoogle.onclick = async () => {
    await _supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
};
btnLogout.onclick = async () => { await _supabase.auth.signOut(); window.location.reload(); };

// --- DADOS ---
async function syncUserData() {
    let { data, error } = await _supabase.from('users').select('*').eq('id', currentUser.id).single();
    if (error && error.code === 'PGRST116') {
        const { data: newUser } = await _supabase.from('users').insert([{ id: currentUser.id, email: currentUser.email }]).select().single();
        userData = newUser;
    } else {
        userData = data;
    }
    updateUI();
}

function updateUI() {
    if (!userData) return;
    
    const isPro = userData.plan === 'Pro';
    planNameUI.innerText = userData.plan;
    
    if (isPro) {
        planNameUI.classList.add('pro');
        usageCountUI.innerText = "Ilimitado";
        usageProgressUI.style.width = "100%";
        usageProgressUI.classList.add('pro-mode');
        btnOpenUpgrade.classList.add('hidden');
    } else {
        planNameUI.classList.remove('pro');
        usageCountUI.innerText = `${userData.usage} / 2 usos`;
        const percentage = (userData.usage / 2) * 100;
        usageProgressUI.style.width = `${percentage}%`;
        usageProgressUI.classList.remove('pro-mode');
        btnOpenUpgrade.classList.remove('hidden');
    }
    
    historyList.innerHTML = "";
    if (userData.history) {
        userData.history.slice().reverse().forEach(text => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerText = text;
            item.onclick = () => { promptInput.value = text; promptInput.focus(); };
            historyList.appendChild(item);
        });
    }
}

// --- GERAÇÃO ---
btnGenerate.onclick = async () => {
    const text = promptInput.value.trim();
    if (!text) return;

    if (userData.plan === "Standart" && userData.usage >= 2) {
        upgradeModal.classList.remove('hidden');
        return;
    }

    loader.classList.remove('hidden');
    resultBox.classList.add('hidden');
    btnGenerate.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: text })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Erro na IA");

        if (data.prompt) {
            outputText.innerText = data.prompt;
            resultBox.classList.remove('hidden');
            const newUsage = userData.usage + 1;
            const newHistory = [...(userData.history || []), text].slice(-20);
            const { data: updatedUser } = await _supabase.from('users').update({ usage: newUsage, history: newHistory }).eq('id', currentUser.id).select().single();
            userData = updatedUser;
            updateUI();
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (e) { alert("Erro: " + e.message); } finally { loader.classList.add('hidden'); btnGenerate.disabled = false; }
};

// EVENTOS UI
btnCopy.onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    btnCopy.innerHTML = `<i data-lucide="check"></i> Copiado!`;
    lucide.createIcons();
    setTimeout(() => { btnCopy.innerHTML = `<i data-lucide="copy"></i> Copiar`; lucide.createIcons(); }, 2000);
};
btnNew.onclick = () => { promptInput.value = ''; resultBox.classList.add('hidden'); promptInput.focus(); };
closeModal.onclick = () => upgradeModal.classList.add('hidden');
btnOpenUpgrade.onclick = () => upgradeModal.classList.remove('hidden');
upgradeModal.onclick = (e) => { if(e.target === upgradeModal) upgradeModal.classList.add('hidden'); };
