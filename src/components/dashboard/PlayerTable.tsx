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
import type { Player, Locale } from "@/types";
import { localized } from "@/lib/utils";

interface PlayerTableProps {
  players: Player[];
  locale: Locale;
  onSelect?: (player: Player) => void;
}

export function PlayerTable({ players, locale, onSelect }: PlayerTableProps) {
  return (
    <div className="rounded-lg border bg-white">
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
  );
}
