"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Player, Locale } from "@/types";
import { localized } from "@/lib/utils";

interface PlayerTableProps {
  players: Player[];
  locale: Locale;
  onSelect?: (player: Player) => void;
}

export function PlayerTable({ players, locale, onSelect }: PlayerTableProps) {
  return (
    <>
      {/* Mobile: card view */}
      <div className="space-y-3 md:hidden">
        {players.map((player) => (
          <Card
            key={player.id}
            className={`border-0 bg-white shadow-sm ${onSelect ? "cursor-pointer active:bg-cream" : ""}`}
            onClick={() => onSelect?.(player)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-black-premium">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {localized(player.position, locale)} · {player.age}{" "}
                    {locale === "fr" ? "ans" : "yrs"}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 bg-gold/10 text-gold text-xs">
                  {localized(player.lastProgress, locale)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md bg-cream p-2">
                  <p className="text-xs text-text-muted">Tech</p>
                  <p className="font-bold text-royal">{player.technicalScore}</p>
                </div>
                <div className="rounded-md bg-cream p-2">
                  <p className="text-xs text-text-muted">Tact</p>
                  <p className="font-bold text-royal">{player.tacticalScore}</p>
                </div>
                <div className="rounded-md bg-cream p-2">
                  <p className="text-xs text-text-muted">Phys</p>
                  <p className="font-bold text-royal">{player.physicalScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{locale === "fr" ? "Joueur" : "Player"}</TableHead>
              <TableHead>{locale === "fr" ? "Poste" : "Position"}</TableHead>
              <TableHead>{locale === "fr" ? "Âge" : "Age"}</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead>Tact</TableHead>
              <TableHead>Phys</TableHead>
              <TableHead>{locale === "fr" ? "Progression" : "Progress"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow
                key={player.id}
                className={onSelect ? "cursor-pointer hover:bg-muted/50" : ""}
                onClick={() => onSelect?.(player)}
              >
                <TableCell className="font-medium">
                  {player.firstName} {player.lastName}
                </TableCell>
                <TableCell>{localized(player.position, locale)}</TableCell>
                <TableCell>{player.age}</TableCell>
                <TableCell>{player.technicalScore}</TableCell>
                <TableCell>{player.tacticalScore}</TableCell>
                <TableCell>{player.physicalScore}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-gold/10 text-gold text-xs">
                    {localized(player.lastProgress, locale)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
