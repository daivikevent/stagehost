'use client';

import { useState } from 'react';
import { QrCode, Share2 } from 'lucide-react';
import { ShareModal } from '@/components/common/ShareModal';

interface DashboardShareButtonProps {
  slug: string;
  name: string;
  tagline?: string;
}

export function DashboardShareButton({ slug, name, tagline }: DashboardShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
        style={{ gap: '8px' }}
      >
        <QrCode size={16} />
        Share & QR Code
      </button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        slug={slug}
        name={name}
        tagline={tagline}
      />
    </>
  );
}
