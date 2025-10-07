import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface AnnouncementProps {
  message: string;
  link?: string;
  linkText?: string;
  dismissible?: boolean;
  storageKey?: string;
}

export function TopSlidingBar({
  message,
  link,
  linkText,
  dismissible = true,
  storageKey = 'announcement-dismissed',
}: AnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(storageKey, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-red-800 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <span>{message}</span>
        {link && linkText && (
          <a
            href={link}
            className="underline font-medium hover:text-amber-200 transition-colors"
          >
            {linkText}
          </a>
        )}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="absolute right-4 hover:bg-red-700 p-1 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
