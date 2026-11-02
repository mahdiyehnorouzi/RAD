import type { CustomerAddress as CustomerAddressView } from "./type";
import type { CustomerAddress } from "../database/entities";

export function toCustomerAddress(row: CustomerAddress): CustomerAddressView {
  return {
    id: row.id,
    recipientName: row.recipientName,
    phone: row.phone,
    provinceId: row.provinceId,
    cityId: row.cityId,
    provinceLabel: row.provinceLabel,
    cityLabel: row.cityLabel,
    address: row.address,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  };
}
