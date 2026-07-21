import { getCachedRecommendation, saveRecommendation } from "./queries";
import { generateRevenueRecommendation, type BusinessSnapshot } from "./ai";
import type { Task } from "@/lib/tasks/queries";
import type { Project } from "@/lib/projects/queries";

export type PersonConfig = {
  name: string;
  focusArea: string;
};

function todayDateStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Checks today's cached recommendation first; only calls Claude (and
// saves the result) on the first dashboard load of the day for that
// person. Everyone after that gets the cached copy.
export async function getPersonRecommendation(
  person: PersonConfig,
  email: string | null,
  allTasks: Task[],
  allProjects: Project[],
  business: BusinessSnapshot,
): Promise<string | null> {
  const today = todayDateStr();

  const cached = await getCachedRecommendation(person.name, today);
  if (cached) return cached;

  if (!email) {
    return generateRevenueRecommendation(
      { name: person.name, focusArea: person.focusArea, openTasks: [], projects: [] },
      business,
    );
  }

  const openTasks = allTasks
    .filter((t) => t.assignee_email === email && t.status !== "done")
    .map((t) => ({ title: t.title, status: t.status, dueDate: t.due_date }));

  const projects = allProjects
    .filter((p) => p.assignee_emails.includes(email))
    .map((p) => {
      const projectTasks = allTasks.filter((t) => t.project_id === p.id);
      const percentDone =
        projectTasks.length > 0
          ? Math.round(
              (projectTasks.filter((t) => t.status === "done").length /
                projectTasks.length) *
                100,
            )
          : null;
      return { name: p.name, percentDone };
    });

  const text = await generateRevenueRecommendation(
    { name: person.name, focusArea: person.focusArea, openTasks, projects },
    business,
  );

  if (text) {
    await saveRecommendation(person.name, today, text);
  }

  return text;
}
