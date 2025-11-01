import { PenLine } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-5xl items-center">
        <div className="mr-4 flex items-center">
          <PenLine className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            SignText Converter
          </h1>
        </div>
      </div>
    </header>
  );
}
