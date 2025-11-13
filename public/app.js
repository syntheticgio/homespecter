// Global state
let appliances = [];
const API_URL = window.location.origin;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadAppliances();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            showView(view);
            
            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Form submission
    document.getElementById('appliance-form').addEventListener('submit', handleFormSubmit);
}

// View management
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Update menu active state
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
        const response = await fetch(`${API_URL}/api/appliances`);
        if (!response.ok) throw new Error('Failed to load appliances');
        
        appliances = await response.json();
        renderAppliances();
    } catch (error) {
        console.error('Error loading appliances:', error);
        showMessage('Failed to load appliances', 'error');
        document.getElementById('appliances-grid').innerHTML = 
            '<div class="empty-state"><h3>Failed to load appliances. Please try again.</h3></div>';
    }
}

// Render appliances
function renderAppliances() {
    const grid = document.getElementById('appliances-grid');
    
    if (appliances.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>No appliances yet</h3>
                <p>Start by adding your first appliance!</p>
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
        const response = await fetch(`${API_URL}/api/appliances`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to save appliance');
        
        showMessage('Appliance saved successfully!', 'success');
        resetForm();
        await loadAppliances();
        showView('appliances');
    } catch (error) {
        console.error('Error saving appliance:', error);
        showMessage('Failed to save appliance. Please try again.', 'error');
    }
}

// Reset form
function resetForm() {
    document.getElementById('appliance-form').reset();
}

// Show appliance details in modal
async function showApplianceDetails(id) {
    try {
        const response = await fetch(`${API_URL}/api/appliances/${id}`);
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
                    <div class="detail-item">
                        <strong>Manufacturer</strong>
                        ${appliance.manufacturer || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Model</strong>
                        ${appliance.model || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Serial Number</strong>
                        ${appliance.serialNumber || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Location</strong>
                        ${appliance.location || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Purchase Date</strong>
                        ${formatDate(appliance.purchaseDate)}
                    </div>
                    <div class="detail-item">
                        <strong>Warranty Expiry</strong>
                        ${formatDate(appliance.warrantyExpiry)}
                    </div>
                    <div class="detail-item">
                        <strong>Purchase Price</strong>
                        ${appliance.purchasePrice ? `$${appliance.purchasePrice}` : 'N/A'}
                    </div>
                </div>
            </div>
            
            ${appliance.notes ? `
                <div class="detail-section">
                    <h3>Notes</h3>
                    <p>${appliance.notes}</p>
                </div>
            ` : ''}
            
            ${appliance.manuals && appliance.manuals.length > 0 ? `
                <div class="detail-section">
                    <h3>Manuals & Documents</h3>
                    <ul class="file-list">
                        ${appliance.manuals.map(manual => 
                            `<li><a href="${API_URL}/uploads/${manual}" target="_blank">📄 ${manual}</a></li>`
                        ).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading appliance details:', error);
        showMessage('Failed to load appliance details', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('detail-modal').classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('detail-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Delete appliance
async function deleteAppliance(id) {
    if (!confirm('Are you sure you want to delete this appliance?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/appliances/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete appliance');
        
        showMessage('Appliance deleted successfully', 'success');
        await loadAppliances();
    } catch (error) {
        console.error('Error deleting appliance:', error);
        showMessage('Failed to delete appliance', 'error');
    }
}

// Edit appliance (placeholder for future implementation)
function editAppliance(id) {
    showMessage('Edit functionality coming soon!', 'success');
}

// Show message
function showMessage(text, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(message, mainContent.firstChild);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Toggle dark mode (placeholder)
function toggleDarkMode() {
    showMessage('Dark mode coming soon!', 'success');
}
