import React, { useState, useEffect, useRef } from 'react';
// --- HIGHLIGHT: The import path for firebaseConfig.js has been corrected ---
import { db, appId } from '/src/firebaseConfig.js';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';

// --- Sub-component for displaying "Offer" messages ---
const OfferCard = ({ message, authUser, onRespond }) => {
    const isReceiver = message.senderId !== authUser.uid;
    const canRespond = isReceiver && message.status === 'pending';
    return (
        <div className="flex justify-center my-3">
            <div className={`p-3 rounded-lg border max-w-xs w-full ${message.status === 'accepted' ? 'bg-green-50 border-green-200' : message.status === 'declined' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                {message.replyTo && <p className="text-xs text-gray-500">Offer for: <span className="font-medium">{message.replyTo.productName}</span></p>}
                <p className="text-sm text-center font-semibold my-2">Offer: ${message.price.toFixed(2)}</p>
                <div className="text-xs text-center text-gray-500">Status: <span className="font-medium capitalize">{message.status}</span></div>
                {canRespond && (
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => onRespond(message.id, 'accepted')} className="flex-1 bg-green-500 text-white text-sm py-1 rounded hover:bg-green-600">Accept</button>
                        <button onClick={() => onRespond(message.id, 'declined')} className="flex-1 bg-red-500 text-white text-sm py-1 rounded hover:bg-red-600">Decline</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-component for displaying "Delivery" messages ---
const DeliveryCard = ({ message, authUser, onRespond }) => {
    const isReceiver = message.senderId !== authUser.uid;
    const canRespond = isReceiver && message.status === 'pending';
    return (
        <div className="flex justify-center my-3">
            <div className={`p-3 rounded-lg border max-w-xs w-full ${message.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs text-gray-500">Delivery Proposal:</p>
                <div className="mt-2 text-sm space-y-1">
                    <p><span className="font-semibold">Method:</span> {message.delivery.method}</p>
                    <p><span className="font-semibold">Location:</span> {message.delivery.location}</p>
                    {message.delivery.time && <p><span className="font-semibold">Time:</span> {message.delivery.time}</p>}
                </div>
                <div className="text-xs text-center text-gray-500 mt-2">Status: <span className="font-medium capitalize">{message.status}</span></div>
                {canRespond && (
                    <div className="flex gap-2 mt-3">
                        <button onClick={() => onRespond(message.id, 'accepted')} className="flex-1 bg-green-500 text-white text-sm py-1 rounded hover:bg-green-600">Accept</button>
                        <button onClick={() => onRespond(message.id, 'declined')} className="flex-1 bg-red-500 text-white text-sm py-1 rounded hover:bg-red-600">Decline</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Sub-component for "Product Tag" messages ---
const ProductTagCard = ({ message, onReply, isInCart }) => (
    <div className={`flex justify-center my-4 transition-opacity duration-300 ${isInCart ? 'opacity-50' : 'opacity-100'}`}>
        <div className="p-3 rounded-lg bg-gray-100 border max-w-xs w-full">
            <div className="flex items-center gap-3">
                <img src={message.productImageUrl} alt={message.productName} className="w-16 h-16 rounded-md object-cover" />
                <div>
                    <p className="font-bold text-gray-800">{message.productName}</p>
                    <p className="text-gray-600">${message.productPrice.toFixed(2)}</p>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <button onClick={() => onReply(message)} disabled={isInCart} className="flex-1 text-sm bg-gray-200 py-2 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed">
                    Reply
                </button>
                 <div className={`flex-1 text-sm text-white py-2 rounded-md text-center ${isInCart ? 'bg-green-500' : 'bg-gray-400'}`}>
                    {isInCart ? '✓ Added to Cart' : 'Pending...'}
                </div>
            </div>
        </div>
    </div>
);

// --- Sub-component for text messages ---
const TextMessage = ({ message, isSender }) => (
     <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isSender ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
        {message.replyTo && (
            <div className={`border-l-2 pl-2 mb-1 opacity-80 ${isSender ? 'border-blue-200' : 'border-blue-400'}`}>
                <p className="text-xs font-semibold">{message.replyTo.productName}</p>
            </div>
        )}
        <p>{message.text}</p>
    </div>
);

// --- Main Chat Component ---
const Chat = ({ authUser, chatPartnerId, onClose, onAddToCart, cartItems }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatPartner, setChatPartner] = useState(null);
    const messagesEndRef = useRef(null);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); 
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [deliveryDetails, setDeliveryDetails] = useState({ method: 'On-Campus Meetup', location: '', time: '' });

    const chatId = [authUser.uid, chatPartnerId].sort().join('_');

    useEffect(() => {
        getDoc(doc(db, `artifacts/${appId}/users`, chatPartnerId)).then(doc => {
            if (doc.exists()) setChatPartner(doc.data());
        });
        const q = query(collection(db, `artifacts/${appId}/chats/${chatId}/messages`), orderBy('timestamp'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [chatId, chatPartnerId]);
    
    useEffect(() => {
        if (messages.length > 0) {
            const lastProductTag = [...messages].reverse().find(m => m.type === 'product_tag');
            if (lastProductTag && (!replyingTo || replyingTo.id !== lastProductTag.id)) {
                setReplyingTo(lastProductTag);
            }
        }
    }, [messages, replyingTo]);

    useEffect(() => {
        const productTags = messages.filter(m => m.type === 'product_tag');
        productTags.forEach(tag => {
            const alreadyInCart = cartItems.some(item => item.sourceMessageId === tag.id);
            if (alreadyInCart) return;
            const acceptedDelivery = messages.find(m => m.type === 'delivery' && m.replyTo?.productId === tag.productId && m.status === 'accepted');
            if (acceptedDelivery) {
                const acceptedOffer = messages.find(m => m.type === 'offer' && m.productId === tag.productId && m.status === 'accepted');
                const price = acceptedOffer ? acceptedOffer.price : tag.productPrice;
                const productForCart = { id: tag.productId, name: tag.productName, imageUrl: tag.productImageUrl };
                onAddToCart(productForCart, chatPartnerId, price, tag.id, acceptedDelivery.delivery);
            }
        });
    }, [messages, cartItems, onAddToCart, chatPartnerId]);

    useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        await addDoc(collection(db, `artifacts/${appId}/chats/${chatId}/messages`), {
            type: 'text', text: newMessage, senderId: authUser.uid, timestamp: serverTimestamp(),
            replyTo: replyingTo ? { productId: replyingTo.productId, productName: replyingTo.productName } : null,
        });
        setNewMessage('');
    };

    const handleSendOffer = async (e) => {
        e.preventDefault();
        const price = parseFloat(offerPrice);
        if (!price || price <= 0 || !replyingTo) return;
        await addDoc(collection(db, `artifacts/${appId}/chats/${chatId}/messages`), {
            type: 'offer', price, senderId: authUser.uid, status: 'pending', timestamp: serverTimestamp(),
            replyTo: { productId: replyingTo.productId, productName: replyingTo.productName },
            productId: replyingTo.productId,
        });
        setOfferPrice('');
        setShowOfferModal(false);
    };

    const handleSendDelivery = async (e) => {
        e.preventDefault();
        if (!deliveryDetails.location || (deliveryDetails.method === 'On-Campus Meetup' && !deliveryDetails.time)) return;
        await addDoc(collection(db, `artifacts/${appId}/chats/${chatId}/messages`), {
            type: 'delivery',
            delivery: deliveryDetails,
            senderId: authUser.uid,
            status: 'pending',
            timestamp: serverTimestamp(),
            replyTo: replyingTo ? { productId: replyingTo.productId, productName: replyingTo.productName } : null,
        });
        setShowDeliveryModal(false);
    };

    const handleCardResponse = async (messageId, status) => {
        await updateDoc(doc(db, `artifacts/${appId}/chats/${chatId}/messages`, messageId), { status });
    };

    if (!chatPartner) return null;

    return (
        <div className="fixed bottom-4 right-4 sm:right-8 w-[90vw] max-w-sm h-[60vh] bg-white rounded-xl shadow-2xl flex flex-col border z-50">
            {showOfferModal && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center rounded-xl z-20">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-11/12">
                        <h3 className="text-lg font-bold mb-2">Make an Offer</h3>
                        <p className="text-sm text-gray-500 mb-4">For: {replyingTo?.productName}</p>
                        <form onSubmit={handleSendOffer}>
                            <input type="number" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="Enter price" className="w-full px-3 py-2 border rounded-md" autoFocus/>
                            <div className="flex gap-2 mt-4">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-md">Send Offer</button>
                                <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 bg-gray-200 py-2 rounded-md">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showDeliveryModal && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center rounded-xl z-20">
                    <form onSubmit={handleSendDelivery} className="bg-white p-6 rounded-lg shadow-xl w-11/12 space-y-4">
                        <h3 className="text-lg font-bold">Set Delivery Details</h3>
                         <div>
                            <label className="block text-sm font-medium">Method</label>
                            <select value={deliveryDetails.method} onChange={e => setDeliveryDetails(prev => ({...prev, method: e.target.value}))} className="w-full mt-1 p-2 border rounded-md bg-white">
                                <option>On-Campus Meetup</option>
                                <option>Dispatch Rider</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Location / Address</label>
                            <input type="text" value={deliveryDetails.location} onChange={e => setDeliveryDetails(prev => ({...prev, location: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" required/>
                        </div>
                        {deliveryDetails.method === 'On-Campus Meetup' && <div>
                            <label className="block text-sm font-medium">Time</label>
                            <input type="text" value={deliveryDetails.time} onChange={e => setDeliveryDetails(prev => ({...prev, time: e.target.value}))} className="w-full mt-1 p-2 border rounded-md" required/>
                        </div>}
                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md">Send Proposal</button>
                            <button type="button" onClick={() => setShowDeliveryModal(false)} className="w-full bg-gray-200 py-2 rounded-md">Cancel</button>
                        </div>
                    </form>
                </div>
            )}
            <header className="flex items-center justify-between p-3 border-b">
                 <h3 className="font-bold flex-grow ml-3">{`${chatPartner.firstName} ${chatPartner.lastName}`}</h3>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800">&times;</button>
            </header>
            <div className="flex-grow overflow-y-auto p-4">
                {messages.map(msg => {
                    const isInCart = msg.type === 'product_tag' && cartItems.some(item => item.sourceMessageId === msg.id);
                    if (msg.type === 'product_tag') return <ProductTagCard key={msg.id} message={msg} onReply={setReplyingTo} isInCart={isInCart} onAddToCart={() => {}} />;
                    if (msg.type === 'offer') return <OfferCard key={msg.id} message={msg} authUser={authUser} onRespond={handleCardResponse} />;
                    if (msg.type === 'delivery') return <DeliveryCard key={msg.id} message={msg} authUser={authUser} onRespond={handleCardResponse} />;
                    return (<div key={msg.id} className={`flex my-2 ${msg.senderId === authUser.uid ? 'justify-end' : 'justify-start'}`}><TextMessage message={msg} isSender={msg.senderId === authUser.uid} /></div>);
                })}
                <div ref={messagesEndRef} />
            </div>
            <footer className="p-3 border-t">
                 {replyingTo && <div className="text-xs px-2 mb-1">Replying to: <span className="font-semibold">{replyingTo.productName}</span></div>}
                 <form onSubmit={handleSendMessage} className="flex gap-2">
                    <button type="button" onClick={() => replyingTo && setShowDeliveryModal(true)} disabled={!replyingTo} className="p-2 text-gray-500 disabled:text-gray-300">📍</button>
                    <button type="button" onClick={() => replyingTo && setShowOfferModal(true)} disabled={!replyingTo} className="p-2 text-gray-500 disabled:text-gray-300">$</button>
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-4 py-2 border rounded-full"/>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full">Send</button>
                </form>
            </footer>
        </div>
    );
};

export default Chat;

