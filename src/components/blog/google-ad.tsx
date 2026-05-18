'use client';

import { useEffect, useRef, useState } from 'react';

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
 * Automatically hides itself when the ad is unfilled to avoid blank spaces.
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
  const [isVisible, setIsVisible] = useState(true);

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

  // Check if the ad is unfilled after a short delay and hide if so
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!adRef.current) return;
      const ins = adRef.current.querySelector('ins.adsbygoogle');
      if (ins) {
        const adStatus = ins.getAttribute('data-ad-status');
        if (adStatus === 'unfilled') {
          setIsVisible(false);
        }
      }
    }, 3000); // Wait 3s for AdSense to respond

    // Also observe for attribute changes on the ins element
    const observer = new MutationObserver(() => {
      if (!adRef.current) return;
      const ins = adRef.current.querySelector('ins.adsbygoogle');
      if (ins) {
        const adStatus = ins.getAttribute('data-ad-status');
        if (adStatus === 'unfilled') {
          setIsVisible(false);
        } else if (adStatus === 'filled') {
          setIsVisible(true);
        }
      }
    });

    if (adRef.current) {
      observer.observe(adRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`google-ad-wrapper ${className}`} style={style} ref={adRef}>
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
 * Sidebar ad unit — shows a Google AdSense rectangle.
 * Falls back to a styled placeholder when AdSense hasn't loaded or ad is unfilled.
 */
export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={`ad-sidebar ${className}`}>
      <GoogleAd
        slot="1234567890"
        format="rectangle"
        className="w-full"
      />
      {/* Placeholder shown via CSS when the GoogleAd returns null (unfilled) */}
      <AdFallback type="sidebar" />
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
      <AdFallback type="in-article" />
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
      <AdFallback type="header" />
    </div>
  );
}

/**
 * Fallback component that shows a styled placeholder when no GoogleAd is visible.
 * Detects if the sibling GoogleAd rendered (is visible) and hides itself accordingly.
 */
function AdFallback({ type }: { type: 'sidebar' | 'in-article' | 'header' }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showFallback, setShowFallback] = useState(true);

  useEffect(() => {
    // Check if a visible GoogleAd sibling exists
    const checkSibling = () => {
      if (!containerRef.current?.parentElement) return;
      const googleAdEl = containerRef.current.parentElement.querySelector('.google-ad-wrapper');
      // If the GoogleAd component rendered a visible div, hide fallback
      if (googleAdEl && googleAdEl.children.length > 0) {
        // Check if it's actually showing an ad (has a visible ins element)
        const ins = googleAdEl.querySelector('ins.adsbygoogle');
        if (ins && ins.getAttribute('data-ad-status') !== 'unfilled') {
          setShowFallback(false);
        }
      }
    };

    // Initial check after AdSense has time to load
    const timer1 = setTimeout(checkSibling, 2000);
    const timer2 = setTimeout(checkSibling, 5000);

    // Observe mutations to detect when ad loads
    const observer = new MutationObserver(checkSibling);
    if (containerRef.current?.parentElement) {
      observer.observe(containerRef.current.parentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
    };
  }, []);

  if (!showFallback) return null;

  const heightClass = type === 'sidebar' ? 'min-h-[250px]' : type === 'in-article' ? 'min-h-[100px]' : 'min-h-[90px]';

  return (
    <div ref={containerRef} className={`${heightClass} bg-muted/30 border border-dashed border-muted-foreground/15 rounded-lg flex flex-col items-center justify-center gap-2 p-4`}>
      <div className="text-muted-foreground/30 text-2xl">✦</div>
      <p className="text-xs text-muted-foreground/40 font-medium">Advertisement</p>
      <p className="text-[10px] text-muted-foreground/25">Ad space available</p>
    </div>
  );
}
