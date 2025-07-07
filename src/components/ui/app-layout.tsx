'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';
import { LayoutDashboard, Sheet } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <AppLogo className="h-8 w-8 text-primary" />
                    <h1 className="text-xl font-semibold font-headline text-slate-800">SheetSifter</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/dashboard')}
                    tooltip="Dashboard"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/' || pathname.startsWith('/operations')}
                    tooltip="Planilhas"
                  >
                    <Link href="/">
                      <Sheet />
                      <span>Planilhas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      );
}
