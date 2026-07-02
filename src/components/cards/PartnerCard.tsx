"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-center px-8"
      >
        <span className="text-xl font-bold uppercase tracking-widest text-navy/60 md:text-2xl">
          {name}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-royal">{name}</h3>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-royal"
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
    </motion.div>
  );
}

interface NewsCardProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
}

export function NewsCard({
  title,
  excerpt,
  image,
  date,
  category,
  slug,
}: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Link href={`/actualites/${slug}`}>
        <Card className="group h-full overflow-hidden border-0 bg-white shadow-sm transition-shadow hover:shadow-md">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <Badge className="absolute left-4 top-4 bg-royal text-white">
              {category}
            </Badge>
          </div>
          <CardContent className="p-5">
            <time className="text-xs text-text-muted">{date}</time>
            <h3 className="mt-2 text-lg font-bold text-black-premium group-hover:text-royal">
              {title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm text-text-muted">
              {excerpt}
            </p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
