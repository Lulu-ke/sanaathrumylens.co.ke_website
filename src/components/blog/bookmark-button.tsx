'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function BookmarkButton({
  postId,
  initialBookmarked = false,
  variant = 'ghost',
  size = 'icon',
  className = '',
  showLabel = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      router.push('/api/auth/signin');
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const res = await fetch(`/api/bookmarks/${postId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsBookmarked(false);
          toast.success('Bookmark removed');
        } else {
          toast.error('Failed to remove bookmark');
        }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });
        if (res.ok) {
          setIsBookmarked(true);
          toast.success('Post bookmarked');
        } else if (res.status === 409) {
          setIsBookmarked(true);
          toast.info('Already bookmarked');
        } else {
          toast.error('Failed to bookmark post');
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} relative`}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isBookmarked ? (
          <motion.div
            key="bookmarked"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Bookmark className="h-4 w-4 fill-primary text-primary" />
          </motion.div>
        ) : (
          <motion.div
            key="not-bookmarked"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Bookmark className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {showLabel && (
        <span className="ml-1.5 text-sm">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  );
}
