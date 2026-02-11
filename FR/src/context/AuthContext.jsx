import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for stored user on mount
        const storedUser = localStorage.getItem('frenchmaster_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            const user = {
                ...data.user,
                role: 'learner',
                isActive: true,
                emailVerified: true
            };
            
            setUser(user);
            localStorage.setItem('frenchmaster_user', JSON.stringify(user));
            localStorage.setItem('frenchmaster_session', JSON.stringify(data.session));
            
            return user;
        } catch (error) {
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            const newUser = {
                id: data.user.id,
                email: data.user.email,
                ...userData,
                role: 'learner',
                isActive: true,
                emailVerified: false
            };
            
            setUser(newUser);
            localStorage.setItem('frenchmaster_user', JSON.stringify(newUser));
            return newUser;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('frenchmaster_user');
    };

    const updateUser = (updates) => {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('frenchmaster_user', JSON.stringify(updatedUser));
    };

    const updateSubscription = (subscriptionData) => {
        const updatedUser = { 
            ...user, 
            subscription: {
                type: subscriptionData.type || 'free',
                status: subscriptionData.status || 'active',
                expiresAt: subscriptionData.expiresAt,
                features: subscriptionData.features || ['basic_feedback']
            }
        };
        setUser(updatedUser);
        localStorage.setItem('frenchmaster_user', JSON.stringify(updatedUser));
    };
    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        updateSubscription
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
