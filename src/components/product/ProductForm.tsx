import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";
import { X, Plus } from "lucide-react";
import ImageUpload, { ExistingImage, ImageFile } from "../ImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  title: string;
  slug: string;
  codes: string[];
  sku: string;
  category_id: string;
  price: number;
  mrp: number;
  tax_slab: number;
  hsn_code: string;
  stock: number;
  description: string;
  features: string[];
  youtube_ids: string[];
  featured: boolean;
  trending: boolean;
  active: boolean;
}

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData>;
  onSuccess: () => void;
  onCancel: () => void;
  sellerId?: string;
  isSeller?: boolean;
}

export function ProductForm({
  productId,
  initialData,
  onSuccess,
  onCancel,
  sellerId,
  isSeller,
}: ProductFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    codes: initialData?.codes || [],
    sku: initialData?.sku || "",
    category_id: initialData?.category_id || "",
    price: initialData?.price || 0,
    mrp: initialData?.mrp || 0,
    tax_slab: initialData?.tax_slab || 5,
    hsn_code: initialData?.hsn_code || "",
    stock: initialData?.stock || 0,
    description: initialData?.description || "",
    features: initialData?.features || [],
    youtube_ids: initialData?.youtube_ids || [],
    featured: initialData?.featured || false,
    trending: initialData?.trending || false,
    active: initialData?.active !== undefined ? initialData.active : true,
  });

  const [newCode, setNewCode] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newYoutubeId, setNewYoutubeId] = useState("");

  useEffect(() => {
    if (productId) {
      loadProductImages();
    }
  }, [productId]);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      files.forEach((fileObj) => {
        URL.revokeObjectURL(fileObj.preview);
      });
    };
  }, [files]);

  const loadProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setExistingImages(data || []);
    } catch (error) {
      console.error("Failed to load product images:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    // Call your edge function to get presigned URL
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-image-upload-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          filenames: [fileName],
          contentTypes: [file.type],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { urls } = await response.json();
    const uploadUrl = urls[0];

    // Upload to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload image");
    }

    return uploadUrl.publicUrl;
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: productId ? formData.slug : generateSlug(title),
    });
  };

  const addCode = () => {
    if (newCode.trim() && !formData.codes.includes(newCode.trim())) {
      setFormData({ ...formData, codes: [...formData.codes, newCode.trim()] });
      setNewCode("");
    }
  };

  const removeCode = (code: string) => {
    setFormData({
      ...formData,
      codes: formData.codes.filter((c) => c !== code),
    });
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features.filter((f) => f !== feature),
    });
  };

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, newImage.trim()],
      });
      setNewImage("");
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter((i) => i !== image),
    });
  };

  const addYoutubeId = () => {
    if (
      newYoutubeId.trim() &&
      !formData.youtube_ids.includes(newYoutubeId.trim())
    ) {
      setFormData({
        ...formData,
        youtube_ids: [...formData.youtube_ids, newYoutubeId.trim()],
      });
      setNewYoutubeId("");
    }
  };

  const removeYoutubeId = (id: string) => {
    setFormData({
      ...formData,
      youtube_ids: formData.youtube_ids.filter((ytId) => ytId !== id),
    });
  };

  const saveProductImages = async (productId: string) => {
    try {
      // First, handle existing images - update their order
      if (existingImages.length > 0) {
        const updatePromises = existingImages.map(async (image, index) => {
          const { error } = await supabase
            .from("product_images")
            .update({
              sort_order: index,
              is_primary: index === 0,
            })
            .eq("id", image.id);

          if (error) throw error;
        });

        await Promise.all(updatePromises);
      }

      // Then, upload new files and save to database
      if (files.length > 0) {
        const uploadPromises = files.map(async (fileObj, index) => {
          // Upload file to storage
          const imageUrl = await uploadImageToStorage(fileObj.file);

          // Save to database
          const { error } = await supabase.from("product_images").insert({
            product_id: productId,
            image_url: imageUrl,
            alt_text: fileObj.file.name.split(".")[0],
            sort_order: existingImages.length + index,
            is_primary: existingImages.length === 0 && index === 0,
          });

          if (error) throw error;
          return imageUrl;
        });

        await Promise.all(uploadPromises);
      }
    } catch (error) {
      console.error("Failed to save product images:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedProductId = productId;

      const productData: any = {
        title: formData.title,
        slug: formData.slug,
        codes: formData.codes,
        sku: formData.sku,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price.toString()),
        mrp: parseFloat(formData.mrp.toString()),
        tax_slab: parseFloat(formData.tax_slab.toString()),
        hsn_code: formData.hsn_code,
        stock: parseInt(formData.stock.toString()),
        description: formData.description,
        features: formData.features,
        youtube_ids: formData.youtube_ids,
        featured: formData.featured,
        trending: formData.trending,
        active: formData.active,
      };

      if (sellerId) {
        productData.seller_id = sellerId;
      }

      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Product updated successfully",
          variant: "success",
        });
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        toast({
          title: "Success",
          description: "Product created successfully",
          variant: "success",
        });

        savedProductId = data?.id;
      }

      // Upload and save images
      await saveProductImages(savedProductId);

      // Cleanup local file URLs
      files.forEach((fileObj) => {
        URL.revokeObjectURL(fileObj.preview);
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU *
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HSN Code
          </label>
          <input
            type="text"
            value={formData.hsn_code}
            onChange={(e) =>
              setFormData({ ...formData, hsn_code: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({
                ...formData,
                price: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MRP (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.mrp}
            onChange={(e) =>
              setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tax Slab (%) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.tax_slab}
            onChange={(e) =>
              setFormData({
                ...formData,
                tax_slab: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock *
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Codes
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addCode())
            }
            placeholder="Enter product code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addCode}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.codes.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {code}
              <button
                type="button"
                onClick={() => removeCode(code)}
                className="hover:text-blue-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Features
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addFeature())
            }
            placeholder="Enter product feature"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="space-y-2">
          {formData.features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <span className="flex-1 text-sm">{feature}</span>
              <button
                type="button"
                onClick={() => removeFeature(feature)}
                className="text-red-600 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Images
        </label>
        <ImageUpload
          files={files}
          existingImages={existingImages}
          onFilesChange={setFiles}
          onExistingImagesChange={setExistingImages}
          maxImages={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          YouTube Video IDs
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newYoutubeId}
            onChange={(e) => setNewYoutubeId(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addYoutubeId())
            }
            placeholder="Enter YouTube video ID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
          <button
            type="button"
            onClick={addYoutubeId}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.youtube_ids.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
            >
              {id}
              <button
                type="button"
                onClick={() => removeYoutubeId(id)}
                className="hover:text-red-900"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {!isSeller && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor="featured"
                className="text-sm font-medium text-gray-700"
              >
                Featured Product
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trending"
                checked={formData.trending}
                onChange={(e) =>
                  setFormData({ ...formData, trending: e.target.checked })
                }
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor="trending"
                className="text-sm font-medium text-gray-700"
              >
                Trending Product
              </label>
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) =>
              setFormData({ ...formData, active: e.target.checked })
            }
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : productId
            ? "Update Product"
            : "Create Product"}
        </button>
      </div>
    </form>
  );
}
