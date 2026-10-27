"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SettingsState } from "@/lib/org/settings-actions";

type Props = {
  action: (state: SettingsState, formData: FormData) => Promise<SettingsState>;
  submitLabel: string;
  pendingLabel: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
};

/** A settings form with inline success and error feedback. */
export function SettingsForm({
  action,
  submitLabel,
  pendingLabel,
  resetOnSuccess,
  children,
}: Props) {
  const [state, formAction] = useFormState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && resetOnSuccess) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4" noValidate>
      {children}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingLabel={pendingLabel} className="justify-self-start">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
