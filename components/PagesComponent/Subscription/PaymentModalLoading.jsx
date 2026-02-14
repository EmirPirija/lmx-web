
import { Skeleton } from "@/components/ui/skeleton";

const PaymentModalLoading = () => {
    return (
        <div className="w-full p-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo skeleton */}
                    <Skeleton className="w-8 h-8 rounded-md" />

                    {/* Text skeleton */}
                    <Skeleton className="h-7 w-24 rounded-md" />
                </div>

                {/* Arrow skeleton */}
                <Skeleton className="w-4 h-4 rounded-md" />
            </div>
        </div>
    )
}

export default PaymentModalLoading
