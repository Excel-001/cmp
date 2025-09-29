// --- HIGHLIGHT: Added { useState } to the React import ---
import React, { useState } from 'react';
// --- HIGHLIGHT: Corrected the import paths to be relative ---
import StarRating from './StarRating.jsx';
import { db, appId } from '../firebaseConfig.js';
import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';

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
        }
    };
    
    return (
        <div className="mt-8 pt-6 border-t">
            <h4 className="text-xl font-bold">Leave a Review</h4>
            <div className="my-4">
                <span className="font-semibold">Your Rating:</span>
                <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setRating(star)}>
                            <svg className={`w-8 h-8 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                    ))}
                </div>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Tell us about your experience..." rows="3" className="w-full p-2 border rounded-md"></textarea>
            <button onClick={handleSubmitReview} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md">Submit Review</button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
        </div>
    );
};

const ProductDetail = ({ product, vendor, onBack, authUser, onStartChat }) => {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
            <button onClick={onBack} className="mb-6 text-blue-600 hover:underline font-semibold">&larr; Back to Marketplace</button>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                <div className="md:w-1/2">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-80 object-cover rounded-lg"/>
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
                        disabled={authUser.uid === product.vendorId}
                    >
                        {authUser.uid === product.vendorId ? "This is your product" : "Contact Vendor to Purchase"}
                    </button>
                </div>
            </div>
            { authUser.uid !== product.vendorId && <LeaveReview product={product} authUser={authUser} /> }
        </div>
    );
};

export default ProductDetail;

