import React from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, appId } from '../firebaseConfig.js';

// --- HIGHLIGHT: Now receives an onCheckout function ---
const Cart = ({ cartItems, onClose, onCheckout }) => {
    
    const removeFromCart = async (itemId) => {
        await deleteDoc(doc(db, `artifacts/${appId}/cart`, itemId));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={onClose}>
            <div className="bg-white w-full max-w-md h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <button onClick={onClose} className="p-2 text-2xl font-light">&times;</button>
                </header>
                
                {cartItems.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center"><p>Your cart is empty.</p></div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex gap-4">
                                <img src={item.imageUrl} alt={item.productName} className="w-20 h-20 rounded-md object-cover"/>
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{item.productName}</h3>
                                    <p className="font-bold">₦{item.price.toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <footer className="p-4 border-t">
                    <div className="flex justify-between items-center font-bold text-lg mb-4">
                        <span>Subtotal</span>
                        <span>₦{subtotal.toFixed(2)}</span>
                    </div>
                    {/* --- HIGHLIGHT: Button now triggers the checkout process --- */}
                    <button 
                        onClick={onCheckout}
                        disabled={cartItems.length === 0} 
                        className="w-full bg-green-500 text-white py-3 rounded-lg font-bold disabled:bg-gray-300"
                    >
                        Proceed to Checkout
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default Cart;

