import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { browserFetch } from "@/lib/browser-api";
import type { Team, TeamMember } from "@/types/organization";

export function useTeams(departmentId?: number) {
  return useQuery({
    queryKey: ["teams", { departmentId }],
    queryFn: () =>
      browserFetch<Team[]>(
        departmentId ? `/teams?filter[department_id]=${departmentId}` : "/teams",
      ),
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ["teams", id],
    queryFn: () => browserFetch<Team>(`/teams/${id}`),
    enabled: Number.isFinite(id),
  });
}

export type SaveTeamInput = {
  department_id: number;
  name: string;
  team_leader_id?: number | null;
  active?: boolean;
};

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveTeamInput) => browserFetch<Team>("/teams", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useUpdateTeam(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<SaveTeamInput>) =>
      browserFetch<Team>(`/teams/${id}`, { method: "PUT", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}

export function useTeamMembers(teamId: number) {
  return useQuery({
    queryKey: ["teams", teamId, "members"],
    queryFn: () => browserFetch<TeamMember[]>(`/teams/${teamId}/members`),
    enabled: Number.isFinite(teamId),
  });
}

export function useAddTeamMember(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { employee_id: number; effective_date?: string }) =>
      browserFetch<TeamMember>(`/teams/${teamId}/members`, { method: "POST", body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useRemoveTeamMember(teamId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) =>
      browserFetch<void>(`/teams/${teamId}/members/${employeeId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", teamId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => browserFetch<void>(`/teams/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });
}
