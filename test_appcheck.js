import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testUnauthorizedRead() {
    console.log('🔄 Attempting to read /events WITHOUT App Check...');
    try {
        const eventsRef = collection(db, 'events');
        const snapshot = await getDocs(eventsRef);
        console.log(`❌ FAILURE: Read ${snapshot.size} events. App Check is NOT blocking unverified traffic.`);
        process.exit(1);
    } catch (error) {
        if (error.code === 'permission-denied') {
            console.log('✅ SUCCESS: Firebase blocked the request with "permission-denied" due to missing App Check token.');
            process.exit(0);
        } else {
            console.log('⚠️ Unexpected error:', error);
            process.exit(1);
        }
    }
}

testUnauthorizedRead();
