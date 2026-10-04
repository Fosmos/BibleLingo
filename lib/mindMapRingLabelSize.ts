// A ring node's label size (MindMapRingNode.tsx): the largest, from 9 to 13px, at which its
// longest word still fits across a circle `size` px wide.
export function ringLabelSize(size: number, label: string): number {
  const longestWord = Math.max(1, ...label.split(/\s+/).map((word) => word.length));
  return Math.max(9, Math.min(13, Math.floor((size - 10) / (longestWord * 0.6))));
}
