import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sky Flight Challenge — Game Pesawat 3D" },
      { name: "description", content: "Game pesawat 3D di browser: lewati 10 ring kuning dengan keyboard atau micro:bit V2." },
      { property: "og:title", content: "Sky Flight Challenge" },
      { property: "og:description", content: "Terbangkan pesawat melewati 10 ring kuning, pakai keyboard atau micro:bit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/skyflight/index.html"
      title="Sky Flight Challenge"
      allow="serial; autoplay; fullscreen"
      className="fixed inset-0 h-full w-full border-0"
    />
  );
}
