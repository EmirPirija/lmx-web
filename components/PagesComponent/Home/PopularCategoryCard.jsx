import CustomLink from "@/components/Common/CustomLink";
import * as Phosphor from "@phosphor-icons/react";

const PopularCategoryCard = ({ item }) => {
  // Uzmi ikonu prema imenu iz baze, fallback = Question
  const Icon = Phosphor[item?.image] ?? Phosphor.Question;

  return (
    <CustomLink
      href={`/ads?category=${item?.slug}`}
      className="flex flex-col items-center gap-4 group"
    >
      <div className="border p-2.5 rounded-full bg-primary/5 group-hover:bg-primary/10 transition">
        <Icon
          size={48}
          weight="bold"
          className="text-primary group-hover:scale-110 transition-transform duration-200"
        />
      </div>

      <p className="text-sm sm:text-base line-clamp-2 font-medium text-center leading-tight group-hover:text-primary transition-colors">
        {item?.translated_name}
      </p>
    </CustomLink>
  );
};

export default PopularCategoryCard;
