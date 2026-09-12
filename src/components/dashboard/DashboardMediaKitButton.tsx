'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { MediaKitModal } from '@/components/portfolio/MediaKitModal';
import type { AnchorProfile } from '@/types';

interface DashboardMediaKitButtonProps {
  profile: AnchorProfile;
  className?: string;
  style?: React.CSSProperties;
}

export function DashboardMediaKitButton({ profile, className, style }: DashboardMediaKitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className || "btn btn-secondary"}
        onClick={() => setIsOpen(true)}
        style={{ gap: '8px', ...style }}
      >
        <FileText size={15} />
        <span>PDF Media Kit</span>
      </button>

      <MediaKitModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        profile={profile}
      />
    </>
  );
}
