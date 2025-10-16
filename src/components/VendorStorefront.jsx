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
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg">Loading vendor profile...</span>
            </div>
        )
    }

    const avgRating = vendor.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0;
    
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(activeSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="btn btn-ghost gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Marketplace
            </button>
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="avatar">
                        <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                            <img 
                                src={vendor.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${vendor.firstName.charAt(0)}`}
                                alt={vendor.firstName}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-3">
                    <h1 className="card-title text-3xl justify-center sm:justify-start">
                        {`${vendor.firstName} ${vendor.lastName}`}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-base-content/70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{vendor.location}</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                        <StarRating rating={avgRating} />
                        <span className="text-sm">({vendor.reputation?.ratings || 0} ratings)</span>
                    </div>

                    <div className="divider my-2"></div>
                    
                    <div className="stats stats-vertical sm:stats-horizontal shadow">
                        <div className="stat place-items-center">
                            <div className="stat-title">Member Since</div>
                            <div className="stat-value text-lg">{calculateRegistrationDuration(vendor.createdAt)}</div>
                        </div>

                        <div className="stat place-items-center">
                            <div className="stat-title">Products</div>
                            <div className="stat-value text-primary">{products.length}</div>
                            <div> Listed Items</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Products</div>
                            <div className="stat-value text-primary">{products.length}</div>
                            <div> Listed Items</div>
                        </div>
                        <div className="stat place-items-center">
                            <div className="stat-title">Total Sales</div>
                            <div className="stat-value text-secondary">{totalSold}</div>
                            <div>Products Sold</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-4">
                    <div className="form-control">
                        <div className="input-group">
                            <input
                    type="text"
                    placeholder="Search this vendor's products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="input input-bordered w-full"
                />
                <button 
                    onClick={handleSearch}
                    className="btn btn-square btn-ghost"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                        {activeSearch ? `Search Results for "${activeSearch}` : 'All Products'}
                    </h2>
                    {activeSearch && (
                        <button
                            onClick={() => { setSearchInput(''); setActiveSearch(''); }}
                            className="btn btn-sm btn-ghost gap-2">
                                Clear Search
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                    )}
                </div>
                {filteredProducts.length === 0 ? (
                    <div className="alert alert-info shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>
                                {activeSearch 
                                    ? `No products found matching "${activeSearch}"`
                                    : "This vendor hasn't listed any products yet."
                                }
                            </span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                )}
            </div>
        </div>
    );
};

export default VendorStorefront;

