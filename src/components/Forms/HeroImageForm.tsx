import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import HeroImageUpload from "../admin/HeroImageUpload";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import { compressAndConvertImage } from "../Utils/ImageCompression";
import { GripVertical, Edit, Save, X, Trash2, Plus } from "lucide-react";

interface HeroSlide {
  id?: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  media_type: "video" | "image";
  youtube_id?: string | null;
  cta_text?: string | null;
  cta_link?: string | null;
  position: number;
}

interface EditingState {
  [key: string]: {
    isEditing: boolean;
    originalData: HeroSlide;
    editedData: HeroSlide;
    newImages?: string[];
    isSaving?: boolean;
  };
}

const HeroImageForm = () => {
  const [loading, setLoading] = useState(false);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [editingStates, setEditingStates] = useState<EditingState>({});
  const [newSlide, setNewSlide] = useState<Partial<HeroSlide>>({
    title: "",
    subtitle: "",
    media_type: "image",
    youtube_id: "",
    cta_text: "",
    cta_link: "",
  });
  const [newImage, setNewImage] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const draggedOverIndex = useRef<number | null>(null);

  // ✅ Fetch all slides
  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from("hero_images")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Failed to load hero slides");
    } else {
      setSlides(data);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  // ✅ Upload image to storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

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

  // ✅ Upload image helper
  const uploadImage = async (imageUrl: string): Promise<string | null> => {
    if (!imageUrl.startsWith("data:")) return imageUrl;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const webpFile = await compressAndConvertImage(
        new File([blob], `hero_${Date.now()}.webp`, { type: blob.type }),
        "webp"
      );

      const publicUrl = await uploadImageToStorage(webpFile);
      return publicUrl;
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed.");
      return null;
    }
  };

  // ✅ Start editing a slide
  const startEditing = (slide: HeroSlide) => {
    if (!slide.id) return;

    setEditingStates((prev) => ({
      ...prev,
      [slide.id!]: {
        isEditing: true,
        originalData: { ...slide },
        editedData: { ...slide },
        newImages: slide.image_url ? [] : [],
        isSaving: false,
      },
    }));
  };

  // ✅ Cancel editing
  const cancelEditing = (slideId: string) => {
    setEditingStates((prev) => {
      const newStates = { ...prev };
      delete newStates[slideId];
      return newStates;
    });
  };

  // ✅ Update edited slide data
  const updateEditedSlide = (
    slideId: string,
    field: keyof HeroSlide,
    value: any
  ) => {
    setEditingStates((prev) => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        editedData: {
          ...prev[slideId].editedData,
          [field]: value,
        },
      },
    }));
  };

  // ✅ Update edited slide images
  const updateEditedSlideImages = (slideId: string, images: string[]) => {
    setEditingStates((prev) => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        newImages: images,
      },
    }));
  };

  // ✅ Save edited slide
  const saveEditedSlide = async (slideId: string) => {
    const editState = editingStates[slideId];
    if (!editState) return;

    const { editedData, newImages } = editState;

    if (!editedData.title) {
      toast.error("Please enter a title.");
      return;
    }

    if (
      editedData.media_type === "image" &&
      !editedData.image_url &&
      (!newImages || newImages.length === 0)
    ) {
      toast.error("Please upload an image.");
      return;
    }

    if (editedData.media_type === "video" && !editedData.youtube_id) {
      toast.error("Please enter a YouTube video ID.");
      return;
    }

    // Set saving state
    setEditingStates((prev) => ({
      ...prev,
      [slideId]: {
        ...prev[slideId],
        isSaving: true,
      },
    }));

    try {
      let uploadedUrl = editedData.image_url;

      // Handle new image upload
      if (
        editedData.media_type === "image" &&
        newImages &&
        newImages.length > 0
      ) {
        uploadedUrl = await uploadImage(newImages[0]);
      }

      const updateData = {
        title: editedData.title,
        subtitle: editedData.subtitle,
        media_type: editedData.media_type,
        youtube_id:
          editedData.media_type === "video" ? editedData.youtube_id : null,
        cta_text: editedData.cta_text,
        cta_link: editedData.cta_link,
        image_url: editedData.media_type === "image" ? uploadedUrl : null,
      };

      const { data, error } = await supabase
        .from("hero_images")
        .update(updateData)
        .eq("id", slideId)
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error("Failed to update slide.");
      } else {
        toast.success("Slide updated successfully!");

        // Update slides state
        setSlides((prev) =>
          prev.map((slide) => (slide.id === slideId ? data : slide))
        );

        // Clear editing state
        cancelEditing(slideId);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update slide.");
    } finally {
      // Clear saving state
      setEditingStates((prev) => ({
        ...prev,
        [slideId]: {
          ...prev[slideId],
          isSaving: false,
        },
      }));
    }
  };

  // ✅ Add new slide
  const handleAddSlide = async () => {
    if (!newSlide.title) {
      toast.error("Please enter a title.");
      return;
    }

    if (newSlide.media_type === "image" && newImage.length === 0) {
      toast.error("Please upload an image.");
      return;
    }

    if (newSlide.media_type === "video" && !newSlide.youtube_id) {
      toast.error("Please enter a YouTube video ID.");
      return;
    }

    setLoading(true);
    let uploadedUrl = newImage[0] || null;

    if (newSlide.media_type === "image" && uploadedUrl?.startsWith("data:")) {
      uploadedUrl = await uploadImage(uploadedUrl);
    }

    const position = slides.length + 1;

    const { data, error } = await supabase
      .from("hero_images")
      .insert([
        {
          title: newSlide.title,
          subtitle: newSlide.subtitle,
          media_type: newSlide.media_type,
          youtube_id:
            newSlide.media_type === "video" ? newSlide.youtube_id : null,
          cta_text: newSlide.cta_text,
          cta_link: newSlide.cta_link,
          image_url: newSlide.media_type === "image" ? uploadedUrl : null,
          position,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Failed to add slide.");
    } else {
      toast.success("Slide added successfully!");
      setSlides((prev) => [...prev, data]);
      setNewSlide({
        title: "",
        subtitle: "",
        media_type: "image",
        youtube_id: "",
        cta_text: "",
        cta_link: "",
      });
      setNewImage([]);
      setShowAddForm(false);
    }
  };

  // ✅ Delete slide
  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    const { error } = await supabase.from("hero_images").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete slide.");
    } else {
      toast.success("Slide deleted successfully!");
      setSlides((prev) => prev.filter((slide) => slide.id !== id));

      // Clear any editing state for this slide
      if (editingStates[id]) {
        cancelEditing(id);
      }
    }
  };

  // ✅ Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    draggedOverIndex.current = index;
  };

  // ✅ Enhanced drag and drop handler with transaction
  const handleDragEnd = async () => {
    if (draggedIndex === null || draggedOverIndex.current === null) {
      setDraggedIndex(null);
      return;
    }

    if (draggedIndex === draggedOverIndex.current) {
      setDraggedIndex(null);
      return;
    }

    const newSlides = [...slides];
    const draggedSlide = newSlides[draggedIndex];

    // Remove dragged slide and insert at new position
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(draggedOverIndex.current, 0, draggedSlide);

    // Optimistically update UI
    setSlides(newSlides);

    try {
      // Use Supabase RPC function for atomic position updates
      const { error } = await supabase.rpc("reorder_hero_slides", {
        slide_updates: newSlides.map((slide, index) => ({
          id: slide.id,
          new_position: index + 1,
        })),
      });

      if (error) {
        throw error;
      }

      toast.success("Slide order updated!");
    } catch (error) {
      console.error("Reorder error:", error);
      toast.error("Failed to update slide order");
      // Revert on error
      fetchSlides();
    }

    setDraggedIndex(null);
    draggedOverIndex.current = null;
  };

  // ✅ Render slide content based on editing state
  const renderSlideContent = (slide: HeroSlide, index: number) => {
    const editState = editingStates[slide.id!];
    const isEditing = editState?.isEditing;
    const editedData = editState?.editedData || slide;
    const isSaving = editState?.isSaving;

    return (
      <div
        key={slide.id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        className={`border rounded-lg p-4 transition-all duration-200 ${
          draggedIndex === index ? "opacity-50 scale-95" : ""
        } ${isEditing ? "border-blue-300 bg-blue-50" : "border-gray-200"}`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Drag handle */}
          {!isEditing && (
            <div className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 mt-1">
              <GripVertical className="w-5 h-5" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 space-y-3">
            {isEditing ? (
              // ✅ Edit mode
              <div className="space-y-4">
                {/* Media type toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Media Type:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`px-3 py-1 border rounded ${
                        editedData.media_type === "image"
                          ? "bg-primary-500 text-white"
                          : "bg-gray-100"
                      }`}
                      onClick={() =>
                        updateEditedSlide(slide.id!, "media_type", "image")
                      }
                    >
                      Image
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 border rounded ${
                        editedData.media_type === "video"
                          ? "bg-primary-500 text-white"
                          : "bg-gray-100"
                      }`}
                      onClick={() =>
                        updateEditedSlide(slide.id!, "media_type", "video")
                      }
                    >
                      Video
                    </button>
                  </div>
                </div>

                {/* Media upload/input */}
                {editedData.media_type === "image" ? (
                  <HeroImageUpload
                    images={
                      editState.newImages || (editedData.image_url ? [] : [])
                    }
                    onImagesChange={(images) =>
                      updateEditedSlideImages(slide.id!, images)
                    }
                    maxImages={1}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="YouTube Video ID"
                    className="w-full p-2 border rounded"
                    value={editedData.youtube_id || ""}
                    onChange={(e) =>
                      updateEditedSlide(slide.id!, "youtube_id", e.target.value)
                    }
                  />
                )}

                {/* Text fields */}
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-2 border rounded"
                  value={editedData.title}
                  onChange={(e) =>
                    updateEditedSlide(slide.id!, "title", e.target.value)
                  }
                />
                <textarea
                  placeholder="Subtitle"
                  className="w-full p-2 border rounded"
                  rows={2}
                  value={editedData.subtitle || ""}
                  onChange={(e) =>
                    updateEditedSlide(slide.id!, "subtitle", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="CTA Text"
                  className="w-full p-2 border rounded"
                  value={editedData.cta_text || ""}
                  onChange={(e) =>
                    updateEditedSlide(slide.id!, "cta_text", e.target.value)
                  }
                />
                <input
                  type="url"
                  placeholder="CTA Link"
                  className="w-full p-2 border rounded"
                  value={editedData.cta_link || ""}
                  onChange={(e) =>
                    updateEditedSlide(slide.id!, "cta_link", e.target.value)
                  }
                />
              </div>
            ) : (
              // ✅ View mode
              <div>
                <h3 className="font-medium text-lg">{slide.title}</h3>
                {slide.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{slide.subtitle}</p>
                )}
                {slide.cta_text && (
                  <p className="text-sm text-blue-600 mt-1">{slide.cta_text}</p>
                )}

                {/* Media preview */}
                <div className="mt-3">
                  {slide.media_type === "image" && slide.image_url && (
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  )}
                  {slide.media_type === "video" && slide.youtube_id && (
                    <iframe
                      className="w-32 h-20 rounded"
                      src={`https://www.youtube.com/embed/${slide.youtube_id}`}
                      title={slide.title}
                      allowFullScreen
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => saveEditedSlide(slide.id!)}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelEditing(slide.id!)}
                  disabled={isSaving}
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(slide)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSlide(slide.id!)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Hero Slides</h2>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Slide
        </Button>
      </div>

      {/* ✅ Existing slides list */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No slides found. Add your first slide to get started.
          </p>
        ) : (
          slides.map((slide, index) => renderSlideContent(slide, index))
        )}
      </div>

      {/* ✅ Add new slide form */}
      {showAddForm && (
        <div className="border-t pt-6 mt-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Add New Slide</h3>

            {/* Media type toggle */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">Media Type:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-1 border rounded ${
                    newSlide.media_type === "image"
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() =>
                    setNewSlide({ ...newSlide, media_type: "image" })
                  }
                >
                  Image
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 border rounded ${
                    newSlide.media_type === "video"
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100"
                  }`}
                  onClick={() =>
                    setNewSlide({ ...newSlide, media_type: "video" })
                  }
                >
                  Video
                </button>
              </div>
            </div>

            {/* Conditional fields */}
            {newSlide.media_type === "image" ? (
              <HeroImageUpload
                images={newImage}
                onImagesChange={setNewImage}
                maxImages={1}
              />
            ) : (
              <input
                type="text"
                placeholder="YouTube Video ID"
                className="w-full p-2 border rounded mb-3"
                value={newSlide.youtube_id || ""}
                onChange={(e) =>
                  setNewSlide({ ...newSlide, youtube_id: e.target.value })
                }
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <input
                type="text"
                placeholder="Title"
                className="w-full p-2 border rounded"
                value={newSlide.title || ""}
                onChange={(e) =>
                  setNewSlide({ ...newSlide, title: e.target.value })
                }
              />
              <textarea
                placeholder="Subtitle"
                className="w-full p-2 border rounded"
                rows={2}
                value={newSlide.subtitle || ""}
                onChange={(e) =>
                  setNewSlide({ ...newSlide, subtitle: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="CTA Text"
                className="w-full p-2 border rounded"
                value={newSlide.cta_text || ""}
                onChange={(e) =>
                  setNewSlide({ ...newSlide, cta_text: e.target.value })
                }
              />
              <input
                type="url"
                placeholder="CTA Link"
                className="w-full p-2 border rounded"
                value={newSlide.cta_link || ""}
                onChange={(e) =>
                  setNewSlide({ ...newSlide, cta_link: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                onClick={handleAddSlide}
                variant="primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Add Slide"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddForm(false)}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroImageForm;
