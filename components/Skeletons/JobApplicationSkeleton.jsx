import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const JobApplicationSkeleton = ({ count = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 p-1 dark:border-slate-700/80 dark:bg-slate-900/80">
        <Table>
          <TableHeader className="bg-slate-50/90 dark:bg-slate-900/80">
            <TableRow className="text-xs sm:text-sm">
              <TableHead>
                <Skeleton className="h-5 w-[60%]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[70%]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[50%]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[70%]" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-5 w-[60%]" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs sm:text-sm">
            {Array(count)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <TableCell>
                    <Skeleton className="h-4 w-[85%]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80%]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[75%]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[90%]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[70%]" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default JobApplicationSkeleton;
