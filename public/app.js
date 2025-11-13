// Global state
let appliances = [];
let currentUser = null;
const API_URL = window.location.origin;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuthStatus();
});

// --- THEME ---
const THEME_KEY = 'hs_theme';

function applyTheme(theme) {
    // Apply data-theme on the root element
    document.documentElement.setAttribute('data-theme', theme);
    
    // Sync settings checkbox if present
    const darkToggle = document.getElementById('darkMode');
    if (darkToggle) darkToggle.checked = theme === 'dark';
    
    // Update theme toggle button icon
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        const icon = themeBtn.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
}

function initTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        applyTheme(theme);
    } catch (_) {
        applyTheme('light');
    }
}

// --- AUTHENTICATION ---

async function checkAuthStatus() {
    try {
        const response = await fetch(`${API_URL}/api/auth/status`);
        const data = await response.json();
        if (data.isAuthenticated) {
            showApp(data.user);
        } else {
            showAuth();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showAuth();
    }
}

function showAuth() {
    document.body.classList.add('logged-out');
    const authContainer = document.getElementById('auth-container');
    const container = document.getElementById('container');
    if (authContainer) authContainer.style.display = 'flex';
    if (container) container.style.display = 'none';
    setupAuthEventListeners();
}

function showApp(user) {
    currentUser = user;
    document.body.classList.remove('logged-out');
    const authContainer = document.getElementById('auth-container');
    const container = document.querySelector('.container');
    if (authContainer) authContainer.style.display = 'none';
    if (container) container.style.display = 'flex';
    
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${user.username}`;
    }
    // Ensure theme toggle reflects current theme when app UI renders
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(currentTheme);
    
    setupAppEventListeners();
    loadAppliances();
}

function setupAuthEventListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.classList.remove('active');
            if (registerForm) registerForm.classList.add('active');
        });
    }
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerForm) registerForm.classList.remove('active');
            if (loginForm) loginForm.classList.add('active');
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
        const user = await response.json();
        showApp(user);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Registration failed');
        }
        const user = await response.json();
        showApp(user);
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function handleLogout() {
    try {
        await apiFetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
        currentUser = null;
        showAuth();
    } catch (error) {
        console.error('Logout failed:', error);
        showMessage('Logout failed. Please try again.', 'error');
    }
}

// --- API HELPER ---

async function apiFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        // Unauthorized, session expired or invalid
        showMessage('Your session has expired. Please log in again.', 'error');
        showAuth();
        throw new Error('Unauthorized');
    }
    return response;
}


// --- MAIN APP ---

function setupAppEventListeners() {
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            showView(view);
        });
    });

    // Form submission
    const applianceForm = document.getElementById('appliance-form');
    if (applianceForm) {
        applianceForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Edit form submission
    const editForm = document.getElementById('edit-appliance-form');
    if (editForm) {
        editForm.addEventListener('submit', handleEditFormSubmit);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// View management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
}

// Load appliances
async function loadAppliances() {
    try {
        const response = await apiFetch(`${API_URL}/api/appliances`);
        if (!response.ok) throw new Error('Failed to load appliances');
        
        appliances = await response.json();
        renderAppliances();
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            console.error('Error loading appliances:', error);
            showMessage('Failed to load appliances', 'error');
            document.getElementById('appliances-grid').innerHTML = 
                '<div class="empty-state"><h3>Failed to load appliances. Please try again.</h3></div>';
        }
    }
}

// Render appliances
function renderAppliances() {
    const grid = document.getElementById('appliances-grid');
    
    if (appliances.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No appliances yet, ${currentUser.username}!</h3>
                <p>Start by adding your first appliance.</p>
                <button class="btn btn-primary" onclick="showView('add')">+ Add Appliance</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = appliances.map(appliance => {
        const imageUrl = appliance.photos && appliance.photos.length > 0 
            ? `${API_URL}/uploads/${appliance.photos[0]}`
            : null;
        
        return `
            <div class="appliance-tile" onclick="showApplianceDetails('${appliance._id}')">
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="${appliance.name}" class="appliance-image">`
                    : `<div class="appliance-placeholder">📱</div>`
                }
                <div class="appliance-tile-header">
                    <div>
                        <h3>${appliance.name}</h3>
                        <span class="appliance-category">${appliance.category}</span>
                    </div>
                </div>
                <div class="appliance-info">
                    ${appliance.manufacturer ? `<p><strong>Brand:</strong> ${appliance.manufacturer}</p>` : ''}
                    ${appliance.location ? `<p><strong>Location:</strong> ${appliance.location}</p>` : ''}
                    ${appliance.model ? `<p><strong>Model:</strong> ${appliance.model}</p>` : ''}
                </div>
                <div class="tile-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary" onclick="editAppliance('${appliance._id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteAppliance('${appliance._id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await apiFetch(`${API_URL}/api/appliances`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save appliance');
        }
        
        showMessage('Appliance saved successfully!', 'success');
        resetForm();
        await loadAppliances();
        showView('appliances');
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            console.error('Error saving appliance:', error);
            showMessage(`Failed to save appliance: ${error.message}`, 'error');
        }
    }
}

// Reset form
function resetForm() {
    document.getElementById('appliance-form').reset();
}

// Show appliance details in modal
async function showApplianceDetails(id) {
    try {
        const response = await apiFetch(`${API_URL}/api/appliances/${id}`);
        if (!response.ok) throw new Error('Failed to load appliance details');
        
        const appliance = await response.json();
        const modal = document.getElementById('detail-modal');
        const modalBody = document.getElementById('modal-body');
        
        const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';
        
        modalBody.innerHTML = `
            <h2>${appliance.name}</h2>
            <span class="appliance-category">${appliance.category}</span>
            
            ${appliance.photos && appliance.photos.length > 0 ? `
                <div class="detail-section">
                    <h3>Photos</h3>
                    ${appliance.photos.map(photo => 
                        `<img src="${API_URL}/uploads/${photo}" alt="Appliance photo" class="detail-image">`
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h3>Details</h3>
                <div class="detail-grid">
                    <div class="detail-item"><strong>Manufacturer</strong> ${appliance.manufacturer || 'N/A'}</div>
                    <div class="detail-item"><strong>Model</strong> ${appliance.model || 'N/A'}</div>
                    <div class="detail-item"><strong>Serial Number</strong> ${appliance.serialNumber || 'N/A'}</div>
                    <div class="detail-item"><strong>Location</strong> ${appliance.location || 'N/A'}</div>
                    <div class="detail-item"><strong>Purchase Date</strong> ${formatDate(appliance.purchaseDate)}</div>
                    <div class="detail-item"><strong>Warranty Expiry</strong> ${formatDate(appliance.warrantyExpiry)}</div>
                    <div class="detail-item"><strong>Purchase Price</strong> ${appliance.purchasePrice ? `$${appliance.purchasePrice}` : 'N/A'}</div>
                </div>
            </div>
            
            ${appliance.notes ? `<div class="detail-section"><h3>Notes</h3><p>${appliance.notes}</p></div>` : ''}
            
            ${appliance.manuals && appliance.manuals.length > 0 ? `
                <div class="detail-section">
                    <h3>Manuals & Documents</h3>
                    <ul class="file-list">
                        ${appliance.manuals.map(manual => `<li><a href="${API_URL}/uploads/${manual}" target="_blank">📄 ${manual}</a></li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            ${appliance.quickStartGuide ? `
                <div class="detail-section">
                    <h3>Quick Start Guide</h3>
                    <ul class="file-list">
                        <li><a href="${API_URL}/uploads/${appliance.quickStartGuide}" target="_blank">📘 Quick Start Guide</a></li>
                    </ul>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            console.error('Error loading appliance details:', error);
            showMessage('Failed to load appliance details', 'error');
        }
    }
}

// Close modal
function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const detailModal = document.getElementById('detail-modal');
    const editModal = document.getElementById('edit-modal');
    if (event.target === detailModal) {
        closeModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
}

// Delete appliance
async function deleteAppliance(id) {
    if (!confirm('Are you sure you want to delete this appliance?')) {
        return;
    }
    
    try {
        const response = await apiFetch(`${API_URL}/api/appliances/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete appliance');
        
        showMessage('Appliance deleted successfully', 'success');
        await loadAppliances();
    } catch (error) {
        if (error.message !== 'Unauthorized') {
            console.error('Error deleting appliance:', error);
            showMessage('Failed to delete appliance', 'error');
        }
    }
}

// Edit appliance
async function editAppliance(id) {
    try {
        const response = await fetch(`${API_URL}/api/appliances/${id}`);
        if (!response.ok) throw new Error('Failed to load appliance');
        
        const appliance = await response.json();
        
        // Populate edit form with existing data
        document.getElementById('edit-name').value = appliance.name || '';
        document.getElementById('edit-category').value = appliance.category || '';
        document.getElementById('edit-manufacturer').value = appliance.manufacturer || '';
        document.getElementById('edit-model').value = appliance.model || '';
        document.getElementById('edit-serialNumber').value = appliance.serialNumber || '';
        document.getElementById('edit-location').value = appliance.location || '';
        document.getElementById('edit-purchaseDate').value = appliance.purchaseDate ? appliance.purchaseDate.split('T')[0] : '';
        document.getElementById('edit-warrantyExpiry').value = appliance.warrantyExpiry ? appliance.warrantyExpiry.split('T')[0] : '';
        document.getElementById('edit-purchasePrice').value = appliance.purchasePrice || '';
        document.getElementById('edit-notes').value = appliance.notes || '';
        
        // Store the appliance ID for submission
        document.getElementById('edit-appliance-form').dataset.id = id;
        
        // Show edit modal and close detail modal
        closeModal();
        document.getElementById('edit-modal').classList.add('active');
    } catch (error) {
        console.error('Error loading appliance for edit:', error);
        showMessage('Failed to load appliance for editing', 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// Handle edit form submission
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const applianceId = document.getElementById('edit-appliance-form').dataset.id;
    const formData = new FormData(e.target);
    
    // Validate URLs (client-side)
    const photosUrlsText = formData.get('photosUrls') || '';
    const manualsUrlsText = formData.get('manualsUrls') || '';
    const quickStartGuideUrlText = formData.get('quickStartGuideUrl') || '';

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const docExts = ['pdf', 'doc', 'docx', 'txt'];

    const validateUrlList = (text, allowedExts) => {
        if (!text) return true;
        const lines = text.split(/\r?\n|,\s*/).map(u => u.trim()).filter(Boolean);
        for (const u of lines) {
            if (!/^https?:\/\//i.test(u)) return false;
            const ext = u.split('.').pop().toLowerCase();
            if (!allowedExts.includes(ext)) return false;
        }
        return true;
    };

    if (photosUrlsText && !validateUrlList(photosUrlsText, imageExts)) {
        showMessage('One or more photo URLs are invalid; ensure they are http(s) links to images.', 'error');
        return;
    }
    if (manualsUrlsText && !validateUrlList(manualsUrlsText, docExts)) {
        showMessage('One or more manual URLs are invalid; ensure they are http(s) links to pdf/doc/docx/txt.', 'error');
        return;
    }
    if (quickStartGuideUrlText && !validateUrlList(quickStartGuideUrlText, docExts)) {
        showMessage('Quick Start Guide URL is not a valid document link (pdf/doc/docx/txt).', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/appliances/${applianceId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to update appliance');
        
        showMessage('Appliance updated successfully!', 'success');
        closeEditModal();
        await loadAppliances();
        showView('appliances');
    } catch (error) {
        console.error('Error updating appliance:', error);
        showMessage('Failed to update appliance. Please try again.', 'error');
    }
}

// Show message
function showMessage(text, type) {
    const container = document.body.classList.contains('logged-out') ? document.getElementById('auth-container') : document.querySelector('.main-content');
    if (!container) return;

    const existingMessage = container.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    container.insertBefore(message, container.firstChild);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Toggle dark mode from settings checkbox
function toggleDarkMode() {
    const toggle = document.getElementById('darkMode');
    const isDark = !!(toggle && toggle.checked);
    const theme = isDark ? 'dark' : 'light';
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
    showMessage(`${isDark ? 'Dark' : 'Light'} mode enabled`, 'success');
}

// Toggle theme from sidebar button
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    try { localStorage.setItem(THEME_KEY, newTheme); } catch (_) {}
}
