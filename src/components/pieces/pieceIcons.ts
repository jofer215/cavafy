import { User, MapPin, Package, Circle, Sparkles, Star, Heart, Sword, Crown, Building, TreePine, Ship, Wand } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PIECE_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "User",      icon: User      },
  { name: "MapPin",    icon: MapPin    },
  { name: "Package",   icon: Package   },
  { name: "Circle",    icon: Circle    },
  { name: "Sparkles",  icon: Sparkles  },
  { name: "Star",      icon: Star      },
  { name: "Heart",     icon: Heart     },
  { name: "Sword",     icon: Sword     },
  { name: "Crown",     icon: Crown     },
  { name: "Building",  icon: Building  },
  { name: "TreePine",  icon: TreePine  },
  { name: "Ship",      icon: Ship      },
  { name: "Wand",      icon: Wand      },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  PIECE_ICON_OPTIONS.map(({ name, icon }) => [name, icon])
);

export function getPieceIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Circle;
}
