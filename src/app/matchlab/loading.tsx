import { fr } from "@/lib/matchlab/messages";
export default function Loading() {
  return (
    <p className="ml-loading" role="status">
      {fr.loading}
    </p>
  );
}
