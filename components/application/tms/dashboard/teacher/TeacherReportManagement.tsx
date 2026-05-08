// app/admin/reports/teachers/page.tsx
// (or wherever your admin routes live — adjust the path to match your project)

import { TeacherGrowthChart } from "./TeacherGrowthTrendPage";
import { TeacherLocationList } from "./TeacherLocationListPage";
import { TeacherOverviewCards } from "./TeacherOverViewCard";
import { TeacherPerformanceTable } from "./TeacherPerformanceList";


export default function TeacherReportPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page heading */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Teacher report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview, growth analytics, location data, and performance summary.
          </p>
        </div>

        {/* 1 — Overview KPI cards */}
        <section>
          <SectionLabel>Overview</SectionLabel>
          <TeacherOverviewCards />
        </section>

        {/* 2 — Growth chart */}
        <section>
          <SectionLabel>Growth analytics</SectionLabel>
          <TeacherGrowthChart />
        </section>

        {/* 3 — Location list */}
        <section>
          <SectionLabel>Location heatmap</SectionLabel>
          <TeacherLocationList />
        </section>

        {/* 4 — Performance table */}
        <section>
          <SectionLabel>Performance</SectionLabel>
          <TeacherPerformanceTable />
        </section>

      </div>
    </main>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
      {children}
    </p>
  );
}