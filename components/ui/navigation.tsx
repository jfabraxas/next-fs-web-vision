'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  HardDrive,
  Settings,
  Brain,
  Home,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Storage', href: '/storage', icon: HardDrive },
  { name: 'Knowledge', href: '/knowledge', icon: Brain },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-0 top-0 z-40 h-full w-16 bg-white shadow-lg">
      <div className="flex h-full flex-col items-center justify-start space-y-4 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg transition-colors hover:bg-gray-100',
                pathname === item.href
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-600'
              )}
              title={item.name}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}