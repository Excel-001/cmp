import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, setDoc, serverTimestamp, query, where, writeBatch, getDocs, documentId } from 'firebase/firestore';
// --- HIGHLIGHT: All import paths have been corrected to be absolute ---
import { auth, db } from '/src/firebaseConfig.js'; 
import Auth from '/src/components/Auth.jsx';
import Marketplace from '/src/components/Marketplace.jsx';
import VendorProfile from '/src/components/VendorProfile.jsx';
import UserProfile from '/src/components/UserProfile.jsx';
import Chat from '/src/components/Chat.jsx';
import Cart from '/src/components/Cart.jsx';
import Checkout from '/src/components/Checkout.jsx';
import VendorStorefront from '/src/components/VendorStorefront.jsx';
// import Logo from '/src/components/Logo.jsx';
import ProductDetail from '/src/components/ProductDetail.jsx';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
    const [authUser, setAuthUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('auth');
    const [activeView, setActiveView] = useState({ page: 'marketplace', context: null });
    const [activeChatPartnerId, setActiveChatPartnerId] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [products, setProducts] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [vendors, setVendors] = useState({});

    useEffect(() => {
        const listen = onAuthStateChanged(auth, (user) => {
            if (user) {
                const unsub = onSnapshot(doc(db, `artifacts/${appId}/users`, user.uid), (docSnap) => {
                     if (docSnap.exists()){ setUserData(docSnap.data()); setAuthUser(user); setView('app'); } 
                     else { setView('auth'); }
                     setLoading(false);
                });
                return () => unsub();
            } else {
                setAuthUser(null); setUserData(null); setView('auth'); setLoading(false);
            }
        });
        return () => listen();
    }, []);

    useEffect(() => {
        if (!authUser) { setCartItems([]); return; }
        const q = query(collection(db, `artifacts/${appId}/cart`), where('buyerId', '==', authUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCartItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [authUser]);
    
    useEffect(() => {
        if (cartItems.length === 0) return;
        const productIds = [...new Set(cartItems.map(item => item.productId))];
        const newProductIds = productIds.filter(id => !products[id]);
        if (newProductIds.length > 0) {
            const q = query(collection(db, `artifacts/${appId}/products`), where(documentId(), 'in', newProductIds));
            getDocs(q).then(snapshot => {
                const newProducts = {};
                snapshot.docs.forEach(doc => newProducts[doc.id] = { id: doc.id, ...doc.data() });
                setProducts(prev => ({ ...prev, ...newProducts }));
            });
        }
    }, [cartItems, products]);

    const handleSignOut = () => { signOut(auth); setActiveView({ page: 'marketplace', context: null }); };
    const startChat = async (vendorId, product) => {
        if (!authUser) return;
        const chatId = [authUser.uid, vendorId].sort().join('_');
        await setDoc(doc(db, `artifacts/${appId}/chats`, chatId), { participants: [authUser.uid, vendorId] }, { merge: true });
        if (product) {
            const messagesRef = collection(db, `artifacts/${appId}/chats/${chatId}/messages`);
            const q = query(messagesRef, where("type", "==", "product_tag"), where("productId", "==", product.id));
            const existingTags = await getDocs(q);
            if (existingTags.empty) {
                await addDoc(messagesRef, { type: 'product_tag', productId: product.id, productName: product.name, productPrice: product.price, productImageUrl: product.imageUrl, senderId: authUser.uid, timestamp: serverTimestamp() });
            }
        }
        setActiveChatPartnerId(vendorId);
    };
    const handleAddToCart = async (product, vendorId, negotiatedPrice, sourceMessageId) => {
        if (!authUser) return;
        try {
            await addDoc(collection(db, `artifacts/${appId}/cart`), {
                buyerId: authUser.uid, vendorId, productId: product.id, productName: product.name,
                imageUrl: product.imageUrl, price: negotiatedPrice, quantity: 1,
                createdAt: serverTimestamp(), sourceMessageId: sourceMessageId || null,
            });
            setShowCart(true);
        } catch (error) { console.error("Error adding to cart: ", error); }
    };
    const handlePlaceOrder = async (orderDetails) => { /* ... */ };
    const handleViewVendor = (vendorId) => setActiveView({ page: 'vendorStorefront', context: vendorId });
    const handleViewProfile = () => setActiveView({ page: 'profile', context: null });
    const handleBackToMarket = () => { setSelectedProduct(null); setActiveView({ page: 'marketplace', context: null }); };
    const handleViewProduct = (product) => setSelectedProduct(product);

    const Header = () => (
        <div className="w-full max-w-6xl mx-auto flex justify-between items-center mb-8">
            {/* <div onClick={handleBackToMarket} className="cursor-pointer"><Logo /></div> */}
            <div>
                <button onClick={handleBackToMarket} className={`px-4 py-2 rounded-md mr-2 ${activeView.page === 'marketplace' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Market</button>
                <button onClick={handleViewProfile} className={`px-4 py-2 rounded-md mr-2 ${activeView.page === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>Profile</button>
                <button onClick={() => setShowCart(true)} className="relative p-2 rounded-full hover:bg-gray-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    {cartItems.length > 0 && <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{cartItems.length}</span>}
                </button>
            </div>
        </div>
    );
    
   const renderMainContent = () => {
        if (selectedProduct) {
            const vendor = vendors[selectedProduct.vendorId] || (activeView.context === selectedProduct.vendorId ? products[selectedProduct.id]?.vendor : null)
            return <ProductDetail 
                        product={selectedProduct} 
                        vendor={vendor} 
                        onBack={() => setSelectedProduct(null)} 
                        authUser={authUser} 
                        onStartChat={startChat}
                    />
        }
       
        switch (activeView.page) {
            case 'vendorStorefront':
                return <VendorStorefront vendorId={activeView.context} onBack={handleBackToMarket} onStartChat={startChat} onViewProduct={handleViewProduct} />;
            case 'profile':
                return userData.role === 'Vendor'
                    ? <VendorProfile user={authUser} userData={userData} onSignOut={handleSignOut} onChatSelect={setActiveChatPartnerId} />
                    : <UserProfile user={authUser} userData={userData} onSignOut={handleSignOut} onChatSelect={setActiveChatPartnerId} />;
            case 'marketplace':
            default:
                return <Marketplace userData={userData} authUser={authUser} onStartChat={startChat} onViewVendor={handleViewVendor} onViewProduct={handleViewProduct} />;
        }
    };
    
    const cartItemsWithProducts = cartItems.map(item => ({...item, product: products[item.productId]}));

    return (
        <main className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
            {loading ? <p className="text-center mt-10">Loading...</p> : view === 'app' && authUser && userData ? (
                <>
                    <Header />
                    {renderMainContent()}
                    {activeChatPartnerId && <Chat authUser={authUser} chatPartnerId={activeChatPartnerId} onClose={() => setActiveChatPartnerId(null)} onAddToCart={handleAddToCart} cartItems={cartItems}/>}
                    {showCart && <Cart cartItems={cartItemsWithProducts} onClose={() => setShowCart(false)} onCheckout={() => { setShowCart(false); setIsCheckingOut(true); }} />}
                    {isCheckingOut && <Checkout cartItems={cartItemsWithProducts} userData={userData} onPlaceOrder={handlePlaceOrder} onBack={() => setIsCheckingOut(false)} />}
                </>
            ) : (
                <div className="w-full max-w-6xl mx-auto">
                     {/* <div className="flex justify-center mb-8"><Logo /></div> */}
                    <Auth />
                </div>
            )}
        </main>
    );
}

