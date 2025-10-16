import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '/src/firebaseConfig.js';
import imageCompression from 'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.mjs';

const UserSettings = ({ user, userData }) => {
    const [profileData, setProfileData] = useState(userData);
    const [originalData, setOriginalData] = useState(userData);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    
    const CLOUDINARY_CLOUD_NAME = "dojvewcke";
    const CLOUDINARY_UPLOAD_PRESET = "campus_marketplace_preset";

    useEffect(() => {
        const fieldsToCheck = ['firstName', 'lastName', 'middleName', 'phoneNumber', 'location'];
        const changed = fieldsToCheck.some(field => 
            profileData[field] !== originalData[field]
        );
        setHasChanges(changed);
    }, [profileData, originalData]);

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
            setOriginalData(prev => ({ ...prev, photoURL}));
            setSuccess("Profile picture updated!");
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Image upload failed.");
            console.error(err);
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
            setOriginalData({ ...profileData });
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to update profile.');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-2xl font-bold">Account Settings</h2>
            </div>

            {error && (
                <div className="alert alert-error shadow-lg">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {success && (
                <div className="alert alert-success shadow-lg">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{success}</span>
                    </div>
                </div>
            )}

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title text-xl mb-4">Profile Picture</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="avatar">
                            <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4">
                                <img 
                                src={profileData.photoURL || `https://placehold.co/128x128/E0E7FF/4F46E5?text=${profileData.firstName.charAt(0)}`} 
                                alt="Profile" 
                            />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <p className="text-sm opacity-70 mb-3">JPG, PNG or GIF. Max size 1MB</p>
                        <label htmlFor="photo-upload" className="btn btn-outline btn-primary gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Change Picture
                        </label>
                        <input 
                            id="photo-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} />
                        
                        {uploading && (
                            <div className="flex items-center gap-2 mt-3">
                                <span className="loading loading-spinner loading-sm"></span>
                                <span className="text-sm">Uploading...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <h3 className="card-title text-xl mb-4">Personal Information</h3>
                    <form onSubmit={handleProfileUpdate} className="mt-6">
                        <div className="space-y-4">
                            {/* Form fields for editing */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium">First Name</label>
                                    <input 
                                        type="text" 
                                        value={profileData.firstName} 
                                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} 
                                        className="input input-bordered w-full" 
                                        required />
                                </div>
                                <div className="w-full sm:w-1/2">
                                    <label className="block text-sm font-medium">Last Name</label>
                                    <input 
                                        type="text" 
                                        value={profileData.lastName} 
                                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} 
                                        className="input input-bordered w-full" 
                                        required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Phone Number</label>
                                <input 
                                    type="tel" 
                                    value={profileData.phoneNumber} 
                                    onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})} 
                                    className="input input-bordered w-full" 
                                    required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Location</label>
                                <input 
                                    type="text" 
                                    value={profileData.location} 
                                    onChange={(e) => setProfileData({...profileData, location: e.target.value})} 
                                    className="input input-bordered w-full" 
                                    required />
                            </div>
                        </div>

                        <div className="divider"></div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
                        <div className="card-actions justify-end">
                            <button 
                                type="submit" 
                                className={`btn btn-primary gap-2 ${
                                    hasChanges
                                        ? 'btn btn-primary gap-2'
                                        : 'btn btn-disabled'
                                }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>Save Changes
                                </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default UserSettings;

