import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardRender: React.ForwardRefRenderFunction<HTMLDivElement, CardProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm glass",
        className
      )}
      {...props}
    />
  )
}

const Card = React.forwardRef(CardRender)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeaderRender: React.ForwardRefRenderFunction<HTMLDivElement, CardHeaderProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
}

const CardHeader = React.forwardRef(CardHeaderRender)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const CardTitleRender: React.ForwardRefRenderFunction<HTMLParagraphElement, CardTitleProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

const CardTitle = React.forwardRef(CardTitleRender)
CardTitle.displayName = "CardTitle"

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescriptionRender: React.ForwardRefRenderFunction<HTMLParagraphElement, CardDescriptionProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

const CardDescription = React.forwardRef(CardDescriptionRender)
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContentRender: React.ForwardRefRenderFunction<HTMLDivElement, CardContentProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
}

const CardContent = React.forwardRef(CardContentRender)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooterRender: React.ForwardRefRenderFunction<HTMLDivElement, CardFooterProps> = (
  { className, ...props }, 
  ref
) => {
  return (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
}

const CardFooter = React.forwardRef(CardFooterRender)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
