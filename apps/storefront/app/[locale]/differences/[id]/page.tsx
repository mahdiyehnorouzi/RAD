import { DifferencePortraitView } from "@/components/difference";
import { NotFoundState } from "@/components/states";
import { resolveDifference } from "@/lib/difference/resolve";

export default async function DifferenceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await resolveDifference(id);
  if (!work) {
    return (
      <NotFoundState
        title="museumMissing"
        body="museumBody"
        primary={{ href: "/differences", label: "museumBack" }}
        secondary={{ href: "/studio", label: "designMine" }}
      />
    );
  }
  return (
    <DifferencePortraitView
      portrait={work.portrait}
      passportCode={work.passportCode}
    />
  );
}
