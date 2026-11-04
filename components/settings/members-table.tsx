"use client";

import { Loader2, MailX, UserMinus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { changeRole, removeFromOrganization, revokeInvitation } from "@/lib/org/settings-actions";

export const ROLE_LABEL = {
  admin: "Administrador",
  supervisor: "Supervisor",
  counter: "Contador",
} as const;
type Role = keyof typeof ROLE_LABEL;

type Props = {
  currentUserId: string;
  isAdmin: boolean;
  members: { id: string; name: string; role: Role; since: string }[];
  invitations: { id: string; email: string; role: Role; createdAt: string }[];
};

export function MembersTable({ currentUserId, isAdmin, members, invitations }: Props) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(success);
    });

  return (
    <div className="relative overflow-x-auto rounded border border-rule bg-panel">
      <table className="w-full min-w-[36rem] text-sm">
        <caption className="sr-only">Miembros e invitaciones pendientes</caption>
        <thead>
          <tr className="border-b border-rule text-left font-display text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            <th scope="col" className="px-4 py-3">
              Persona
            </th>
            <th scope="col" className="px-4 py-3">
              Rol
            </th>
            <th scope="col" className="px-4 py-3">
              Desde
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Acciones</span>
              {pending ? (
                <Loader2 className="ml-auto size-4 animate-spin" aria-label="Guardando" />
              ) : null}
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-rule last:border-0">
              <td className="px-4 py-2.5 font-semibold">
                {member.name}
                {member.id === currentUserId ? (
                  <span className="ml-2 font-normal text-ink-muted">(tú)</span>
                ) : null}
              </td>
              <td className="px-4 py-2.5">
                {isAdmin ? (
                  <>
                    <label className="sr-only" htmlFor={`role-${member.id}`}>
                      Rol de {member.name}
                    </label>
                    <select
                      id={`role-${member.id}`}
                      defaultValue={member.role}
                      disabled={pending}
                      onChange={(event) =>
                        run(
                          () => changeRole(member.id, event.target.value),
                          `Rol de ${member.name} actualizado.`,
                        )
                      }
                      className="h-9 rounded border border-rule-strong/40 bg-panel pl-2.5 pr-8 text-base sm:text-sm"
                    >
                      {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  ROLE_LABEL[member.role]
                )}
              </td>
              <td className="px-4 py-2.5 text-ink-muted">{formatDate(member.since)}</td>
              <td className="px-4 py-2.5 text-right">
                {isAdmin && member.id !== currentUserId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`¿Quitar a ${member.name} de la empresa?`)) {
                        run(
                          () => removeFromOrganization(member.id),
                          `${member.name} ya no es parte de la empresa.`,
                        );
                      }
                    }}
                  >
                    <UserMinus aria-hidden="true" />
                    Quitar
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
          {invitations.map((invite) => (
            <tr key={invite.id} className="border-b border-rule bg-panel-sunken/50 last:border-0">
              <td className="px-4 py-2.5">
                {invite.email}
                <span className="ml-2 rounded-sm border border-rule-strong/30 px-1.5 py-0.5 text-xs font-semibold text-ink-muted">
                  Invitación pendiente
                </span>
              </td>
              <td className="px-4 py-2.5">{ROLE_LABEL[invite.role]}</td>
              <td className="px-4 py-2.5 text-ink-muted">{formatDate(invite.createdAt)}</td>
              <td className="px-4 py-2.5 text-right">
                {isAdmin ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => revokeInvitation(invite.id), "Invitación revocada.")}
                  >
                    <MailX aria-hidden="true" />
                    Revocar
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
