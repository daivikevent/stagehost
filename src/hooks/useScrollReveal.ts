'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to add scroll-reveal animations to elements.
 * Uses IntersectionObserver for performance.
 * 
 * Usage:
 * ```tsx
 * const ref = useScrollReveal();
 * return <div ref={ref} className="reveal">Content</div>;
 * ```
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    // Observe the element and all children with .reveal class
    const revealElements = element.querySelectorAll('.reveal');
    if (element.classList.contains('reveal')) {
      observer.observe(element);
    }
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * Hook to observe multiple scroll reveal elements in a container.
 * Call once on a parent container to animate all .reveal children.
 */
export function useScrollRevealContainer<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const revealElements = container.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}
