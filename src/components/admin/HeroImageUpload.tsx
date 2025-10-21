import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

const HeroImageUpload = ({
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploadProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxImages - images.length;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            onImagesChange([...images, e.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxImages - images.length,
    disabled: images.length >= maxImages,
  });

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-secondary-200 hover:border-primary-500"
        } ${images.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-secondary-400" />
        <p className="text-sm text-secondary-600">
          {isDragActive
            ? "Drop the images here..."
            : images.length >= maxImages
            ? "Maximum number of images reached"
            : "Drag & drop images here, or click to select"}
        </p>
        <p className="text-xs text-secondary-500 mt-1">
          {`${images.length}/${maxImages} images uploaded`}
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                {index > 0 && (
                  <button
                    onClick={() => moveImage(index, index - 1)}
                    className="p-1 bg-white rounded-full text-secondary-900 hover:text-primary-500 transition-colors"
                  >
                    ←
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    onClick={() => moveImage(index, index + 1)}
                    className="p-1 bg-white rounded-full text-secondary-900 hover:text-primary-500 transition-colors"
                  >
                    →
                  </button>
                )}
                <button
                  onClick={() => removeImage(index)}
                  className="p-1 bg-white rounded-full text-error-500 hover:text-error-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroImageUpload;
