"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import {
  createInvitationAction,
  leaveOrganizationAction,
  removeMemberAction,
  revokeInvitationAction,
  updateMemberRoleAction,
  type InvitationFormState,
} from "@/actions/members";
import type { SimpleFormState } from "@/actions/expenses";
import { INVITATION_TTL_DAYS, ORG_ROLES, ORG_ROLE_DESCRIPTIONS, ORG_ROLE_LABELS, type OrgRole } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

interface MemberRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
}

interface InvitationRow {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  expiresAt: Date;
}

const initialState: SimpleFormState = {};

// Même règle que côté serveur : un admin ne touche pas aux propriétaires.
function canAssignRole(actor: OrgRole, role: OrgRole) {
  return actor === "OWNER" || (actor === "ADMIN" && role !== "OWNER");
}

function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

async function copyInviteLink(token: string) {
  try {
    await navigator.clipboard.writeText(inviteLink(token));
    toast.success("Lien d'invitation copié");
  } catch {
    window.prompt("Copiez ce lien :", inviteLink(token));
  }
}

export function MembersManager({
  members,
  invitations,
  currentUserId,
  actorRole,
}: {
  members: MemberRow[];
  invitations: InvitationRow[];
  currentUserId: string;
  actorRole: OrgRole;
}) {
  const isAdmin = actorRole === "OWNER" || actorRole === "ADMIN";
  const assignableRoles = ORG_ROLES.filter((r) => canAssignRole(actorRole, r));

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Membres ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {members.map((m) => (
            <MemberItem
              key={m.id}
              member={m}
              isSelf={m.userId === currentUserId}
              editable={isAdmin && m.userId !== currentUserId && canAssignRole(actorRole, m.role)}
              assignableRoles={assignableRoles}
            />
          ))}
          <LeaveOrganization />
        </CardContent>
      </Card>

      {isAdmin && <InviteForm assignableRoles={assignableRoles} />}

      {isAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Invitations en attente ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ORG_ROLE_LABELS[inv.role] ?? inv.role} ·{" "}
                    {new Date(inv.expiresAt) < new Date() ? "expirée" : `expire le ${formatDate(inv.expiresAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => copyInviteLink(inv.token)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Lien
                  </Button>
                  <form action={revokeInvitationAction}>
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage={`Annuler l'invitation de ${inv.email} ?`}>
                      Annuler
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Rôles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          {ORG_ROLES.map((r) => (
            <div key={r} className="flex gap-3">
              <span className="w-24 shrink-0 font-medium">{ORG_ROLE_LABELS[r]}</span>
              <span className="text-muted-foreground">{ORG_ROLE_DESCRIPTIONS[r]}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberItem({
  member,
  isSelf,
  editable,
  assignableRoles,
}: {
  member: MemberRow;
  isSelf: boolean;
  editable: boolean;
  assignableRoles: OrgRole[];
}) {
  const [role, setRole] = useState<OrgRole>(member.role);
  const [roleState, roleAction, rolePending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await updateMemberRoleAction(prev, fd);
    if (result.error) setRole(member.role);
    else toast.success("Rôle mis à jour");
    return result;
  }, initialState);
  const [removeState, removeAction, removePending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await removeMemberAction(prev, fd);
    if (!result.error) toast.success("Membre retiré");
    return result;
  }, initialState);
  const error = roleState.error ?? removeState.error;

  return (
    <div className="py-2.5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member.name}
            {isSelf && <span className="font-normal text-muted-foreground"> (vous)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
        {editable ? (
          <div className="flex shrink-0 items-center gap-1">
            <form action={roleAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <Select
                name="role"
                value={role}
                disabled={rolePending}
                aria-label={`Rôle de ${member.name}`}
                className="h-8 w-36 text-xs"
                onChange={(e) => {
                  setRole(e.target.value as OrgRole);
                  e.currentTarget.form?.requestSubmit();
                }}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ORG_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </form>
            <form action={removeAction}>
              <input type="hidden" name="memberId" value={member.id} />
              <ConfirmSubmitButton
                variant="ghost"
                size="sm"
                disabled={removePending}
                confirmMessage={`Retirer ${member.name} de l'organisation ?`}
              >
                Retirer
              </ConfirmSubmitButton>
            </form>
          </div>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">{ORG_ROLE_LABELS[member.role] ?? member.role}</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function LeaveOrganization() {
  const [state, action, pending] = useActionState(leaveOrganizationAction, initialState);
  return (
    <div className="flex flex-col items-start gap-1 pt-3">
      <form action={action}>
        <ConfirmSubmitButton
          variant="outline"
          size="sm"
          disabled={pending}
          confirmMessage="Quitter cette organisation ? Vous n'y aurez plus accès sans nouvelle invitation."
        >
          Quitter l&apos;organisation
        </ConfirmSubmitButton>
      </form>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </div>
  );
}

const initialInviteState: InvitationFormState = {};

function InviteForm({ assignableRoles }: { assignableRoles: OrgRole[] }) {
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(async (prev: InvitationFormState, fd: FormData) => {
    const result = await createInvitationAction(prev, fd);
    if (result.token) {
      setEmail("");
      await copyInviteLink(result.token);
    }
    return result;
  }, initialInviteState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">Inviter un membre</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@exemple.fr"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-40">
            <Label htmlFor="invite-role">Rôle</Label>
            <Select id="invite-role" name="role" defaultValue="MEMBER">
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {ORG_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={pending || !email.trim()}>
            {pending ? "Création…" : "Inviter"}
          </Button>
        </form>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.token && (
          <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p>Envoyez ce lien à la personne invitée (valable {INVITATION_TTL_DAYS} jours) :</p>
            <div className="flex gap-1.5">
              <Input readOnly value={inviteLink(state.token)} className="h-8 text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" size="sm" onClick={() => copyInviteLink(state.token!)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Aucun email n&apos;est envoyé automatiquement : copiez le lien et partagez-le (SMS, WhatsApp, email…). La
          personne devra se connecter ou créer un compte avec l&apos;adresse invitée.
        </p>
      </CardContent>
    </Card>
  );
}
