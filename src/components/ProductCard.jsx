import React from 'react';
import StarRating from '/src/components/StarRating.jsx'; // Corrected import path

const ProductCard = ({ product, vendor, onViewProduct }) => {
    // Helper function for optimized Cloudinary URLs
    const getThumbnailUrl = (originalUrl) => {
        if (!originalUrl || !originalUrl.includes('/image/upload/')) {
            return originalUrl; // Return original if it's not a valid Cloudinary URL
        }
        const parts = originalUrl.split('/image/upload/');
        // w_400: width 400px, h_400: height 400px, c_fill: crop to fill, q_auto: automatic quality
        const transformations = 'w_400,h_400,c_fill,q_auto/'; 
        return `${parts[0]}/image/upload/${transformations}${parts[1]}`;
    };

    const avgRating = vendor?.reputation?.ratings > 0 ? (vendor.reputation.score / vendor.reputation.ratings) : 0;

    return (
        <div className="flex flex-col">
            <div className='bg-[#F3F4F7] flex justify-center items-center max-h-[16rem] p-1 '>
                  <img 
                src={getThumbnailUrl(product.imageUrl)} 
                alt={product.name}
                className=" max-h-[98%] max-w-[full] object-fit  m-auto" 
            /> 
            </div>
         
            <div className=" relative p-1">
                <div className='flex-col text-start items-center '>
                     <p className="text-lg font-bold  h-full  text-gray-900 truncate">{product.name}</p>
                <p className="text-lg  font-bold h-full truncate text-blue-600">${product.price.toFixed(2)}</p>
                </div>
               
                
                {/* --- Updated Vendor Tag Section --- */}
                <div className=" pt-1 border-t border-gray-200 flex-grow">
                    <div className="flex items-center gap-2">
                        {/* <img 
                            src={vendor?.photoURL || `https://placehold.co/32x32/E0E7FF/4F46E5?text=${vendor?.firstName?.charAt(0) || 'V'}`} 
                            alt={vendor?.firstName}
                            className=" w-[85%] m-auto self-center rounded-full object-cover"
                        /> */}
                        <div>
                            {/* <p className="text-sm font-semibold text-gray-800 truncate">{`${vendor?.firstName || ''} ${vendor?.lastName || ''}`}</p> */}
                            <div className="flex items-center">
                                <StarRating rating={avgRating} />
                                <span className="text-xs text-gray-500 ml-1">({vendor?.reputation?.ratings || 0})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onViewProduct(product)} 
                    className=" w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                    View Product
                </button>
            </div>
        </div>
    );
};

export default ProductCard;

