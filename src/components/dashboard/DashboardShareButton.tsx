'use client';

import { useState } from 'react';
import { QrCode, Share2 } from 'lucide-react';
import { ShareModal } from '@/components/common/ShareModal';

interface DashboardShareButtonProps {
  slug: string;
  name: string;
  tagline?: string;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function DashboardShareButton({ slug, name, tagline, className, style, label }: DashboardShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className || "btn btn-secondary"}
        onClick={() => setIsOpen(true)}
        style={{ gap: '8px', ...style }}
      >
        <QrCode size={15} />
        <span>{label || 'Share & QR Code'}</span>
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
