import React from 'react'
import { SectionLabel } from '../teacher/TeacherReportManagement'
import { RevenueOverviewCards } from './RevenueOverview'
import { RevenueTrendChart } from './RevenueTrend'
import { MonthlyRevenueSummaryPanel } from './MonthlyRevenuSummary'

function RevenueManagementPage() {
  return     <main className="min-h-screen bg-background px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
  
          {/* Page heading */}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Revenue report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overview, growth analytics, Monthly Earning.
            </p>
          </div>
  
          {/* 1 — Overview KPI cards */}
          <section>
            <SectionLabel>Overview</SectionLabel>
            <RevenueOverviewCards />
          </section>
  
          {/* 2 — Growth chart */}
          <section>
            <SectionLabel>Growth analytics</SectionLabel>
            <RevenueTrendChart />
          </section>
  
          {/* 3 — Location list */}
          <section>
            <SectionLabel>Average Monthly Earning</SectionLabel>
            <MonthlyRevenueSummaryPanel />
          </section>
  
          
  
        </div>
      </main>
}

export default RevenueManagementPage
