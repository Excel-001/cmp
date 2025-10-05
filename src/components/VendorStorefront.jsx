import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
// --- HIGHLIGHT: All import paths have been corrected to be relative ---
import { db, appId } from '../firebaseConfig.js';
import StarRating from './StarRating.jsx';
import ProductCard from './ProductCard.jsx';

const VendorStorefront = ({ vendorId, onBack, onStartChat, onViewProduct }) => {
    const [vendor, setVendor] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalSold, setTotalSold] = useState(0);
    const [searchInput, setSearchInput] = useState(''); 
    const [activeSearch, setActiveSearch] = useState(''); 

    useEffect(() => {
        getDoc(doc(db, `artifacts/${appId}/users`, vendorId)).then(docSnap => {
            if (docSnap.exists()) setVendor(docSnap.data());
        });

        const q = query(collection(db, `artifacts/${appId}/products`), where("vendorId", "==", vendorId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        
        const ordersQuery = query(collection(db, `artifacts/${appId}/orderItems`), where("vendorId", "==", vendorId));
        getDocs(ordersQuery).then(snapshot => {
            let count = 0;
            snapshot.forEach(doc => { count += doc.data().quantity; });
            setTotalSold(count);
        });

        return () => unsubscribe();
    }, [vendorId]);

    const calculateRegistrationDuration = (createdAtTimestamp) => {
        if (!createdAtTimestamp) return "";
        const regDate = createdAtTimestamp.toDate();
        const now = new Date();
        const diff = now.getTime() - regDate.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days < 1) return "Joined today";
        if (days < 30) return `Joined ${days} day(s) ago`;
        if (days < 365) return `Joined ${Math.floor(days / 30)} month(s) ago`;
        return `Joined ${Math.floor(days / 365)} year(s) ago`;
    };
    
    const handleSearch = () => {
        setActiveSearch(searchInput);
    };

    if (loading || !vendor) {
        return <p className="text-center mt-10">Loading vendor profile...</p>;
    }

    const avgRating = vendor.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0;
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(activeSearch.toLowerCase())
    );

    return (
        <div>
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-semibold">&larr; Back to Marketplace</button>
            <header className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white rounded-lg shadow-md border mb-8">
                <img 
                    src={vendor.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${vendor.firstName.charAt(0)}`}
                    alt={vendor.firstName}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                />
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{`${vendor.firstName} ${vendor.lastName}`}</h1>
                    <p className="text-gray-500">{vendor.location}</p>
                    <div className="flex items-center gap-2">
                        <StarRating rating={avgRating} />
                        <span className="text-sm">({vendor.reputation?.ratings || 0} ratings)</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 pt-2">
                        <span>{calculateRegistrationDuration(vendor.createdAt)}</span>
                        <span className="font-bold hidden sm:inline">&middot;</span>
                        <span>{products.length} products listed</span>
                        <span className="font-bold hidden sm:inline">&middot;</span>
                        <span>{totalSold} total sales</span>
                    </div>
                </div>
            </header>

            <div className="mb-6 w-full lg:w-[30%] relative">
                <input
                    type="text"
                    placeholder="Search this vendor's products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 focus:outline-none rounded-full focus:ring-2 focus:ring-blue-500"
                />
                <button 
                    onClick={handleSearch}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>
            </div>

            <h2 className="text-2xl font-bold mb-4">Products from this Vendor</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        vendor={vendor} 
                        onViewProduct={onViewProduct}
                        onViewVendor={() => {}} 
                    />
                ))}
            </div>
        </div>
    );
};

export default VendorStorefront;

