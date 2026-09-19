/**
 * Utilities for handling document and security attachments (images/PDFs)
 * Compresses images to ~80-120KB so they can be saved safely in state and Firestore
 */

export async function processFileAttachment(file, label = 'Security Document') {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // If PDF
    if (file.type === 'application/pdf') {
      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('PDF file size must be under 2MB.'));
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name || `${label}.pdf`,
          label,
          type: 'pdf',
          dataUrl: reader.result,
          size: file.size,
          uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // If Image (JPEG, PNG, WEBP, etc.)
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        resolve({
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name || `${label}.jpg`,
          label,
          type: 'image',
          dataUrl,
          size: Math.round((dataUrl.length * 3) / 4),
          uploadedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      };
      img.onerror = () => reject(new Error('Could not process image file.'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
