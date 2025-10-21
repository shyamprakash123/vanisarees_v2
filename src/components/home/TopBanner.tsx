import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TopBanner = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch messages from Supabase
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("message")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMessages(data.map((msg) => msg.message));
      } else {
        console.error("Failed to fetch announcements:", error?.message);
      }
    };

    fetchMessages();
  }, []);

  // Auto-rotate messages
  useEffect(() => {
    if (messages.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000); // 5 seconds delay

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [messages]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? messages.length - 1 : prev - 1));
  };

  if (!messages.length) return null;

  return (
    <div className="w-full bg-primary-800 text-white relative overflow-hidden py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-4 relative">
        <button onClick={handlePrev} className="absolute left-0 px-2 py-1">
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center w-full max-w-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={messages[currentIndex]}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="text-sm md:text-base font-medium leading-snug md:leading-normal h-[2.8rem] md:h-auto flex items-center justify-center"
            >
              {messages[currentIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <button onClick={handleNext} className="absolute right-0 px-2 py-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TopBanner;
