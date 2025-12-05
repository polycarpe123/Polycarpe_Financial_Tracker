// Finance Tracker JavaScript with Firebase Integration

import { 
    auth,
    signUpUser,
    signInUser,
    signInWithGoogle,
    signOutUser,
    getUserProfile,
    updateUserProfile,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    initializeDefaultCategories
} from './firebase-config.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Global Variables
let currentUser = null;
let categories = [];
let transactions = [];
let currentEditId = null;
let categoryToDelete = null;
let currentTransactionType = 'expense';

// DOM Elements
const authTabs = document.querySelectorAll('.auth-tabs .tab');
const transactionTypeTabs = document.querySelectorAll('.transaction-type-tabs .tab');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuClose = document.querySelector('.mobile-menu .close-btn');
const modalOverlays = document.querySelectorAll('.modal-overlay');
const addTransactionBtns = document.querySelectorAll('.btn-primary');
const signOutBtns = document.querySelectorAll('.sign-out');

// ==========================================
// AUTH STATE OBSERVER
// ==========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        console.log('User signed in:', user.email);
        
        // If on auth page, redirect to dashboard
        if (document.querySelector('.landing-page')) {
            window.location.href = 'Dashboard.html';
        } else {
            // Show loading state immediately
            showPageLoadingState();
            
            // Load user data
            await loadUserData();
            
            // Hide loading state after data is loaded
            hidePageLoadingState();
        }
    } else {
        // User is signed out
        currentUser = null;
        console.log('User signed out');
        
        // If not on auth page, redirect to login
        if (!document.querySelector('.landing-page')) {
            window.location.href = 'index.html';
        }
    }
});

// ==========================================
// LOAD USER DATA
// ==========================================

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        // Load user profile
        const profileResult = await getUserProfile(currentUser.uid);
        if (profileResult.success) {
            updateUIWithUserProfile(profileResult.data);
        }
        
        // Load categories
        const categoriesResult = await getCategories(currentUser.uid);
        if (categoriesResult.success) {
            categories = categoriesResult.data;
            
            // If no categories, initialize defaults
            if (categories.length === 0) {
                await initializeDefaultCategories(currentUser.uid);
                const newCategoriesResult = await getCategories(currentUser.uid);
                categories = newCategoriesResult.data;
            }
            
            renderCategories();
            loadCategoriesIntoDropdowns();
        }
        
        // Load transactions
        const transactionsResult = await getTransactions(currentUser.uid);
        if (transactionsResult.success) {
            transactions = transactionsResult.data;
            renderTransactions();
            updateDashboardStats();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ==========================================
// UI UPDATE FUNCTIONS
// ==========================================

function updateUIWithUserProfile(profile) {
    // Update all user name elements
    const userNameElements = document.querySelectorAll('#topNavUserName, #dropdownUserName');
    userNameElements.forEach(el => {
        if (el) el.textContent = profile.name;
    });
    
    // Update all user email elements
    const userEmailElements = document.querySelectorAll('#topNavUserEmail, #dropdownUserEmail');
    userEmailElements.forEach(el => {
        if (el) el.textContent = profile.email;
    });
    
    // Update settings page if present
    const nameInput = document.querySelector('.settings-section input[type="text"]');
    if (nameInput) nameInput.value = profile.name;
    
    const emailInput = document.querySelector('.settings-section input[type="email"]');
    if (emailInput) emailInput.value = profile.email;
}

function updateDashboardStats() {
    // Calculate stats from transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'income') {
            totalBalance += amount;
            if (transactionDate.getMonth() === currentMonth && 
                transactionDate.getFullYear() === currentYear) {
                monthlyIncome += amount;
            }
        } else {
            totalBalance -= amount;
            if (transactionDate.getMonth() === currentMonth && 
                transactionDate.getFullYear() === currentYear) {
                monthlyExpense += amount;
            }
        }
    });
    
    // Update stat cards
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = `$${totalBalance.toFixed(2)}`;
        statValues[1].textContent = `$${monthlyIncome.toFixed(2)}`;
        statValues[2].textContent = `$${monthlyExpense.toFixed(2)}`;
    }
}

