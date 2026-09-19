const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Returns a short-lived signature the mobile app / admin dashboard uses to
 * upload directly to Cloudinary from the client. This keeps receipt and
 * ID-document photos off the Render dyno entirely - only the resulting
 * URL ever touches the Express backend.
 */
function getSignedUploadParams(folder) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder
  };
}

module.exports = { getSignedUploadParams };
