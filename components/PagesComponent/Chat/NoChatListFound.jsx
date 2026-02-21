import { t } from "@/utils";
import noChatListFound from "../../../public/assets/no_data_found_illustrator.svg";
import CustomImage from "@/components/Common/CustomImage";

const NoChatListFound = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4">
      <CustomImage
        src={noChatListFound}
        alt="no chat list found"
        width={200}
        height={200}
        className="w-[200px] h-auto aspect-square"
      />
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
