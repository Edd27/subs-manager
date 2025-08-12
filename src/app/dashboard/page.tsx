import { Suspense } from "react";
import DashboardContent from "./sections/content";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
