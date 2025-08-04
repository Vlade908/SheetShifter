
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { LayoutDashboard, Sheet as SheetIcon, Pencil, Check, Bus, LogOut, MoreVertical } from 'lucide-react';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './dropdown-menu';


const EditableMenuItem = ({ 
    initialLabel, 
    storageKey, 
    href, 
    pathMatcher, 
    Icon 
}: { 
    initialLabel: string, 
    storageKey: string,
    href: string,
    pathMatcher: (pathname: string) => boolean,
    Icon: React.ElementType 
}) => {
    const pathname = usePathname();
    const { state: sidebarState } = useSidebar();
    const [label, setLabel] = useState(initialLabel);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedLabel = localStorage.getItem(storageKey);
        if (savedLabel) {
            setLabel(savedLabel);
        }
    }, [storageKey]);

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
                localStorage.setItem(storageKey, newLabel);
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
                    isActive={pathMatcher(pathname)}
                    tooltip={label}
                    className="flex-grow"
                >
                    <Link href={href}>
                        <Icon />
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

const UserProfile = () => {
    const { user, logout } = useAuth();
    const { state: sidebarState } = useSidebar();
    
    if (!user) return null;

    const isExpanded = sidebarState === 'expanded';
    const fallback = user.displayName?.charAt(0) ?? user.email?.charAt(0) ?? '?';

    if (!isExpanded) {
        return (
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Avatar className="h-8 w-8 cursor-pointer">
                                <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User Avatar'} />
                                <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                        <p>{user.displayName ?? user.email}</p>
                    </TooltipContent>
                </Tooltip>
                <DropdownMenuContent side="right" align="center" className="w-56">
                    <div className="p-2">
                        <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <div className="w-full flex items-center gap-2 p-2 border rounded-md">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User Avatar'} />
                <AvatarFallback>{fallback.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate flex-grow">{user.displayName ?? user.email}</span>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="w-56">
                    <div className="p-2">
                      <ThemeToggle />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>
    )
}


export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (pathname === '/login') {
        return <>{children}</>;
    }

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
                    isActive={pathname === '/dashboard'}
                    tooltip="Dashboard"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard />
                      <span className="group-data-[state=collapsed]:hidden">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <EditableMenuItem
                    initialLabel="Subsidio"
                    storageKey="subsidioMenuItemLabel"
                    href="/"
                    pathMatcher={(path) => path === '/' || path.startsWith('/operations')}
                    Icon={SheetIcon}
                />
                <EditableMenuItem
                    initialLabel="Passe"
                    storageKey="passeMenuItemLabel"
                    href="/passe"
                    pathMatcher={(path) => path.startsWith('/passe')}
                    Icon={Bus}
                />
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <UserProfile />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            {children}
          </SidebarInset>
        </SidebarProvider>
      );
}
