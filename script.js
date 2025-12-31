import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// SUBSTITUA PELOS DADOS DO SEU FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "pront-ai.firebaseapp.com",
  projectId: "pront-ai",
  appId: "1:..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elementos
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loader = document.getElementById('loader');
const historyList = document.getElementById('historyList');

// Monitor de Autenticação
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

// Lógica de Geração via API (Vercel Serverless)
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
        if (data.prompt) {
            outputText.innerText = data.prompt;
            resultBox.classList.remove('hidden');
            addToHistory(text);
        } else {
            throw new Error();
        }
    } catch (e) {
        alert("Erro ao conectar com a IA. Verifique se o deploy na Vercel está correto.");
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
    alert("Copiado para a área de transferência!");
};

lucide.createIcons();
