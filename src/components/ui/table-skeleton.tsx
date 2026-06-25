"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <Table>
      <THead>
        <TR>
          {Array.from({ length: columns }).map((_, i) => (
            <TH key={i}>
              <Skeleton className="h-4 w-24" />
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <TR key={rowIdx}>
            {Array.from({ length: columns }).map((_, colIdx) => (
              <TD key={colIdx}>
                <Skeleton className={`h-4 ${colIdx === 0 ? "w-32" : colIdx === columns - 1 ? "w-16" : "w-20"}`} />
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg mt-4" />
    </div>
  );
}