"use client";

import { motion } from "framer-motion";
import {
  Star,
  GraduationCap,
  TrendingUp,
  Crown,
  Dumbbell,
  BookOpen,
  Cpu,
  Heart,
  Award,
  Target,
  Handshake,
  Rocket,
  Leaf,
  Users,
  Eye,
  UserCheck,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Star,
  GraduationCap,
  TrendingUp,
  Crown,
  Dumbbell,
  BookOpen,
  Cpu,
  Heart,
  Award,
  Target,
  Handshake,
  Rocket,
  Leaf,
  Users,
  Eye,
  UserCheck,
  Globe,
};

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn("text-center", className)}
    >
      <div className="text-3xl font-bold text-gold md:text-5xl">{value}</div>
      <div className="mt-2 text-sm uppercase tracking-wider text-text-muted">
        {label}
      </div>
    </motion.div>
  );
}

interface PillarCardProps {
  title: string;
  description: string;
  icon?: string;
  index?: number;
  dark?: boolean;
}

export function PillarCard({
  title,
  description,
  icon = "Star",
  index = 0,
  dark = false,
}: PillarCardProps) {
  const Icon = iconMap[icon] ?? Star;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        className={cn(
          "h-full border-0 shadow-sm transition-shadow hover:shadow-md",
          dark ? "bg-navy-light text-white" : "bg-white"
        )}
      >
        <CardContent className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
            <Icon className="h-6 w-6 text-gold" />
          </div>
          <h3
            className={cn(
              "text-lg font-bold uppercase tracking-wide",
              dark ? "text-white" : "text-black-premium"
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed",
              dark ? "text-white/70" : "text-text-muted"
            )}
          >
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
}

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-black-premium">{value}</p>
        {trend && (
          <p className="mt-1 text-xs font-medium text-gold">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
