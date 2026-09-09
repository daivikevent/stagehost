/**
 * StageHost — Client-Side Image Compression Utility
 * Resizes and compresses heavy DSLR/phone photos (10-25MB) into lightweight,
 * ultra-fast WebP/JPEG files (< 400KB) directly in the browser before upload.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.85,
    format = 'image/webp',
  } = options;

  // If file is not an image or is an SVG/GIF, return as-is
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }

            // Generate clean compressed file
            const newName = file.name.replace(/\.[^/.]+$/, '') + (format === 'image/webp' ? '.webp' : '.jpg');
            const compressedFile = new File([blob], newName, {
              type: format,
              lastModified: Date.now(),
            });

            // If compressed is somehow larger than original, keep original
            if (compressedFile.size >= file.size) {
              return resolve(file);
            }

            resolve(compressedFile);
          },
          format,
          quality
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}
