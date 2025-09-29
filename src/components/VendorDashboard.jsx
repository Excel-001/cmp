import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
// Firebase Storage imports are no longer needed
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.mjs';
import { db, appId } from '../firebaseConfig.js';

// --- NEW: Helper function for optimized Cloudinary URLs ---
const getThumbnailUrl = (originalUrl) => {
    if (!originalUrl || !originalUrl.includes('/image/upload/')) {
        return originalUrl; // Return original if it's not a valid Cloudinary URL
    }
    const parts = originalUrl.split('/image/upload/');
    // w_400: width 400px, c_fill: crop to fill, q_auto: automatic quality for best compression
    const transformations = 'w_400,h_400,c_fill,q_auto/'; 
    return `${parts[0]}/image/upload/${transformations}${parts[1]}`;
};


// --- Reusable Component to display a list of products ---
// --- UPDATED: Uses the getThumbnailUrl function for faster image loading ---
const ProductList = ({ products }) => (
    <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800">Your Products</h3>
        {products.length === 0 ? (
            <p className="text-gray-500 mt-2">You haven't added any products yet.</p>
        ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <img 
                            src={getThumbnailUrl(product.imageUrl)} 
                            alt={product.name} 
                            className="w-full h-40 object-cover"
                        />
                        <div className="p-4">
                            <h4 className="font-semibold text-gray-900">{product.name}</h4>
                            <p className="text-gray-600">${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);


// --- Main Vendor Dashboard Component ---
const VendorDashboard = ({ user, userData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    
    const [products, setProducts] = useState([]);

    // ** IMPORTANT: Replace these with your Cloudinary details **
    const CLOUDINARY_CLOUD_NAME = "dojvewcke"; // <-- Found on your Cloudinary dashboard
    const CLOUDINARY_UPLOAD_PRESET = "campus_marketplace_preset"; // <-- The unsigned preset you created

    useEffect(() => {
        if (!user) return;
        const productsRef = collection(db, `artifacts/${appId}/products`);
        const q = query(productsRef, where("vendorId", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(userProducts);
        });

        return () => unsubscribe();
    }, [user]);

    const handleImageSelect = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || !imageFile || CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" || CLOUDINARY_UPLOAD_PRESET === "YOUR_UPLOAD_PRESET") {
            setError('Please fill out all fields, select an image, and configure Cloudinary details in the code.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Compress Image (efficient)
            const options = { maxSizeMB: 1, maxWidthOrHeight: 800 };
            const compressedFile = await imageCompression(imageFile, options);

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Cloudinary upload failed');
            }
            
            const data = await response.json();
            const imageUrl = data.secure_url;

            // 3. Save product data (with Cloudinary URL) to Firestore
            const productsCollectionRef = collection(db, `artifacts/${appId}/products`);
            await addDoc(productsCollectionRef, {
                vendorId: user.uid,
                vendorLocation: userData.location,
                name,
                description,
                price: parseFloat(price),
                imageUrl, // <-- Now using the URL from Cloudinary
                createdAt: serverTimestamp(),
            });

            // 4. Reset form
            setSuccess('Product added successfully!');
            setName('');
            setDescription('');
            setPrice('');
            setImageFile(null);
            document.getElementById('product-image-input').value = null;
            setTimeout(() => setSuccess(''), 4000);

        } catch (err) {
            setError('Failed to add product. Please check your Cloudinary settings and try again.');
            console.error("Error adding product: ", err);
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div className="mt-6">
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold text-gray-800">Add a New Product</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                        <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Product Image</label>
                        <input id="product-image-input" type="file" onChange={handleImageSelect} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {success && <p className="text-green-500 text-sm">{success}</p>}

                    <button type="submit" disabled={uploading} className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
                        {uploading ? 'Uploading...' : 'Add Product'}
                    </button>
                </form>
            </div>
            <ProductList products={products} />
        </div>
    );
};

export default VendorDashboard;

