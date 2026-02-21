import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import type { Functions } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

console.log('Firebase.ts: Module evaluation started');

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase.ts: Config loaded', {
    projectId: firebaseConfig.projectId,
    apiKeyPresent: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain
});

let app: FirebaseApp = {} as FirebaseApp;
let functions: Functions = {} as Functions;
let db: Firestore = {} as Firestore;
let auth: Auth = {} as Auth;

try {
    // Initialize Firebase
    console.log('Firebase.ts: Calling initializeApp...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase.ts: initializedApp success');

    // Initialize App Check (ReCAPTCHA Enterprise)
    // In local development, setting this flag enables a debug token
    if (import.meta.env.DEV) {
        ; (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(
                import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'PLACEHOLDER_RECAPTCHA_KEY'
            ),
            isTokenAutoRefreshEnabled: true
        });
        console.log('Firebase.ts: AppCheck initialized');
    } catch (acError) {
        console.warn('Firebase.ts: AppCheck failed to initialize (expected if keys missing):', acError);
    }

    // Export services
    functions = getFunctions(app);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('Firebase.ts: Services initialized');
} catch (error) {
    console.error('Firebase.ts: CRITICAL ERROR initializing Firebase:', error);
}

export { functions, db, auth, app };
