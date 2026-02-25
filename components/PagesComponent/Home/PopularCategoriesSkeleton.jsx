import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Skeleton } from "../../ui/skeleton";

const PopularCategoriesSkeleton = () => {
  return (
    <>
      <div className="container mt-12">
        <div className="space-between">
          <Skeleton className="w-1/4 h-4" />
          <Skeleton className="w-1/12 h-4" />
        </div>
        <Carousel
          className="w-full mt-6"
          opts={{
            align: "start",
            containScroll: "trim",
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-3">
            {Array.from({ length: 11 }).map((_, index) => (
              <CarouselItem
                key={index}
                className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-[14.28%] xl:basis-[12.5%] 2xl:basis-[10%] pl-2 md:pl-3"
              >
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="mx-auto h-14 w-14 rounded-full sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]" />
                  <Skeleton className="h-3.5 w-4/5 mx-auto" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </>
  );
};

export default PopularCategoriesSkeleton;