function showLoadingState() {
    // Add a loading overlay
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    loadingDiv.innerHTML = '<p style="font-size: 18px; color: #10b981;">Loading...</p>';
    document.body.appendChild(loadingDiv);
}

function hideLoadingState() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) loadingDiv.remove();
}

// New functions for page loading state
function showPageLoadingState() {
    // Hide main content immediately
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.visibility = 'hidden';
        mainContent.style.opacity = '0';
    }
    
    // Show full-page loading overlay
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'page-loading-overlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #f9fafb;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 60px; height: 60px; margin: 0 auto 20px; border: 4px solid #e5e7eb; border-top: 4px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="font-size: 18px; color: #10b981; font-weight: 500;">Loading your data...</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
}

function hidePageLoadingState() {
    const loadingDiv = document.getElementById('page-loading-overlay');
    if (loadingDiv) {
        // Fade out the loading overlay
        loadingDiv.style.transition = 'opacity 0.3s ease';
        loadingDiv.style.opacity = '0';
        
        setTimeout(() => {
            loadingDiv.remove();
        }, 300);
    }
    
    // Show main content with fade in
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.style.transition = 'opacity 0.3s ease';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize page loading for non-auth pages
    if (!document.querySelector('.landing-page')) {
        // Hide content initially to prevent flash of old data
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.visibility = 'hidden';
            mainContent.style.opacity = '0';
        }
    }
    
    initAuthTabs();
    initTransactionTabs();
    initMobileMenu();
    initModals();
    initForms();
    initSearch();
    initFilters();
    initProfileDropdown();
    initCategoriesPage();
    initFileUpload();
});

// Auth Tabs Functionality
function initAuthTabs() {
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const isSignIn = this.textContent.trim() === 'Sign In';
            if (isSignIn) {
                console.log('Switching to Sign In form');
            } else {
                console.log('Switching to Create Account form');
            }
        });
    });
}

// Transaction Type Tabs
function initTransactionTabs() {
    transactionTypeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            transactionTypeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const type = this.textContent.trim();
            console.log('Transaction type selected:', type);
        });
    });
}

// Mobile Menu
function initMobileMenu() {
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    const mobileNavItems = mobileMenu?.querySelectorAll('.nav-item');
    mobileNavItems?.forEach(item => {
        item.addEventListener('click', function() {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    const mobileUserIcon = document.querySelector('.mobile-user-icon');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (mobileUserIcon && profileDropdown) {
        mobileUserIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.mobile-user-icon') && !e.target.closest('.profile-dropdown')) {
                profileDropdown.classList.remove('show');
            }
        });
        
        const dropdownSignOut = profileDropdown.querySelector('.dropdown-signout');
        if (dropdownSignOut) {
            dropdownSignOut.addEventListener('click', function(e) {
                e.preventDefault();
                const signoutModal = document.querySelector('.signout-modal');
                if (signoutModal) {
                    signoutModal.classList.add('show');
                    signoutModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    profileDropdown.classList.remove('show');
                }
            });
        }
    }
}

// Modal Management
function initModals() {
    // Add Transaction buttons
    addTransactionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.textContent.includes('Add Transaction')) {
                e.preventDefault();
                openTransactionModal();
            }
        });
    });
    
    // Sign out buttons
    signOutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const signoutModal = document.querySelector('.signout-modal');
            if (signoutModal) {
                signoutModal.classList.add('show');
                signoutModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close buttons
    const closeBtns = document.querySelectorAll('.close-btn, .btn-secondary');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                e.preventDefault();
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Click outside to close
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Confirm sign out
    const confirmSignOut = document.querySelector('.signout-modal .btn-danger');
    if (confirmSignOut) {
        confirmSignOut.addEventListener('click', async function() {
            showLoadingState();
            const result = await signOutUser();
            hideLoadingState();
            
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                alert('Error signing out: ' + result.error);
            }
        });
    }
}

