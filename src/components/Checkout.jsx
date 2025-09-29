import React, { useState, useEffect } from 'react';

const Checkout = ({ cartItems, userData, onPlaceOrder, onBack }) => {
    const [deliveryLocation, setDeliveryLocation] = useState(userData.location || '');
    const [deliveryTime, setDeliveryTime] = useState('');
    // --- HIGHLIGHT: State to manage the selected delivery method and its fee ---
    const [selectedMethod, setSelectedMethod] = useState('meetup');
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [error, setError] = useState('');

    // --- HIGHLIGHT: Calculate subtotal and available options from cart items ---
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const availableOptions = {
        meetup: cartItems.every(item => item.product?.deliveryOptions?.meetup),
        dispatch: cartItems.every(item => item.product?.deliveryOptions?.dispatch),
        dropoff: cartItems.every(item => item.product?.deliveryOptions?.dropoff),
    };
    const dropoffFee = cartItems.reduce((sum, item) => sum + (item.product?.deliveryOptions?.deliveryFee || 0), 0);
    
    // --- HIGHLIGHT: Update total when delivery method changes ---
    useEffect(() => {
        if (selectedMethod === 'dropoff') {
            setDeliveryFee(dropoffFee);
        } else {
            setDeliveryFee(0);
        }
    }, [selectedMethod, dropoffFee]);

    const total = subtotal + deliveryFee;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!deliveryLocation || !deliveryTime) {
            setError('Please confirm a time and location.');
            return;
        }
        const orderDetails = {
            deliveryLocation, deliveryTime,
            deliveryMethod: selectedMethod, deliveryFee,
            totalAmount: total,
        };
        onPlaceOrder(orderDetails);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl flex flex-col">
                <header className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Confirm Order</h2><button onClick={onBack}>&times;</button></header>
                <main className="p-6 overflow-y-auto">
                    {/* --- Order Summary (Updated) --- */}
                    <div className="space-y-2 mb-6 border-b pb-4">
                        {cartItems.map(item => (<div key={item.id} className="flex justify-between"><span>{item.productName}</span><span>${item.price.toFixed(2)}</span></div>))}
                        {deliveryFee > 0 && <div className="flex justify-between text-sm"><span>Delivery Fee</span><span>₦{deliveryFee.toFixed(2)}</span></div>}
                        <div className="flex justify-between font-bold pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    </div>
                    
                    {/* --- Delivery Details Form (Updated) --- */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="font-semibold">Select Delivery Method</label>
                            <div className="mt-2 space-y-2">
                                {availableOptions.meetup && <label><input type="radio" value="meetup" checked={selectedMethod === 'meetup'} onChange={(e) => setSelectedMethod(e.target.value)} /> On-Campus Meetup</label>}
                                {availableOptions.dispatch && <label><input type="radio" value="dispatch" checked={selectedMethod === 'dispatch'} onChange={(e) => setSelectedMethod(e.target.value)} /> Dispatch Rider</label>}
                                {availableOptions.dropoff && <label><input type="radio" value="dropoff" checked={selectedMethod === 'dropoff'} onChange={(e) => setSelectedMethod(e.target.value)} /> Local Drop-off (+₦{dropoffFee})</label>}
                            </div>
                        </div>
                        <div><label>Campus Location</label><input type="text" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} required/></div>
                        <div><label>Proposed Meetup Time</label><input type="text" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g., Tomorrow at 2 PM" required/></div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="w-full mt-2 bg-green-500 text-white py-3 rounded-lg font-bold">Place Order</button>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default Checkout;

