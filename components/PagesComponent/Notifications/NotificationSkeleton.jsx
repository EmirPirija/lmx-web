import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationSkeleton = () => {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/85 p-1 dark:border-slate-700/80 dark:bg-slate-900/80">
            <Table>
                <TableHeader className='bg-slate-50/90 dark:bg-slate-900/80'>
                    <TableRow className='text-xs sm:text-sm'>
                        <TableHead>
                            <Skeleton className="h-5 w-2/4" />
                        </TableHead>
                        <TableHead className="text-center">
                            <Skeleton className="mx-auto h-5 w-2/4" />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className='text-xs sm:text-sm'>
                    {Array.from({ length: 15 }).map((_, index) => (
                        <TableRow key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-[48px] w-[48px] rounded-lg" />
                                    <div className="flex flex-col gap-2 flex-1">
                                        <Skeleton className="h-4 w-2/4" />
                                        <Skeleton className="h-3 w-3/4" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-center">
                                <Skeleton className="mx-auto h-4 w-full" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default NotificationSkeleton; 