// New function to open transaction modal
function openTransactionModal() {
    // Try multiple selectors to find the transaction modal
    let modal = document.getElementById('transaction-modal');
    if (!modal) {
        modal = document.querySelector('.modal-overlay:not(.signout-modal):not(#delete-modal):not(#category-modal)');
    }
    
    if (modal) {
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Set default date to today
        const dateInput = modal.querySelector('input[type="date"]');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }
        
        // Reset transaction type to expense
        currentTransactionType = 'expense';
        const tabs = modal.querySelectorAll('.transaction-type-tabs .tab');
        tabs.forEach(tab => {
            if (tab.textContent.trim().toLowerCase() === 'expense') {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Show modal
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Transaction modal not found');
    }
}

// Form Handling
function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const formType = this.closest('.landing-page') ? 'auth' : 'transaction';
            
            if (formType === 'auth') {
                handleAuthSubmit(formData);
            } else {
                handleTransactionSubmit(formData);
            }
        });
    });
    
    // Google Sign In Button
    const googleBtn = document.querySelector('button[type="button"]');
    if (googleBtn && googleBtn.textContent.includes('Google')) {
        googleBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            showLoadingState();
            const result = await signInWithGoogle();
            hideLoadingState();
            
            if (!result.success) {
                alert('Error signing in with Google: ' + result.error);
            }
        });
    }
    
    // Initialize transaction type tabs in modal
    initTransactionTypeTabs();
}

// New function to handle transaction type tabs in modal
function initTransactionTypeTabs() {
    const modalTabs = document.querySelectorAll('.modal-overlay .transaction-type-tabs .tab');
    
    modalTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active from all tabs in this modal
            const parentModal = this.closest('.modal-overlay');
            const siblingTabs = parentModal.querySelectorAll('.transaction-type-tabs .tab');
            siblingTabs.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            this.classList.add('active');
            
            // Update current transaction type
            currentTransactionType = this.textContent.trim().toLowerCase();
            console.log('Transaction type selected:', currentTransactionType);
        });
    });
}

// Auth Form Submission
async function handleAuthSubmit(formData) {
    const email = document.querySelector('input[type="email"]')?.value;
    const password = document.querySelector('input[type="password"]')?.value;
    const fullName = document.querySelector('input[type="text"]')?.value;
    
    const isSignUp = document.querySelector('.auth-tabs .tab.active')?.textContent.trim() === 'Create Account';
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    showLoadingState();
    
    let result;
    if (isSignUp) {
        result = await signUpUser(email, password, fullName);
    } else {
        result = await signInUser(email, password);
    }
    
    hideLoadingState();
    
    if (!result.success) {
        alert('Error: ' + result.error);
    }
}

// Fixed Transaction Form Submission
async function handleTransactionSubmit(formData) {
    if (!currentUser) {
        alert('Please sign in first');
        return;
    }
    
    // Get the modal that contains the form
    const modal = document.querySelector('.modal-overlay.show') || 
                  document.getElementById('transaction-modal');
    
    if (!modal) {
        console.error('No active modal found');
        return;
    }
    
    // Get form inputs from the modal
    const amountInput = modal.querySelector('input[type="number"]');
    const categorySelect = modal.querySelector('select');
    const dateInput = modal.querySelector('input[type="date"]');
    const descriptionInput = modal.querySelector('input[type="text"]');
    
    const amount = amountInput?.value;
    const category = categorySelect?.value;
    const date = dateInput?.value;
    const description = descriptionInput?.value;
    
    // Validate
    if (!amount || !category || !date || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    const transaction = {
        amount: amount,
        category: category,
        date: date,
        description: description,
        type: currentTransactionType
    };
    
    console.log('Submitting transaction:', transaction);
    
    showLoadingState();
    const result = await addTransaction(currentUser.uid, transaction);
    hideLoadingState();
    
    if (result.success) {
        // Close modal
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Reload transactions
        await loadUserData();
        alert('Transaction added successfully!');
    } else {
        alert('Error adding transaction: ' + result.error);
    }
}

// Search Functionality
function initSearch() {
    const searchInput = document.querySelector('.search-section input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterTransactions(searchTerm);
        });
    }
}

function filterTransactions(searchTerm) {
    const transactionItems = document.querySelectorAll('.transaction-item');
    
    transactionItems.forEach(transaction => {
        const name = transaction.querySelector('.transaction-name')?.textContent.toLowerCase();
        const category = transaction.querySelector('.transaction-category')?.textContent.toLowerCase();
        
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            transaction.style.display = 'flex';
        } else {
            transaction.style.display = 'none';
        }
    });
}

