import React from 'react'
import { SectionLabel } from '../teacher/TeacherReportManagement'
import { VacancyOverviewCards } from './VacancyOverviewCard'
import { VacancyTrendChart } from './VavancyTrendGrowth'
import { VacancyLocationMap } from './VacancyDenseLocation'
import { SupplyDemandTable } from './SupplyDemandTable'

function VacancyManagementPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
    
            {/* Page heading */}
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Vacancy report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Overview, growth analytics, location data, and Supply Demand table.
              </p>
            </div>
    
            {/* 1 — Overview KPI cards */}
            <section>
              <SectionLabel>Overview</SectionLabel>
              <VacancyOverviewCards />
            </section>
    
            {/* 2 — Growth chart */}
            <section>
              <SectionLabel>Growth analytics</SectionLabel>
              <VacancyTrendChart />
            </section>
    
            {/* 3 — Location list */}
            <section>
              <SectionLabel>Location heatmap</SectionLabel>
              <VacancyLocationMap />
            </section>
    
            {/* 4 — Performance table */}
            <section>
              <SectionLabel>Performance</SectionLabel>
              <SupplyDemandTable />
            </section>
    
          </div>
        </main>
  )
}

export default VacancyManagementPage
