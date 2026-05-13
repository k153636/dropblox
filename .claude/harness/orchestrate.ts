#!/usr/bin/env bun
/**
 * Harness Orchestrator
 * Chains Planner → Generator → Evaluator for autonomous sprint-based development.
 *
 * Usage:
 *   bun orchestrate.ts plan "2Dレトロゲームメーカーを作って"
 *   bun orchestrate.ts run              # Run current sprint once
 *   bun orchestrate.ts run --all        # Run all remaining sprints
 *   bun orchestrate.ts status           # Show progress table
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { spawnSync, execSync } from "child_process";
import { resolve, join } from "path";

const HARNESS_DIR = join(import.meta.dir, "agents");
const SPEC_FILE = "harness-spec.json";
const STATE_FILE = "harness-state.json";
const MAX_RETRIES = 3;

// ── Types ────────────────────────────────────────────────────────────────────

interface Sprint {
  id: number;
  name: string;
  goal: string;
  features: string[];
  acceptance_criteria: { critical: string[]; normal: string[] };
}

interface Spec {
  product_name: string;
  description: string;
  sprints: Sprint[];
}

interface SprintState {
  status: "pending" | "self_evaluated" | "pass" | "fail";
  retries: number;
  generator_scores?: Record<string, number>;
  evaluator_results?: Array<{ criterion: string; passed: boolean; note: string }>;
  feedback?: string;
  blockers?: string[];
}

interface HarnessState {
  current_sprint: number;
  sprints: Record<string, SprintState>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readSpec(): Spec {
  if (!existsSync(SPEC_FILE)) throw new Error(`${SPEC_FILE} not found. Run 'plan' first.`);
  return JSON.parse(readFileSync(SPEC_FILE, "utf-8"));
}

function readState(): HarnessState {
  if (!existsSync(STATE_FILE)) {
    const initial: HarnessState = { current_sprint: 1, sprints: {} };
    writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
}

function writeState(state: HarnessState) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function readAgentPrompt(name: "planner" | "generator" | "evaluator"): string {
  return readFileSync(join(HARNESS_DIR, `${name}.md`), "utf-8");
}

/** Run claude agent with full tool access (file write, bash, git, MCP) */
function runClaude(prompt: string, cwd = process.cwd()): string {
  const result = spawnSync(
    "claude",
    [
      "-p",
      "--dangerously-skip-permissions", // allows file I/O, bash, git without prompts
      "--max-turns", "50",              // prevent infinite loops
      prompt,
    ],
    {
      cwd,
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30 * 60 * 1000, // 30 min max per agent run
    }
  );
  if (result.error) throw result.error;
  return result.stdout ?? "";
}

