import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, appId } from '../firebaseConfig.js';
import StarRating from './StarRating.jsx';
import ProductCard from './ProductCard.jsx'; // We'll need a standalone ProductCard

const VendorStorefront = ({ vendorId, onBack, onStartChat, onViewProduct }) => {
    const [vendor, setVendor] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch vendor's profile data
        getDoc(doc(db, `artifacts/${appId}/users`, vendorId)).then(docSnap => {
            if (docSnap.exists()) {
                setVendor(docSnap.data());
            }
        });

        // Listen for vendor's products
        const productsRef = collection(db, `artifacts/${appId}/products`);
        const q = query(productsRef, where("vendorId", "==", vendorId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [vendorId]);

    if (loading || !vendor) {
        return <p className="text-center mt-10">Loading vendor profile...</p>;
    }

    const avgRating = vendor.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0;

    return (
        <div>
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-semibold">&larr; Back to Marketplace</button>
            <header className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-lg shadow-md border mb-8">
                <img 
                    src={vendor.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${vendor.firstName.charAt(0)}`}
                    alt={vendor.firstName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                />
                <div>
                    <h1 className="text-3xl font-bold">{`${vendor.firstName} ${vendor.lastName}`}</h1>
                    <p className="text-gray-500">{vendor.location}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={avgRating} />
                        <span className="text-sm">({vendor.reputation?.ratings || 0} ratings)</span>
                    </div>
                </div>
            </header>

            <h2 className="text-2xl font-bold mb-4">Products from this Vendor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        vendor={vendor} 
                        onViewProduct={onViewProduct}
                        onViewVendor={() => {}} // No need to view vendor from their own page
                    />
                ))}
            </div>
        </div>
    );
};

export default VendorStorefront;
