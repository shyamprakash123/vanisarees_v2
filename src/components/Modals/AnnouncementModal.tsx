import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";

const AnnouncementModal = ({ isOpen, onClose }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAnnouncements(data);
    else console.error(error.message);
  };

  useEffect(() => {
    if (isOpen) fetchAnnouncements();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (editingId) {
      await supabase
        .from("announcements")
        .update({ message })
        .eq("id", editingId);
    } else {
      await supabase
        .from("announcements")
        .insert([{ message, is_active: true }]);
    }

    setMessage("");
    setEditingId(null);
    fetchAnnouncements();
  };

  const handleEdit = (announcement) => {
    setMessage(announcement.message);
    setEditingId(announcement.id);
  };

  const handleDelete = async (id) => {
    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-secondary-950/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-strong p-6 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl">Manage Announcements</h2>
          <button
            type="button"
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            &#x2715;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter announcement message"
            className="flex-1 border border-gray-300 px-4 py-2 rounded"
          />
          <Button type="submit">{editingId ? "Update" : "Add"}</Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded shadow-sm flex justify-between items-start bg-secondary-50"
            >
              <div>
                <p className="text-gray-800">{item.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  className="text-blue-600 hover:underline text-sm"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline text-sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
