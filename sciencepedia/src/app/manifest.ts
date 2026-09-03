import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sciencepedia — Bách khoa toàn thư khoa học",
    short_name: "Sciencepedia",
    description:
      "Khám phá vũ trụ, sự sống và sức khoẻ con người qua những bài viết khoa học được kiểm chứng.",
    start_url: "/vi",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    lang: "vi",
    categories: ["education", "science", "reference"],
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
