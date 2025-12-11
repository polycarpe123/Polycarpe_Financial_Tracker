// Dashboard Charts with Chart.js
// This file generates the balance trend chart and updates dashboard stats

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getTransactions } from './firebase-config.js';

let balanceTrendChart = null;

// Wait for user authentication and DOM ready
let isDashboardInitialized = false;

function initDashboard() {
    if (isDashboardInitialized) return;
    
    onAuthStateChanged(auth, async (user) => {
        if (user && window.location.pathname.includes('Dashboard')) {
            console.log('📊 Loading dashboard for user:', user.uid);
            await loadDashboard(user.uid);
        }
    });
    
    isDashboardInitialized = true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

async function loadDashboard(userId) {
    try {
        // Get all transactions
        const result = await getTransactions(userId);
        
        if (!result.success) {
            console.error('Failed to load transactions:', result.error);
            return;
        }
        
        const transactions = result.data;
        console.log('📊 Processing', transactions.length, 'transactions for dashboard');
        
        // Calculate dashboard data
        const dashboardData = processTransactionsForDashboard(transactions);
        
        // Update stats cards
        updateDashboardStats(dashboardData);
        
        // Create balance trend chart
        createBalanceTrendChart(dashboardData.balanceTrend);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function processTransactionsForDashboard(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate current month income and expenses
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    
    // Calculate total balance and prepare data for balance trend
    let totalBalance = 0;
    const balanceTrend = [];
    
    // Sort transactions by date (oldest first for balance calculation)
    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Create a map to store daily balances for the last 30 days
    const dailyBalances = new Map();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Calculate cumulative balance for each transaction
    sortedTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        const transactionDate = new Date(transaction.date);
        
        // Update total balance
        if (transaction.type === 'income') {
            totalBalance += amount;
        } else {
            totalBalance -= amount;
        }
        
        // Track this month's income/expense
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
            if (transaction.type === 'income') {
                thisMonthIncome += amount;
            } else {
                thisMonthExpense += amount;
            }
        }
        
        // Store balance for last 30 days
        if (transactionDate >= thirtyDaysAgo) {
            const dateKey = transactionDate.toISOString().split('T')[0];
            dailyBalances.set(dateKey, totalBalance);
        }
    });
    
    // Generate balance trend data points for last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        // Find the balance for this date or carry forward the previous balance
        let balance = 0;
        if (dailyBalances.has(dateKey)) {
            balance = dailyBalances.get(dateKey);
        } else {
            // Find the most recent balance before this date
            for (let j = i + 1; j <= 29; j++) {
                const prevDate = new Date();
                prevDate.setDate(prevDate.getDate() - j);
                const prevDateKey = prevDate.toISOString().split('T')[0];
                if (dailyBalances.has(prevDateKey)) {
                    balance = dailyBalances.get(prevDateKey);
                    break;
                }
            }
        }
        
        balanceTrend.push({
            date: date,
            balance: balance
        });
    }
    
    return {
        totalBalance,
        thisMonthIncome,
        thisMonthExpense,
        balanceTrend
    };
}

function updateDashboardStats(data) {
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    
    if (statCards.length >= 3) {
        statCards[0].textContent = `$${data.totalBalance.toFixed(2)}`;
        statCards[1].textContent = `$${data.thisMonthIncome.toFixed(2)}`;
        statCards[2].textContent = `$${data.thisMonthExpense.toFixed(2)}`;
    }
}

function createBalanceTrendChart(balanceTrend) {
    const chartPlaceholder = document.querySelector('.chart-placeholder');
    
    if (!chartPlaceholder) {
        console.error('Chart placeholder not found');
        return;
    }
    
    // Replace placeholder with canvas
    chartPlaceholder.innerHTML = '<canvas id="balanceTrendChart"></canvas>';
    const ctx = document.getElementById('balanceTrendChart');
    
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (balanceTrendChart) {
        balanceTrendChart.destroy();
    }
    
    // Prepare data
    const labels = balanceTrend.map(point => {
        const date = new Date(point.date);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    });
    
    const data = balanceTrend.map(point => point.balance);
    
    // Create gradient
    const canvas = ctx;
    const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    // Create chart
    balanceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Balance',
                data: data,
                borderColor: '#10b981',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Balance: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        },
                        font: {
                            size: 11
                        },
                        color: '#6b7280'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8,
                        font: {
                            size: 11
                        },
                        color: '#6b7280'
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            }
        }
    });
}

console.log('✅ Dashboard charts module loaded');