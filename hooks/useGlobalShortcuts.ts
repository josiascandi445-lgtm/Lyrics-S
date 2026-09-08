import { useEffect } from 'react';
import { audioClock } from '@/lib/audio/audioClock';
import { useProjectStore } from '@/stores/projectStore';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Atalhos globais (secção 38). Não interferem quando o utilizador está a
 * escrever num input/textarea.
 */
export function useGlobalShortcuts() {
  const syncModeActive = useProjectStore((s) => s.syncModeActive);
  const setSyncModeActive = useProjectStore((s) => s.setSyncModeActive);
  const selectedLineId = useProjectStore((s) => s.selectedLineId);
  const markLineStart = useProjectStore((s) => s.markLineStart);
  const markLineEnd = useProjectStore((s) => s.markLineEnd);
  const lines = useProjectStore((s) => s.project.lyrics.lines);
  const setSelectedLine = useProjectStore((s) => s.setSelectedLine);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;

      switch (e.code) {
        case 'Space': {
          e.preventDefault();
          audioClock.toggle();
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          audioClock.seekBy(e.shiftKey ? -1 : -5);
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          audioClock.seekBy(e.shiftKey ? 1 : 5);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          setSyncModeActive(!syncModeActive);
          break;
        }
        case 'Escape': {
          if (syncModeActive) {
            e.preventDefault();
            setSyncModeActive(false);
          }
          break;
        }
        case 'KeyS': {
          if (!syncModeActive || !selectedLineId) return;
          e.preventDefault();
          markLineStart(selectedLineId, audioClock.currentTime);
          break;
        }
        case 'KeyE': {
          if (!syncModeActive || !selectedLineId) return;
          e.preventDefault();
          markLineEnd(selectedLineId, audioClock.currentTime);
          const idx = lines.findIndex((l) => l.id === selectedLineId);
          const next = lines[idx + 1];
          if (next) setSelectedLine(next.id);
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [syncModeActive, selectedLineId, lines, markLineStart, markLineEnd, setSelectedLine, setSyncModeActive]);
}