// Filter Functionality
function initFilters() {
    const filterSelect = document.querySelector('.filter-section select');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function(e) {
            const category = e.target.value;
            filterByCategory(category);
        });
    }
}

function filterByCategory(category) {
    const transactionItems = document.querySelectorAll('.transaction-item');
    
    transactionItems.forEach(transaction => {
        const transactionCategory = transaction.querySelector('.transaction-category')?.textContent;
        
        if (category === 'All Categories' || transactionCategory === category) {
            transaction.style.display = 'flex';
        } else {
            transaction.style.display = 'none';
        }
    });
}

// File Upload
function initFileUpload() {
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    console.log('File selected:', file.name);
                    uploadArea.querySelector('p').textContent = file.name;
                }
            });
            
            input.click();
        });
    }
}

// Export CSV
function exportToCSV() {
    let csv = 'Name,Category,Amount,Date,Type\n';
    
    transactions.forEach(transaction => {
        csv += `${transaction.description},${transaction.category},${transaction.amount},${transaction.date},${transaction.type}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

const exportBtn = document.querySelector('.btn-primary.full-width');
if (exportBtn && exportBtn.textContent.includes('Export')) {
    exportBtn.addEventListener('click', exportToCSV);
}

// Settings Form
const settingsInputs = document.querySelectorAll('.settings-section input, .settings-section select');
settingsInputs.forEach(input => {
    input.addEventListener('change', async function() {
        if (!currentUser) return;
        
        const updates = {};
        if (this.name === 'name' || this.id === 'name') {
            updates.name = this.value;
        }
        
        if (Object.keys(updates).length > 0) {
            const result = await updateUserProfile(currentUser.uid, updates);
            if (result.success) {
                console.log('Profile updated');
            }
        }
    });
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768) {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }, 250);
});

// ==========================================
// RENDER TRANSACTIONS
// ==========================================

function renderTransactions() {
    const transactionList = document.querySelector('.transaction-list');
    if (!transactionList) return;
    
    if (transactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">No transactions yet. Add your first transaction!</p>';
        return;
    }
    
    transactionList.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const amountClass = transaction.type === 'income' ? 'positive' : 'negative';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon">${transaction.type === 'income' ? '↗' : '🏷️'}</div>
                <div class="transaction-details">
                    <div class="transaction-name">${transaction.description}</div>
                    <div class="transaction-category">${transaction.category}</div>
                </div>
                <div class="transaction-amount ${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</div>
                <div class="transaction-date">${formattedDate}</div>
            </div>
        `;
    }).join('');
}

// ==========================================
// CATEGORIES PAGE
// ==========================================

