
import React, { useState } from 'react';
// --- HIGHLIGHT: All import paths have been corrected to be absolute ---
import Dashboard from '/src/components/Dashboard.jsx';
import ProductManager from '/src/components/ProductManager.jsx';
import UserSettings from '/src/components/UserSettings.jsx';
import ChatList from '/src/components/ChatList.jsx';

// --- A new, reusable NavLink component for the sidebar ---
const NavLink = ({ tabName, activeTab, setActiveTab, children }) => (
    <button 
        onClick={() => setActiveTab(tabName.toLowerCase())}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left transition-colors ${activeTab === tabName.toLowerCase() ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
    >
        {children}
    </button>
);

const VendorProfile = ({ user, userData, onSignOut, onChatSelect }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard user={user} />;
            case 'products':
                return <ProductManager user={user} userData={userData} />;
            case 'messages':
                return <ChatList authUser={user} onChatSelect={onChatSelect} />;
            case 'settings':
                return <UserSettings user={user} userData={userData} />;
            default:
                return <Dashboard user={user} />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg border w-full">
            <div className="flex flex-col md:flex-row">
                {/* --- New Sidebar Navigation --- */}
                <aside className="w-full md:w-64 p-4 border-r border-gray-200">
                    <div className="flex items-center gap-3 mb-8">
                         <img 
                            src={userData.photoURL || `https://placehold.co/40x40/E0E7FF/4F46E5?text=${userData.firstName.charAt(0)}`} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                            <h2 className="text-md font-semibold">{`${userData.firstName} ${userData.lastName}`}</h2>
                            <p className="text-xs text-gray-500">Vendor Account</p>
                        </div>
                    </div>
                    <nav className="space-y-2">
                        <NavLink tabName="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab}>Dashboard</NavLink>
                        <NavLink tabName="Products" activeTab={activeTab} setActiveTab={setActiveTab}>Products</NavLink>
                        <NavLink tabName="Messages" activeTab={activeTab} setActiveTab={setActiveTab}>Messages</NavLink>
                        <NavLink tabName="Settings" activeTab={activeTab} setActiveTab={setActiveTab}>Settings</NavLink>
                    </nav>
                     <button 
                        onClick={onSignOut}
                        className="mt-8 w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                        Sign Out
                    </button>
                </aside>

                {/* --- Main Content Area --- */}
                <main className="w-full p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default VendorProfile;

