import { Button } from "@/components/ui/button";
import { t } from "@/utils";
import { MdArrowBack } from "@/components/Common/UnifiedIconPack";

const NoChatFound = ({ handleBack, isLargeScreen }) => {
  return (
    <div className="flex flex-col gap-3 text-center items-center justify-center px-6">
      <h5 className="text-primary text-2xl font-semibold">Nema razgovora!</h5>
      <p className="text-slate-500 dark:text-slate-400">Pitaj zadnju</p>

      {!isLargeScreen && (
        <Button className="w-fit rounded-full px-5" onClick={handleBack}>
          <MdArrowBack size={20} className="rtl:scale-x-[-1]" />
          {"Nazad"}
        </Button>
      )}
    </div>
  );
};

export default NoChatFound;
