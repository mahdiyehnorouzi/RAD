import { Boxes, CircleGauge, Hammer, PackageCheck } from "lucide-react";
import type { AdminProduct } from "../lib/admin-data";
import { StatTile } from "./admin-stat-tile";

export function OverviewStats({
  products,
  loading,
}: {
  products: ReadonlyArray<Pick<AdminProduct, "status">>;
  loading: boolean;
}) {
  const available = products.filter(
    (item) => item.status === "available",
  ).length;
  const inWorkshop = products.filter(
    (item) => item.status === "in_workshop",
  ).length;
  const sold = products.filter((item) => item.status === "sold").length;

  return (
    <section className="stat-grid">
      <StatTile
        icon={<PackageCheck />}
        value={available}
        label="آماده فروش"
        loading={loading}
      />
      <StatTile
        icon={<Hammer />}
        value={inWorkshop}
        label="در کارگاه"
        loading={loading}
      />
      <StatTile
        icon={<Boxes />}
        value={sold}
        label="فروخته شده"
        loading={loading}
      />
      <StatTile
        icon={<CircleGauge />}
        value={products.length}
        label="اثر ثبت‌شده"
        loading={loading}
      />
    </section>
  );
}
