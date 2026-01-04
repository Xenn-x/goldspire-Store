import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, push, set, remove, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ==========================================
// CONFIGURASI FIREBASE ANDA DISINI
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCwYIQbD73DCHf4uln1CkwPyNOA64lOZTA",
    authDomain: "goldspire-smp.firebaseapp.com",
    databaseURL: "https://goldspire-smp-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "goldspire-smp",
    storageBucket: "goldspire-smp.firebasestorage.app",
    messagingSenderId: "9716285558",
    appId: "1:9716285558:web:d3d3a26a5dd58747429f57",
    measurementId: "G-5X4GREL21Z"
};
// ==========================================

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global State
let storeSettings = {
    waNumber: "628123456789",
    messageTemplate: "Halo admin, mau beli {item}, harga {price}, stok {stock}"
};
let itemsData = {};

// ------------------------------------------------------------------
// CORE FUNCTIONS (Load Data)
// ------------------------------------------------------------------

// Listen to Items
const itemsRef = ref(db, 'items');
onValue(itemsRef, (snapshot) => {
    const data = snapshot.val();
    itemsData = data || {};
    renderUserCatalog();
    renderAdminTable();
});

// Listen to Settings
const settingsRef = ref(db, 'settings');
onValue(settingsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        storeSettings = data;
        // Update Admin UI Inputs
        const waInput = document.getElementById('settingWA');
        const msgInput = document.getElementById('settingMsg');
        if (waInput) waInput.value = storeSettings.waNumber;
        if (msgInput) msgInput.value = storeSettings.messageTemplate;
    }
});

// ------------------------------------------------------------------
// USER UI LOGIC
// ------------------------------------------------------------------

window.renderUserCatalog = () => {
    const container = document.getElementById('catalogContainer');
    if (!container) return;
    container.innerHTML = '';

    const items = Object.entries(itemsData);

    if (items.length === 0) {
        container.innerHTML = '<div class="w-full text-center text-gray-500 py-10">Belum ada item tersedia.</div>';
        return;
    }

    items.forEach(([id, item]) => {
        const card = document.createElement('div');
        card.className = "min-w-[280px] md:min-w-[320px] bg-mc-card border border-gray-700 rounded-xl overflow-hidden snap-center flex flex-col hover:border-mc-gold/50 transition duration-300 drop-shadow-xl";

        const formatPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price);

        // Construct WhatsApp Link
        let msg = storeSettings.messageTemplate
            .replace('{item}', item.name)
            .replace('{price}', formatPrice)
            .replace('{stock}', item.stock);
        const waLink = `https://wa.me/${storeSettings.waNumber}?text=${encodeURIComponent(msg)}`;

        card.innerHTML = `
            <div class="h-48 overflow-hidden relative group">
                <img src="${item.image_url || 'https://via.placeholder.com/300'}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-500">
                <div class="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-mc-gold border border-mc-gold/30">
                    Stok: ${item.stock}
                </div>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <h4 class="text-xl font-bold text-white mb-1">${item.name}</h4>
                <div class="text-lg text-mc-gold font-semibold mb-4">${formatPrice}</div>
                
                <a href="${waLink}" target="_blank" class="mt-auto block text-center w-full py-3 bg-white/5 hover:bg-mc-gold hover:text-black border border-mc-gold/30 text-mc-gold font-bold rounded transition-all">
                    BELI SEKARANG
                </a>
            </div>
        `;
        container.appendChild(card);
    });
};

window.scrollCatalog = (direction) => {
    const container = document.getElementById('catalogContainer');
    if (!container) return;
    const scrollAmount = 350;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};


// ------------------------------------------------------------------
// ADMIN PANEL LOGIC
// ------------------------------------------------------------------

// Constants
const ADMIN_PASS = "admin123"; // Simple hardcoded password

// Toggle UI
const adminPanel = document.getElementById('adminPanel');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('loginError');

const adminToggleBtn = document.getElementById('adminToggleBtn');
if (adminToggleBtn) {
    adminToggleBtn.addEventListener('click', () => {
        adminPanel.classList.remove('hidden');
    });
}

const closeAdminBtn = document.getElementById('closeAdminBtn');
if (closeAdminBtn) {
    closeAdminBtn.addEventListener('click', () => {
        adminPanel.classList.add('hidden');
    });
}

// Login Logic
window.handleAdminLogin = () => {
    const input = document.getElementById('adminPasswordInput').value;
    if (input === ADMIN_PASS) {
        loginForm.classList.add('hidden');
        adminContent.classList.remove('hidden');
        loginError.classList.add('hidden');
        renderAdminTable();
    } else {
        loginError.classList.remove('hidden');
    }
};

// Render Admin Table
window.renderAdminTable = () => {
    const tbody = document.getElementById('adminItemsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    Object.entries(itemsData).forEach(([id, item]) => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-700 hover:bg-gray-700/30";
        tr.innerHTML = `
            <td class="p-3"><img src="${item.image_url}" class="w-10 h-10 object-cover rounded"></td>
            <td class="p-3 font-medium text-white">${item.name}</td>
            <td class="p-3">${item.price}</td>
            <td class="p-3">${item.stock}</td>
            <td class="p-3 flex gap-2">
                <button onclick="editItem('${id}')" class="text-blue-400 hover:text-blue-300">Edit</button>
                <button onclick="deleteItem('${id}')" class="text-red-400 hover:text-red-300">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// Settings Logic
window.saveSettings = () => {
    const newWA = document.getElementById('settingWA').value;
    const newMsg = document.getElementById('settingMsg').value;

    set(ref(db, 'settings'), {
        waNumber: newWA,
        messageTemplate: newMsg
    }).then(() => alert('Settings Saved!'));
};

// CRUD Logic
const modal = document.getElementById('itemModal');

window.openItemModal = () => {
    document.getElementById('editItemId').value = '';
    document.getElementById('modalTitle').innerText = 'Add New Item';
    document.getElementById('itemName').value = '';
    document.getElementById('itemImg').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemStock').value = '';
    modal.classList.remove('hidden');
};

window.closeItemModal = () => {
    modal.classList.add('hidden');
};

window.editItem = (id) => {
    const item = itemsData[id];
    document.getElementById('editItemId').value = id;
    document.getElementById('modalTitle').innerText = 'Edit Item';

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemImg').value = item.image_url;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemStock').value = item.stock;

    modal.classList.remove('hidden');
};

window.deleteItem = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
        remove(ref(db, `items/${id}`));
    }
};

window.submitItem = () => {
    const id = document.getElementById('editItemId').value;
    const itemPayload = {
        name: document.getElementById('itemName').value,
        image_url: document.getElementById('itemImg').value,
        price: Number(document.getElementById('itemPrice').value),
        stock: Number(document.getElementById('itemStock').value),
    };

    if (!itemPayload.name || !itemPayload.price) return alert('Name and Price are required!');

    if (id) {
        // Update
        set(ref(db, `items/${id}`), itemPayload).then(() => closeItemModal());
    } else {
        // Create
        push(ref(db, 'items'), itemPayload).then(() => closeItemModal());
    }
};
