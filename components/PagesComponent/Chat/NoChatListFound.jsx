import { MessageSquare } from "@/components/Common/UnifiedIconPack";

const NoChatListFound = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-6">
      <div className="relative mb-2">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          <MessageSquare size={34} />
        </div>
        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
      </div>
      <h3 className="font-semibold text-2xl text-primary text-center">
        {"Nema razgovora"}
      </h3>
      <span className="text-sm text-slate-500 dark:text-slate-400 text-center">
        {"Nema dostupnih chatova."}
      </span>
    </div>
  );
};

export default NoChatListFound;
