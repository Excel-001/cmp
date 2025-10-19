import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.mjs';
// --- HIGHLIGHT: The import path for firebaseConfig.js has been corrected ---
import { db, appId } from '../firebaseConfig.js';

// --- Reusable Component for displaying a list of products ---
const ProductList = ({ products, onDeleteClick }) => {
    const getThumbnailUrl = (originalUrl) => {
        if (!originalUrl || !originalUrl.includes('/image/upload/')) return originalUrl;
        const parts = originalUrl.split('/image/upload/');
        return `${parts[0]}/image/upload/w_400,h_400,c_fill,q_auto/${parts[1]}`;
    };

    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800">Your Products</h3>
            {products.length === 0 ? (
                <p className="text-gray-500 mt-2">You haven't added any products yet.</p>
            ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <img src={getThumbnailUrl(product.imageUrl)} alt={product.name} className="w-full h-40 object-cover"/>
                            <div className="p-4">
                                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                <p className="text-gray-600">${product.price.toFixed(2)}</p>
                                <button onClick={() => onDeleteClick(product.id)} className="text-sm text-red-500 hover:underline mt-2">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Reusable Component for the delete confirmation modal ---
const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
            <p className="mb-4 text-lg">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold">Delete</button>
                <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">Cancel</button>
            </div>
        </div>
    </div>
);


const ProductManager = ({ user, userData }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploading, setUploading] = useState(false);
    const [products, setProducts] = useState([]);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deliveryOptions, setDeliveryOptions] = useState({ meetup: true, dropoff: false, dispatch: false });
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [attributes, setAttributes] = useState({
        brand: '', color: '', size: '', material: '',
        fit: 'Regular', gender: 'Unisex', availability: 'In Stock',
    });

    const CLOUDINARY_CLOUD_NAME = "dojvewcke";
    const CLOUDINARY_UPLOAD_PRESET = "campus_marketplace_preset";

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, `artifacts/${appId}/products`), where("vendorId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [user]);

    const handleImageSelect = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).slice(0, 5);
            setImageFiles(files);
        }
    };

    const handleDeleteClick = (productId) => {
        setProductToDelete(productId);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/products`, productToDelete));
        } catch(err) {
            setError("Failed to delete product.");
        } finally {
            setProductToDelete(null);
        }
    };

    const handleAttributeChange = (e) => {
        const { name, value } = e.target;
        setAttributes(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDeliveryOptionChange = (e) => {
        const { name, checked } = e.target;
        setDeliveryOptions(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !price || imageFiles.length === 0) {
            setError('Please fill out all fields and select at least one image.');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const uploadPromises = imageFiles.map(async (file) => {
                const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
                const formData = new FormData();
                formData.append('file', compressedFile);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                if (!response.ok) throw new Error('Image upload failed');
                return response.json();
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const imageUrls = uploadedImages.map(img => img.secure_url);

            await addDoc(collection(db, `artifacts/${appId}/products`), {
                vendorId: user.uid,
                vendorLocation: userData.location,
                name, description, 
                price: parseFloat(price),
                createdAt: serverTimestamp(),
                imageUrl: imageUrls[0],
                images: imageUrls.slice(1),
                attributes,
                deliveryOptions: {
                    ...deliveryOptions,
                    deliveryFee: deliveryOptions.dropoff ? parseFloat(deliveryFee) : 0,
                },
                salesCount: 0,
                rating: 0,
            });

            setSuccess('Product added successfully!');
            setName(''); setDescription(''); setPrice(''); setImageFiles([]);
            setAttributes({ brand: '', color: '', size: '', material: '', fit: 'Regular', gender: 'Unisex', availability: 'In Stock' });
            document.getElementById('product-image-input').value = null;
            setTimeout(() => setSuccess(''), 4000);

        } catch (err) {
            setError('Failed to add product.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div>
            {productToDelete && <ConfirmationModal message="Are you sure you want to delete this product? This cannot be undone." onConfirm={confirmDelete} onCancel={() => setProductToDelete(null)} />}
            <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h2 className="text-2xl font-bold">Add a New Product</h2>
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
                        <label className="block text-sm font-medium text-gray-700">Product Images (up to 5)</label>
                        <input id="product-image-input" type="file" onChange={handleImageSelect} accept="image/*" multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" required />
                    </div>
                    
                    {imageFiles.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {imageFiles.map((file, index) => (
                                <div key={index} className="relative aspect-square">
                                    <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-800">Product Details</h3>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Brand</label>
                                <input type="text" name="brand" value={attributes.brand} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2" placeholder="e.g., Nike, Generic" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Color</label>
                                <input type="text" name="color" value={attributes.color} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2" placeholder="e.g., Blue" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Size / Weight</label>
                                <input type="text" name="size" value={attributes.size} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2" placeholder="e.g., M, 42, 250mg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Material / Fabric</label>
                                <input type="text" name="material" value={attributes.material} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2" placeholder="e.g., Cotton, Leather" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Fit</label>
                                <select name="fit" value={attributes.fit} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2 bg-white">
                                    <option>Regular</option><option>Slim</option><option>Oversized</option><option>N/A</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Gender</label>
                                <select name="gender" value={attributes.gender} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2 bg-white">
                                    <option>Unisex</option><option>Men</option><option>Women</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Availability</label>
                                <select name="availability" value={attributes.availability} onChange={handleAttributeChange} className="mt-1 w-full border rounded-md p-2 bg-white">
                                    <option>In Stock</option><option>Pre-order</option><option>Out of Stock</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold text-gray-800">Delivery Options</h3>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center"><input type="checkbox" name="meetup" checked={deliveryOptions.meetup} onChange={handleDeliveryOptionChange} className="h-4 w-4" /> <span className="ml-2 text-sm">On-Campus Meetup (Free)</span></label>
                            <label className="flex items-center"><input type="checkbox" name="dispatch" checked={deliveryOptions.dispatch} onChange={handleDeliveryOptionChange} className="h-4 w-4" /> <span className="ml-2 text-sm">3rd-Party Dispatch Rider (Buyer pays)</span></label>
                            <label className="flex items-center"><input type="checkbox" name="dropoff" checked={deliveryOptions.dropoff} onChange={handleDeliveryOptionChange} className="h-4 w-4" /> <span className="ml-2 text-sm">Local Drop-off (You deliver)</span></label>
                            {deliveryOptions.dropoff && (
                                <div className="pl-6">
                                    <label className="block text-sm font-medium">Drop-off Fee (₦)</label>
                                    <input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-md" placeholder="e.g., 1000" />
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    {success && <p className="text-green-500 text-sm">{success}</p>}
                    <button type="submit" disabled={uploading} className="w-full py-2 bg-blue-600 text-white rounded-lg">{uploading ? 'Uploading...' : 'Add Product'}</button>
                </form>
            </div>
            <ProductList products={products} onDeleteClick={handleDeleteClick} />
        </div>
    );
};

export default ProductManager;

