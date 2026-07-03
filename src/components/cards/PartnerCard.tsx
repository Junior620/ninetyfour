"use client";

import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

interface PartnerCardProps {
  name: string;
  role: string;
  description: string;
  website?: string;
  index?: number;
  compact?: boolean;
}

export function PartnerCard({
  name,
  role,
  description,
  website,
  index = 0,
  compact = false,
}: PartnerCardProps) {
  if (compact) {
    return (
      <ScrollReveal
        variant="scaleIn"
        delay={index * 0.08}
        className="flex items-center justify-center px-4 sm:px-8"
      >
        <span className="text-base font-bold uppercase tracking-widest text-navy/60 transition-colors duration-200 hover:text-navy sm:text-xl md:text-2xl">
          {name}
        </span>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal variant="scaleIn" delay={index * 0.08}>
      <Card className="hover-lift h-full border-0 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-royal">{name}</h3>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted transition-all duration-200 hover:translate-x-0.5 hover:text-royal"
                aria-label={`Visit ${name}`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <Badge variant="secondary" className="mb-3 bg-gold/10 text-gold">
            {role}
          </Badge>
          <p className="text-sm leading-relaxed text-text-muted">
            {description}
          </p>
        </CardContent>
      </Card>
    </ScrollReveal>
  );
}

interface NewsCardProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
  index?: number;
}

export function NewsCard({
  title,
  excerpt,
  image,
  date,
  category,
  slug,
  index = 0,
}: NewsCardProps) {
  return (
    <ScrollReveal variant="fadeUp" delay={index * 0.08}>
      <Link href={`/actualites/${slug}`} className="block">
        <Card className="hover-lift group h-full overflow-hidden border-0 bg-white shadow-sm">
          <div className="hover-zoom relative aspect-[16/10]">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <Badge className="absolute left-4 top-4 bg-royal text-white">
              {category}
            </Badge>
          </div>
          <CardContent className="p-5">
            <time className="text-xs text-text-muted">{date}</time>
            <h3 className="mt-2 text-lg font-bold text-black-premium transition-colors duration-200 group-hover:text-royal">
              {title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-text-muted">
              {excerpt}
            </p>
          </CardContent>
        </Card>
      </Link>
    </ScrollReveal>
  );
}
