import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface OverlayPortalProps {
  children: React.ReactNode;
  containerId?: string;
}

/**
 * OverlayPortal
 * Ensures every overlay renders at the document body level into #overlay-root,
 * completely breaking out of any parent CSS transforms, filters, or overflow-hidden stacking contexts.
 */
export const OverlayPortal: React.FC<OverlayPortalProps> = ({
  children,
  containerId = 'overlay-root',
}) => {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let node = document.getElementById(containerId);
    if (!node) {
      node = document.createElement('div');
      node.id = containerId;
      node.setAttribute('data-lenis-prevent', 'true');
      document.body.appendChild(node);
    } else {
      node.setAttribute('data-lenis-prevent', 'true');
    }
    setMountNode(node);
  }, [containerId]);

  if (!mountNode) return null;
  return createPortal(children, mountNode);
};

export default OverlayPortal;
