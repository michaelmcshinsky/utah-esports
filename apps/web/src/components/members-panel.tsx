"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@utah-esports/ui";

export type MemberRow = {
  membershipId: string;
  email: string;
  displayName: string | null;
  role: "owner" | "editor" | "viewer";
  isSelf: boolean;
};

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

export function MembersPanel({
  orgSlug,
  members,
  canManage,
}: {
  orgSlug: string;
  members: MemberRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/organizations/${orgSlug}/members`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    setBusy(false);
    if (res.ok) {
      setEmail("");
      setNotice("Member added.");
      router.refresh();
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not add member");
    }
  }

  async function changeRole(membershipId: string, nextRole: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/organizations/${orgSlug}/members`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ membershipId, role: nextRole }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not change role");
    }
    router.refresh();
  }

  async function removeMember(membershipId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this organization?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/organizations/${orgSlug}/members?membershipId=${membershipId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not remove member");
    }
    router.refresh();
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-success-700" role="status">
            {notice}
          </p>
        ) : null}

        <ul className="divide-y divide-charcoal-100">
          {members.map((m) => (
            <li key={m.membershipId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar name={m.displayName ?? m.email} size="sm" decorative />
                <div className="min-w-0">
                  <p className="truncate font-medium text-charcoal-900">
                    {m.displayName ?? m.email}
                    {m.isSelf ? <span className="ml-1 text-xs text-charcoal-400">(you)</span> : null}
                  </p>
                  <p className="truncate text-xs text-charcoal-500">{m.email}</p>
                </div>
              </div>
              {canManage ? (
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Role for ${m.email}`}
                    value={m.role}
                    disabled={busy}
                    onChange={(e) => changeRole(m.membershipId, e.target.value)}
                    className="rounded-lg border border-charcoal-300 px-2 py-1 text-sm"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => removeMember(m.membershipId, m.displayName ?? m.email)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Badge variant="neutral">{m.role}</Badge>
              )}
            </li>
          ))}
        </ul>

        {canManage ? (
          <form onSubmit={addMember} className="flex flex-wrap items-end gap-2 border-t border-charcoal-100 pt-3" noValidate>
            <div className="min-w-56 flex-1">
              <Input
                label="Add member by email"
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hint="They need an existing Utah Esports account"
              />
            </div>
            <div className="w-32">
              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_OPTIONS} />
            </div>
            <Button type="submit" size="sm" disabled={busy || !email.trim()}>
              {busy ? "Adding…" : "Add"}
            </Button>
          </form>
        ) : (
          <p className="text-xs text-charcoal-500">
            Only owners can change roles or add members.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
