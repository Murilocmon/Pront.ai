const SUPABASE_URL = "https://xvkgjlnsavcclfnzblig.supabase.co";
const SUPABASE_KEY = "sb_secret_elQ_8o5ToUjqDFRsIndU3w_GsD3VLjl";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM
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

let currentUser = null;
let userData = null;

// --- AUTH ---
async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        document.body.className = 'auth-true';
        document.getElementById('uEmail').innerText = user.email;
        await fetchUserData();
    } else {
        document.body.className = 'auth-false';
    }
}

btnGoogle.onclick = async () => {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
};

btnLogout.onclick = async () => {
    await supabase.auth.signOut();
    window.location.reload();
};

// --- DATABASE ---
async function fetchUserData() {
    let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (!data) {
        // Criar registro inicial
        const { data: newUser } = await supabase.from('users').insert([
            { id: currentUser.id, email: currentUser.email, usage: 0, plan: 'Standart', history: [] }
        ]).select().single();
        userData = newUser;
    } else {
        userData = data;
    }
    updateUI();
}

function updateUI() {
    planNameUI.innerHTML = `Plano: <b class="${userData.plan === 'Pro' ? 'blue' : ''}">${userData.plan}</b>`;
    usageCountUI.innerText = userData.plan === 'Pro' ? "Usos: Ilimitados" : `Usos: ${userData.usage} / 2`;
    
    historyList.innerHTML = "";
    userData.history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerText = item;
        div.onclick = () => promptInput.value = item;
        historyList.prepend(div);
    });
}

// --- GERAÇÃO ---
btnGenerate.onclick = async () => {
    const input = promptInput.value.trim();
    if (!input) return;

    if (userData.plan === 'Standart' && userData.usage >= 2) {
        upgradeModal.classList.remove('hidden');
        return;
    }

    loader.classList.remove('hidden');
    resultBox.classList.add('hidden');
    btnGenerate.disabled = true;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: input })
        });
        const data = await res.json();

        if (data.prompt) {
            outputText.innerText = data.prompt;
            resultBox.classList.remove('hidden');

            // Atualizar uso e histórico no Supabase
            const newHistory = [...userData.history, input].slice(-10); // Mantém 10
            const { data: updated } = await supabase
                .from('users')
                .update({ usage: userData.usage + 1, history: newHistory })
                .eq('id', currentUser.id)
                .select()
                .single();
            
            userData = updated;
            updateUI();
        }
    } catch (e) {
        alert("Erro na geração.");
    } finally {
        loader.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    alert("Copiado!");
};

document.getElementById('closeModal').onclick = () => upgradeModal.classList.add('hidden');

checkUser();
lucide.createIcons();
