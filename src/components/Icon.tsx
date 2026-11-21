import {
  Users, GraduationCap, HeartPulse, Briefcase, Sprout, Construction, Trees, Landmark,
  Building2, Microscope, Database, type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const MAP: Record<string, ComponentType<LucideProps>> = {
  users: Users, 'graduation-cap': GraduationCap, 'heart-pulse': HeartPulse, briefcase: Briefcase,
  sprout: Sprout, construction: Construction, trees: Trees, landmark: Landmark,
  'building-2': Building2, microscope: Microscope,
};

export default function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = MAP[name] ?? Database;
  return <C {...props} />;
}
