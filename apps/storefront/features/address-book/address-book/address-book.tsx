"use client";

import { useEffect } from "react";
import { MapPin } from "lucide-react";
import { AccountHeading } from "@/components/account/account-heading";
import { AccountShell } from "@/components/account/account-shell";
import { useLocale } from "@/components/i18n";
import { CardListSkeleton, SkeletonScreen } from "@/components/ui/skeleton";
import { ADDRESS_BOOK_LIMIT } from "../const";
import { addressDraftDirty } from "../address-book-state";
import { useAddressBook } from "../hooks/use-address-book";
import { AddressDeleteDialog } from "./address-delete-dialog";
import { AddressForm } from "./address-form";
import { AddressList } from "./address-list";
import styles from "./address-book.module.css";

export function AddressBookPage() {
  const { t } = useLocale();
  const book = useAddressBook();
  const { state } = book;
  const deleting = state.addresses.find(
    (address) => address.id === state.editingId,
  );
  const atLimit = state.addresses.length >= ADDRESS_BOOK_LIMIT;
  const listMode = state.view === "list" || state.view === "delete";
  const busyList = state.busyId !== "";

  useEffect(() => {
    if (!addressDraftDirty(state)) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state]);

  return (
    <AccountShell requireAuth>
      <section
        className={`${styles.page} section`}
        aria-busy={state.phase === "loading" || undefined}
      >
        <AccountHeading
          icon={MapPin}
          title={
            state.view === "create"
              ? t("addressesAdd")
              : state.view === "edit"
                ? t("addressesEdit")
                : t("addressesTitle")
          }
          body={
            state.view === "list" || state.view === "delete"
              ? t("addressesBody")
              : undefined
          }
          action={
            state.view === "list" ? (
              <div className={styles.toolbar}>
                <button
                  type="button"
                  className="account-button"
                  disabled={state.phase !== "ready" || atLimit || busyList}
                  onClick={() => book.dispatch({ type: "create" })}
                >
                  {t("addressesAdd")}
                </button>
              </div>
            ) : null
          }
        />

        {atLimit && state.view === "list" ? (
          <p className={styles.notice} role="status">
            {t("addressesLimit")}
          </p>
        ) : null}
        {state.notice ? (
          <p
            className={styles.notice}
            data-tone={state.notice.tone}
            role={state.notice.tone === "error" ? "alert" : "status"}
          >
            {state.notice.text}
          </p>
        ) : null}

        {state.phase === "loading" ? (
          <SkeletonScreen>
            <CardListSkeleton count={2} />
          </SkeletonScreen>
        ) : null}

        {state.phase === "load-error" ? (
          <button type="button" className="account-button" onClick={book.retry}>
            {t("retry")}
          </button>
        ) : null}

        {state.phase !== "loading" &&
        state.phase !== "load-error" &&
        listMode ? (
          <AddressList
            addresses={state.addresses}
            busyId={state.busyId}
            disabled={state.phase !== "ready"}
            onEdit={(address) => book.dispatch({ type: "edit", address })}
            onDelete={(id) => book.dispatch({ type: "ask-delete", id })}
            onDefault={book.setDefault}
          />
        ) : null}

        {state.view === "create" || state.view === "edit" ? (
          <AddressForm
            mode={state.view}
            draft={state.draft}
            errors={state.errors}
            busy={state.phase === "saving"}
            canChooseDefault={state.addresses.length > 0}
            onDraft={(field, value) =>
              book.dispatch({ type: "draft", field, value })
            }
            onProvince={(provinceId) =>
              book.dispatch({ type: "province", provinceId })
            }
            onCity={(cityId) =>
              book.dispatch({ type: "draft", field: "cityId", value: cityId })
            }
            onSubmit={book.submit}
            onCancel={() => book.dispatch({ type: "cancel" })}
          />
        ) : null}

        {state.view === "delete" && deleting ? (
          <AddressDeleteDialog
            address={deleting}
            busy={state.phase === "deleting"}
            onConfirm={book.confirmDelete}
            onDismiss={() => book.dispatch({ type: "cancel" })}
          />
        ) : null}
      </section>
    </AccountShell>
  );
}
