'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { MediaKitModal } from '@/components/portfolio/MediaKitModal';
import type { AnchorProfile } from '@/types';

interface DashboardMediaKitButtonProps {
  profile: AnchorProfile;
}

export function DashboardMediaKitButton({ profile }: DashboardMediaKitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
        style={{ gap: '8px' }}
      >
        <FileText size={16} />
        PDF Media Kit
      </button>

      <MediaKitModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        profile={profile}
      />
    </>
  );
}
