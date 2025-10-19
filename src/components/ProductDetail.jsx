import React, { useState } from 'react';
// --- HIGHLIGHT: All import paths have been corrected to be absolute ---
import StarRating from '/src/components/StarRating.jsx';
import { db, appId } from '/src/firebaseConfig.js';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';

// --- The LeaveReview component remains unchanged ---
const LeaveReview = ({ product, authUser }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmitReview = async () => {
        if (rating === 0) {
            setError("Please select a star rating.");
            return;
        }
        setError("");
        setSuccess("");

        try {
            await runTransaction(db, async (transaction) => {
                const vendorRef = doc(db, `artifacts/${appId}/users`, product.vendorId);
                const vendorDoc = await transaction.get(vendorRef);
                if (!vendorDoc.exists()) throw "Vendor not found!";
                const newReputation = {
                    ratings: (vendorDoc.data().reputation.ratings || 0) + 1,
                    score: (vendorDoc.data().reputation.score || 0) + rating
                };
                transaction.update(vendorRef, { reputation: newReputation });
                
                const reviewRef = doc(collection(db, `artifacts/${appId}/reviews`));
                transaction.set(reviewRef, {
                    productId: product.id,
                    vendorId: product.vendorId,
                    buyerId: authUser.uid,
                    rating,
                    comment,
                    createdAt: serverTimestamp()
                });
            });
            setSuccess("Your review has been submitted. Thank you!");
            setRating(0);
            setComment("");
        } catch (e) {
            setError("Failed to submit review. You may have already reviewed this vendor.");
            console.error("Review submission error:", e);
        }
    };
    
    return (
        <div className="mt-8 pt-6 border-t">
            <h4 className="text-xl font-bold">Leave a Review</h4>
            <div className="my-4">
                <span className="font-semibold">Your Rating:</span>
                <div className="flex gap-1 mt-2">
                   <StarRating rating={rating} onRatingChange={setRating} />
                </div>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us about your experience..." rows="3" className="w-full p-2 border rounded-md"></textarea>
            <button onClick={handleSubmitReview} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md">Submit Review</button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        </div>
    );
};

// --- The ProductDetail component has been updated with a new image gallery ---
const ProductDetail = ({ product, vendor, onBack, authUser, onStartChat }) => {
    // --- State to manage which image is currently selected ---
    const [selectedImage, setSelectedImage] = useState(product.imageUrl);

    // Create a list of all images, with the main one first.
    const allImages = [product.imageUrl, ...(product.images || [])].slice(0, 5);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-semibold">&larr; Back to Marketplace</button>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* --- New Multi-Image Gallery --- */}
                <div className="md:w-1/2 flex flex-col-reverse sm:flex-row gap-4">
                    <div className="flex sm:flex-col gap-3 justify-center sm:justify-start">
                        {allImages.map((imgUrl, index) => (
                            <div
                                key={index}
                                onClick={() => setSelectedImage(imgUrl)}
                                className={`w-16 h-16 p-1 bg-gray-100 rounded-md cursor-pointer transition-all ${selectedImage === imgUrl ? 'ring-2 ring-blue-600' : 'hover:ring-2 hover:ring-gray-300'}`}
                            >
                                <img src={imgUrl} alt={`thumbnail ${index + 1}`} className="w-full h-full object-contain" />
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center h-80 sm:h-auto">
                        <img
                            src={selectedImage}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain p-4"
                        />
                    </div>
                </div>

                <div className="md:w-1/2">
                    <h2 className="text-2xl sm:text-3xl font-bold">{product.name}</h2>
                    <p className="text-3xl font-extrabold text-blue-600 my-4">${product.price.toFixed(2)}</p>
                    <p className="text-gray-700">{product.description}</p>
                    
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-lg font-semibold">Vendor Information</h4>
                        <p className="mt-2">{vendor?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <StarRating rating={vendor?.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0} />
                            <span className="text-sm">({vendor?.reputation?.ratings || 0} ratings)</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-lg font-semibold text-gray-800">Delivery Options</h4>
                        <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                            {product.deliveryOptions?.meetup && <li>On-Campus Meetup (Free)</li>}
                            {product.deliveryOptions?.dispatch && <li>3rd-Party Dispatch Rider</li>}
                            {product.deliveryOptions?.dropoff && <li>Local Drop-off (Fee: ₦{product.deliveryOptions.deliveryFee || 0})</li>}
                        </ul>
                    </div>

                    <button 
                        onClick={() => onStartChat(product.vendorId, product)} 
                        className="mt-6 w-full bg-green-500 text-white py-3 rounded-lg text-lg font-bold hover:bg-green-600 disabled:bg-green-300"
                        disabled={!authUser || authUser.uid === product.vendorId}
                    >
                        {authUser?.uid === product.vendorId ? "This is your product" : "Contact Vendor to Purchase"}
                    </button>
                </div>
            </div>
            { authUser && authUser.uid !== product.vendorId && <LeaveReview product={product} authUser={authUser} /> }
        </div>
    );
};

export default ProductDetail;

