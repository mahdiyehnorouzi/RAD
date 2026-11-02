/**
 * A delivery address saved on the signed-in customer's account.
 * An order keeps its own name, city, phone, and address snapshot.
 * Saving or deleting one of these records does not change past orders.
 * Mirrored by the API address module (CommonJS cannot import this package).
 */
export interface CustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  provinceLabel: string;
  cityLabel: string;
  address: string;
  postalCode: string | null;
  isDefault: boolean;
}

export interface CustomerAddressInput {
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode?: string;
}

export interface CustomerAddressList {
  addresses: CustomerAddress[];
}
