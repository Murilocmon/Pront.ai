const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "sb_secret_elQ_8o5ToUjqDFRsIndU3w_GsD3VLjl";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
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

// --- SISTEMA DE AUTENTICAÇÃO ---

async function checkSession() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        document.body.className = 'auth-true';
        document.getElementById('uName').innerText = currentUser.user_metadata.full_name || currentUser.email;
        document.getElementById('uAvatar').src = currentUser.user_metadata.avatar_url || "";
        await syncUserData();
    } else {
        document.body.className = 'auth-false';
    }
}

btnGoogle.onclick = async () => {
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin // Redireciona de volta para o seu site
        }
    });
    if (error) alert("Erro ao conectar com Google: " + error.message);
};

btnLogout.onclick = async () => {
    await _supabase.auth.signOut();
    window.location.reload();
};

// --- BANCO DE DATOS (SUPABASE) ---

async function syncUserData() {
    // Tenta buscar o usuário na tabela personalizada
    let { data, error } = await _supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!data) {
        // Se não existe, cria o registro inicial (Standart)
        const { data: newUser, error: insError } = await _supabase
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
}

function updateUI() {
    if (!userData) return;
    planNameUI.innerHTML = `Plano: <b class="${userData.plan === 'Pro' ? 'blue' : ''}">${userData.plan}</b>`;
    usageCountUI.innerText = userData.plan === 'Pro' ? "Usos: Ilimitados" : `Usos: ${userData.usage} / 2`;
    
    // Atualiza histórico na sidebar
    historyList.innerHTML = "";
    userData.history.slice().reverse().forEach(text => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerText = text;
        item.onclick = () => { promptInput.value = text; };
        historyList.appendChild(item);
    });
}

// --- GERAÇÃO DE PROMPT ---

btnGenerate.onclick = async () => {
    const text = promptInput.value.trim();
    if (!text) return;

    // Trava de Plano Standart
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

            // Salva progresso no Supabase
            const newUsage = userData.usage + 1;
            const newHistory = [...userData.history, text].slice(-10); // Mantém os últimos 10

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
        alert("Erro: " + e.message);
    } finally {
        loader.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

// Funções de UI
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

// Iniciar app
checkSession();
lucide.createIcons();
