import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqCard = ({ faq }) => {
  const question = faq?.translated_question || faq?.question || "Pitanje";
  const answer = faq?.translated_answer || faq?.answer || "Odgovor uskoro.";
  const faqValue = String(faq?.id ?? question);

  return (
    <Accordion
      type="single"
      collapsible
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <AccordionItem value={faqValue} className="group border-none">
        <AccordionTrigger
          className="bg-transparent px-4 text-start text-base font-semibold text-slate-900 hover:no-underline dark:text-slate-100
                    group-data-[state=open]:border-b group-data-[state=open]:border-slate-200 group-data-[state=open]:bg-slate-50
                    group-data-[state=open]:text-primary dark:group-data-[state=open]:border-slate-800 dark:group-data-[state=open]:bg-slate-950/50"
        >
          {question}
        </AccordionTrigger>
        <AccordionContent className="bg-slate-50 p-4 dark:bg-slate-950/50">
          <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{answer}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default FaqCard;
