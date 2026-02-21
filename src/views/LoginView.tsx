import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    // Get role from state, default to null if accessed directly
    const role = location.state?.role as 'player' | 'coach' | 'venue' | 'admin' | undefined;
    const from = location.state?.from?.pathname || '/';

    // Infer role from the redirect path if not explicitly provided
    // This handles the case where RequireAuth redirects to /login from a specific dashboard
    let effectiveRole: 'player' | 'coach' | 'venue' | 'admin' | undefined = role;
    if (!effectiveRole) {
        if (from.startsWith('/player')) effectiveRole = 'player';
        else if (from.startsWith('/coach')) effectiveRole = 'coach';
        else if (from.startsWith('/venue')) effectiveRole = 'venue';
        else if (from.startsWith('/admin')) effectiveRole = 'admin';
    }

    const getRoleConfig = () => {
        switch (effectiveRole) {
            case 'player':
                return {
                    title: isSignUp ? 'Player Sign Up' : 'Player Login',
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/20',
                    destination: '/player'
                };
            case 'coach':
                return {
                    title: isSignUp ? 'Coach Sign Up' : 'Coach Login',
                    color: 'text-primary',
                    bgColor: 'bg-primary/20',
                    destination: '/coach'
                };
            case 'venue':
                return {
                    title: isSignUp ? 'Venue Sign Up' : 'Venue Login',
                    color: 'text-purple-400',
                    bgColor: 'bg-purple-500/20',
                    destination: '/venue'
                };
            case 'admin':
                return {
                    title: 'Admin Login',
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/20',
                    destination: '/admin'
                };
            default:
                return {
                    title: 'Welcome Back',
                    color: 'text-white',
                    bgColor: 'bg-white/10',
                    destination: '/'
                };
        }
    };

    const config = getRoleConfig();

    const handleLogin = async () => {
        if (import.meta.env.DEV) {
            // Mock Login for Dev if needed
        }

        if (!email || !password) {
            showToast('Please enter both email and password', 'error');
            return;
        }

        setLoading(true);
        try {
            if (isSignUp) {
                if (!effectiveRole) {
                    showToast('Please select a role to sign up', 'error');
                    setLoading(false);
                    return;
                }
                await signUp(email, password, effectiveRole);
                showToast('Account created! Welcome!', 'success');
            } else {
                await signIn(email, password);
                showToast('Successfully logged in!', 'success');
            }

            // Navigate based on actual Firestore role (most reliable), then fallback to selected role
            const target = effectiveRole ? config.destination : (from !== '/' && from !== '/login') ? from : '/explore';
            navigate(target);
        } catch (error) {
            console.error(error);
            showToast((isSignUp ? 'Sign up failed: ' : 'Login failed: ') + (error as Error).message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-black z-0"></div>
            <div className={`absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none ${effectiveRole ? config.bgColor.replace('/20', '/10') : 'bg-white/5'}`}></div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 z-20 group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="glass-panel p-8 rounded-2xl w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className={`text-3xl font-heading font-black italic mb-2 ${config.color}`}>{config.title}</h1>
                    <p className="text-text-muted">{isSignUp ? 'Create your account to get started.' : 'Sign in to access your dashboard.'}</p>
                </div>

                {effectiveRole ? (
                    /* Specific Login Form */
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-black uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${effectiveRole === 'player' ? 'bg-blue-500' : effectiveRole === 'coach' ? 'bg-primary' : effectiveRole === 'admin' ? 'bg-red-500 text-white' : 'bg-purple-500'}`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </button>

                        <div className="text-center mt-4">
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-sm text-text-muted hover:text-white transition-colors underline"
                            >
                                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Generic Selection (if accessed directly) */
                    <div className="space-y-4">
                        <button onClick={() => navigate('/login', { state: { role: 'coach' } })} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-6 hover:bg-white/10 transition-colors">
                            <span className="text-white font-bold">Coach</span>
                        </button>
                        <button onClick={() => navigate('/login', { state: { role: 'player' } })} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-6 hover:bg-white/10 transition-colors">
                            <span className="text-white font-bold">Player</span>
                        </button>
                        <button onClick={() => navigate('/login', { state: { role: 'venue' } })} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between px-6 hover:bg-white/10 transition-colors">
                            <span className="text-white font-bold">Venue Owner</span>
                        </button>
                        <button onClick={() => navigate('/login', { state: { role: 'admin' } })} className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between px-6 hover:bg-red-500/20 transition-colors">
                            <span className="text-red-400 font-bold">Admin</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
