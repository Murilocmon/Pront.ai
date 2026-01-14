// CONFIGURAÇÕES SUPABASE
const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a2dqbG5zYXZjY2xmbnpibGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDEzMTEsImV4cCI6MjA4Mzk3NzMxMX0.Vp9hVFBratBs-FOPDWh0LIFGN6D8A5AUcbb683oTkwc"; // Certifique-se de usar a 'anon public'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SELETORES ---
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
const usageProgressUI = document.getElementById('usageProgress');
const btnOpenUpgrade = document.getElementById('btnOpenUpgrade');
const upgradeModal = document.getElementById('upgradeModal');
const closeModal = document.getElementById('closeModal');
const btnNew = document.getElementById('btnNew');
const btnCopy = document.getElementById('btnCopy');

let userData = null;
let currentUser = null;

// --- GERENCIAMENTO DE SESSÃO ---

// Função de Logout (Corrigida)
const handleLogout = async () => {
    console.log("Tentando sair...");
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Erro ao sair:", error.message);
    } else {
        window.location.reload(); // Recarrega para limpar o estado
    }
};

// Escutador de Mudança de Auth
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event);
    if (session) {
        currentUser = session.user;
        document.body.classList.replace('auth-false', 'auth-true');
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name || currentUser.email;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url || "";
        await syncUserData();
        lucide.createIcons();
    } else {
        document.body.classList.replace('auth-true', 'auth-false');
    }
});

// Botão de Login
btnGoogle.onclick = async () => {
    console.log("Iniciando login Google...");
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    if (error) alert("Erro de Login: " + error.message);
};

// Atribuindo Logout
btnLogout.onclick = handleLogout;

// --- BANCO DE DATOS ---

async function syncUserData() {
    console.log("Sincronizando dados do usuário...");
    let { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error && error.code === 'PGRST116') {
        const { data: newUser } = await supabaseClient
            .from('users')
            .insert([{ id: currentUser.id, email: currentUser.email, plan: 'Standart', usage: 0, history: [] }])
            .select()
            .single();
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

// --- GERAÇÃO DE PROMPT (Llama 3.3) ---

btnGenerate.onclick = async () => {
    console.log("Gerar clicado...");
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

            const { data: updatedUser } = await supabaseClient
                .from('users')
                .update({ usage: newUsage, history: newHistory })
                .eq('id', currentUser.id)
                .select()
                .single();

            userData = updatedUser;
            updateUI();
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (e) {
        console.error("Erro na geração:", e);
        alert("Erro no pront.ai: " + e.message);
    } finally {
        loader.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

// --- EVENTOS DE INTERFACE ---

btnCopy.onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    const original = btnCopy.innerHTML;
    btnCopy.innerHTML = `<i data-lucide="check"></i> Copiado!`;
    lucide.createIcons();
    setTimeout(() => { btnCopy.innerHTML = original; lucide.createIcons(); }, 2000);
};

btnNew.onclick = () => {
    promptInput.value = '';
    resultBox.classList.add('hidden');
    promptInput.focus();
};

closeModal.onclick = () => upgradeModal.classList.add('hidden');
btnOpenUpgrade.onclick = () => upgradeModal.classList.remove('hidden');

// Fechar modal ao clicar fora
upgradeModal.onclick = (e) => {
    if (e.target === upgradeModal || e.target.classList.contains('modal-backdrop')) {
        upgradeModal.classList.add('hidden');
    }
};

lucide.createIcons();
