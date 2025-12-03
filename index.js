// ==========================================
// FINANCE TRACKER - COMPLETE JAVASCRIPT
// ==========================================

// ==========================================
// 1. DATA STRUCTURE & STATE MANAGEMENT
// ==========================================

let currentUser = null;
let transactions = [];
let currentPage = 'landing';
let currentAuthTab = 'signin';
let currentTransactionType = 'expense';

// Sample data for demonstration
const sampleTransactions = [
    { id: 1, type: 'income', amount: 5000, category: 'Salary', date: '2024-11-29', description: 'Monthly Salary', icon: '↗' },
    { id: 2, type: 'expense', amount: 4.50, category: 'Food', date: '2024-11-30', description: 'Coffee Shop', icon: '🍴' },
    { id: 3, type: 'expense', amount: 89.32, category: 'Food', date: '2024-12-01', description: 'Grocery Store', icon: '🍴' },
    { id: 4, type: 'expense', amount: 15.99, category: 'Entertainment', date: '2024-12-01', description: 'Netflix Subscription', icon: '📺' },
    { id: 5, type: 'income', amount: 1200, category: 'Freelance', date: '2024-11-26', description: 'Freelance Project', icon: '💼' },
    { id: 6, type: 'expense', amount: 45, category: 'Transportation', date: '2024-11-28', description: 'Gas Station', icon: '🚗' }
];

// LocalStorage keys
const STORAGE_KEYS = {
    USER: 'financeTracker_user',
    TRANSACTIONS: 'financeTracker_transactions'
};

// Load data from localStorage
function loadUserData() {
    try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('User data loaded:', currentUser);
        }
        
        if (savedTransactions) {
            transactions = JSON.parse(savedTransactions);
            console.log('Transactions loaded:', transactions.length);
        } else {
            // Load sample data if no saved data
            transactions = [...sampleTransactions];
        }
        
        // Update UI if on dashboard
        updateDashboard();
        updateTransactionList();
    } catch (error) {
        console.warn('Error loading user data:', error);
        transactions = [...sampleTransactions];
    }
}

// Save data to localStorage
function saveUserData() {
    try {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        }
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
        console.warn('Error saving user data:', error);
    }
}

// ==========================================
// 2. UTILITY FUNCTIONS
// ==========================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCategoryIcon(category) {
    const icons = {
        'Salary': '↗',
        'Freelance': '💼',
        'Food': '🍴',
        'Entertainment': '📺',
        'Transportation': '🚗',
        'Utilities': '💡',
        'Shopping': '🛍️',
        'Health': '🏥',
        'Other': '📝'
    };
    return icons[category] || '📝';
}

function showPage(pageName) {
    // Only use this for single-page navigation
    // Skip if pages are already split into separate HTML files
    const allContainers = document.querySelectorAll('.landing-page, .modal-page, .app-container');
    if (allContainers.length <= 1) {
        console.log('Pages appear to be split - skipping showPage');
        return;
    }
    
    document.querySelectorAll('.landing-page, .modal-page, .app-container').forEach(el => {
        el.style.display = 'none';
    });
    
    currentPage = pageName;
    
    if (pageName === 'landing') {
        const landing = document.querySelector('.landing-page');
        if (landing) landing.style.display = 'flex';
    } else if (pageName === 'dashboard' || pageName === 'transactions' || pageName === 'analytics' || pageName === 'settings') {
        const appContainers = document.querySelectorAll('.app-container');
        const pageIndex = { 'dashboard': 0, 'transactions': 1, 'analytics': 2, 'settings': 4 };
        if (appContainers[pageIndex[pageName]]) {
            appContainers[pageIndex[pageName]].style.display = 'flex';
        }
    }
}

// ==========================================
// 3. AUTHENTICATION FUNCTIONALITY
// ==========================================

function initAuth() {
    // Auth tab switching
    const authTabs = document.querySelectorAll('.auth-tabs .tab');
    if (authTabs.length === 0) return; // No auth tabs on this page
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const parent = this.closest('.auth-tabs');
            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const isSignIn = this.textContent.includes('Sign In');
            currentAuthTab = isSignIn ? 'signin' : 'signup';
        });
    });
    
    // Handle form submissions
    document.querySelectorAll('form').forEach(form => {
        if (form.closest('.landing-page') || form.closest('.modal-page') || form.closest('.right-section')) {
            form.addEventListener('submit', handleAuth);
        }
    });
}

