import React, { useState } from 'react';
import UserSettings from '/src/components/UserSettings.jsx';
import ChatList from '/src/components/ChatList.jsx'; // Now used by buyers as well

const UserProfile = ({ user, userData, onSignOut, onChatSelect }) => {
    const [activeTab, setActiveTab] = useState('profile');

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
            case 'profile':
                return <div><h2 className="text-2xl font-bold">Profile Overview</h2><p className="mt-2 text-gray-500">Your orders and reviews will be displayed here.</p></div>;
            case 'messages':
                return <ChatList authUser={user} onChatSelect={onChatSelect} />;
            case 'settings':
                return <UserSettings user={user} userData={userData} />;
            default:
                return <div>Profile Overview</div>;
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border w-full">
            <div className="flex flex-col md:flex-row gap-8">
                {/* --- Left Sidebar Navigation --- */}
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
                        <NavLink tabName="Profile">My Profile</NavLink>
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

                {/* --- Main Content Area --- */}
                <main className="w-full md:w-3/4">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default UserProfile;

