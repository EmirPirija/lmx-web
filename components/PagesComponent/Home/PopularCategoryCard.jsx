import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

const PopularCategoryCard = ({ item }) => {
  return (
    <CustomLink
      href={`/ads?category=${item?.slug}`}
      className="flex flex-col gap-4"
    >
      {/* PROMJENE OVDJE:
         1. Dodao sam 'w-20 h-20' (ili stavi manje npr. w-16 h-16) da fiksiram veličinu kruga.
         2. Dodao sam 'mx-auto' da bi krug ostao centriran.
         3. Dodao sam 'relative' i 'overflow-hidden' da slika ne bi izlazila van kruga.
      */}
      <div className="rounded-full w-20 h-20 sm:w-24 sm:h-24 mx-auto overflow-hidden relative">
        <CustomImage
          src={item?.image}
          // Ovi brojevi su manje bitni ako koristis CSS klase (w-full h-full), 
          // ali ih ostavi radi omjera.
          width={96} 
          height={96}
          // 'object-cover' osigurava da slika popuni krug bez deformisanja
          className="w-full h-full object-cover" 
          alt="Category"
          loading="eager"
        />
      </div>

      <p className="text-sm sm:text-base line-clamp-2 font-medium text-center leading-tight">
        {item?.translated_name}
      </p>
    </CustomLink>
  );
};

export default PopularCategoryCard;