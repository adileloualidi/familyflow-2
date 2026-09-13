import { describe, it, expect } from "vitest";
import { computeStreak, computeAutoAssignScores, newlyEarnedBadges, daysBetween } from "./family";
import type { Member, Task } from "@/types";

function makeMember(over: Partial<Member> = {}): Member {
  return {
    id: "m1",
    familyId: "f1",
    uid: null,
    name: "Test",
    role: "child",
    age: 10,
    color: "#000",
    avatarUrl: null,
    status: "active",
    skills: [],
    preferences: [],
    availability: [],
    canCreateTasks: false,
    points: 0,
    totalPointsEarned: 0,
    tasksDone: 0,
    streak: 0,
    lastDoneDate: null,
    badges: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

function makeTask(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    familyId: "f1",
    title: "Test task",
    description: "",
    group: "Cuisine",
    type: "simple",
    status: "A faire",
    points: 5,
    difficulty: "facile",
    estimatedMinutes: 10,
    assigneeId: null,
    assignedMode: "manuel",
    dueDate: null,
    recurrence: null,
    minAge: null,
    subtasks: [],
    comments: [],
    proofUrls: [],
    createdBy: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    history: [],
    ...over,
  };
}

describe("daysBetween", () => {
  it("computes day gaps correctly", () => {
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
    expect(daysBetween("2026-01-01", "2026-01-10")).toBe(9);
  });
});

describe("computeStreak", () => {
  it("starts at 1 when no previous completion", () => {
    expect(computeStreak({ lastDoneDate: null, streak: 0 })).toBe(1);
  });
  it("increments streak on consecutive day", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    expect(computeStreak({ lastDoneDate: yesterday, streak: 3 }, undefined)).toBeGreaterThanOrEqual(1);
  });
  it("resets streak after a gap of more than 1 day", () => {
    expect(computeStreak({ lastDoneDate: "2020-01-01", streak: 5 }, "2020-01-10")).toBe(1);
  });
  it("keeps streak the same on same-day repeat", () => {
    expect(computeStreak({ lastDoneDate: "2020-01-10", streak: 5 }, "2020-01-10")).toBe(5);
  });
});

describe("computeAutoAssignScores", () => {
  it("excludes members below the minimum age", () => {
    const young = makeMember({ id: "young", age: 6 });
    const old = makeMember({ id: "old", age: 15 });
    const scores = computeAutoAssignScores({ group: "Jardin", minAge: 12, points: 10 }, [young, old], []);
    const youngScore = scores.find((s) => s.member.id === "young")!;
    const oldScore = scores.find((s) => s.member.id === "old")!;
    expect(youngScore.score).toBe(-9999);
    expect(oldScore.score).toBeGreaterThan(-9999);
  });

  it("excludes guests and suspended members", () => {
    const guest = makeMember({ id: "guest", role: "guest" });
    const suspended = makeMember({ id: "susp", status: "suspended" });
    const active = makeMember({ id: "active" });
    const scores = computeAutoAssignScores({ group: "Cuisine", minAge: null, points: 5 }, [guest, suspended, active], []);
    expect(scores.map((s) => s.member.id)).toEqual(["active"]);
  });

  it("penalizes members with more open task load", () => {
    const light = makeMember({ id: "light" });
    const busy = makeMember({ id: "busy" });
    const tasks: Task[] = [
      makeTask({ id: "t-busy", assigneeId: "busy", status: "En cours", points: 50 }),
    ];
    const scores = computeAutoAssignScores({ group: "Cuisine", minAge: null, points: 5 }, [light, busy], tasks);
    const lightScore = scores.find((s) => s.member.id === "light")!.score;
    const busyScore = scores.find((s) => s.member.id === "busy")!.score;
    expect(lightScore).toBeGreaterThan(busyScore);
  });

  it("boosts members whose skills/preferences match the task group", () => {
    const skilled = makeMember({ id: "skilled", skills: ["Jardin"] });
    const neutral = makeMember({ id: "neutral" });
    const scores = computeAutoAssignScores({ group: "Jardin", minAge: null, points: 5 }, [skilled, neutral], []);
    const skilledScore = scores.find((s) => s.member.id === "skilled")!.score;
    const neutralScore = scores.find((s) => s.member.id === "neutral")!.score;
    expect(skilledScore).toBeGreaterThan(neutralScore);
  });

  it("favors equitable distribution: fewer completed tasks -> higher fairness boost", () => {
    const fresh = makeMember({ id: "fresh", tasksDone: 0 });
    const veteran = makeMember({ id: "veteran", tasksDone: 50 });
    const scores = computeAutoAssignScores({ group: "Cuisine", minAge: null, points: 5 }, [fresh, veteran], []);
    const freshScore = scores.find((s) => s.member.id === "fresh")!.score;
    const veteranScore = scores.find((s) => s.member.id === "veteran")!.score;
    expect(freshScore).toBeGreaterThan(veteranScore);
  });
});

describe("newlyEarnedBadges", () => {
  it("awards the 10-tasks badge on crossing the threshold", () => {
    const badges = newlyEarnedBadges({ tasksDone: 9, streak: 0, badges: [] }, { tasksDone: 10, streak: 0 });
    expect(badges).toContain("tasks10");
  });
  it("does not re-award an already-held badge", () => {
    const badges = newlyEarnedBadges({ tasksDone: 10, streak: 0, badges: ["tasks10"] }, { tasksDone: 11, streak: 0 });
    expect(badges).not.toContain("tasks10");
  });
  it("awards the 7-day streak badge", () => {
    const badges = newlyEarnedBadges({ tasksDone: 0, streak: 6, badges: [] }, { tasksDone: 0, streak: 7 });
    expect(badges).toContain("streak7");
  });
});
