import type { Palace3DObjectKind } from "@/types";

// What can be placed, in the order the Build tray shows it.
export const OBJECT_CATALOG: { kind: Palace3DObjectKind; label: string }[] = [
  { kind: "pedestal", label: "Pedestal" },
  { kind: "statue", label: "Statue" },
  { kind: "lantern", label: "Lantern" },
  { kind: "fountain", label: "Fountain" },
  { kind: "tree", label: "Tree" },
  { kind: "chest", label: "Chest" },
  { kind: "lectern", label: "Lectern" },
  { kind: "crystal", label: "Crystal" },
  { kind: "urn", label: "Urn" },
  { kind: "throne", label: "Throne" },
  { kind: "globe", label: "Globe" },
];

export const objectLabel = (kind: Palace3DObjectKind) => OBJECT_CATALOG.find((entry) => entry.kind === kind)?.label ?? kind;
