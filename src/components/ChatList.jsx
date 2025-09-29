import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, documentId, getDocs } from 'firebase/firestore';
// --- HIGHLIGHT: Corrected the import path to be relative ---
import { db, appId } from '../firebaseConfig.js';

const ChatList = ({ authUser, onChatSelect }) => {
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authUser) return;
        
        const chatsRef = collection(db, `artifacts/${appId}/chats`);
        const q = query(chatsRef, where('participants', 'array-contains', authUser.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let chatData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            chatData.sort((a, b) => b.lastMessageTimestamp?.toDate() - a.lastMessageTimestamp?.toDate());

            setChats(chatData);
            setLoading(false);

            const partnerIds = chatData.map(c => c.participants.find(p => p !== authUser.uid)).filter(Boolean);
            if (partnerIds.length > 0) {
                const usersRef = collection(db, `artifacts/${appId}/users`);
                const usersQuery = query(usersRef, where(documentId(), 'in', partnerIds));
                getDocs(usersQuery).then(userDocs => {
                    const usersData = {};
                    userDocs.forEach(doc => usersData[doc.id] = doc.data());
                    setUsers(prev => ({ ...prev, ...usersData }));
                });
            }
        });

        return () => unsubscribe();
    }, [authUser]);

    if (loading) {
        return <p>Loading conversations...</p>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold">Messages</h2>
            <div className="mt-4 space-y-3">
                {chats.length === 0 ? (
                    <p className="text-gray-500">No conversations yet.</p>
                ) : (
                    chats.map(chat => {
                        const partnerId = chat.participants.find(p => p !== authUser.uid);
                        const partner = users[partnerId];
                        return (
                            <div 
                                key={chat.id} 
                                className="flex items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
                                onClick={() => partnerId && onChatSelect(partnerId)}
                            >
                                <img 
                                    src={partner?.photoURL || `https://placehold.co/48x48/E0E7FF/4F46E5?text=${partner?.firstName?.charAt(0) || '?'}`}
                                    alt="partner"
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="ml-4 flex-grow overflow-hidden">
                                    <p className="font-semibold text-gray-800 truncate">{`${partner?.firstName || 'User'} ${partner?.lastName || ''}`}</p>
                                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default ChatList;

