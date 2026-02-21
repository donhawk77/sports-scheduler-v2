import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase WITHOUT App Check
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUnauthorizedRead() {
    console.log('🔄 Attempting to read /events collection WITHOUT App Check token...');
    try {
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);
        console.log(`❌ FAILURE: Successfully read ${snapshot.size} events. App Check is NOT blocking unverified traffic.`);
        process.exit(1);
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            console.log('✅ SUCCESS: Firebase blocked the request with "permission-denied". App Check lockdown is working perfectly against scraped keys.');
            process.exit(0);
        } else {
            console.log('⚠️ Unexpected error:', error);
            process.exit(1);
        }
    }
}

testUnauthorizedRead();
