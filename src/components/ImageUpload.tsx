import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export interface ExistingImage {
  id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

interface ImageUploadProps {
  files: ImageFile[]; // Local file objects for new uploads
  existingImages: ExistingImage[]; // Existing images from database
  onFilesChange: (files: ImageFile[]) => void;
  onExistingImagesChange: (images: ExistingImage[]) => void;
  onDeleteExistingImage?: (id: string, url: string) => void;
  maxImages?: number;
}

const ImageUpload = ({
  files,
  existingImages,
  onFilesChange,
  onExistingImagesChange,
  onDeleteExistingImage,
  maxImages = 5,
}: ImageUploadProps) => {
  const totalImages = files.length + existingImages.length;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - totalImages;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      const newFiles: ImageFile[] = filesToProcess.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }));

      onFilesChange([...files, ...newFiles]);
    },
    [files, totalImages, maxImages, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxImages - totalImages,
    disabled: totalImages >= maxImages,
  });

  // Remove local file
  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    // Revoke the object URL to free up memory
    URL.revokeObjectURL(fileToRemove.preview);

    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  // Remove existing image (with optional Supabase delete)
  const removeExistingImage = async (index: number) => {
    const imageToRemove = existingImages[index];

    // 1️⃣ If parent provided delete handler, call it (to delete from Supabase)
    if (onDeleteExistingImage) {
      await onDeleteExistingImage(imageToRemove.id, imageToRemove.image_url);
    }

    // 2️⃣ Update UI after deletion
    const newImages = existingImages.filter((_, i) => i !== index);

    // Reorder remaining images
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      sort_order: idx,
      is_primary: idx === 0,
    }));

    onExistingImagesChange(reorderedImages);
  };

  // Move files around
  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    onFilesChange(newFiles);
  };

  // Move existing images around
  const moveExistingImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...existingImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    // Update sort_order and is_primary
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      sort_order: idx,
      is_primary: idx === 0,
    }));

    onExistingImagesChange(reorderedImages);
  };

  // Combine existing images and new files for display
  const allImages = [
    ...existingImages.map((img, index) => ({
      type: "existing" as const,
      index,
      src: img.image_url,
      alt: img.alt_text || `Product image ${index + 1}`,
      id: img.id,
      isPrimary: img.is_primary,
    })),
    ...files.map((fileObj, index) => ({
      type: "new" as const,
      index,
      src: fileObj.preview,
      alt: `New image ${index + 1}`,
      id: fileObj.id,
      isPrimary: existingImages.length === 0 && index === 0,
    })),
  ];

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-secondary-200 hover:border-primary-500"
        } ${totalImages >= maxImages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-secondary-400" />
        <p className="text-sm text-secondary-600">
          {isDragActive
            ? "Drop the images here..."
            : totalImages >= maxImages
            ? "Maximum number of images reached"
            : "Drag & drop images here, or click to select"}
        </p>
        <p className="text-xs text-secondary-500 mt-1">
          {`${totalImages}/${maxImages} images selected`}
        </p>
      </div>

      {allImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allImages.map((image, displayIndex) => (
            <div key={image.id} className="relative group">
              <img
                src={image.src}
                alt={image.alt}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                {displayIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (image.type === "existing") {
                        moveExistingImage(image.index, image.index - 1);
                      } else {
                        moveFile(image.index, image.index - 1);
                      }
                    }}
                    className="p-1 bg-white rounded-full text-secondary-900 hover:text-primary-500 transition-colors"
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                {displayIndex < allImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (image.type === "existing") {
                        moveExistingImage(image.index, image.index + 1);
                      } else {
                        moveFile(image.index, image.index + 1);
                      }
                    }}
                    className="p-1 bg-white rounded-full text-secondary-900 hover:text-primary-500 transition-colors"
                    title="Move right"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (image.type === "existing") {
                      removeExistingImage(image.index);
                    } else {
                      removeFile(image.index);
                    }
                  }}
                  className="p-1 bg-white rounded-full text-error-500 hover:text-error-600 transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {image.isPrimary && (
                <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </span>
              )}
              {image.type === "new" && (
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  New
                </span>
              )}
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                {displayIndex + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
