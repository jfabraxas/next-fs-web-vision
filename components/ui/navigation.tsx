'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/lib/theme/ThemeToggle';
import { ChefHat as Chat, Settings, Database, FileText, Home } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
        isActive && 'bg-accent text-accent-foreground'
      )}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-16 flex-col items-center justify-between border-r bg-background py-4">
      <div className="space-y-4">
        <NavItem
          href="/"
          icon={<Home className="h-5 w-5" />}
          label="Home"
          isActive={pathname === '/'}
        />
        <NavItem
          href="/chat"
          icon={<Chat className="h-5 w-5" />}
          label="Chat"
          isActive={pathname.startsWith('/chat')}
        />
        <NavItem
          href="/storage"
          icon={<Database className="h-5 w-5" />}
          label="Storage"
          isActive={pathname.startsWith('/storage')}
        />
        <NavItem
          href="/knowledge"
          icon={<FileText className="h-5 w-5" />}
          label="Knowledge"
          isActive={pathname.startsWith('/knowledge')}
        />
      </div>
      <div className="space-y-4">
        <ThemeToggle />
        <NavItem
          href="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          isActive={pathname.startsWith('/settings')}
        />
      </div>
    </aside>
  );
}