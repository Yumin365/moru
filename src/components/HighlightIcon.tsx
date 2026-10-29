import {
  Bike,
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Flower2,
  Footprints,
  Heart,
  Moon,
  Pill,
  Salad,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { HighlightIconKey } from '../lib/highlight';

const ICONS: Record<HighlightIconKey, LucideIcon> = {
  dumbbell: Dumbbell,
  flower: Flower2,
  footprints: Footprints,
  bike: Bike,
  salad: Salad,
  droplets: Droplets,
  pill: Pill,
  book: BookOpen,
  brain: Brain,
  moon: Moon,
  heart: Heart,
  sparkles: Sparkles,
};

/** The icon chosen for the 파란색 기록 (dumbbell = 근력 운동 by default). */
export function HighlightIcon({ icon, size = 16, strokeWidth = 2.4, className }: { icon: HighlightIconKey; size?: number; strokeWidth?: number; className?: string }) {
  const Icon = ICONS[icon] ?? Dumbbell;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