function printTable(spec: Spec, state: HarnessState) {
  console.log(`\n${spec.product_name} — Sprint Progress\n`);
  console.log("ID  Name                           Status       Retries");
  console.log("─".repeat(60));
  for (const sprint of spec.sprints) {
    const s = state.sprints[sprint.id] ?? { status: "pending", retries: 0 };
    const icon = { pending: "⬜", self_evaluated: "🔄", pass: "✅", fail: "❌" }[s.status];
    const current = state.current_sprint === sprint.id ? " ◀" : "";
    console.log(
      `${String(sprint.id).padEnd(4)}${sprint.name.slice(0, 30).padEnd(32)}${icon} ${s.status.padEnd(14)}${s.retries ?? 0}${current}`
    );
  }
  console.log();
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function commandPlan(brief: string) {
  console.log("🗺  Running Planner…\n");
  const systemPrompt = readAgentPrompt("planner");
  const prompt = `${systemPrompt}\n\n---\n\nBrief:\n${brief}\n\nSave the spec to ${SPEC_FILE} in the current directory.`;
  const output = runClaude(prompt);
  console.log(output);
  if (existsSync(SPEC_FILE)) {
    const spec = readSpec();
    console.log(`\n✅  Spec written: ${spec.sprints.length} sprints for "${spec.product_name}"`);
  }
}

async function commandRun(runAll: boolean) {
  const spec = readSpec();
  const state = readState();
  const totalSprints = spec.sprints.length;

  // Safety: create a harness branch so destructive changes are reversible
  if (runAll && state.current_sprint === 1) {
    try {
      const branch = `harness/${spec.product_name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
      execSync(`git checkout -b "${branch}"`, { stdio: "pipe" });
      console.log(`🌿  Working on branch: ${branch}\n`);
    } catch {
      // Not a git repo or branch already exists — continue anyway
    }
  }

  do {
    const sprintId = state.current_sprint;
    if (sprintId > totalSprints) {
      console.log("🎉  All sprints complete!");
      printTable(spec, state);
      break;
    }

    const sprint = spec.sprints.find((s) => s.id === sprintId)!;
    const sprintState: SprintState = state.sprints[sprintId] ?? { status: "pending", retries: 0 };
    state.sprints[sprintId] = sprintState;

    if (sprintState.retries >= MAX_RETRIES) {
      console.error(`❌  Sprint ${sprintId} failed after ${MAX_RETRIES} retries. Manual intervention needed.`);
      break;
    }

    // ── Generator ──────────────────────────────────────────────────────────
    console.log(`\n🔨  Sprint ${sprintId}: ${sprint.name} — Generator (attempt ${sprintState.retries + 1})\n`);

    const feedbackSection = sprintState.feedback
      ? `\n\nPrevious evaluator feedback to fix:\n${sprintState.feedback}`
      : "";

    const generatorPrompt =
      readAgentPrompt("generator") +
      `\n\n---\n\nImplement sprint ${sprintId}.${feedbackSection}`;

    const genOutput = runClaude(generatorPrompt);
    console.log(genOutput);

    sprintState.status = "self_evaluated";
    sprintState.retries = (sprintState.retries ?? 0) + 1;
    writeState(state);

    // ── Evaluator ──────────────────────────────────────────────────────────
    console.log(`\n🧪  Sprint ${sprintId}: ${sprint.name} — Evaluator\n`);

    const evaluatorPrompt =
      readAgentPrompt("evaluator") +
      `\n\n---\n\nTest sprint ${sprintId}. Playwright MCP is available if configured.`;

    const evalOutput = runClaude(evaluatorPrompt);
    console.log(evalOutput);

    // Parse EVALUATOR_DONE line
    const doneMatch = evalOutput.match(/EVALUATOR_DONE sprint=\d+ verdict=(\w+)/);
    const verdict = doneMatch?.[1] ?? "fail";

    // Re-read state (evaluator may have updated it)
    const freshState = readState();
    const freshSprintState = freshState.sprints[sprintId] ?? sprintState;

    if (verdict === "pass") {
      freshSprintState.status = "pass";
      freshState.current_sprint = sprintId + 1;
      writeState(freshState);
      Object.assign(state, freshState);
      console.log(`\n✅  Sprint ${sprintId} passed!`);
    } else {
      freshSprintState.status = "fail";
      writeState(freshState);
      Object.assign(state, freshState);
      console.log(`\n❌  Sprint ${sprintId} failed. Feedback recorded. Retrying…`);
    }
  } while (runAll && state.current_sprint <= totalSprints);

  printTable(spec, state);
}

function commandStatus() {
  const spec = readSpec();
  const state = readState();
  printTable(spec, state);
}

// ── Entry point ───────────────────────────────────────────────────────────────

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case "plan":
    if (!args[0]) { console.error("Usage: bun orchestrate.ts plan \"<brief>\""); process.exit(1); }
    commandPlan(args.join(" "));
    break;
  case "run":
    commandRun(args.includes("--all"));
    break;
  case "status":
    commandStatus();
    break;
  default:
    console.log(`
Harness Orchestrator

Commands:
  plan "<brief>"    Generate spec from a 1-4 line brief
  run               Run the current sprint (Generator + Evaluator)
  run --all         Run all remaining sprints autonomously
  status            Show sprint progress table
    `);
}