function renderCategories() {
    const incomeContainer = document.getElementById('income-categories');
    const expenseContainer = document.getElementById('expense-categories');
    
    if (!incomeContainer || !expenseContainer) return;
    
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    const incomeCount = document.getElementById('income-count');
    const expenseCount = document.getElementById('expense-count');
    if (incomeCount) incomeCount.textContent = `(${incomeCategories.length})`;
    if (expenseCount) expenseCount.textContent = `(${expenseCategories.length})`;
    
    if (incomeCategories.length === 0) {
        incomeContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h3>No Income Categories</h3>
                <p>Add your first income category to get started</p>
            </div>
        `;
    } else {
        incomeContainer.innerHTML = incomeCategories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color" style="background: ${category.color};"></div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-badge income">Income</span>
                </div>
                <div class="category-actions">
                    <button class="icon-btn" onclick="window.editCategoryHandler('${category.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="window.openDeleteModalHandler('${category.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    if (expenseCategories.length === 0) {
        expenseContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <h3>No Expense Categories</h3>
                <p>Add your first expense category to get started</p>
            </div>
        `;
    } else {
        expenseContainer.innerHTML = expenseCategories.map(category => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-color" style="background: ${category.color};"></div>
                    <span class="category-name">${category.name}</span>
                    <span class="category-badge expense">Expense</span>
                </div>
                <div class="category-actions">
                    <button class="icon-btn" onclick="window.editCategoryHandler('${category.id}')" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="icon-btn delete" onclick="window.openDeleteModalHandler('${category.id}')" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Global handlers for categories
window.openAddCategoryModal = function(type = 'expense') {
    const modal = document.getElementById('category-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('category-form');
    const typeSelect = document.getElementById('category-type');
    
    if (!modal || !form) return;
    
    currentEditId = null;
    form.reset();
    modalTitle.textContent = 'Add Category';
    typeSelect.value = type;
    modal.style.display = 'flex';
};

window.closeCategoryModal = function() {
    const modal = document.getElementById('category-modal');
    if (modal) modal.style.display = 'none';
    currentEditId = null;
};

window.editCategoryHandler = function(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const modal = document.getElementById('category-modal');
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('category-name');
    const typeSelect = document.getElementById('category-type');
    
    if (!modal) return;
    
    currentEditId = id;
    modalTitle.textContent = 'Edit Category';
    nameInput.value = category.name;
    typeSelect.value = category.type;
    
    const colorInputs = document.querySelectorAll('input[name="color"]');
    colorInputs.forEach(input => {
        if (input.value === category.color) {
            input.checked = true;
        }
    });
    
    modal.style.display = 'flex';
};

window.openDeleteModalHandler = function(id) {
    categoryToDelete = id;
    const modal = document.getElementById('delete-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.style.display = 'none';
    categoryToDelete = null;
};

window.confirmDeleteCategory = async function() {
    if (categoryToDelete === null || !currentUser) return;
    
    showLoadingState();
    const result = await deleteCategory(currentUser.uid, categoryToDelete);
    hideLoadingState();
    
    if (result.success) {
        await loadUserData();
        window.closeDeleteModal();
    } else {
        alert('Error deleting category: ' + result.error);
    }
};

function initCategoryForm() {
    const form = document.getElementById('category-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please sign in first');
            return;
        }
        
        const name = document.getElementById('category-name').value.trim();
        const type = document.getElementById('category-type').value;
        const colorInput = document.querySelector('input[name="color"]:checked');
        const color = colorInput ? colorInput.value : '#10b981';
        
        if (!name) {
            alert('Please enter a category name');
            return;
        }
        
        showLoadingState();
        
        if (currentEditId) {
            const result = await updateCategory(currentUser.uid, currentEditId, { name, type, color });
            hideLoadingState();
            
            if (result.success) {
                await loadUserData();
                window.closeCategoryModal();
            } else {
                alert('Error updating category: ' + result.error);
            }
        } else {
            const result = await addCategory(currentUser.uid, { name, type, color });
            hideLoadingState();
            
            if (result.success) {
                await loadUserData();
                window.closeCategoryModal();
            } else {
                alert('Error adding category: ' + result.error);
            }
        }
    });
}

function loadCategoriesIntoDropdowns() {
    const categorySelects = document.querySelectorAll('.filter-section select, .modal-dialog select');
    
    if (categorySelects.length === 0) return;
    
    categorySelects.forEach(select => {
        const isFilterDropdown = select.closest('.filter-section');
        
        if (isFilterDropdown) {
            const currentValue = select.value;
            select.innerHTML = '<option>All Categories</option>' + 
                categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            select.value = currentValue || 'All Categories';
        } else {
            const currentValue = select.value;
            select.innerHTML = categories.map(c => 
                `<option value="${c.name}">${c.name}</option>`
            ).join('');
            if (currentValue && categories.find(c => c.name === currentValue)) {
                select.value = currentValue;
            }
        }
    });
}

function initCategoriesPage() {
    if (!document.getElementById('income-categories')) return;
    
    initCategoryForm();
    
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closeCategoryModal();
            }
        });
    }
    
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                window.closeDeleteModal();
            }
        });
    }
}

function initProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    const profileContainer = document.querySelector('.profile-container .profile-dropdown');
    
    if (profileBtn && profileContainer) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            profileContainer.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-container')) {
                profileContainer.classList.remove('active');
            }
        });
        
        const profileSignoutBtn = document.querySelector('.profile-signout-btn');
        if (profileSignoutBtn) {
            profileSignoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const signoutModal = document.querySelector('.signout-modal');
                if (signoutModal) {
                    signoutModal.classList.add('show');
                    signoutModal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    profileContainer.classList.remove('active');
                }
            });
        }
    }
}

console.log('Finance Tracker with Firebase initialized!');