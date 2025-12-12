import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">hh.ru parser</h1>
        <p className="text-muted-foreground">
          Base project scaffolding: Tailwind v4 + shadcn/ui + Redis + OpenRouter.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button>Get started</Button>
        <Button variant="outline">Docs</Button>
      </div>
    </div>
  );
}
