import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserData {
    uid: string;
    email: string | null;
    role: 'player' | 'coach' | 'venue' | 'admin';
    displayName?: string;
    stripeAccountId?: string;
    waiverAgreed?: boolean;
    waiverAgreedAt?: { seconds: number; nanoseconds: number; }; // Firestore Timestamp
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, role: UserData['role']) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch user role/data from Firestore using onSnapshot for real-time updates
                const userRef = doc(db, 'users', firebaseUser.uid);
                unsubscribeDoc = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        setUserData(userSnap.data() as UserData);
                    } else {
                        console.warn('User document not found for:', firebaseUser.uid);
                        setUserData(null);
                    }
                }, (error) => {
                    console.error('Error listening to user data:', error);
                });
            } else {
                setUserData(null);
                if (unsubscribeDoc) {
                    unsubscribeDoc();
                    unsubscribeDoc = undefined;
                }
            }

            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) {
                unsubscribeDoc();
            }
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, role: UserData['role']) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Create user document in Firestore
        const newUser: UserData = {
            uid: result.user.uid,
            email: result.user.email,
            role,
        };

        await setDoc(doc(db, 'users', result.user.uid), newUser);
        setUserData(newUser); // Optimistic update
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signOut }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