function handleAuth(e) {
    e.preventDefault();
    
    const form = e.target;
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    
    if (!emailInput || !passwordInput) return;
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    // Basic validation
    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (currentAuthTab === 'signup' && password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    // Simulate successful authentication
    currentUser = {
        name: form.querySelector('input[type="text"]')?.value || 'User',
        email: email
    };
    
    // Load sample data
    transactions = [...sampleTransactions];
    
    // Save to localStorage
    saveUserData();
    
    // Navigate to dashboard (works for split pages)
    window.location.href = 'Dashboard.html'; // 
}

// ==========================================
// 4. DASHBOARD FUNCTIONALITY
// ==========================================

function updateDashboard() {
    if (!currentUser) return;
    
    // Update welcome message
    const welcomeMsg = document.querySelector('.page-header h1');
    if (welcomeMsg && welcomeMsg.textContent.includes('Welcome')) {
        welcomeMsg.textContent = `Welcome back, ${currentUser.name}!`;
    }
    
    // Calculate statistics
    const stats = calculateStats();
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length >= 3) {
        statCards[0].textContent = formatCurrency(stats.balance);
        statCards[1].textContent = formatCurrency(stats.monthIncome);
        statCards[2].textContent = formatCurrency(stats.monthExpense);
    }
    
    // Update recent transactions
    updateTransactionList();
}

function calculateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let totalIncome = 0;
    let totalExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    
    transactions.forEach(t => {
        const transDate = new Date(t.date);
        const amount = parseFloat(t.amount);
        
        if (t.type === 'income') {
            totalIncome += amount;
            if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
                monthIncome += amount;
            }
        } else {
            totalExpense += amount;
            if (transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear) {
                monthExpense += amount;
            }
        }
    });
    
    return {
        balance: totalIncome - totalExpense,
        monthIncome,
        monthExpense,
        totalIncome,
        totalExpense
    };
}

function updateTransactionList(filterCategory = 'All Categories', searchTerm = '') {
    const transactionLists = document.querySelectorAll('.transaction-list');
    
    transactionLists.forEach(list => {
        // Filter transactions
        let filteredTransactions = transactions.filter(t => {
            const matchesCategory = filterCategory === 'All Categories' || t.category === filterCategory;
            const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 t.category.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limit to 5 on dashboard
        if (list.closest('.app-container') && list.closest('.app-container').querySelector('.page-header h1')?.textContent.includes('Welcome')) {
            filteredTransactions = filteredTransactions.slice(0, 5);
        }
        
        // Generate HTML
        list.innerHTML = filteredTransactions.map(t => `
            <div class="transaction-item" data-id="${t.id}">
                <div class="transaction-icon">${t.icon}</div>
                <div class="transaction-details">
                    <div class="transaction-name">${t.description}</div>
                    <div class="transaction-category">${t.category}</div>
                </div>
                <div class="transaction-amount ${t.type === 'income' ? 'positive' : 'negative'}">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
                <div class="transaction-date">${formatDate(t.date)}</div>
            </div>
        `).join('');
    });
}

// ==========================================
// 5. TRANSACTION MANAGEMENT
// ==========================================

function initTransactionModal() {
    // Transaction type tabs
    document.querySelectorAll('.transaction-type-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const parent = this.closest('.transaction-type-tabs');
            parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentTransactionType = this.textContent.toLowerCase();
        });
    });
    
    // Add transaction buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Add Transaction')) {
            btn.addEventListener('click', openTransactionModal);
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Modal form submission
    const transactionForm = document.querySelector('.modal-overlay form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleAddTransaction);
    }
    
    // Cancel button
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Cancel')) {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal-overlay');
                if (modal) modal.style.display = 'none';
            });
        }
    });
}

function openTransactionModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
        // Set today's date
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
}

function handleAddTransaction(e) {
    e.preventDefault();
    
    const form = e.target;
    const amount = parseFloat(form.querySelector('input[type="number"]').value);
    const category = form.querySelector('select').value;
    const date = form.querySelector('input[type="date"]').value;
    const description = form.querySelector('input[placeholder*="Grocery"]')?.value || form.querySelector('input[type="text"]')?.value;
    
    if (!amount || !category || !date || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    const newTransaction = {
        id: Date.now(),
        type: currentTransactionType,
        amount: amount,
        category: category,
        date: date,
        description: description,
        icon: getCategoryIcon(category)
    };
    
    transactions.unshift(newTransaction);
    
    // Save to localStorage
    saveUserData();
    
    // Close modal
    form.closest('.modal-overlay').style.display = 'none';
    
    // Update UI
    updateDashboard();
    updateTransactionList();
    
    // Show success message
    alert('Transaction added successfully!');
}

// ==========================================
// 6. FILTERS & SEARCH
// ==========================================

function initFilters() {
    // Search input
    document.querySelectorAll('.search-section input').forEach(input => {
        input.addEventListener('input', function() {
            const filterSelect = document.querySelector('.filter-section select');
            const category = filterSelect ? filterSelect.value : 'All Categories';
            updateTransactionList(category, this.value);
        });
    });
    
    // Category filter
    document.querySelectorAll('.filter-section select').forEach(select => {
        select.addEventListener('change', function() {
            const searchInput = document.querySelector('.search-section input');
            const searchTerm = searchInput ? searchInput.value : '';
            updateTransactionList(this.value, searchTerm);
        });
    });
}

// ==========================================
// 7. NAVIGATION
// ==========================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length === 0) return; // No navigation on this page
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            
            if (href === '#signout') {
                openSignOutModal();
                return;
            }
            
            // Update active state
            const nav = this.closest('nav');
            if (nav) {
                nav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
            
            // Navigate to page (for split pages, change the actual page)
            const page = href.replace('#', '');
            
            // Check if we're using split pages (separate HTML files)
            const pageMap = {
                'Dashboard': 'Dashboard.html',
                'Transactions': 'transactions.html',
                'Analytics': 'analytics.html',
                'Settings': 'settings.html'
            };
            
            if (pageMap[page]) {
                window.location.href = pageMap[page];
            } else {
                // Fallback for single-page navigation
                showPage(page);
                
                if (page === 'Dashboard') {
                    updateDashboard();
                } else if (page === 'Transactions') {
                    updateTransactionList();
                } else if (page === 'Analytics') {
                    updateAnalytics();
                }
            }
        });
    });
}

