import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, documentId, orderBy } from 'firebase/firestore';
// --- HIGHLIGHT: All import paths have been corrected to be relative ---
import { db, appId } from '../firebaseConfig.js';
import ProductDetail from './ProductDetail.jsx';
import StarRating from './StarRating.jsx';

// --- ProductCard is defined inside Marketplace as requested ---
const ProductCard = ({ product, vendor, onViewProduct, onViewVendor }) => {
    const getThumbnailUrl = (originalUrl) => {
        if (!originalUrl || !originalUrl.includes('/image/upload/')) return originalUrl;
        const parts = originalUrl.split('/image/upload/');
        return `${parts[0]}/image/upload/w_400,h_400,c_fill,q_auto/${parts[1]}`;
    };

    const avgRating = vendor?.reputation?.ratings > 0
        ? vendor.reputation.score / vendor.reputation.ratings
        : 0;

    return (
        <div className="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <figure className="bg-base-200 aspect-square">
                <img
                    src={getThumbnailUrl(product.imageUrl)}
                    alt={product.name}
                    className="object-contain w-full h-full p-4"
                />
            </figure>

            <div className="card-body">
                <h3 className="card-title text-base line-clamp-2">{product.name}</h3>
                <div className="badge badge-primary badge-lg font-bold">₦{product.price.toFixed(2)}</div>

                <div className="divider my-1"></div>

                <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded-lg transition-colors"
                    onClick={() => onViewVendor && onViewVendor(product.vendorId)}
                >
                    <div className="avatar">
                        <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img
                                src={
                                    vendor?.photoURL ||
                                    `https://placehold.co/40x40/E0E7FF/4F46E5?text=${vendor?.firstName?.charAt(0) || 'V'}`
                                }
                                alt={vendor?.firstName}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                            {`${vendor?.firstName || '...'} ${vendor?.lastName || ''}`}
                        </p>
                        <div className="flex items-center gap-1">
                            <StarRating rating={avgRating} />
                            <span className="text-xs opacity-60">
                                ({vendor?.reputation?.ratings || 0})
                            </span>
                        </div>
                        <div className="text-xs opacity-60 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {vendor?.location || '...'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onViewProduct(product)}
                    className="btn btn-primary btn-block mt-2"
                >
                    View Details
                </button>
            </div>
        </div>
    );
    // return (
    //     <div className="bg-white rounded-lg shadow-md overflow-hidden  hover:shadow-xl transition-shadow duration-300 flex flex-col">
    //         <div className="   bg-gray-100 p-2">
    //             <img
    //                 src={getThumbnailUrl(product.imageUrl)}
    //                 alt={product.name}
    //                 className="w-full h-full object-contain"
    //             />
    //         </div>

    //         <div className="p-2 flex flex-col flex-grow">
    //             <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
    //             <p className="text-xl font-extrabold text-blue-600 ">${product.price.toFixed(2)}</p>

    //             <div className=" border-t pt-2 mt-2  flex-grow">
    //                 <div
    //                     className="flex items-center gap-1 cursor-pointer"
    //                     onClick={() => onViewVendor && onViewVendor(product.vendorId)}
    //                 >
    //                     <img
    //                         src={
    //                             vendor?.photoURL ||
    //                             `https://placehold.co/32x32/E0E7FF/4F46E5?text=${vendor?.firstName?.charAt(0) || 'V'}`
    //                         }
    //                         alt={vendor?.firstName}
    //                         className="w-8 h-8 rounded-full object-cover"
    //                     />
    //                     <div>
    //                         <p className="text-sm font-semibold text-gray-800 truncate">
    //                             {`${vendor?.firstName || '...'} ${vendor?.lastName || ''}`}
    //                         </p>
    //                         <div className="flex items-center">
    //                             <StarRating rating={avgRating} />
    //                             <span className="text-xs text-gray-500 ">
    //                                 ({vendor?.reputation?.ratings || 0})
    //                             </span>
    //                         </div>
    //                         <div className="text-xs text-gray-500">
    //                             {vendor?.location || '...'}
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>

    //             <button
    //                 onClick={() => onViewProduct(product)}
    //                 className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
    //             >
    //                 View Product
    //             </button>
    //         </div>
    //     </div>
    // );
};

