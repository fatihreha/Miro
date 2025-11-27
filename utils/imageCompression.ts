import imageCompression from 'browser-image-compression';

/**
 * Image Compression Utility
 * Compresses images before upload to reduce file size and improve performance
 */

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg' as const
    };

    try {
        const compressedFile = await imageCompression(file, options);
        console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        return file; // Return original if compression fails
    }
}

export async function compressImages(files: File[]): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file)));
}
