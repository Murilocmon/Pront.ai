import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Seus dados reais inseridos aqui
const firebaseConfig = {
  apiKey: "AIzaSyD3UMwRrFBB9WqHZ4pvghwFNn4rw2kVv50",
  authDomain: "pront-ai.firebaseapp.com",
  projectId: "pront-ai",
  storageBucket: "pront-ai.firebasestorage.app",
  messagingSenderId: "356777790012",
  appId: "1:356777790012:web:53d4e536bb38d742f09139",
  measurementId: "G-BZK224C6L5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elementos DOM
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loader = document.getElementById('loader');
const historyList = document.getElementById('historyList');

// Monitor de Login
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.body.className = 'auth-true';
        document.getElementById('uName').innerText = user.displayName;
        document.getElementById('uAvatar').src = user.photoURL;
    } else {
        document.body.className = 'auth-false';
    }
});

btnGoogle.onclick = () => signInWithPopup(auth, provider);
btnLogout.onclick = () => signOut(auth);

// Gerar Prompt
btnGenerate.onclick = async () => {
    const text = promptInput.value.trim();
    if (!text) return;

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
        outputText.innerText = data.prompt;
        resultBox.classList.remove('hidden');
        addToHistory(text);
    } catch (e) {
        alert("Erro na conexão.");
    } finally {
        loader.classList.add('hidden');
        btnGenerate.disabled = false;
    }
};

function addToHistory(text) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = text;
    historyList.prepend(item);
}

document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    alert("Copiado!");
};

document.getElementById('btnNew').onclick = () => {
    promptInput.value = '';
    resultBox.classList.add('hidden');
};

lucide.createIcons();
