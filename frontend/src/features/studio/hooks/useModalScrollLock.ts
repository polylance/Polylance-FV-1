import { useScrollLock } from '../../../utils/scrollLock';

/**
 * Re-export shared reference-counted scroll lock for backwards compatibility.
 */
export function useModalScrollLock(isOpen: boolean): void {
  useScrollLock(isOpen);
}

