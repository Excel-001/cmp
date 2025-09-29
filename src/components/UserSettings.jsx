import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '/src/firebaseConfig.js';
import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.mjs';

const UserSettings = ({ user, userData }) => {
    const [profileData, setProfileData] = useState(userData);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const CLOUDINARY_CLOUD_NAME = "dojvewcke";
    const CLOUDINARY_UPLOAD_PRESET = "campus_marketplace_preset";

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploading(true);
        setError('');
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 800 });
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            if (!response.ok) throw new Error('Upload failed');
            const data = await response.json();
            const photoURL = data.secure_url;
            await updateDoc(doc(db, `artifacts/${appId}/users`, user.uid), { photoURL });
            setProfileData(prev => ({ ...prev, photoURL }));
            setSuccess("Profile picture updated!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Image upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateDoc(doc(db, `artifacts/${appId}/users`, user.uid), {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                middleName: profileData.middleName,
                phoneNumber: profileData.phoneNumber,
                location: profileData.location
            });
            setSuccess('Profile updated successfully!');
             setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <div className="mt-6 flex items-center gap-4">
                 <img 
                    src={profileData.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${profileData.firstName.charAt(0)}`} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                />
                <div>
                    <label htmlFor="photo-upload" className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg cursor-pointer hover:bg-gray-300">
                        Change Picture
                    </label>
                    <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    {uploading && <p className="text-sm text-blue-500 mt-2">Uploading...</p>}
                </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="mt-6">
                <div className="space-y-4">
                    {/* Form fields for editing */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/2">
                            <label className="block text-sm font-medium">First Name</label>
                            <input type="text" value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="block text-sm font-medium">Last Name</label>
                            <input type="text" value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Phone Number</label>
                        <input type="tel" value={profileData.phoneNumber} onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Location</label>
                        <input type="text" value={profileData.location} onChange={(e) => setProfileData({...profileData, location: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                </div>
                 {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                 {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
                <div className="mt-6">
                     <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Save Changes</button>
                </div>
            </form>
        </div>
    );
};

export default UserSettings;

