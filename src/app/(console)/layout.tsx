import ConsoleShell from "@/components/dashboard/ConsoleShell";
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

  return <ConsoleShell initials={initials}>{children}</ConsoleShell>;
}