const Marketplace = ({ userData, authUser, onStartChat, onViewVendor }) => {
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ color: '', size: '', location: '', gender: '', availability: '' });
    const [sortBy, setSortBy] = useState('createdAt_desc');

    useEffect(() => {
        if (!userData) return;
        setLoading(true);
        let q = query(collection(db, `artifacts/${appId}/products`));

        if (filters.location) q = query(q, where('vendorLocation', '==', filters.location));
        if (filters.color) q = query(q, where('attributes.color', '==', filters.color));
        if (filters.size) q = query(q, where('attributes.size', '==', filters.size));
        if (filters.gender) q = query(q, where('attributes.gender', '==', filters.gender));
        if (filters.availability) q = query(q, where('attributes.availability', '==', filters.availability));

        if (sortBy === 'price_asc') q = query(q, orderBy('price', 'asc'));
        else if (sortBy === 'price_desc') q = query(q, orderBy('price', 'desc'));
        else if (sortBy === 'rating_desc') q = query(q, orderBy('rating', 'desc'));
        else q = query(q, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (searchTerm) {
                productsData = productsData.filter(p =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            setProducts(productsData);
            setLoading(false);
        }, (error) => {
            console.error("Marketplace listener error:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [userData, filters, searchTerm, sortBy]);

    useEffect(() => {
        if (products.length === 0) return;
        const vendorIds = [...new Set(products.map(p => p.vendorId))].filter(id => !vendors[id]);
        if (vendorIds.length > 0) {
            const usersRef = collection(db, `artifacts/${appId}/users`);
            const vendorQuery = query(usersRef, where(documentId(), 'in', vendorIds));
            getDocs(vendorQuery).then(vendorDocs => {
                const newVendors = {};
                vendorDocs.forEach(doc => { newVendors[doc.id] = doc.data(); });
                setVendors(prev => ({ ...prev, ...newVendors }));
            });
        }
    }, [products, vendors]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (selectedProduct) {
        return (
            <ProductDetail
                product={selectedProduct}
                vendor={vendors[selectedProduct.vendorId]}
                onBack={() => setSelectedProduct(null)}
                authUser={authUser}
                onStartChat={onStartChat}
            />
        );
    }

    return (
        <div className="container mx-auto px-4">
            {/* Search and Filter Section */}
            <div className="card bg-base-100 shadow-xl mb-8">
                <div className="card-body space-y-4">
                    {/* Search Bar */}
                    <div className="form-control">
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input input-bordered w-full"
                            />
                            <button className="btn btn-square btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <select 
                            name="location" 
                            onChange={handleFilterChange} 
                            className="select select-bordered w-full"
                        >
                            <option value="">All Locations</option>
                            <option>Nile University</option>
                        </select>
                        
                        <select 
                            name="color" 
                            onChange={handleFilterChange} 
                            className="select select-bordered w-full"
                        >
                            <option value="">All Colors</option>
                        </select>
                        
                        <select 
                            name="size" 
                            onChange={handleFilterChange} 
                            className="select select-bordered w-full"
                        >
                            <option value="">All Sizes</option>
                        </select>
                        
                        <select 
                            name="gender" 
                            onChange={handleFilterChange} 
                            className="select select-bordered w-full"
                        >
                            <option value="">Any Gender</option>
                        </select>
                        
                        <select
                            name="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="createdAt_desc">Newest First</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating_desc">Top Rated</option>
                        </select>
                    </div>

                    {/* Active Filters Badge */}
                    {Object.values(filters).some(f => f) && (
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(filters).map(([key, value]) => 
                                value && (
                                    <div key={key} className="badge badge-outline gap-2">
                                        {key}: {value}
                                        <button onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}>✕</button>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : products.length === 0 ? (
                <div className="alert alert-info shadow-lg">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>No products found. Try adjusting your filters.</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            vendor={vendors[product.vendorId]}
                            onViewProduct={setSelectedProduct}
                            onViewVendor={onViewVendor}
                        />
                    ))}
                </div>
            )}
        </div>
    );
    // return (
    //     <div>
    //         <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border space-y-4">
    //             <input
    //                 type="text"
    //                 placeholder="Search for products..."
    //                 value={searchTerm}
    //                 onChange={(e) => setSearchTerm(e.target.value)}
    //                 className="w-full px-4 py-2 border rounded-md"
    //             />

    //             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    //                 <select name="location" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white">
    //                     <option value="">All Locations</option>
    //                     <option>Nile University</option>
    //                 </select>
    //                 <select name="color" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white">
    //                     <option value="">All Colors</option>
    //                 </select>
    //                 <select name="size" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white">
    //                     <option value="">All Sizes</option>
    //                 </select>
    //                 <select name="gender" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white">
    //                     <option value="">Any Gender</option>
    //                 </select>
    //                 <select
    //                     name="sortBy"
    //                     value={sortBy}
    //                     onChange={(e) => setSortBy(e.target.value)}
    //                     className="w-full p-2 border rounded-md bg-white"
    //                 >
    //                     <option value="createdAt_desc">Newest</option>
    //                     <option value="price_asc">Price: Low to High</option>
    //                     <option value="price_desc">Price: High to Low</option>
    //                     <option value="rating_desc">Top Rated</option>
    //                 </select>
    //             </div>
    //         </div>

    //         {loading ? (
    //             <p className="text-center">Loading...</p>
    //         ) : (
    //             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 md:gap-6 gap-3">
    //                 {products.map(product => (
    //                     <ProductCard
    //                         key={product.id}
    //                         product={product}
    //                         vendor={vendors[product.vendorId]}
    //                         onViewProduct={setSelectedProduct}
    //                         onViewVendor={onViewVendor}
    //                     />
    //                 ))}
    //             </div>
    //         )}
    //     </div>
    // );
};

export default Marketplace;

