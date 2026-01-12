import * as React from "react"
import { cn } from "@/lib/utils"

// Utility function za parsiranje datuma
const parseAndFormatDate = (text) => {
  const dateRegex = /(\d{4})\s*M(\d{2})\s*(\d{2})/
  const match = text.match(dateRegex)
  
  if (match) {
    const [_, year, month, day] = match
    const formattedDate = `${parseInt(day)}.${parseInt(month)}.${year}`
    return { formattedDate, isDate: true }
  }
  
  return { isDate: false }
}

// Utility function za formatiranje teksta u paragrafe
const formatTextContent = (text) => {
  if (typeof text !== 'string') return text
  
  // Podjeli tekst na rečenice
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  // Grupiši rečenice u paragrafe (svake 2-3 rečenice)
  const paragraphs = []
  let currentParagraph = []
  
  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence.trim())
    
    // Napravi paragraf nakon 2-3 rečenice ili na kraju
    if (currentParagraph.length >= 2 || index === sentences.length - 1) {
      paragraphs.push(currentParagraph.join(' '))
      currentParagraph = []
    }
  })
  
  return paragraphs
}

const Table = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-hidden">
    <div className="overflow-auto rounded-2xl border-border/50 bg-white shadow-xl">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props} 
      />
    </div>
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "sticky top-0 z-10 bg-gray-50/95",
      "backdrop-blur-sm border-b-2 border-gray-200",
      "[&_tr]:border-0",
      className
    )} 
    {...props} 
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      "bg-white",
      className
    )}
    {...props} 
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t-2 border-gray-200 bg-gray-50/80",
      "font-medium backdrop-blur-sm [&>tr]:last:border-b-0",
      className
    )}
    {...props} 
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "group border-b border-gray-100 transition-all duration-200",
      "hover:bg-gray-50/50",
      "data-[state=selected]:bg-blue-50/50",
      className
    )}
    {...props} 
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-14 px-6 text-left align-middle font-semibold text-sm",
      "text-gray-700 tracking-wide uppercase",
      "first:rounded-tl-2xl last:rounded-tr-2xl",
      "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-4",
      className
    )}
    {...props} 
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef(({ className, children, ...props }, ref) => {
  const dateInfo = typeof children === 'string' ? parseAndFormatDate(children) : { isDate: false }
  
  if (dateInfo.isDate) {
    return (
      <td
        ref={ref}
        className={cn(
          "p-6 align-middle",
          "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-4",
          className
        )}
        {...props}
      >
        <span className="text-sm font-medium text-gray-900 tabular-nums">
          {dateInfo.formattedDate}
        </span>
      </td>
    )
  }
  
  // Formatiranje dužeg teksta u paragrafe
  const paragraphs = typeof children === 'string' && children.length > 100 
    ? formatTextContent(children) 
    : null
  
  if (paragraphs && paragraphs.length > 1) {
    return (
      <td
        ref={ref}
        className={cn(
          "p-6 align-top",
          "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-4",
          className
        )}
        {...props}
      >
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed max-w-4xl">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-justify">
              {paragraph}
            </p>
          ))}
        </div>
      </td>
    )
  }
  
  return (
    <td
      ref={ref}
      className={cn(
        "p-6 align-middle text-sm text-gray-700 leading-relaxed",
        "group-hover:text-gray-900 transition-colors duration-200",
        "[&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:pl-4",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-6 text-sm text-gray-500 italic font-medium",
      className
    )}
    {...props} 
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}