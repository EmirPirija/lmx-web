import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIsRtl } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";

const AdLanguageSelector = ({
  langId,
  setLangId,
  languages,
  setTranslations,
}) => {
  const isRTL = useSelector(getIsRtl);

  const handleLangChange = (newId) => {
    setLangId(newId);
    setTranslations((t) => ({
      ...t,
      [newId]: t[newId] || {},
    }));
  };

  return (
    <div className="flex items-center gap-2">
      <p className="hidden whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300 lg:block">
        Odaberite jezik
      </p>
      <Select value={langId} onValueChange={handleLangChange}>
        <SelectTrigger className="gap-2 border-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          <SelectValue placeholder="Odaberite jezik" />
        </SelectTrigger>
        <SelectContent align={isRTL ? "start" : "end"}>
          <SelectGroup>
            {languages &&
              languages.length > 0 &&
              languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  {lang.name}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AdLanguageSelector;
