import React, { useMemo } from 'react';

const Checkout = ({ cartItems, onPlaceOrder, onBack }) => {

    // --- HIGHLIGHT: Logic to group cart items by vendor ---
    const itemsByVendor = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const vendorId = item.vendorId;
            if (!acc[vendorId]) {
                acc[vendorId] = {
                    vendorName: `${item.vendor?.firstName || 'Vendor'} ${item.vendor?.lastName || ''}`,
                    items: [],
                    // --- HIGHLIGHT: Safely handle potentially missing delivery details ---
                    deliveryDetails: item.deliveryDetails || { method: 'Not specified', location: 'Not specified' },
                };
            }
            acc[vendorId].items.push(item);
            return acc;
        }, {});
    }, [cartItems]);

    // --- HIGHLIGHT: Calculate grand total ---
    const grandTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handlePlaceOrderClick = () => {
        // --- HIGHLIGHT: Pass grouped items to the main order function ---
        const orderDetails = {
            totalAmount: grandTotal,
        };
        onPlaceOrder(orderDetails, itemsByVendor);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col h-[90vh]">
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Confirm Your Order</h2>
                    <button onClick={onBack} className="p-2 text-2xl font-light">&times;</button>
                </header>

                <main className="p-6 overflow-y-auto flex-grow">
                    {Object.keys(itemsByVendor).length === 0 ? (
                        <p>Your cart is empty.</p>
                    ) : (
                        <div className="space-y-6">
                            {/* --- HIGHLIGHT: Render items grouped by vendor --- */}
                            {Object.entries(itemsByVendor).map(([vendorId, data]) => (
                                <div key={vendorId} className="border p-4 rounded-lg">
                                    <h3 className="font-bold text-lg mb-3">Items from {data.vendorName}</h3>
                                    <div className="space-y-3 border-b pb-3 mb-3">
                                        {data.items.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <span>{item.productName}</span>
                                                <span className="font-medium">₦{item.price.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <h4 className="font-semibold mb-1">Agreed Delivery Details:</h4>
                                        {/* --- HIGHLIGHT: Safely access delivery details to prevent crashes --- */}
                                        <p><span className="font-medium">Method:</span> {data.deliveryDetails?.method}</p>
                                        <p><span className="font-medium">Location:</span> {data.deliveryDetails?.location}</p>
                                        {data.deliveryDetails?.time && <p><span className="font-medium">Time:</span> {data.deliveryDetails?.time}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t bg-gray-50 rounded-b-lg">
                    <div className="flex justify-between items-center font-bold text-xl mb-4">
                        <span>Grand Total</span>
                        <span>₦{grandTotal.toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={handlePlaceOrderClick}
                        disabled={cartItems.length === 0}
                        className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300"
                    >
                        Proceed to Payment
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default Checkout;

