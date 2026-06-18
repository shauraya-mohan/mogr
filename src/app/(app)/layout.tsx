import AppHeader from "@/components/app/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bone text-ink">
      <AppHeader />
      <main className="container-page py-[clamp(40px,8vh,80px)]">{children}</main>
    </div>
  );
}
