"use client";

import { User } from "@/utils/types/user.types";

import TeacherReportManagement from "./teacher/TeacherReportManagement";
import VacancyManagementPage from "./vacancy/VacancyManagementPage";
import RevenueManagementPage from "./revenue/RevenueManagementPage";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  BarChart3,
  BriefcaseBusiness,
  DollarSign,
} from "lucide-react";

function ReportManagementPage({
  user,
}: {
  user: User;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Report Management
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Monitor teachers, vacancies, and revenue performance from a single centralized dashboard.
            </p>
          </div>
        </div>

        {/* Clean Card-style Tabs */}
        <Tabs defaultValue="teachers" className="space-y-5">
          <TabsList className="inline-flex h-auto w-full gap-2 rounded-lg bg-muted/50 p-1">
            <TabsTrigger
              value="teachers"
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Teachers</span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="vacancies"
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <div className="flex items-center justify-center gap-2">
                <BriefcaseBusiness className="w-4 h-4" />
                <span className="hidden sm:inline">Vacancies</span>
              </div>
            </TabsTrigger>

            <TabsTrigger
              value="revenue"
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Revenue</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value="teachers" className="mt-0">
            <TeacherReportManagement />
          </TabsContent>

          <TabsContent value="vacancies" className="mt-0">
            <VacancyManagementPage />
          </TabsContent>

          <TabsContent value="revenue" className="mt-0">
            <RevenueManagementPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default ReportManagementPage;