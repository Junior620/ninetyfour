import type { Graph, Filters } from "./schema";
// Applied only after RLS. Export mode closes the complete relation graph over the filters.
export function filterGraph(
  graph: Graph,
  filters: Filters,
  exporting = false,
): Graph {
  const {
    seasons,
    players,
    memberships,
    matches,
    evaluations,
    markers,
    videos,
    consents,
    media,
    reports,
    targets,
    lineups,
    requirements,
    trials,
    dossiers,
    live_sessions,
    plans,
  } = graph;
  const scopedMemberships = memberships.filter(
    (m) =>
      (!filters.season || m.season_id === filters.season) &&
      (!filters.category || m.category_id === filters.category) &&
      (!filters.player || m.player_id === filters.player),
  );
  const eligiblePlayers = new Set(scopedMemberships.map((m) => m.player_id));
  let selectedMatches = matches.filter(
    (m) =>
      (!filters.season || m.season_id === filters.season) &&
      (!filters.category || m.category_id === filters.category) &&
      (!filters.match || m.id === filters.match) &&
      (!filters.from || m.played_on >= filters.from) &&
      (!filters.to || m.played_on <= filters.to) &&
      (!filters.status || m.status === filters.status) &&
      (!filters.q ||
        m.opponent
          .toLocaleLowerCase("fr")
          .includes(filters.q.toLocaleLowerCase("fr"))),
  );
  const initialMatchIds = new Set(selectedMatches.map((m) => m.id));
  const selectedEvaluations = evaluations.filter(
    (e) =>
      initialMatchIds.has(e.match_id) &&
      eligiblePlayers.has(e.player_id) &&
      (!filters.position || e.position === filters.position),
  );
  const candidateMarkers = markers.filter(
    (m) =>
      initialMatchIds.has(m.match_id) &&
      (!m.player_id || eligiblePlayers.has(m.player_id)) &&
      (!filters.player || m.player_id === filters.player) &&
      (!filters.position || m.position === filters.position),
  );
  if (filters.player || filters.position) {
    const ids = new Set(
      [...selectedEvaluations, ...candidateMarkers].map((e) => e.match_id),
    );
    selectedMatches = selectedMatches.filter((m) => ids.has(m.id));
  }
  const matchIds = new Set(selectedMatches.map((m) => m.id));
  const restrictToParticipation =
    exporting &&
    !!(
      filters.from ||
      filters.to ||
      filters.match ||
      filters.position ||
      filters.q ||
      filters.status
    );
  const involved = new Set([
    ...selectedEvaluations.map((e) => e.player_id),
    ...candidateMarkers.map((m) => m.player_id).filter(Boolean),
  ]);
  const selectedPlayers = players.filter(
    (p) =>
      eligiblePlayers.has(p.id) &&
      (!restrictToParticipation || involved.has(p.id)),
  );
  const playerIds = new Set(selectedPlayers.map((p) => p.id));
  const selectedMarkers = candidateMarkers.filter(
    (m) =>
      matchIds.has(m.match_id) &&
      (!m.player_id || playerIds.has(m.player_id)) &&
      (!filters.player || m.player_id === filters.player) &&
      (!filters.position || m.position === filters.position),
  );
  const markerIds = new Set(selectedMarkers.map((m) => m.id));
  const selectedTargets = targets.filter(
    (t) =>
      (!filters.season || t.season_id === filters.season) &&
      (!filters.category || t.category_id === filters.category) &&
      (!filters.position || t.position === filters.position) &&
      !filters.match &&
      !filters.player &&
      !filters.from &&
      !filters.to,
  );
  const selectedMemberships = scopedMemberships.filter(
    (m) =>
      playerIds.has(m.player_id) &&
      (!exporting ||
        !restrictToParticipation ||
        selectedMatches.some(
          (match) =>
            match.season_id === m.season_id &&
            match.category_id === m.category_id,
        )),
  );
  // Scenarios follow the season/category filters; in export mode only those of an
  // exported season and category whose players are all in the graph, so a restored
  // scenario never points outside it (an empty scenario included).
  const selectedLineups = lineups.filter(
    (l) =>
      (!filters.season || l.season_id === filters.season) &&
      (!filters.category || l.category_id === filters.category) &&
      (!exporting ||
        ([...selectedMatches, ...selectedMemberships].some(
          (x) => x.season_id === l.season_id && x.category_id === l.category_id,
        ) &&
          [
            ...Object.values(l.slots).map((s) => s.player_id),
            ...l.bench,
          ].every((p) => !p || playerIds.has(p)) &&
          (!l.match_id || matchIds.has(l.match_id)))),
  );
  const lineupIds = new Set(selectedLineups.map((l) => l.id));
  return {
    seasons: seasons.filter((s) =>
      !exporting
        ? !filters.season || s.id === filters.season
        : selectedMatches.some((m) => m.season_id === s.id) ||
          selectedMemberships.some((m) => m.season_id === s.id) ||
          selectedTargets.some((t) => t.season_id === s.id),
    ),
    players: selectedPlayers,
    memberships: selectedMemberships,
    matches: selectedMatches.sort((a, b) =>
      b.played_on.localeCompare(a.played_on),
    ),
    evaluations: selectedEvaluations.filter((e) => playerIds.has(e.player_id)),
    markers: selectedMarkers,
    videos: videos.filter((v) => matchIds.has(v.match_id)),
    consents: consents.filter((c) => playerIds.has(c.player_id)),
    media: media.filter((m) => playerIds.has(m.player_id)),
    // Snapshot revisions may contain former players or answers outside a filter.
    // Keep revisions only when the entire immutable snapshot is within the export graph.
    reports: reports.filter(
      (r) =>
        matchIds.has(r.match_id) &&
        r.snapshot.players.every((p) => playerIds.has(p.id)) &&
        r.snapshot.markers.every(
          (m) =>
            (!m.player_id || playerIds.has(m.player_id)) &&
            (!filters.position || m.position === filters.position) &&
            (!filters.player || m.player_id === filters.player),
        ) &&
        r.snapshot.evaluations.every(
          (e) =>
            playerIds.has(e.player_id) &&
            (!filters.position || e.position === filters.position),
        ),
    ),
    targets: selectedTargets,
    lineups: selectedLineups,
    requirements,
    trials: trials.filter((t) => playerIds.has(t.player_id)),
    // In export mode a dossier is kept only if the sequences it cites are in the graph.
    dossiers: dossiers.filter(
      (d) =>
        playerIds.has(d.player_id) &&
        (!exporting || d.sequence_ids.every((s) => markerIds.has(s))),
    ),
    live_sessions: live_sessions.filter((l) => matchIds.has(l.match_id)),
    plans: plans.filter(
      (p) =>
        matchIds.has(p.match_id) &&
        (!exporting || !p.lineup_id || lineupIds.has(p.lineup_id)),
    ),
  };
}