// ==========================================
// 8. SIGN OUT FUNCTIONALITY
// ==========================================

function openSignOutModal() {
    const modal = document.getElementById('signout-overlay');
    if (modal) modal.style.display = 'flex';
}

function initSignOut() {
    const cancelBtn = document.getElementById('cancel-signout');
    const confirmBtn = document.getElementById('confirm-signout');
    const overlay = document.getElementById('signout-overlay');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (overlay) overlay.style.display = 'none';
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            currentUser = null;
            transactions = [];
            
            // Clear localStorage
            localStorage.removeItem(STORAGE_KEYS.USER);
            localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
            
            if (overlay) overlay.style.display = 'none';
            
            // Navigate to landing/login page
            window.location.href = 'LandingPage.html'; 
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    }
}

// ==========================================
// 9. ANALYTICS PAGE
// ==========================================

function updateAnalytics() {
    const stats = calculateStats();
    
    // Calculate category totals
    const categoryTotals = {};
    transactions.forEach(t => {
        if (t.type === 'expense') {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
        }
    });
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    
    // Update analytics stats
    const analyticsStats = document.querySelectorAll('.app-container')[2]?.querySelectorAll('.stat-value');
    if (analyticsStats && analyticsStats.length >= 3) {
        analyticsStats[0].textContent = topCategory ? formatCurrency(topCategory[1]) : '$0.00';
        analyticsStats[1].textContent = formatCurrency(stats.totalIncome);
        analyticsStats[2].textContent = formatCurrency(stats.totalExpense);
    }
}

// ==========================================
// 10. SETTINGS PAGE
// ==========================================

function initSettings() {
    // Export CSV button
    document.querySelectorAll('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Export')) {
            btn.addEventListener('click', exportTransactionsCSV);
        }
    });
    
    // Delete account button
    document.querySelectorAll('.btn-danger').forEach(btn => {
        if (btn.textContent.includes('Delete Account')) {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    alert('Account deletion would be processed here');
                }
            });
        }
    });
}

function exportTransactionsCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const rows = transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ==========================================
// 11. RESPONSIVE MOBILE MENU
// ==========================================

function initMobileMenu() {
    const menuBtn = document.querySelector('.menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeBtn = mobileMenu?.querySelector('.close-btn');
    
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.style.display = 'flex';
        });
    }
    
    if (closeBtn && mobileMenu) {
        closeBtn.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
        });
    }
}

// ==========================================
// 12. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Finance Tracker loading...');
    
    // Detect current page and initialize accordingly
    detectAndInitPage();
    
    // Initialize all modules safely (with error handling)
    safeInit(initAuth, 'Auth');
    safeInit(initNavigation, 'Navigation');
    safeInit(initTransactionModal, 'Transaction Modal');
    safeInit(initFilters, 'Filters');
    safeInit(initSignOut, 'Sign Out');
    safeInit(initSettings, 'Settings');
    safeInit(initMobileMenu, 'Mobile Menu');
    
    console.log('Finance Tracker initialized successfully!');
});

// Safe initialization wrapper
function safeInit(initFunction, name) {
    try {
        initFunction();
    } catch (error) {
        console.warn(`Failed to initialize ${name}:`, error);
    }
}

// Detect which page we're on and initialize appropriately
function detectAndInitPage() {
    // Check if we're on landing page
    if (document.querySelector('.landing-page')) {
        console.log('Landing page detected');
        // Don't call showPage for split pages
    }
    // Check if we're on dashboard/app pages
    else if (document.querySelector('.app-container')) {
        console.log('App page detected');
        // Load user data if exists
        loadUserData();
    }
    // Check if we're on modal page
    else if (document.querySelector('.modal-page')) {
        console.log('Modal page detected');
    }
}