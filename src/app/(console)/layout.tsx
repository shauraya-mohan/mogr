import Link from "next/link";
import ConsoleSidebarNav from "@/components/dashboard/ConsoleSidebarNav";
import ConsoleProfileMenu from "@/components/dashboard/ConsoleProfileMenu";
import { createClient } from "@/lib/supabase/server";

function initialsFrom(name: string | null, email: string | null): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "·";
}

/**
 * Console shell for logged-in sections (dashboard, and future scans/routine/etc).
 * Dark sidebar in both themes (brand chrome); the content area follows the theme.
 * Nav items are intentionally inert for now — wired up when those routes exist.
 */
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initials = "·";
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    initials = initialsFrom(data?.full_name ?? null, user.email ?? null);
  }

  return (
    <div className="min-h-screen bg-bone text-ink">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between bg-[#1A1A16] px-5 text-[#F4F2EC]">
        <Link href="/" className="font-display text-[20px] font-bold tracking-[-0.03em]">
          mogr<span className="text-bronze">.</span>
        </Link>
        <ConsoleProfileMenu initials={initials} variant="topbar" />
      </div>

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[256px] flex-col border-r border-white/[0.06] bg-[#1A1A16] text-[#F1EEE6] lg:flex">
        <div className="px-7 pb-7 pt-8">
          <Link
            href="/"
            className="font-display text-[26px] font-bold tracking-[-0.03em] text-[#F4F2EC]"
          >
            mogr<span className="text-bronze">.</span>
          </Link>
        </div>

        <ConsoleSidebarNav />

        <ConsoleProfileMenu initials={initials} />
      </aside>

      {/* Main */}
      <main className="lg:ml-[256px]">
        <div className="mx-auto max-w-[1080px] px-[clamp(20px,4vw,56px)] py-[clamp(28px,5vh,56px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
