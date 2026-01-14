// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENTOS
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loader = document.getElementById('loader');
const historyList = document.getElementById('historyList');
const planNameUI = document.getElementById('planName');
const usageCountUI = document.getElementById('usageCount');
const upgradeModal = document.getElementById('upgradeModal');

let userData = null;
let currentUser = null;

// --- GERENCIAMENTO DE SESSÃO ---

_supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    
    if (session) {
        currentUser = session.user;
        document.body.classList.replace('auth-false', 'auth-true');
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name || currentUser.email;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url || "";
        await syncUserData();
    } else {
        document.body.classList.replace('auth-true', 'auth-false');
    }
});

btnGoogle.onclick = async () => {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin 
        }
    });
    if (error) alert("Erro de Autenticação: " + error.message);
};

btnLogout.onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

// --- BANCO DE DATOS ---

async function syncUserData() {
    try {
        let { data, error } = await _supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code === 'PGRST116') {
            // Usuário novo: Criar registro
            const { data: newUser } = await _supabase
                .from('users')
                .insert([{ 
                    id: currentUser.id, 
                    email: currentUser.email, 
                    plan: 'Standart', 
                    usage: 0, 
                    history: [] 
                }])
                .select()
                .single();
            userData = newUser;
        } else {
            userData = data;
        }
        updateUI();
    } catch (e) {
        console.error("Erro ao sincronizar dados:", e);
    }
}

function updateUI() {
    if (!userData) return;
    planNameUI.innerHTML = `Plano: <b class="${userData.plan === 'Pro' ? 'blue' : ''}">${userData.plan}</b>`;
    usageCountUI.innerText = userData.plan === 'Pro' ? "Usos: Ilimitados" : `Usos: ${userData.usage} / 2`;
    
    historyList.innerHTML = "";
    if (userData.history) {
        userData.history.slice().reverse().forEach(text => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerText = text;
            item.onclick = () => { promptInput.value = text; };
            historyList.appendChild(item);
        });
    }
}

// --- GERAÇÃO IA (LLAMA 3.3) ---

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
            const newHistory = [...(userData.history || []), text].slice(-10);

            const { data: updatedUser } = await _supabase
                .from('users')
                .update({ usage: newUsage, history: newHistory })
                .eq('id', currentUser.id)
                .select()
                .single();

            userData = updatedUser;
            updateUI();
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } catch (e) {
        alert("Falha: " + e.message);
    } finally {
        loader.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

// UI EVENTS
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    alert("Copiado!");
};
document.getElementById('btnNew').onclick = () => {
    promptInput.value = '';
    resultBox.classList.add('hidden');
};
document.getElementById('closeModal').onclick = () => upgradeModal.classList.add('hidden');
document.getElementById('btnOpenUpgrade').onclick = () => upgradeModal.classList.remove('hidden');

lucide.createIcons();
