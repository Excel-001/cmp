import React, { useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    OAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, appId } from '../firebaseConfig.js';

// --- Reusable Apple Sign-In Handler ---
const handleAppleSignIn = async () => {
    const provider = new OAuthProvider('apple.com');
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            const nameParts = user.displayName ? user.displayName.split(' ') : ['New', 'User'];
            await setDoc(userDocRef, {
                email: user.email,
                firstName: nameParts[0] || '',
                lastName: nameParts[nameParts.length - 1] || '',
                middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
                phoneNumber: user.phoneNumber || '',
                role: 'Buyer',
                location: 'Not set',
                createdAt: serverTimestamp(),
                photoURL: user.photoURL,
            });
        }
    } catch (error) {
        console.error("Apple Sign-In Error:", error);
    }
};

// --- SignUp Form Component ---
const SignUp = ({ setAuthView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('Buyer');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        if (!location || !firstName || !lastName || !email || !password || !phoneNumber) {
            setError("Please fill out all required fields.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                firstName,
                lastName,
                middleName,
                phoneNumber,
                role,
                location,
                createdAt: serverTimestamp(),
                reputation: role === 'Vendor' ? { score: 0, ratings: 0 } : null,
                photoURL: null,
            });
        } catch (err) {
            setError('Failed to sign up. Please check your details and try again.');
            console.error(err);
        }
    };

    return (
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">Create an Account</h2>
            <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Middle Name <span className="text-gray-400">(Optional)</span></label>
                    <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="+1234567890" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Your Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Nile University" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">I am a...</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                        <option value="Buyer">Buyer</option>
                        <option value="Vendor">Vendor</option>
                    </select>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button 
                    type="submit" 
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    Sign Up
                </button>
            </form>
            <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button onClick={() => setAuthView('login')} className="font-medium text-blue-600 hover:text-blue-500">Sign In</button>
            </p>
        </div>
    );
};

// --- Login Form Component (Unchanged) ---
const Login = ({ setAuthView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        signInWithEmailAndPassword(auth, email, password).catch((err) => setError(err.message));
    };

    return (
        <div className="w-full max-w-md p-6 sm:p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900">Welcome Back!</h2>
            <form onSubmit={handleLogin} className="space-y-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign In</button>
            </form>
            <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => setAuthView('signup')} className="font-medium text-blue-600 hover:text-blue-500">Sign Up</button>
            </p>
        </div>
    );
};

// --- Main Auth Component (Unchanged) ---
const Auth = () => {
    const [authView, setAuthView] = useState('login');
    return (
        <div className="flex justify-center items-center min-h-[60vh]">
            {authView === 'login' 
                ? <Login setAuthView={setAuthView} /> 
                : <SignUp setAuthView={setAuthView} />
            }
        </div>
    );
};

export default Auth;

