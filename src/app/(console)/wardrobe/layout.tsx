// Scopes the ported wardrobe component styles to the wardrobe routes
// (inventory, style, scan). The console shell (sidebar + content area)
// comes from the parent (console)/layout.tsx.
import "./wardrobe.css";
import "./looks/looks.css";

export default function WardrobeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
