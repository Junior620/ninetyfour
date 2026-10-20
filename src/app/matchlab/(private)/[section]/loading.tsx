import { fr } from "@/lib/matchlab/messages";

/** Shown at once when a menu link is tapped, while the next page renders. */
export default function Loading() {
  return (
    <p className="ml-loading" role="status">
      {fr.loading}
    </p>
  );
}
