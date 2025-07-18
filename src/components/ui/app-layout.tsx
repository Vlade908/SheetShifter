'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';
import { LayoutDashboard, Sheet as SheetIcon, Pencil, Check } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';


const EditableMenuItem = () => {
    const pathname = usePathname();
    const { state: sidebarState } = useSidebar();
    const [label, setLabel] = useState('Subsidio');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedLabel = localStorage.getItem('subsidioMenuItemLabel');
        if (savedLabel) {
            setLabel(savedLabel);
        }
    }, []);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    
    const handleSave = () => {
        if (inputRef.current) {
            const newLabel = inputRef.current.value.trim();
            if (newLabel) {
                setLabel(newLabel);
                localStorage.setItem('subsidioMenuItemLabel', newLabel);
            }
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    }

    const isExpanded = sidebarState === 'expanded';

    return (
        <SidebarMenuItem>
            <div className={cn("group/editable-item flex items-center w-full relative", isExpanded && "pr-2")}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === '/' || pathname.startsWith('/operations')}
                    tooltip={label}
                    className="flex-grow"
                >
                    <Link href="/">
                        <SheetIcon />
                        {isExpanded && !isEditing && <span className="group-data-[state=collapsed]:hidden flex-grow text-left">{label}</span>}
                    </Link>
                </SidebarMenuButton>

                {isExpanded && isEditing && (
                    <div className="flex items-center gap-1 absolute left-2 right-2 pl-8 z-10">
                        <Input
                            ref={inputRef}
                            defaultValue={label}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            className="h-7 text-sm !m-0"
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={handleSave}>
                            <Check className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
            
                {isExpanded && !isEditing && (
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover/editable-item:opacity-100 absolute right-1"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                            <p>Editar Nome</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </SidebarMenuItem>
    )
}


export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <AppLogo className="h-8 w-8 text-primary" />
                    <h1 className="text-xl font-semibold font-headline text-sidebar-foreground group-data-[state=collapsed]:hidden">SheetSifter</h1>
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
                      <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <EditableMenuItem />
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <ThemeToggle />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      );
}
