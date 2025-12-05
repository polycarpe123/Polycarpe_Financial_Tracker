// Firebase Configuration and Helper Functions
// Replace with your actual Firebase config from Firebase Console

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Your Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyDrRa-9v3AbJzBv736hrZFGktkk9EyZjTk",
  authDomain: "polycarpe-financial-tracker.firebaseapp.com",
  projectId: "polycarpe-financial-tracker",
  storageBucket: "polycarpe-financial-tracker.firebasestorage.app",
  messagingSenderId: "845208200156",
  appId: "1:845208200156:web:fb5e9c464b3ed0a8a02519",
  measurementId: "G-KGTTMJBLY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

// Sign Up with Email/Password
export async function signUpUser(email, password, fullName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: fullName || email.split('@')[0],
            email: email,
            createdAt: Timestamp.now(),
            currency: 'USD',
            notifications: true
        });
        
        return { success: true, user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

// Sign In with Email/Password
export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign In with Google
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if user profile exists, if not create it
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                createdAt: Timestamp.now(),
                currency: 'USD',
                notifications: true
            });
        }
        
        return { success: true, user };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out
export async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Get Current User Profile
export async function getUserProfile(userId) {
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'User profile not found' };
        }
    } catch (error) {
        console.error('Get user profile error:', error);
        return { success: false, error: error.message };
    }
}

// Update User Profile
export async function updateUserProfile(userId, updates) {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// CATEGORY FUNCTIONS
// ==========================================

// Get all categories for a user
export async function getCategories(userId) {
    try {
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const querySnapshot = await getDocs(categoriesRef);
        
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: categories };
    } catch (error) {
        console.error('Get categories error:', error);
        return { success: false, error: error.message };
    }
}

// Add a new category
export async function addCategory(userId, categoryData) {
    try {
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const docRef = await addDoc(categoriesRef, {
            name: categoryData.name,
            type: categoryData.type,
            color: categoryData.color,
            createdAt: Timestamp.now()
        });
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Add category error:', error);
        return { success: false, error: error.message };
    }
}

// Update a category
export async function updateCategory(userId, categoryId, updates) {
    try {
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await updateDoc(categoryRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Update category error:', error);
        return { success: false, error: error.message };
    }
}

// Delete a category
export async function deleteCategory(userId, categoryId) {
    try {
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await deleteDoc(categoryRef);
        return { success: true };
    } catch (error) {
        console.error('Delete category error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

// Get all transactions for a user
export async function getTransactions(userId) {
    try {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(transactionsRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                // Convert Firestore Timestamp to JS Date
                date: data.date.toDate()
            });
        });
        
        return { success: true, data: transactions };
    } catch (error) {
        console.error('Get transactions error:', error);
        return { success: false, error: error.message };
    }
}

// Add a new transaction
export async function addTransaction(userId, transactionData) {
    try {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const docRef = await addDoc(transactionsRef, {
            amount: parseFloat(transactionData.amount),
            category: transactionData.category,
            description: transactionData.description,
            type: transactionData.type,
            date: Timestamp.fromDate(new Date(transactionData.date)),
            createdAt: Timestamp.now()
        });
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Add transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Update a transaction
export async function updateTransaction(userId, transactionId, updates) {
    try {
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        
        // Convert date to Timestamp if it exists in updates
        if (updates.date && !(updates.date instanceof Timestamp)) {
            updates.date = Timestamp.fromDate(new Date(updates.date));
        }
        
        await updateDoc(transactionRef, updates);
        return { success: true };
    } catch (error) {
        console.error('Update transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Delete a transaction
export async function deleteTransaction(userId, transactionId) {
    try {
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        await deleteDoc(transactionRef);
        return { success: true };
    } catch (error) {
        console.error('Delete transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Get transactions by category
export async function getTransactionsByCategory(userId, category) {
    try {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
            transactionsRef, 
            where('category', '==', category),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: data.date.toDate()
            });
        });
        
        return { success: true, data: transactions };
    } catch (error) {
        console.error('Get transactions by category error:', error);
        return { success: false, error: error.message };
    }
}

// Get transactions by date range
export async function getTransactionsByDateRange(userId, startDate, endDate) {
    try {
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const q = query(
            transactionsRef,
            where('date', '>=', Timestamp.fromDate(startDate)),
            where('date', '<=', Timestamp.fromDate(endDate)),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const transactions = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({ 
                id: doc.id, 
                ...data,
                date: data.date.toDate()
            });
        });
        
        return { success: true, data: transactions };
    } catch (error) {
        console.error('Get transactions by date range error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// INITIALIZE DEFAULT CATEGORIES
// ==========================================

export async function initializeDefaultCategories(userId) {
    const defaultCategories = [
        { name: 'Salary', type: 'income', color: '#10b981' },
        { name: 'Freelance', type: 'income', color: '#3b82f6' },
        { name: 'Food', type: 'expense', color: '#ef4444' },
        { name: 'Entertainment', type: 'expense', color: '#f59e0b' },
        { name: 'Transportation', type: 'expense', color: '#ef4444' },
        { name: 'Utilities', type: 'expense', color: '#8b5cf6' }
    ];
    
    try {
        for (const category of defaultCategories) {
            await addCategory(userId, category);
        }
        return { success: true };
    } catch (error) {
        console.error('Initialize default categories error:', error);
        return { success: false, error: error.message };
    }
}

console.log('Firebase configured successfully!');