import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="bg-cosmos starfield relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-star">
      <p className="font-display text-8xl font-bold text-white/20">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">
        {t("notFound")}
      </h1>
      <p className="mt-3 max-w-md text-white/60">{t("notFoundHint")}</p>
      <Button asChild variant="accent" size="lg" className="mt-8">
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
