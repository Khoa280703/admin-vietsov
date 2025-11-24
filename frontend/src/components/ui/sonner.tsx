import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!bg-[var(--color-vietsov-green)] group-[.toaster]:!text-white group-[.toaster]:!border-[var(--color-vietsov-green)] group-[.toaster]:shadow-lg",
          error:
            "group-[.toaster]:!bg-red-600 group-[.toaster]:!text-white group-[.toaster]:!border-red-600 group-[.toaster]:shadow-lg",
          warning:
            "group-[.toaster]:bg-yellow-500 group-[.toaster]:text-white group-[.toaster]:border-yellow-500 group-[.toaster]:shadow-lg",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
