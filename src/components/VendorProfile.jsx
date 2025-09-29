import React, { useState } from 'react';
import ProductManager from '/src/components/ProductManager.jsx';
import UserSettings from '/src/components/UserSettings.jsx';
import ChatList from '/src/components/ChatList.jsx';

const VendorProfile = ({ user, userData, onSignOut, onChatSelect }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const NavLink = ({ tabName, children }) => (
        <button 
            onClick={() => setActiveTab(tabName.toLowerCase())}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left ${activeTab === tabName.toLowerCase() ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
            {children}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <div><h2 className="text-2xl font-bold">Dashboard</h2><p className="mt-2 text-gray-500">Welcome back! Here's an overview of your store.</p></div>;
            case 'products':
                return <ProductManager user={user} userData={userData} />;
            case 'messages':
                return <ChatList authUser={user} onChatSelect={onChatSelect} />;
            case 'settings':
                return <UserSettings user={user} userData={userData} />;
            default:
                return <div>Dashboard</div>;
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border w-full">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-1/4">
                    <div className="flex flex-col items-center">
                         <img 
                            src={userData.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${userData.firstName.charAt(0)}`} 
                            alt="Profile" 
                            className="w-24 h-24 sm:w-32 sm:h-32 mb-4 rounded-full object-cover"
                        />
                        <h2 className="text-xl font-bold text-center">{`${userData.firstName} ${userData.lastName}`}</h2>
                        <p className="text-sm text-gray-500">{userData.location}</p>
                    </div>
                    <nav className="mt-8 space-y-2">
                        <NavLink tabName="Dashboard">Dashboard</NavLink>
                        <NavLink tabName="Products">Products</NavLink>
                        <NavLink tabName="Messages">Messages</NavLink>
                        <NavLink tabName="Settings">Settings</NavLink>
                    </nav>
                     <button 
                        onClick={onSignOut}
                        className="mt-8 w-full bg-red-100 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-200"
                    >
                        Sign Out
                    </button>
                </aside>
                <main className="w-full md:w-3/4">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default VendorProfile;

