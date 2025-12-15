// Analytics Charts with Chart.js

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getTransactions } from './firebase-config.js';

let incomeExpenseChart = null;
let categoryPieChart = null;

// Wait for user authentication
onAuthStateChanged(auth, async (user) => {
    if (user && window.location.pathname.includes('analytics')) {
        console.log('📊 Loading analytics for user:', user.uid);
        await loadAnalytics(user.uid);
    }
});

async function loadAnalytics(userId) {
    try {
        // Get all transactions
        const result = await getTransactions(userId);
        
        if (!result.success) {
            console.error('Failed to load transactions:', result.error);
            return;
        }
        
        const transactions = result.data;
        console.log('📊 Processing', transactions.length, 'transactions for analytics');
        
        // Calculate analytics data
        const analyticsData = processTransactions(transactions);
        
        // Update stats cards
        updateStatsCards(analyticsData);
        
        // Create charts
        createIncomeExpenseChart(analyticsData.monthlyData);
        createCategoryPieChart(analyticsData.categoryExpenses);
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function processTransactions(transactions) {
    const currentYear = new Date().getFullYear();
    
    // Initialize monthly data (Jan to Dec)
    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
        const monthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' });
        monthlyData[monthName] = { income: 0, expense: 0 };
    }
    
    // Track category expenses
    const categoryExpenses = {};
    
    // Track totals
    let totalIncomeYTD = 0;
    let totalExpenseYTD = 0;
    let monthsWithData = new Set();
    
    // Process each transaction
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'short' });
        const amount = parseFloat(transaction.amount);
        
        // Only process current year transactions
        if (year === currentYear) {
            if (transaction.type === 'income') {
                monthlyData[month].income += amount;
                totalIncomeYTD += amount;
                monthsWithData.add(date.getMonth());
            } else {
                monthlyData[month].expense += amount;
                totalExpenseYTD += amount;
                monthsWithData.add(date.getMonth());
                
                // Track category expenses
                if (!categoryExpenses[transaction.category]) {
                    categoryExpenses[transaction.category] = 0;
                }
                categoryExpenses[transaction.category] += amount;
            }
        }
    });
    
    // Calculate averages (only for months with data)
    const monthCount = monthsWithData.size || 1;
    const avgMonthlyIncome = totalIncomeYTD / monthCount;
    const avgMonthlyExpense = totalExpenseYTD / monthCount;
    
    // Calculate savings rate
    const savingsRate = totalIncomeYTD > 0 
        ? Math.round(((totalIncomeYTD - totalExpenseYTD) / totalIncomeYTD) * 100) 
        : 0;
    
    // Find top expense category
    let topCategory = { name: '-', amount: 0 };
    for (const [category, amount] of Object.entries(categoryExpenses)) {
        if (amount > topCategory.amount) {
            topCategory = { name: category, amount: amount };
        }
    }
    
    return {
        monthlyData,
        categoryExpenses,
        totalIncomeYTD,
        totalExpenseYTD,
        avgMonthlyIncome,
        avgMonthlyExpense,
        savingsRate,
        topCategory
    };
}

function updateStatsCards(data) {
    // Top Category
    document.getElementById('top-category-amount').textContent = `$${data.topCategory.amount.toFixed(2)}`;
    document.getElementById('top-category-name').textContent = data.topCategory.name;
    
    // Total Income YTD
    document.getElementById('total-income-ytd').textContent = `$${data.totalIncomeYTD.toFixed(2)}`;
    
    // Total Expense YTD
    document.getElementById('total-expense-ytd').textContent = `$${data.totalExpenseYTD.toFixed(2)}`;
    
    // Summary stats
    document.getElementById('savings-rate').textContent = `${data.savingsRate}%`;
    document.getElementById('avg-monthly-expense').textContent = `$${data.avgMonthlyExpense.toFixed(2)}`;
    document.getElementById('avg-monthly-income').textContent = `$${data.avgMonthlyIncome.toFixed(2)}`;
}

function createIncomeExpenseChart(monthlyData) {
    const ctx = document.getElementById('incomeExpenseChart');
    
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    // Prepare data
    const labels = Object.keys(monthlyData);
    const incomeData = labels.map(month => monthlyData[month].income);
    const expenseData = labels.map(month => monthlyData[month].expense);
    
    // Create chart
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderRadius: 6,
                    maxBarThickness: 60
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderRadius: 6,
                    maxBarThickness: 60
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 13
                        }
                    }
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
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
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
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function createCategoryPieChart(categoryExpenses) {
    const ctx = document.getElementById('categoryPieChart');
    
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }
    
    // Destroy existing chart if it exists
    if (categoryPieChart) {
        categoryPieChart.destroy();
    }
    
    // Check if there's any data
    if (Object.keys(categoryExpenses).length === 0) {
        // Show empty state
        const parentDiv = ctx.parentElement;
        parentDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6b7280;">No expense data available</div>';
        return;
    }
    
    // Prepare data
    const labels = Object.keys(categoryExpenses);
    const data = Object.values(categoryExpenses);
    
    // Color palette
    const colors = [
        '#10b981', // Food (green)
        '#06b6d4', // Transportation (cyan)
        '#f59e0b', // Entertainment (orange)
        '#8b5cf6', // Other (purple)
        '#ef4444', // Utilities (red)
        '#3b82f6', // Additional categories (blue)
        '#ec4899', // Pink
        '#14b8a6', // Teal
    ];
    
    // Create chart
    categoryPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: $${value.toFixed(2)}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
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
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

console.log('✅ Analytics charts module loaded');