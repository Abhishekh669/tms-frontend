"use client";
import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useGetUserFromToken } from '@/utils/hooks/tanstack/user/use-get-user-from-token';
import { AppSidebar } from './app-sidebar';

export interface UserPropsTypes {
    id: string;
    name: string;
    email: string;
}

function TMSWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data : user, isLoading } = useGetUserFromToken();

    const [collapsed, setCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
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
            <AppSidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                user={sidebarUser}
            />
            <main
                className={cn(
                    "transition-all duration-300 ease-in-out min-h-screen p-8",
                    collapsed ? "ml-18" : "ml-65"
                )}
            >
                {children}
            </main>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen flex">
            <div className="w-65 min-h-screen bg-white border-r border-gray-100 flex flex-col gap-4 p-4 shrink-0">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="space-y-2 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
                    ))}
                </div>
            </div>
            <main className="flex-1 p-8 space-y-4">
                <div className="h-7 bg-gray-200 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse mt-4" />
            </main>
        </div>
    );
}

export default TMSWrapper;