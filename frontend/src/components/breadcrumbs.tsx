import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  title: string;
  href?: string;
}

export function Breadcrumbs({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
  if (!breadcrumbs.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-sm">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            )}
            {isLast || !item.href ? (
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {item.title}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              >
                {item.title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
