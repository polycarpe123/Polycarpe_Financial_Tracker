// Finance Tracker JavaScript - INSTANT LOADING VERSION

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
let transactionToDelete = null;
let isDataLoaded = false;
let userProfile = null;

// ==========================================
// AUTH STATE OBSERVER - INSTANT LOAD
// ==========================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log('✅ User signed in:', user.email);
        
        // If on landing page, redirect to dashboard
        if (document.querySelector('.landing-page')) {
            window.location.href = 'Dashboard.html';
            return;
        }
        
        // Display user info INSTANTLY
        displayUserFromAuth(user);
        
        // Load data silently in background (no loading indicator)
        if (!isDataLoaded) {
            loadUserDataSilently();
        }
    } else {
        currentUser = null;
        console.log('❌ User signed out');
        
        if (!document.querySelector('.landing-page')) {
            window.location.href = 'index.html';
        }
    }
});

// ==========================================
// SILENT DATA LOADING (NO INDICATORS)
// ==========================================

async function loadUserDataSilently() {
    if (!currentUser) return;
    
    try {
        console.log('📊 Loading data silently...');
        
        // Load user profile
        const profileResult = await getUserProfile(currentUser.uid);
        if (profileResult.success) {
            userProfile = profileResult.data;
            updateUIWithUserProfile(userProfile);
        } else {
            // Create missing profile
            userProfile = {
                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                email: currentUser.email,
                currency: 'USD',
                notifications: true
            };
            await updateUserProfile(currentUser.uid, userProfile);
            updateUIWithUserProfile(userProfile);
        }
        
        // Load categories
        const categoriesResult = await getCategories(currentUser.uid);
        if (categoriesResult.success) {
            categories = categoriesResult.data;
            
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
        
        isDataLoaded = true;
        console.log('✅ Data loaded silently');
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// ==========================================
// UI UPDATE FUNCTIONS
// ==========================================

function updateUIWithUserProfile(profile) {
    const topNavUserName = document.getElementById('topNavUserName');
    if (topNavUserName) topNavUserName.textContent = profile.name || profile.email?.split('@')[0] || 'User';
    
    const topNavUserEmail = document.getElementById('topNavUserEmail');
    if (topNavUserEmail) topNavUserEmail.textContent = profile.email || '';
    
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (dropdownUserName) dropdownUserName.textContent = profile.name || profile.email?.split('@')[0] || 'User';
    
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    if (dropdownUserEmail) dropdownUserEmail.textContent = profile.email || '';
    
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.value = profile.name || '';
    
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.value = profile.email || '';
    
    const currencySelect = document.getElementById('currency');
    if (currencySelect && profile.currency) currencySelect.value = profile.currency;
}

function displayUserFromAuth(user) {
    const displayName = user.displayName || user.email?.split('@')[0] || 'User';
    const email = user.email || '';
    
    const topNavUserName = document.getElementById('topNavUserName');
    if (topNavUserName) topNavUserName.textContent = displayName;
    
    const topNavUserEmail = document.getElementById('topNavUserEmail');
    if (topNavUserEmail) topNavUserEmail.textContent = email;
    
    const dropdownUserName = document.getElementById('dropdownUserName');
    if (dropdownUserName) dropdownUserName.textContent = displayName;
    
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    if (dropdownUserEmail) dropdownUserEmail.textContent = email;
}

function updateDashboardStats() {
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
    
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = `$${totalBalance.toFixed(2)}`;
        statValues[1].textContent = `$${monthlyIncome.toFixed(2)}`;
        statValues[2].textContent = `$${monthlyExpense.toFixed(2)}`;
    }
}

// Simple loading for user actions only (not page load)
function showActionLoading() {
    const existing = document.getElementById('action-loading');
    if (existing) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'action-loading';
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
    loadingDiv.innerHTML = `
        <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #10b981; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loadingDiv);
}

function hideActionLoading() {
    const loadingDiv = document.getElementById('action-loading');
    if (loadingDiv) loadingDiv.remove();
}

// ==========================================
// INITIALIZATION - NO LOADING SCREEN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing app...');
    
    // Initialize all features immediately
    initAuthTabs();
    initMobileMenu();
    initModals();
    initAuthForms();
    initSearch();
    initFilters();
    initProfileDropdown();
    initCategoriesPage();
    initFileUpload();
    initSettingsPage();
    
    // Initialize transaction modal
    setTimeout(() => {
        initTransactionModal();
        console.log('✅ Transaction modal initialized');
    }, 100);
});

// ==========================================
// TRANSACTION MODAL
// ==========================================

function initTransactionModal() {
    console.log('Initializing transaction modal...');
    
    const addBtns = document.querySelectorAll('.btn-primary, #add-transaction-btn');
    addBtns.forEach(btn => {
        if (btn.textContent.includes('Add Transaction') || btn.id === 'add-transaction-btn') {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Add Transaction button clicked');
                openTransactionModal();
            });
        }
    });
    
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        const tabs = modal.querySelectorAll('.transaction-type-tabs .tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(e) {
                e.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentTransactionType = this.textContent.trim().toLowerCase();
            });
        });
        
        const form = modal.querySelector('form');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            newForm.addEventListener('submit', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleTransactionSubmit();
            });
        }
        
        const closeBtns = modal.querySelectorAll('.close-btn, .close-modal-btn');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                closeTransactionModal();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeTransactionModal();
        });
    }
}

function openTransactionModal(transactionId = null) {
    const modal = document.getElementById('transaction-modal');
    if (!modal) return;
    
    const modalTitle = modal.querySelector('.modal-header h2');
    const form = modal.querySelector('form');
    
    if (transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        currentEditId = transactionId;
        if (modalTitle) modalTitle.textContent = 'Edit Transaction';
        
        modal.querySelector('#transaction-amount').value = transaction.amount;
        modal.querySelector('#transaction-category').value = transaction.category;
        modal.querySelector('#transaction-date').value = new Date(transaction.date).toISOString().split('T')[0];
        modal.querySelector('#transaction-description').value = transaction.description;
        
        currentTransactionType = transaction.type;
        const tabs = modal.querySelectorAll('.transaction-type-tabs .tab');
        tabs.forEach(tab => {
            if (tab.textContent.trim().toLowerCase() === transaction.type) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Transaction';
    } else {
        currentEditId = null;
        if (form) form.reset();
        if (modalTitle) modalTitle.textContent = 'Add Transaction';
        
        const dateInput = modal.querySelector('#transaction-date');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        
        currentTransactionType = 'expense';
        const tabs = modal.querySelectorAll('.transaction-type-tabs .tab');
        tabs.forEach(tab => {
            if (tab.textContent.trim().toLowerCase() === 'expense') {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add Transaction';
    }
    
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function handleTransactionSubmit() {
    if (!currentUser) {
        alert('Please sign in first');
        return;
    }
    
    const amountInput = document.getElementById('transaction-amount');
    const categorySelect = document.getElementById('transaction-category');
    const dateInput = document.getElementById('transaction-date');
    const descriptionInput = document.getElementById('transaction-description');
    
    if (!amountInput || !categorySelect || !dateInput || !descriptionInput) {
        alert('Form error - please refresh the page');
        return;
    }
    
    const amount = amountInput.value.trim();
    const category = categorySelect.value.trim();
    const date = dateInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!amount || !category || !date || !description) {
        alert('Please fill in all fields');
        return;
    }
    
    const numAmount = parseFloat(amount);
    if (numAmount <= 0 || isNaN(numAmount)) {
        alert('Amount must be greater than 0');
        return;
    }
    
    const transaction = {
        amount: numAmount,
        category: category,
        date: date,
        description: description,
        type: currentTransactionType
    };
    
    showActionLoading();
    
    try {
        let result;
        
        if (currentEditId) {
            result = await updateTransaction(currentUser.uid, currentEditId, transaction);
        } else {
            result = await addTransaction(currentUser.uid, transaction);
        }
        
        if (result.success) {
            closeTransactionModal();
            await loadUserDataSilently();
            hideActionLoading();
            alert(currentEditId ? 'Transaction updated!' : 'Transaction added!');
            currentEditId = null;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        hideActionLoading();
        alert('Error: ' + error.message);
    }
}

// ==========================================
// AUTH TABS
// ==========================================

function initAuthTabs() {
    const authTabs = document.querySelectorAll('.auth-tabs .tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            authTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ==========================================
// MOBILE MENU
// ==========================================

function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = mobileMenu?.querySelector('.close-btn');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    const mobileNavItems = mobileMenu?.querySelectorAll('.nav-item:not(.sign-out)');
    mobileNavItems?.forEach(item => {
        item.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    const mobileUserIcon = document.querySelector('.mobile-user-icon');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (mobileUserIcon && profileDropdown) {
        mobileUserIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mobile-user-icon') && 
                !e.target.closest('.profile-dropdown')) {
                profileDropdown.classList.remove('show');
            }
        });
    }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================

function initModals() {
    const signOutBtns = document.querySelectorAll('.sign-out, .nav-item.sign-out, .profile-signout-btn');
    signOutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const signoutModal = document.querySelector('.signout-modal');
            if (signoutModal) {
                signoutModal.classList.add('show');
                signoutModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    const closeBtns = document.querySelectorAll('.signout-modal .btn-secondary');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = document.querySelector('.signout-modal');
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && overlay.classList.contains('signout-modal')) {
                overlay.classList.remove('show');
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    const confirmSignOutBtn = document.querySelector('.signout-modal .btn-danger');
    if (confirmSignOutBtn) {
        confirmSignOutBtn.addEventListener('click', async () => {
            showActionLoading();
            const result = await signOutUser();
            hideActionLoading();
            
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                alert('Error signing out: ' + result.error);
            }
        });
    }
}

// ==========================================
// AUTH FORMS
// ==========================================

function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignIn(loginForm);
        });
    }
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignUp(signupForm);
        });
    }
    
    const googleBtn = document.querySelector('button[type="button"]');
    if (googleBtn && googleBtn.textContent.includes('Google')) {
        googleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            showActionLoading();
            const result = await signInWithGoogle();
            hideActionLoading();
            
            if (!result.success) {
                alert('Error signing in with Google: ' + result.error);
            }
        });
    }
}

async function handleSignIn(form) {
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    showActionLoading();
    const result = await signInUser(email, password);
    hideActionLoading();
    
    if (!result.success) {
        let errorMessage = result.error;
        if (errorMessage.includes('wrong-password') || errorMessage.includes('user-not-found') || errorMessage.includes('invalid-credential')) {
            errorMessage = 'Invalid email or password.';
        }
        alert('Error: ' + errorMessage);
    }
}

async function handleSignUp(form) {
    const nameInput = form.querySelector('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    
    const fullName = nameInput?.value?.trim();
    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;
    
    if (!email || !password || !fullName) {
        alert('Please fill in all fields');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    showActionLoading();
    const result = await signUpUser(email, password, fullName);
    hideActionLoading();
    
    if (!result.success) {
        let errorMessage = result.error;
        if (errorMessage.includes('email-already-in-use')) {
            errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (errorMessage.includes('weak-password')) {
            errorMessage = 'Password is too weak. Please use a stronger password.';
        }
        alert('Error: ' + errorMessage);
    }
}

// ==========================================
// SEARCH AND FILTER
// ==========================================

function initSearch() {
    const searchInput = document.querySelector('.search-section input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterTransactions(searchTerm);
        });
    }
}

function filterTransactions(searchTerm) {
    const transactionItems = document.querySelectorAll('.transaction-item');
    transactionItems.forEach(item => {
        const name = item.querySelector('.transaction-name')?.textContent.toLowerCase() || '';
        const category = item.querySelector('.transaction-category')?.textContent.toLowerCase() || '';
        
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function initFilters() {
    const filterSelect = document.querySelector('.filter-section select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const category = e.target.value;
            filterByCategory(category);
        });
    }
}

function filterByCategory(category) {
    const transactionItems = document.querySelectorAll('.transaction-item');
    transactionItems.forEach(item => {
        const transactionCategory = item.querySelector('.transaction-category')?.textContent || '';
        
        if (category === 'All Categories' || transactionCategory === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ==========================================
// PROFILE DROPDOWN
// ==========================================

function initProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    const profileContainer = document.querySelector('.profile-container .profile-dropdown');
    
    if (profileBtn && profileContainer) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileContainer.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.profile-container')) {
                profileContainer.classList.remove('active');
            }
        });
    }
}

// ==========================================
// FILE UPLOAD
// ==========================================

function initFileUpload() {
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const p = uploadArea.querySelector('p');
                    if (p) p.textContent = `Selected: ${file.name}`;
                }
            });
            
            input.click();
        });
    }
}

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
        const icon = transaction.type === 'income' ? '↗' : '🏷️';
        
        return `
    <div class="transaction-item" data-id="${transaction.id}">
        <div class="transaction-icon">${icon}</div>
        <div class="transaction-details">
            <div class="transaction-name">${transaction.description}</div>
            <div class="transaction-category">${transaction.category}</div>
        </div>
        <div class="transaction-amount ${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</div>
        <div class="transaction-date">${formattedDate}</div>
        <div class="transaction-actions" style="display: flex; gap: 8px; margin-left: 12px;">
            <button class="icon-btn" onclick="window.editTransactionHandler('${transaction.id}')" title="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="icon-btn delete" onclick="window.openDeleteTransactionModal('${transaction.id}')" title="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    </div>
`;
    }).join('');
}

// ==========================================
// CATEGORIES
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
                <h3>No Income Categories</h3>
                <p>Add your first income category to get started</p>
            </div>
        `;
    } else {
        incomeContainer.innerHTML = incomeCategories.map(category => renderCategoryItem(category)).join('');
    }
    
    if (expenseCategories.length === 0) {
        expenseContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Expense Categories</h3>
                <p>Add your first expense category to get started</p>
            </div>
        `;
    } else {
        expenseContainer.innerHTML = expenseCategories.map(category => renderCategoryItem(category)).join('');
    }
}

function renderCategoryItem(category) {
    const badgeClass = category.type === 'income' ? 'income' : 'expense';
    const badgeText = category.type === 'income' ? 'Income' : 'Expense';
    
    return `
        <div class="category-item">
            <div class="category-info">
                <div class="category-color" style="background: ${category.color};"></div>
                <span class="category-name">${category.name}</span>
                <span class="category-badge ${badgeClass}">${badgeText}</span>
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
    `;
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
    document.body.style.overflow = 'hidden';
};

window.closeCategoryModal = function() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
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
        input.checked = (input.value === category.color);
    });
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.openDeleteModalHandler = function(id) {
    categoryToDelete = id;
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeDeleteModal = function() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    categoryToDelete = null;
};

window.confirmDeleteCategory = async function() {
    if (categoryToDelete === null || !currentUser) return;
    
    showActionLoading();
    const result = await deleteCategory(currentUser.uid, categoryToDelete);
    hideActionLoading();
    
    if (result.success) {
        await loadUserDataSilently();
        window.closeDeleteModal();
        alert('Category deleted successfully!');
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
        
        const name = document.getElementById('category-name')?.value?.trim();
        const type = document.getElementById('category-type')?.value;
        const colorInput = document.querySelector('input[name="color"]:checked');
        const color = colorInput ? colorInput.value : '#10b981';
        
        if (!name) {
            alert('Please enter a category name');
            return;
        }
        
        showActionLoading();
        
        if (currentEditId) {
            const result = await updateCategory(currentUser.uid, currentEditId, { name, type, color });
            hideActionLoading();
            
            if (result.success) {
                await loadUserDataSilently();
                window.closeCategoryModal();
                alert('Category updated successfully!');
            } else {
                alert('Error updating category: ' + result.error);
            }
        } else {
            const result = await addCategory(currentUser.uid, { name, type, color });
            hideActionLoading();
            
            if (result.success) {
                await loadUserDataSilently();
                window.closeCategoryModal();
                alert('Category added successfully!');
            } else {
                alert('Error adding category: ' + result.error);
            }
        }
    });
}

function loadCategoriesIntoDropdowns() {
    const categorySelects = document.querySelectorAll('.filter-section select, #transaction-modal select');
    
    categorySelects.forEach(select => {
        const isFilterDropdown = select.closest('.filter-section');
        const currentValue = select.value;
        
        if (isFilterDropdown) {
            select.innerHTML = '<option>All Categories</option>' + 
                categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            if (currentValue) select.value = currentValue;
        } else {
            select.innerHTML = '<option value="">Select a category...</option>' +
                categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
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
            if (e.target === modal) window.closeCategoryModal();
        });
    }
    
    const deleteModal = document.getElementById('delete-modal');
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) window.closeDeleteModal();
        });
    }
}

// ==========================================
// SETTINGS PAGE
// ==========================================

function initSettingsPage() {
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
    
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.addEventListener('blur', async function() {
            if (!currentUser) return;
            const newName = this.value.trim();
            if (newName) {
                const result = await updateUserProfile(currentUser.uid, { name: newName });
                if (result.success) {
                    await loadUserDataSilently();
                }
            }
        });
    }
    
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', async function() {
            if (!currentUser) return;
            const result = await updateUserProfile(currentUser.uid, { currency: this.value });
            if (result.success) {
                console.log('Currency updated');
            }
        });
    }
}

function exportToCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    let csv = 'Date,Description,Category,Type,Amount\n';
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const desc = transaction.description.replace(/,/g, ';');
        csv += `${date},${desc},${transaction.category},${transaction.type},${transaction.amount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
}

// ==========================================
// TRANSACTION HANDLERS
// ==========================================

window.editTransactionHandler = function(id) {
    openTransactionModal(id);
};

window.openDeleteTransactionModal = function(id) {
    transactionToDelete = id;
    const modal = document.createElement('div');
    modal.id = 'delete-transaction-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-dialog small">
            <h2>Delete Transaction?</h2>
            <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeDeleteTransactionModal()">Cancel</button>
                <button class="btn-danger" onclick="confirmDeleteTransaction()">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};

window.closeDeleteTransactionModal = function() {
    const modal = document.getElementById('delete-transaction-modal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
    transactionToDelete = null;
};

window.confirmDeleteTransaction = async function() {
    if (!transactionToDelete || !currentUser) return;
    
    showActionLoading();
    const result = await deleteTransaction(currentUser.uid, transactionToDelete);
    hideActionLoading();
    
    if (result.success) {
        await loadUserDataSilently();
        closeDeleteTransactionModal();
        alert('Transaction deleted successfully!');
    } else {
        alert('Error deleting transaction: ' + result.error);
    }
};

console.log('✅ App initialized and ready!');