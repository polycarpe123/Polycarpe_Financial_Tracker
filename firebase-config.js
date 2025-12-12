
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

console.log('🔥 Firebase initialized');
console.log('📊 Firestore connected:', db ? 'Yes' : 'No');

// ==========================================
// AUTHENTICATION FUNCTIONS - FIXED
// ==========================================

// Sign Up with Email/Password - COMPLETE FIX
export async function signUpUser(email, password, fullName) {
    let userCreated = null;
    
    try {
        console.log('🔵 Step 1: Creating auth user for:', email);
        
        // Step 1: Create authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userCreated = userCredential.user;
        console.log('✅ Auth user created with UID:', userCreated.uid);
        
        // Step 2: Prepare user profile data
        const userProfile = {
            name: fullName || email.split('@')[0],
            email: email,
            createdAt: Timestamp.now(),
            currency: 'USD',
            notifications: true
        };
        
        console.log('🔵 Step 2: Creating Firestore profile document...');
        console.log('Profile data:', userProfile);
        
        // Step 3: Create Firestore document
        const userDocRef = doc(db, 'users', userCreated.uid);
        await setDoc(userDocRef, userProfile);
        
        console.log('✅ Firestore profile created successfully');
        
        // Step 4: Verify the document was created
        console.log('🔵 Step 3: Verifying Firestore document...');
        const verifyDoc = await getDoc(userDocRef);
        
        if (verifyDoc.exists()) {
            console.log('✅ Verification successful! Document exists:', verifyDoc.data());
        } else {
            throw new Error('Document creation failed - not found after setDoc');
        }
        
        // Step 5: Initialize default categories
        console.log('🔵 Step 4: Creating default categories...');
        await initializeDefaultCategories(userCreated.uid);
        console.log('✅ Default categories created');
        
        console.log('🎉 Sign up completed successfully!');
        return { success: true, user: userCreated };
        
    } catch (error) {
        console.error('❌ SIGN UP ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // Cleanup: Delete auth user if Firestore failed
        if (userCreated) {
            console.log('⚠️ Cleaning up auth user due to Firestore error...');
            try {
                await userCreated.delete();
                console.log('✅ Auth user cleaned up');
            } catch (cleanupError) {
                console.error('❌ Cleanup failed:', cleanupError);
            }
        }
        
        // Return user-friendly error message
        let errorMessage = error.message;
        if (error.code === 'permission-denied') {
            errorMessage = 'Database permission denied. Please check Firestore security rules.';
        } else if (error.code === 'unavailable') {
            errorMessage = 'Database unavailable. Please check your internet connection.';
        }
        
        return { success: false, error: errorMessage };
    }
}

// Sign In with Email/Password
export async function signInUser(email, password) {
    try {
        console.log('🔵 Signing in:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Sign in successful:', userCredential.user.uid);
        
        // Verify Firestore profile exists
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.warn('⚠️ User profile not found in Firestore, creating it now...');
            const userProfile = {
                name: userCredential.user.email.split('@')[0],
                email: userCredential.user.email,
                createdAt: Timestamp.now(),
                currency: 'USD',
                notifications: true
            };
            await setDoc(userDocRef, userProfile);
            await initializeDefaultCategories(userCredential.user.uid);
            console.log('✅ Created missing user profile');
        }
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign In with Google - FIXED
export async function signInWithGoogle() {
    try {
        console.log('🔵 Starting Google sign in...');
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('✅ Google auth successful:', user.uid);
        
        // Check if user profile exists
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.log('🔵 Creating new Google user profile...');
            const userProfile = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                createdAt: Timestamp.now(),
                currency: 'USD',
                notifications: true
            };
            
            await setDoc(userDocRef, userProfile);
            console.log('✅ Google user profile created');
            
            await initializeDefaultCategories(user.uid);
            console.log('✅ Default categories created');
        } else {
            console.log('✅ Existing Google user found');
        }
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ Google sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign Out
export async function signOutUser() {
    try {
        console.log('🔵 Signing out...');
        await signOut(auth);
        console.log('✅ Sign out successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Get Current User Profile - ENHANCED
export async function getUserProfile(userId) {
    try {
        console.log('🔵 Fetching user profile for:', userId);
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log('✅ User profile found:', docSnap.data());
            return { success: true, data: docSnap.data() };
        } else {
            console.error('❌ User profile not found in Firestore');
            console.log('Attempting to create profile from auth data...');
            
            // Try to create profile if missing
            if (auth.currentUser) {
                const userProfile = {
                    name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                    email: auth.currentUser.email,
                    createdAt: Timestamp.now(),
                    currency: 'USD',
                    notifications: true
                };
                
                await setDoc(docRef, userProfile);
                console.log('✅ Created missing profile');
                return { success: true, data: userProfile };
            }
            
            return { success: false, error: 'User profile not found' };
        }
    } catch (error) {
        console.error('❌ Get user profile error:', error);
        return { success: false, error: error.message };
    }
}

// Update User Profile
export async function updateUserProfile(userId, updates) {
    try {
        console.log('🔵 Updating user profile:', userId, updates);
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, updates);
        console.log('✅ User profile updated');
        return { success: true };
    } catch (error) {
        console.error('❌ Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// CATEGORY FUNCTIONS
// ==========================================

// Get all categories for a user
export async function getCategories(userId) {
    try {
        console.log('🔵 Fetching categories for:', userId);
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const querySnapshot = await getDocs(categoriesRef);
        
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ Found ${categories.length} categories`);
        return { success: true, data: categories };
    } catch (error) {
        console.error('❌ Get categories error:', error);
        return { success: false, error: error.message };
    }
}

// Add a new category
export async function addCategory(userId, categoryData) {
    try {
        console.log('🔵 Adding category:', categoryData);
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const docRef = await addDoc(categoriesRef, {
            name: categoryData.name,
            type: categoryData.type,
            color: categoryData.color,
            createdAt: Timestamp.now()
        });
        
        console.log('✅ Category added:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Add category error:', error);
        return { success: false, error: error.message };
    }
}

// Update a category
export async function updateCategory(userId, categoryId, updates) {
    try {
        console.log('🔵 Updating category:', categoryId);
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await updateDoc(categoryRef, updates);
        console.log('✅ Category updated');
        return { success: true };
    } catch (error) {
        console.error('❌ Update category error:', error);
        return { success: false, error: error.message };
    }
}

// Delete a category
export async function deleteCategory(userId, categoryId) {
    try {
        console.log('🔵 Deleting category:', categoryId);
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await deleteDoc(categoryRef);
        console.log('✅ Category deleted');
        return { success: true };
    } catch (error) {
        console.error('❌ Delete category error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// TRANSACTION FUNCTIONS
// ==========================================

// Get all transactions for a user
export async function getTransactions(userId) {
    try {
        console.log('🔵 Fetching transactions for:', userId);
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
        
        console.log(`✅ Found ${transactions.length} transactions`);
        return { success: true, data: transactions };
    } catch (error) {
        console.error('❌ Get transactions error:', error);
        return { success: false, error: error.message };
    }
}

// Add a new transaction
export async function addTransaction(userId, transactionData) {
    try {
        console.log('🔵 Adding transaction:', transactionData);
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const docRef = await addDoc(transactionsRef, {
            amount: parseFloat(transactionData.amount),
            category: transactionData.category,
            description: transactionData.description,
            type: transactionData.type,
            date: Timestamp.fromDate(new Date(transactionData.date)),
            createdAt: Timestamp.now()
        });
        
        console.log('✅ Transaction added:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Add transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Update a transaction
export async function updateTransaction(userId, transactionId, updates) {
    try {
        console.log('🔵 Updating transaction:', transactionId);
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        
        // Convert date to Timestamp if it exists in updates
        if (updates.date && !(updates.date instanceof Timestamp)) {
            updates.date = Timestamp.fromDate(new Date(updates.date));
        }
        
        await updateDoc(transactionRef, updates);
        console.log('✅ Transaction updated');
        return { success: true };
    } catch (error) {
        console.error('❌ Update transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Delete a transaction
export async function deleteTransaction(userId, transactionId) {
    try {
        console.log('🔵 Deleting transaction:', transactionId);
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        await deleteDoc(transactionRef);
        console.log('✅ Transaction deleted');
        return { success: true };
    } catch (error) {
        console.error('❌ Delete transaction error:', error);
        return { success: false, error: error.message };
    }
}

// Get transactions by category
export async function getTransactionsByCategory(userId, category) {
    try {
        console.log('🔵 Fetching transactions by category:', category);
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
        
        console.log(`✅ Found ${transactions.length} transactions for category`);
        return { success: true, data: transactions };
    } catch (error) {
        console.error('❌ Get transactions by category error:', error);
        return { success: false, error: error.message };
    }
}

// Get transactions by date range
export async function getTransactionsByDateRange(userId, startDate, endDate) {
    try {
        console.log('🔵 Fetching transactions by date range');
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
        
        console.log(`✅ Found ${transactions.length} transactions in date range`);
        return { success: true, data: transactions };
    } catch (error) {
        console.error('❌ Get transactions by date range error:', error);
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
        console.log('🔵 Initializing default categories for:', userId);
        for (const category of defaultCategories) {
            await addCategory(userId, category);
        }
        console.log('✅ All default categories initialized');
        return { success: true };
    } catch (error) {
        console.error('❌ Initialize default categories error:', error);
        return { success: false, error: error.message };
    }
}

console.log('✅ Firebase config module loaded successfully');