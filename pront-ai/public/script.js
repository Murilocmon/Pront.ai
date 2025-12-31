import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Substitua pelos seus dados do Firebase Console
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    appId: "ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM
const btnLogin = document.getElementById('btnGoogleLogin');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loading = document.getElementById('loading');

// Auth logic
btnLogin.onclick = () => signInWithPopup(auth, provider);
btnLogout.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.body.className = 'logged-in';
        document.getElementById('uName').innerText = user.displayName;
        document.getElementById('userImg').src = user.photoURL;
    } else {
        document.body.className = 'logged-out';
    }
});

// Chamar API da Vercel
btnGenerate.onclick = async () => {
    const text = promptInput.value.trim();
    if (!text) return;

    loading.classList.remove('hidden');
    resultBox.classList.add('hidden');
    btnGenerate.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userInput: text })
        });
        const data = await response.json();
        outputText.innerText = data.text;
        resultBox.classList.remove('hidden');
        saveToHistory(text);
    } catch (e) {
        alert("Erro ao conectar com o servidor.");
    } finally {
        loading.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

function saveToHistory(text) {
    const history = document.getElementById('history');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = text;
    history.prepend(item);
}

lucide.createIcons();