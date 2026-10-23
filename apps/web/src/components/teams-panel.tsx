"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea } from "@utah-esports/ui";
import { teamFormSchema, type TeamFormValues } from "@/src/lib/forms/schemas";

export type TeamRow = {
  id: string;
  name: string;
  slug: string;
  pathway: string | null;
  tryoutInfo: string | null;
  websiteUrl: string | null;
  discordRoleId: string | null;
};

const PATHWAY_OPTIONS = [
  { value: "collegiate", label: "Collegiate" },
  { value: "high_school", label: "High school" },
  { value: "youth", label: "Youth" },
  { value: "independent_team", label: "Independent team" },
];

function TeamFields({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<TeamFormValues>>["register"];
  errors: Partial<Record<keyof TeamFormValues, { message?: string }>>;
}) {
  return (
    <>
      <Input label="Team name" error={errors.name?.message} {...register("name")} />
      <Select
        label="Pathway"
        options={PATHWAY_OPTIONS}
        error={errors.pathway?.message}
        {...register("pathway")}
      />
      <Input label="Institution (optional)" error={errors.institution?.message} {...register("institution")} />
      <Input label="City (optional)" error={errors.city?.message} {...register("city")} />
      <Textarea
        label="Tryout info (optional)"
        rows={2}
        hint="How/when players can join — shown on /schools"
        error={errors.tryoutInfo?.message}
        {...register("tryoutInfo")}
      />
      <Input label="Website (optional)" type="url" error={errors.websiteUrl?.message} {...register("websiteUrl")} />
      <Input
        label="Discord role ID (optional)"
        hint="Advanced: bot assigns this role to linked roster members"
        error={errors.discordRoleId?.message}
        {...register("discordRoleId")}
      />
    </>
  );
}

const EMPTY: TeamFormValues = {
  name: "",
  pathway: "independent_team",
  institution: "",
  city: "",
  tryoutInfo: "",
  websiteUrl: "",
  description: "",
  discordRoleId: "",
};

export function TeamsPanel({
  orgSlug,
  teams,
  canEdit,
  canManage,
}: {
  orgSlug: string;
  teams: TeamRow[];
  canEdit: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: EMPTY,
  });

  function openCreate() {
    reset(EMPTY);
    setEditingId(null);
    setMode("create");
    setError(null);
  }

  function openEdit(team: TeamRow) {
    reset({
      name: team.name,
      pathway: (team.pathway ?? "independent_team") as TeamFormValues["pathway"],
      institution: "",
      city: "",
      tryoutInfo: team.tryoutInfo ?? "",
      websiteUrl: team.websiteUrl ?? "",
      description: "",
      discordRoleId: team.discordRoleId ?? "",
    });
    setEditingId(team.id);
    setMode("edit");
    setError(null);
  }

  async function onSubmit(values: TeamFormValues) {
    setBusy(true);
    setError(null);
    const url = mode === "create" ? `/api/organizations/${orgSlug}/teams` : `/api/teams/${editingId}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    setBusy(false);
    if (res.ok) {
      setMode("closed");
      setEditingId(null);
      router.refresh();
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not save team");
    }
  }

  async function remove(team: TeamRow) {
    if (!window.confirm(`Remove ${team.name}? Roster members are removed too.`)) return;
    setBusy(true);
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not delete team");
    }
    router.refresh();
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Teams</CardTitle>
        {canEdit && mode !== "create" ? (
          <Button size="sm" onClick={openCreate}>
            Add team
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        ) : null}

        {mode === "create" || mode === "edit" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-lg border border-charcoal-200 p-4 sm:grid-cols-2" noValidate>
            <TeamFields register={register} errors={errors} />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" size="sm" disabled={isSubmitting || busy}>
                {isSubmitting || busy ? "Saving…" : mode === "create" ? "Create team" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMode("closed");
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {teams.length === 0 && mode !== "create" ? (
          <p className="text-sm text-charcoal-600">
            No teams yet — add one to publish tryouts and manage Discord rosters.
          </p>
        ) : null}

        {teams.map((team) => (
          <div key={team.id} className="rounded-lg border border-charcoal-100 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-charcoal-900">{team.name}</span>
                {team.pathway ? <Badge variant="neutral">{team.pathway.replace(/_/g, " ")}</Badge> : null}
                {team.discordRoleId ? <Badge variant="accent">roster role</Badge> : null}
              </div>
              <div className="flex gap-2">
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(team)}
                    disabled={busy}
                  >
                    Edit
                  </Button>
                ) : null}
                {canManage ? (
                  <Button size="sm" variant="ghost" onClick={() => remove(team)} disabled={busy}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="mt-1 text-xs text-charcoal-500">
              slug: <code>{team.slug}</code> — used by the Discord <code>/roster</code> commands
            </p>
            {team.tryoutInfo ? (
              <p className="mt-1 text-charcoal-600">{team.tryoutInfo}</p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
