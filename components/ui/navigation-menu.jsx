import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown, Sparkles } from "lucide-react"
 
import { cn } from "@/lib/utils"
 
// ============================================================================
// NAVIGATION MENU ROOT
// ============================================================================
const NavigationMenu = React.forwardRef(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-50 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName
 
// ============================================================================
// NAVIGATION MENU LIST
// ============================================================================
const NavigationMenuList = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center gap-1 rtl:flex-row-reverse",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName
 
// ============================================================================
// NAVIGATION MENU ITEM
// ============================================================================
const NavigationMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Item
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
))
NavigationMenuItem.displayName = "NavigationMenuItem"
 
// ============================================================================
// TRIGGER STYLE VARIANTS
// ============================================================================
const navigationMenuTriggerStyle = cva(
  [
    // Osnovni stil
    "group inline-flex h-10 w-max items-center justify-center gap-2",
    "rounded-xl px-4 py-2",
    "text-sm font-medium",
    "transition-all duration-300 ease-out",
    
    // Boje i pozadina
    "bg-transparent text-foreground/80",
    "hover:bg-gradient-to-r hover:from-primary/10 hover:via-secondary/10 hover:to-primary/5",
    "hover:text-foreground",
    
    // Focus stil
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
    
    // Disabled stil
    "disabled:pointer-events-none disabled:opacity-50",
    
    // Aktivan/Otvoren stil
    "data-[state=open]:bg-gradient-to-r data-[state=open]:from-primary/15 data-[state=open]:via-secondary/10 data-[state=open]:to-primary/5",
    "data-[state=open]:text-primary",
    "data-[state=open]:shadow-sm",
    
    // Hover efekt sa sjenkom
    "hover:shadow-sm",
    
    // Podvlaka animacija
    "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2",
    "after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-primary after:to-secondary",
    "after:transition-all after:duration-300 after:ease-out",
    "hover:after:w-[calc(100%-1.5rem)]",
    "data-[state=open]:after:w-[calc(100%-1.5rem)]",
  ],
  {
    variants: {
      variant: {
        default: "",
        highlighted: [
          "bg-gradient-to-r from-primary/20 to-secondary/20",
          "text-primary font-semibold",
          "border border-primary/20",
          "hover:from-primary/30 hover:to-secondary/30",
          "hover:border-primary/30",
          "hover:shadow-lmx-primary",
        ],
        subtle: [
          "text-muted-foreground",
          "hover:text-foreground",
          "hover:bg-muted/50",
        ],
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
 
// ============================================================================
// NAVIGATION MENU TRIGGER
// ============================================================================
const NavigationMenuTrigger = React.forwardRef(
  ({ className, children, showChevron = true, badge, badgeVariant = "default", ...props }, ref) => {
    const badgeStyles = {
      default: "bg-primary text-white",
      new: "bg-gradient-to-r from-green-500 to-emerald-500 text-white animate-pulse",
      hot: "bg-gradient-to-r from-red-500 to-orange-500 text-white",
      sale: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    }
 
    return (
      <NavigationMenuPrimitive.Trigger
        ref={ref}
        className={cn(
          navigationMenuTriggerStyle(),
          "group select-none",
          className
        )}
        {...props}
      >
        {/* Sadržaj */}
        <span className="relative flex items-center gap-2">
          {children}
          
          {/* Badge (opciono) */}
          {badge && (
            <span
              className={cn(
                "absolute -top-2 -right-4 rtl:-left-4 rtl:right-auto",
                "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                "transform scale-90 group-hover:scale-100 transition-transform duration-200",
                badgeStyles[badgeVariant]
              )}
            >
              {badge}
            </span>
          )}
        </span>
        
        {/* Chevron ikona sa rotacijom */}
        {showChevron && (
          <ChevronDown
            className={cn(
              "relative h-4 w-4 transition-all duration-300 ease-out",
              "text-muted-foreground group-hover:text-primary",
              "group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary",
              "rtl:rotate-180 rtl:group-data-[state=open]:rotate-0"
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Hover glow efekat */}
        <span
          className={cn(
            "absolute inset-0 -z-10 rounded-xl opacity-0",
            "bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20",
            "blur-xl transition-opacity duration-500",
            "group-hover:opacity-100 group-data-[state=open]:opacity-100"
          )}
        />
      </NavigationMenuPrimitive.Trigger>
    )
  }
)
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName
 
// ============================================================================
// NAVIGATION MENU CONTENT
// ============================================================================
const NavigationMenuContent = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      // Pozicioniranje
      "left-0 top-0 w-full md:absolute md:w-auto",
      
      // Animacije - ulaz
      "data-[motion^=from-]:animate-in data-[motion^=from-]:fade-in-0",
      "data-[motion=from-end]:slide-in-from-right-52",
      "data-[motion=from-start]:slide-in-from-left-52",
      
      // Animacije - izlaz
      "data-[motion^=to-]:animate-out data-[motion^=to-]:fade-out-0",
      "data-[motion=to-end]:slide-out-to-right-52",
      "data-[motion=to-start]:slide-out-to-left-52",
      
      // Trajanje animacije
      "duration-300 ease-out",
      
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName
 
// ============================================================================
// NAVIGATION MENU LINK
// ============================================================================
const NavigationMenuLink = NavigationMenuPrimitive.Link
 
// ============================================================================
// NAVIGATION MENU VIEWPORT
// ============================================================================
const NavigationMenuViewport = React.forwardRef(({ className, ...props }, ref) => (
  <div
    className={cn(
      "absolute left-0 rtl:left-auto rtl:right-0 top-full flex justify-center",
      "perspective-1000"
    )}
  >
    <NavigationMenuPrimitive.Viewport
      className={cn(
        // Dimenzije
        "relative mt-2 h-[var(--radix-navigation-menu-viewport-height)] w-full",
        "md:w-[var(--radix-navigation-menu-viewport-width)]",
        "origin-top-center overflow-hidden",
        
        // Stil
        "rounded-2xl",
        "border border-border/50",
        "bg-popover/95 backdrop-blur-xl",
        "text-popover-foreground",
        
        // Sjenka
        "shadow-xl shadow-black/5",
        "ring-1 ring-black/5",
        
        // Animacije
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "duration-300 ease-out",
        
        // Gradient border efekat
        "before:absolute before:inset-0 before:-z-10 before:rounded-2xl",
        "before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-secondary/10",
        "before:opacity-0 before:transition-opacity before:duration-500",
        "data-[state=open]:before:opacity-100",
        
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName
 
// ============================================================================
// NAVIGATION MENU INDICATOR
// ============================================================================
const NavigationMenuIndicator = React.forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-2.5 items-end justify-center overflow-hidden",
      "data-[state=visible]:animate-in data-[state=visible]:fade-in-0 data-[state=visible]:slide-in-from-bottom-2",
      "data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=hidden]:slide-out-to-bottom-2",
      "duration-300",
      className
    )}
    {...props}
  >
    {/* Strelica indikator sa gradijentom */}
    <div
      className={cn(
        "relative top-[60%] h-3 w-3 rotate-45 rounded-tl-sm",
        "bg-gradient-to-br from-popover via-popover to-primary/10",
        "border-l border-t border-border/50",
        "shadow-lg"
      )}
    />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName
 
// ============================================================================
// DODATNE KOMPONENTE ZA BOGAT SADRŽAJ
// ============================================================================
 
/**
 * NavigationMenuCard - Kartica za prikaz u dropdown-u
 * Koristi se za vizualno privlačan prikaz linkova
 */
const NavigationMenuCard = React.forwardRef(
  ({ className, title, description, icon: Icon, href, isNew, isHot, children, ...props }, ref) => (
    <li ref={ref}>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            // Layout
            "group relative flex select-none gap-4 rounded-xl p-4",
            
            // Boja i pozadina
            "bg-transparent",
            "hover:bg-gradient-to-br hover:from-primary/5 hover:via-transparent hover:to-secondary/5",
            
            // Border
            "border border-transparent",
            "hover:border-primary/10",
            
            // Prelaz
            "transition-all duration-300 ease-out",
            
            // Focus
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            
            // Hover transform
            "hover:translate-x-1 rtl:hover:-translate-x-1",
            
            className
          )}
          {...props}
        >
          {/* Ikona */}
          {Icon && (
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-primary/10 to-secondary/10",
                "text-primary",
                "transition-all duration-300",
                "group-hover:from-primary/20 group-hover:to-secondary/20",
                "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
          
          {/* Sadržaj */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-semibold leading-none",
                  "text-foreground",
                  "group-hover:text-primary",
                  "transition-colors duration-200"
                )}
              >
                {title}
              </span>
              
              {/* Novo badge */}
              {isNew && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  <Sparkles className="h-3 w-3" />
                  Novo
                </span>
              )}
              
              {/* Hot badge */}
              {isHot && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse">
                  🔥 Popularno
                </span>
              )}
            </div>
            
            {description && (
              <p
                className={cn(
                  "text-xs leading-snug text-muted-foreground",
                  "line-clamp-2",
                  "group-hover:text-foreground/70",
                  "transition-colors duration-200"
                )}
              >
                {description}
              </p>
            )}
            
            {children}
          </div>
          
          {/* Hover strelica */}
          <div
            className={cn(
              "absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2",
              "opacity-0 -translate-x-2 rtl:translate-x-2",
              "group-hover:opacity-100 group-hover:translate-x-0",
              "transition-all duration-300 ease-out",
              "text-primary"
            )}
          >
            <ChevronDown className="h-4 w-4 -rotate-90 rtl:rotate-90" />
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  )
)
NavigationMenuCard.displayName = "NavigationMenuCard"
 
/**
 * NavigationMenuSection - Sekcija za grupiranje linkova
 */
const NavigationMenuSection = React.forwardRef(
  ({ className, title, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
      {title && (
        <h4
          className={cn(
            "px-4 text-xs font-semibold uppercase tracking-wider",
            "text-muted-foreground/70",
            "flex items-center gap-2"
          )}
        >
          <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          {title}
          <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
        </h4>
      )}
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
)
NavigationMenuSection.displayName = "NavigationMenuSection"
 
/**
 * NavigationMenuFeature - Istaknuta kartica za promocije
 */
const NavigationMenuFeature = React.forwardRef(
  ({ className, title, description, image, href, gradient = "from-primary to-secondary", ...props }, ref) => (
    <li ref={ref} className="row-span-3">
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "group relative flex h-full w-full select-none flex-col justify-end",
            "overflow-hidden rounded-2xl p-6",
            `bg-gradient-to-br ${gradient}`,
            "transition-all duration-500 ease-out",
            "hover:shadow-2xl hover:shadow-primary/20",
            "hover:scale-[1.02]",
            "focus:outline-none focus:ring-2 focus:ring-white/50",
            className
          )}
          {...props}
        >
          {/* Pozadinska slika */}
          {image && (
            <div
              className={cn(
                "absolute inset-0 bg-cover bg-center",
                "opacity-20 group-hover:opacity-30",
                "transition-opacity duration-500"
              )}
              style={{ backgroundImage: `url(${image})` }}
            />
          )}
          
          {/* Overlay pattern */}
          <div
            className={cn(
              "absolute inset-0 opacity-10",
              "bg-[radial-gradient(circle_at_50%_120%,white,transparent_70%)]"
            )}
          />
          
          {/* Sadržaj */}
          <div className="relative z-10">
            <div
              className={cn(
                "mb-2 text-lg font-bold text-white",
                "group-hover:translate-x-1 rtl:group-hover:-translate-x-1",
                "transition-transform duration-300"
              )}
            >
              {title}
            </div>
            <p
              className={cn(
                "text-sm leading-tight text-white/80",
                "line-clamp-2"
              )}
            >
              {description}
            </p>
            
            {/* CTA */}
            <div
              className={cn(
                "mt-4 inline-flex items-center gap-2",
                "text-sm font-semibold text-white",
                "opacity-0 translate-y-2",
                "group-hover:opacity-100 group-hover:translate-y-0",
                "transition-all duration-300 delay-100"
              )}
            >
              Saznaj više
              <ChevronDown className="h-4 w-4 -rotate-90 rtl:rotate-90" />
            </div>
          </div>
          
          {/* Animated ring */}
          <div
            className={cn(
              "absolute -bottom-20 -right-20 rtl:-left-20 rtl:right-auto",
              "h-40 w-40 rounded-full",
              "bg-white/10",
              "group-hover:scale-150",
              "transition-transform duration-700 ease-out"
            )}
          />
        </a>
      </NavigationMenuLink>
    </li>
  )
)
NavigationMenuFeature.displayName = "NavigationMenuFeature"
 
/**
 * NavigationMenuSimpleLink - Jednostavan link bez ikonice
 */
const NavigationMenuSimpleLink = React.forwardRef(
  ({ className, children, href, ...props }, ref) => (
    <li ref={ref}>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            "group flex items-center gap-2 rounded-lg px-4 py-2",
            "text-sm text-foreground/80",
            "transition-all duration-200",
            "hover:bg-primary/5 hover:text-primary",
            "hover:translate-x-1 rtl:hover:-translate-x-1",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              "bg-muted-foreground/30",
              "group-hover:bg-primary group-hover:scale-125",
              "transition-all duration-200"
            )}
          />
          {children}
        </a>
      </NavigationMenuLink>
    </li>
  )
)
NavigationMenuSimpleLink.displayName = "NavigationMenuSimpleLink"
 
// ============================================================================
// EXPORTS
// ============================================================================
export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  // Dodatne komponente
  NavigationMenuCard,
  NavigationMenuSection,
  NavigationMenuFeature,
  NavigationMenuSimpleLink,
}