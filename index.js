// Finance Tracker JavaScript

// DOM Elements
const authTabs = document.querySelectorAll('.auth-tabs .tab');
const transactionTypeTabs = document.querySelectorAll('.transaction-type-tabs .tab');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuClose = document.querySelector('.mobile-menu .close-btn');
const modalOverlays = document.querySelectorAll('.modal-overlay');
const addTransactionBtns = document.querySelectorAll('.btn-primary');
const signOutBtns = document.querySelectorAll('.sign-out');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initAuthTabs();
    initTransactionTabs();
    initMobileMenu();
    initModals();
    initForms();
    initSearch();
    initFilters();
});

// Auth Tabs Functionality
function initAuthTabs() {
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            authTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Handle form switching (for pages with both sign in and create account)
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
    // Open mobile menu
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close mobile menu
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }
    
    // Close menu when clicking nav items
    const mobileNavItems = mobileMenu?.querySelectorAll('.nav-item');
    mobileNavItems?.forEach(item => {
        item.addEventListener('click', function() {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    // Profile dropdown toggle
const mobileUserIcon = document.querySelector('.mobile-user-icon');
const profileDropdown = document.querySelector('.profile-dropdown');

if (mobileUserIcon && profileDropdown) {
    mobileUserIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.mobile-user-icon') && !e.target.closest('.profile-dropdown')) {
            profileDropdown.classList.remove('show');
        }
    });
    
    // Handle sign out from dropdown
    const dropdownSignOut = profileDropdown.querySelector('.dropdown-signout');
    if (dropdownSignOut) {
        dropdownSignOut.addEventListener('click', function(e) {
            e.preventDefault();
            const signoutModal = document.querySelector('.signout-modal');
            if (signoutModal) {
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
    // Add Transaction Modal
    addTransactionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.textContent.includes('Add Transaction')) {
                e.preventDefault();
                const modal = document.querySelector('.modal-overlay:not(.signout-modal)');
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });
    
    // Sign Out Modal
    signOutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const signoutModal = document.querySelector('.signout-modal');
            if (signoutModal) {
                signoutModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close modals
    const closeBtns = document.querySelectorAll('.close-btn, .btn-secondary');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                e.preventDefault();
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close modal when clicking overlay
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Confirm sign out
    const confirmSignOut = document.querySelector('.signout-modal .btn-danger');
    if (confirmSignOut) {
        confirmSignOut.addEventListener('click', function() {
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }
}

// Form Handling
function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const formType = this.closest('.landing-page') ? 'auth' : 'transaction';
            
            if (formType === 'auth') {
                handleAuthSubmit(formData);
            } else {
                handleTransactionSubmit(formData);
            }
        });
    });
}

// Auth Form Submission
function handleAuthSubmit(formData) {
    const email = formData.get('email') || document.querySelector('input[type="email"]')?.value;
    const password = formData.get('password') || document.querySelector('input[type="password"]')?.value;
    
    console.log('Auth form submitted:', { email });
    
    // Simulate authentication
    setTimeout(() => {
        // Redirect to dashboard
        window.location.href = 'Dashboard.html';
    }, 500);
}

// Transaction Form Submission
function handleTransactionSubmit(formData) {
    console.log('Transaction form submitted');
    
    // Get all form inputs
    const amount = document.querySelector('input[type="number"]')?.value;
    const category = document.querySelector('select')?.value;
    const date = document.querySelector('input[type="date"]')?.value;
    const description = document.querySelector('input[type="text"]')?.value;
    
    const transaction = {
        amount: amount,
        category: category,
        date: date,
        description: description,
        type: document.querySelector('.transaction-type-tabs .tab.active')?.textContent.trim()
    };
    
    console.log('New transaction:', transaction);
    
    // Close modal and show success message
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // You would typically save this to a database here
    alert('Transaction added successfully!');
    
    // Refresh the page to show new transaction
    location.reload();
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
    const transactions = document.querySelectorAll('.transaction-item');
    
    transactions.forEach(transaction => {
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
    const transactions = document.querySelectorAll('.transaction-item');
    
    transactions.forEach(transaction => {
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
    const transactions = document.querySelectorAll('.transaction-item');
    let csv = 'Name,Category,Amount,Date\n';
    
    transactions.forEach(transaction => {
        const name = transaction.querySelector('.transaction-name')?.textContent;
        const category = transaction.querySelector('.transaction-category')?.textContent;
        const amount = transaction.querySelector('.transaction-amount')?.textContent;
        const date = transaction.querySelector('.transaction-date')?.textContent;
        
        csv += `${name},${category},${amount},${date}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Add export button listener
const exportBtn = document.querySelector('.btn-primary.full-width');
if (exportBtn && exportBtn.textContent.includes('Export')) {
    exportBtn.addEventListener('click', exportToCSV);
}

// Settings Form
const settingsInputs = document.querySelectorAll('.settings-section input, .settings-section select');
settingsInputs.forEach(input => {
    input.addEventListener('change', function() {
        console.log('Setting changed:', this.name, this.value);
        // Save to localStorage or database
    });
});

// Change Password
const changePasswordBtn = document.querySelector('.btn-secondary');
if (changePasswordBtn && changePasswordBtn.textContent.includes('Change Password')) {
    changePasswordBtn.addEventListener('click', function() {
        alert('Password change functionality would be implemented here');
    });
}

// Delete Account
const deleteAccountBtn = document.querySelector('.btn-danger');
if (deleteAccountBtn && deleteAccountBtn.textContent.includes('Delete Account')) {
    deleteAccountBtn.addEventListener('click', function() {
        const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (confirmed) {
            console.log('Account deletion requested');
            // Handle account deletion
        }
    });
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // Hide mobile menu on resize to desktop
        if (window.innerWidth > 768) {
            mobileMenu.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }, 250);
});

// Initialize file upload
initFileUpload();

console.log('Finance Tracker initialized successfully!');