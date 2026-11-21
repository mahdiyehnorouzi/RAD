/**
 * Highest number already handed out. A fresh sequence reports last_value 1
 * with is_called false, which means nothing has been issued yet.
 */
export function issuedHighWater(
  lastValue: number,
  isCalled: boolean,
  tableMax: number,
) {
  const consumed = isCalled ? lastValue : lastValue - 1;
  return Math.max(consumed, tableMax, 0);
}

/** Copy existing product numbers into the registry. Does not invent new numbers. */
export function backfillLegacyIdentitiesSql() {
  return `
    INSERT INTO "RadIdentity" (
      "id", "radNumber", "productId", "status",
      "reservedAt", "assignedAt", "createdAt", "updatedAt"
    )
    SELECT
      'legacy_' || p."radNumber",
      p."radNumber",
      p."id",
      'assigned',
      COALESCE(p."createdAt", now()),
      COALESCE(p."createdAt", now()),
      now(),
      now()
    FROM "Product" p
    WHERE p."radNumber" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "RadIdentity" i
        WHERE i."radNumber" = p."radNumber" OR i."productId" = p."id"
      )
  `;
}

/** The next number an allocator may hand out. */
export function nextRadNumberAfter(
  lastValue: number,
  isCalled: boolean,
  tableMax: number,
) {
  return issuedHighWater(lastValue, isCalled, tableMax) + 1;
}

/**
 * Move the sequence forward to the highest number already stored.
 * Never moves it backward. A fresh database still issues 1.
 */
export function syncRadIdentitySequenceSql() {
  return `
    WITH state AS (
      SELECT
        last_value,
        is_called,
        GREATEST(
          COALESCE((SELECT MAX("radNumber") FROM "RadIdentity"), 0),
          COALESCE((SELECT MAX("radNumber") FROM "Product"), 0)
        ) AS table_max
      FROM rad_identity_number_seq
    ),
    high AS (
      SELECT
        GREATEST(
          table_max,
          CASE WHEN is_called THEN last_value ELSE last_value - 1 END
        ) AS water,
        CASE WHEN is_called THEN last_value ELSE last_value - 1 END AS consumed
      FROM state
    )
    SELECT setval(
      'rad_identity_number_seq',
      GREATEST(water, 1),
      water > 0
    )
    FROM high
    WHERE water > consumed
  `;
}
