import imageCompression from "browser-image-compression";

export async function compressAndConvertImage(file: File, format: 'webp' | 'jpeg' | 'avif' = 'webp') {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: `image/${format}`, // e.g., 'image/webp'
    };
  
    const compressedFile = await imageCompression(file, options);
  
    // Keep original file name but change extension
    const extension = format === 'jpeg' ? 'jpg' : format;
    const newName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
    return new File([compressedFile], newName, { type: `image/${format}` });
  }