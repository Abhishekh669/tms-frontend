"use client";
import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useGetTeacherFromToken } from '@/utils/hooks/tanstack/teacher/use-get-teacher-from-token';
import { TeacherSidebar } from './TeacherPortalSidebar';

export interface UserPropsTypes {
    id: string;
    name: string;
    email: string;
}

function TeacherPortalWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data : user, isLoading } = useGetTeacherFromToken();

    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/teacher-login");
        }
    }, [isLoading, user, router]);

    if (!mounted || isLoading) {
        return <LoadingSkeleton />;
    }

    if (!user) {
        return null;
    }

    const sidebarUser: UserPropsTypes = {
        id: user.id,
        name: user.name,
        email: user.email,
    };

    return (
        <div className="min-h-screen">
            <TeacherSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                user={sidebarUser}
            />
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out min-h-screen",
                    // Desktop padding
                    "md:p-8 p-4 pt-20 pb-24 md:pt-8 md:pb-8",
                    collapsed ? "md:ml-18" : "md:ml-65",

                    // Mobile: no margin-left because sidebar is hidden on mobile
                    "ml-0"
                )}
            >
                {children}
            </main>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
            {/* Mobile Header Skeleton */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-xl border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="relative w-8 h-8 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="min-w-0 flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-32" />
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-24 mt-1" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
            </div>

            {/* Desktop Sidebar Skeleton - Hidden on mobile */}
            <div className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-[252px] bg-white/80 dark:bg-[#0b0b0c]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/10">
                <div className="flex flex-col w-full">
                    {/* Logo skeleton */}
                    <div className="border-b border-black/5 dark:border-white/10 px-5 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-28" />
                                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20 mt-1" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="h-9 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-full" />
                        </div>
                    </div>

                    {/* Navigation skeletons */}
                    <div className="flex-1 px-3 py-4 space-y-2">
                        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20 mx-3 mb-4" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
                                <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* User skeleton */}
                    <div className="border-t border-black/5 dark:border-white/10 px-4 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-24" />
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-28 mt-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <main className={cn(
                "transition-all duration-300",
                // Desktop padding and margin
                "md:p-8 p-4 pt-20 md:pt-8",
                "md:ml-[252px] ml-0"
            )}>
                {/* Content skeleton */}
                <div className="space-y-6">
                    {/* Header section */}
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse w-48 md:w-64" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-72 md:w-96" />
                    </div>

                    {/* Stats cards grid - responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-32 bg-white dark:bg-gray-800/50 rounded-xl border border-black/5 dark:border-white/10 animate-pulse p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main content area */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-black/5 dark:border-white/10 p-4 md:p-6">
                        <div className="space-y-4">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />
                            <div className="h-32 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                                <div className="h-20 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Additional loading shimmer effect */}
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-5/6" />
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Tab Bar Skeleton - Visible only on mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-xl border-t border-black/5 dark:border-white/10">
                <div className="flex items-stretch px-2 pt-1 pb-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-center gap-1 py-1.5">
                            <div className="w-11 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                            <div className="w-12 h-2 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TeacherPortalWrapper;