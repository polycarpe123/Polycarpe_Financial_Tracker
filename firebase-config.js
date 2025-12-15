import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence // ⚡ Keeps user logged in
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
    Timestamp,
    onSnapshot, // Realtime + caching
    enableIndexedDbPersistence //  Offline support
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
//  ENABLE INSTANT LOADING FEATURES
// ==========================================

// 1. Keep user logged in across sessions
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('✅ Auth persistence enabled');
    })
    .catch((error) => {
        console.error('Auth persistence error:', error);
    });

// 2. Enable offline data persistence (IndexedDB)
enableIndexedDbPersistence(db)
    .then(() => {
        console.log('✅ Offline persistence enabled - INSTANT LOADING activated');
    })
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open - using memory cache');
        } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Browser does not support offline persistence');
        }
    });

console.log('🔥 Firebase initialized with instant loading');

// ==========================================
// REALTIME LISTENERS (Auto-sync + Instant reads)
// ==========================================


export function listenToTransactions(userId, callback) {
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));
    
    // onSnapshot uses cache first (INSTANT), then syncs
    const unsubscribe = onSnapshot(q, 
        { includeMetadataChanges: true }, // Show cache status
        (querySnapshot) => {
            const transactions = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                transactions.push({ 
                    id: doc.id, 
                    ...data,
                    date: data.date.toDate(),
                    _fromCache: querySnapshot.metadata.fromCache // Track if from cache
                });
            });
            
            // Log performance
            if (querySnapshot.metadata.fromCache) {
                console.log('⚡ Transactions loaded from cache (INSTANT)');
            } else {
                console.log('🔄 Transactions synced from server');
            }
            
            callback({ success: true, data: transactions });
        },
        (error) => {
            console.error('❌ Transaction listener error:', error);
            callback({ success: false, error: error.message });
        }
    );
    
    return unsubscribe; // Call this to stop listening
}

export function listenToCategories(userId, callback) {
    const categoriesRef = collection(db, 'users', userId, 'categories');
    
    const unsubscribe = onSnapshot(categoriesRef,
        { includeMetadataChanges: true },
        (querySnapshot) => {
            const categories = [];
            
            querySnapshot.forEach((doc) => {
                categories.push({ 
                    id: doc.id, 
                    ...doc.data(),
                    _fromCache: querySnapshot.metadata.fromCache
                });
            });
            
            if (querySnapshot.metadata.fromCache) {
                console.log('⚡ Categories loaded from cache (INSTANT)');
            } else {
                console.log('🔄 Categories synced from server');
            }
            
            callback({ success: true, data: categories });
        },
        (error) => {
            console.error('❌ Category listener error:', error);
            callback({ success: false, error: error.message });
        }
    );
    
    return unsubscribe;
}

export function listenToUserProfile(userId, callback) {
    const docRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(docRef,
        { includeMetadataChanges: true },
        (docSnap) => {
            if (docSnap.exists()) {
                const fromCache = docSnap.metadata.fromCache;
                
                if (fromCache) {
                    console.log('⚡ Profile loaded from cache (INSTANT)');
                } else {
                    console.log('🔄 Profile synced from server');
                }
                
                callback({ success: true, data: docSnap.data() });
            } else {
                callback({ success: false, error: 'Profile not found' });
            }
        },
        (error) => {
            console.error('❌ Profile listener error:', error);
            callback({ success: false, error: error.message });
        }
    );
    
    return unsubscribe;
}

// ==========================================
// FUNCTIONS FOR COMPATIBILITY
// ==========================================

export async function getTransactions(userId) {
    console.warn('⚠️ Using non-instant getTransactions. Switch to listenToTransactions for instant loading.');
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
                date: data.date.toDate()
            });
        });
        
        return { success: true, data: transactions };
    } catch (error) {
        console.error('❌ Get transactions error:', error);
        return { success: false, error: error.message };
    }
}

export async function getCategories(userId) {
    console.warn('⚠️ Using non-instant getCategories. Switch to listenToCategories for instant loading.');
    try {
        const categoriesRef = collection(db, 'users', userId, 'categories');
        const querySnapshot = await getDocs(categoriesRef);
        
        const categories = [];
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: categories };
    } catch (error) {
        console.error('❌ Get categories error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserProfile(userId) {
    console.warn('⚠️ Using non-instant getUserProfile. Switch to listenToUserProfile for instant loading.');
    try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'User profile not found' };
        }
    } catch (error) {
        console.error('❌ Get user profile error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================================
// WRITE OPERATIONS (work with listeners)
// ==========================================

export async function signUpUser(email, password, fullName) {
    let userCreated = null;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        userCreated = userCredential.user;
        
        const userProfile = {
            name: fullName || email.split('@')[0],
            email: email,
            createdAt: Timestamp.now(),
            currency: 'USD',
            notifications: true
        };
        
        const userDocRef = doc(db, 'users', userCreated.uid);
        await setDoc(userDocRef, userProfile);
        
        await initializeDefaultCategories(userCreated.uid);
        
        return { success: true, user: userCreated };
        
    } catch (error) {
        console.error('❌ Sign up error:', error);
        
        if (userCreated) {
            try {
                await userCreated.delete();
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }
        }
        
        return { success: false, error: error.message };
    }
}

export async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('❌ Sign in error:', error);
        return { success: false, error: error.message };
    }
}

export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            const userProfile = {
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                createdAt: Timestamp.now(),
                currency: 'USD',
                notifications: true
            };
            
            await setDoc(userDocRef, userProfile);
            await initializeDefaultCategories(user.uid);
        }
        
        return { success: true, user };
    } catch (error) {
        console.error('❌ Google sign in error:', error);
        return { success: false, error: error.message };
    }
}

export async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateUserProfile(userId, updates) {
    try {
        const docRef = doc(db, 'users', userId);
        await updateDoc(docRef, updates);
        return { success: true };
    } catch (error) {
        console.error('❌ Update profile error:', error);
        return { success: false, error: error.message };
    }
}

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
        console.error('❌ Add category error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCategory(userId, categoryId, updates) {
    try {
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await updateDoc(categoryRef, updates);
        return { success: true };
    } catch (error) {
        console.error('❌ Update category error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(userId, categoryId) {
    try {
        const categoryRef = doc(db, 'users', userId, 'categories', categoryId);
        await deleteDoc(categoryRef);
        return { success: true };
    } catch (error) {
        console.error('❌ Delete category error:', error);
        return { success: false, error: error.message };
    }
}

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
        console.error('❌ Add transaction error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTransaction(userId, transactionId, updates) {
    try {
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        
        if (updates.date && !(updates.date instanceof Timestamp)) {
            updates.date = Timestamp.fromDate(new Date(updates.date));
        }
        
        await updateDoc(transactionRef, updates);
        return { success: true };
    } catch (error) {
        console.error('❌ Update transaction error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteTransaction(userId, transactionId) {
    try {
        const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
        await deleteDoc(transactionRef);
        return { success: true };
    } catch (error) {
        console.error('❌ Delete transaction error:', error);
        return { success: false, error: error.message };
    }
}

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
        console.error('❌ Initialize default categories error:', error);
        return { success: false, error: error.message };
    }
}

console.log('✅ Firebase config loaded with INSTANT LOADING capabilities');