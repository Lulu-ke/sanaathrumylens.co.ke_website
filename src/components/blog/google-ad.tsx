'use client';

import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  /** Ad slot ID from Google AdSense */
  slot: string;
  /** Ad format: auto, rectangle, horizontal, vertical, fluid */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid';
  /** Whether the ad is responsive */
  responsive?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Style object */
  style?: React.CSSProperties;
}

/**
 * Google AdSense ad unit component.
 * Must be used client-side since it relies on the adsbygoogle global.
 */
export function GoogleAd({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style,
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Push the ad to Google AdSense only once per mount
    if (pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.adsbygoogle) {
        (w.adsbygoogle = w.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded yet — will retry on next render
    }
  }, []);

  return (
    <div className={`google-ad-wrapper ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client="ca-pub-8031704055036556"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

/**
 * Sidebar ad placeholder — shows a Google AdSense unit.
 * Falls back to a styled placeholder if AdSense hasn't loaded.
 */
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`ad-sidebar ${className}`}>
      <GoogleAd
        slot="1234567890"
        format="rectangle"
        className="w-full"
      />
      {/* Fallback placeholder shown while AdSense loads */}
      <noscript>
        <div className="bg-muted/50 border border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
          <p className="text-xs text-muted-foreground">Advertisement</p>
        </div>
      </noscript>
    </div>
  );
}

/**
 * In-article ad unit for between posts / within content.
 */
export function InArticleAd({ className = '' }: { className?: string }) {
  return (
    <div className={`ad-in-article ${className}`}>
      <GoogleAd
        slot="0987654321"
        format="fluid"
        className="w-full"
      />
    </div>
  );
}

/**
 * Header banner ad unit.
 */
export function HeaderBannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`ad-header-banner ${className}`}>
      <GoogleAd
        slot="1122334455"
        format="horizontal"
        className="w-full"
      />
    </div>
  );
}
