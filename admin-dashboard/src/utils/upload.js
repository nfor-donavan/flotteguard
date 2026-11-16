import client from '../api/client';

// Direct-to-Cloudinary upload using a short-lived signature from our API.
// Resolves with the list of secure URLs, in the same order as `files`.
export async function uploadImages(files, signaturePath) {
  const list = Array.from(files);
  if (!list.length) return [];
  const { data: s } = await client.get(signaturePath);
  const urls = [];
  for (const file of list) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', s.apiKey);
    fd.append('timestamp', s.timestamp);
    fd.append('signature', s.signature);
    fd.append('folder', s.folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok || !json.secure_url) throw new Error(json.error?.message || 'Upload failed');
    urls.push(json.secure_url);
  }
  return urls;
}
