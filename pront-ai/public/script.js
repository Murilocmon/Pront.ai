import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Suas credenciais oficiais
const firebaseConfig = {
  apiKey: "AIzaSyD3UMwRrFBB9WqHZ4pvghwFNn4rw2kVv50",
  authDomain: "pront-ai.firebaseapp.com",
  projectId: "pront-ai",
  storageBucket: "pront-ai.firebasestorage.app",
  messagingSenderId: "356777790012",
  appId: "1:356777790012:web:53d4e536bb38d742f09139",
  measurementId: "G-BZK224C6L5"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Elementos do DOM
const btnGoogle = document.getElementById('btnGoogle');
const btnLogout = document.getElementById('btnLogout');
const btnGenerate = document.getElementById('btnGenerate');
const promptInput = document.getElementById('promptInput');
const outputText = document.getElementById('outputText');
const resultBox = document.getElementById('resultBox');
const loader = document.getElementById('loader');
const historyList = document.getElementById('historyList');

// --- LÓGICA DE LOGIN ---

btnGoogle.onclick = async () => {
    console.log("Tentando logar...");
    try {
        await signInWithPopup(auth, provider);
        console.log("Login realizado com sucesso!");
    } catch (error) {
        console.error("Erro detalhado do Firebase:", error);
        // Este alerta vai te dizer o que falta configurar
        alert("Erro no Login: " + error.message); 
    }
};

btnLogout.onclick = () => signOut(auth);

// Observador de estado (Verifica se está logado)
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.displayName);
        document.body.classList.remove('auth-false');
        document.body.classList.add('auth-true');
        document.getElementById('uName').innerText = user.displayName;
        document.getElementById('uAvatar').src = user.photoURL;
    } else {
        console.log("Nenhum usuário logado.");
        document.body.classList.remove('auth-true');
        document.body.classList.add('auth-false');
    }
});

// --- LÓGICA DA IA ---

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
            throw new Error("Resposta da IA vazia");
        }
    } catch (e) {
        alert("Erro ao conectar com a IA. Verifique se a GROQ_API_KEY está configurada na Vercel.");
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

// Funções de UI
document.getElementById('btnCopy').onclick = () => {
    navigator.clipboard.writeText(outputText.innerText);
    const originalText = document.getElementById('btnCopy').innerHTML;
    document.getElementById('btnCopy').innerText = "Copiado!";
    setTimeout(() => { document.getElementById('btnCopy').innerHTML = originalText; }, 2000);
};

document.getElementById('btnNew').onclick = () => {
    promptInput.value = '';
    resultBox.classList.add('hidden');
};

// Inicializa os ícones do Lucide
lucide.createIcons();
