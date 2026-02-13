import { useSearchParams } from "next/navigation";
import { Check } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

const DatePostedFilter = () => {
  const searchParams = useSearchParams();
  const value = searchParams.get("date_posted") || "";

  const options = [
    { label: "Sve vrijeme", value: "all-time" },
    { label: "Danas", value: "today" },
    { label: "1 sedmica", value: "within-1-week" },
    { label: "2 sedmice", value: "within-2-week" },
    { label: "1 mjesec", value: "within-1-month" },
    { label: "3 mjeseca", value: "within-3-month" },
  ];

  const handleChange = (optionValue) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value === optionValue) {
      newSearchParams.delete("date_posted");
    } else {
      newSearchParams.set("date_posted", optionValue);
    }
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all",
              isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
            )}
          >
            <span className={cn("text-sm font-medium", isSelected ? "text-blue-700" : "text-gray-700")}>
              {option.label}
            </span>
            <input type="checkbox" className="sr-only" checked={isSelected} onChange={() => handleChange(option.value)} />
            <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300")}>
              {isSelected && <Check className="w-2 h-2 text-white" />}
            </div>
          </label>
        );
      })}
    </div>
  );
};

export default DatePostedFilter;