import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, documentId, orderBy } from 'firebase/firestore';
// --- HIGHLIGHT: All import paths have been corrected to be absolute ---
import { db, appId } from '/src/firebaseConfig.js';
import ProductDetail from '/src/components/ProductDetail.jsx';
import StarRating from '/src/components/StarRating.jsx';

// Standalone ProductCard component
const ProductCard = ({ product, vendor, onViewProduct, onViewVendor }) => {
    const getThumbnailUrl = (originalUrl) => {
        if (!originalUrl || !originalUrl.includes('/image/upload/')) return originalUrl;
        const parts = originalUrl.split('/image/upload/');
        return `${parts[0]}/image/upload/w_400,h_400,c_fill,q_auto/${parts[1]}`;
    };
    const avgRating = vendor?.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0;

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <img src={getThumbnailUrl(product.imageUrl)} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
                <p className="text-xl font-extrabold text-blue-600 mt-2">${product.price.toFixed(2)}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex-grow">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewVendor(product.vendorId)}>
                        <img 
                            src={vendor?.photoURL || `https://placehold.co/32x32/E0E7FF/4F46E5?text=${vendor?.firstName?.charAt(0) || 'V'}`} 
                            alt={vendor?.firstName}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-sm font-semibold text-gray-800 truncate">{`${vendor?.firstName || ''} ${vendor?.lastName || ''}`}</p>
                            <div className="flex items-center">
                                <StarRating rating={avgRating} />
                                <span className="text-xs text-gray-500 ml-1">({vendor?.reputation?.ratings || 0})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={() => onViewProduct(product)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">View Product</button>
            </div>
        </div>
    )
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
                productsData = productsData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
            }
            setProducts(productsData);
            setLoading(false);
        });
        return unsubscribe;
    }, [userData, filters, searchTerm, sortBy]);
    
    useEffect(() => {
        if (products.length === 0) return;
        const vendorIds = [...new Set(products.map(p => p.vendorId))].filter(id => !vendors[id]);
        if (vendorIds.length > 0) {
            const usersRef = collection(db, `artifacts/${appId}/users`);
            const vendorQuery = query(usersRef, where(documentId(), "in", vendorIds));
            getDocs(vendorQuery).then(vendorDocs => {
                const newVendors = {};
                vendorDocs.forEach(doc => { newVendors[doc.id] = doc.data(); });
                setVendors(prev => ({...prev, ...newVendors}));
            });
        }
    }, [products, vendors]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (selectedProduct) {
        return <ProductDetail product={selectedProduct} vendor={vendors[selectedProduct.vendorId]} onBack={() => setSelectedProduct(null)} authUser={authUser} onStartChat={onStartChat} />;
    }

    return (
        <div>
            <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border space-y-4">
                <input 
                    type="text" 
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <select name="location" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white"><option value="">All Locations</option><option>Nile University</option></select>
                    <select name="color" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white"><option value="">All Colors</option></select>
                    <select name="size" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white"><option value="">All Sizes</option></select>
                    <select name="gender" onChange={handleFilterChange} className="w-full p-2 border rounded-md bg-white"><option value="">Any Gender</option></select>
                    <select name="sortBy" onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border rounded-md bg-white">
                        <option value="createdAt_desc">Newest</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="rating_desc">Top Rated</option>
                    </select>
                </div>
            </div>
            
            {loading ? <p className="text-center">Loading...</p> : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (<ProductCard key={product.id} product={product} vendor={vendors[product.vendorId]} onViewProduct={setSelectedProduct} onViewVendor={onViewVendor}/>))}
                </div>
            )}
        </div>
    );
};

export default Marketplace;

