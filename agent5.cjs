#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { spawnSync } = require("child_process");

/* =========================================================
 * AGENT LEVEL 5 - BLUEPRINT DRIVEN AUTONOMOUS ENGINEER
 * ========================================================= */

const CONFIG = {
    REPO_PATH: process.env.REPO_PATH || process.cwd(),
    BLUEPRINT_FILE: process.env.BLUEPRINT_FILE || "BLUEPRINT.md",

    OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
    MODEL_PLANNER: process.env.MODEL_PLANNER || "qwen2.5-coder:7b",
    MODEL_EXECUTOR: process.env.MODEL_EXECUTOR || "qwen2.5-coder:7b",
    MODEL_REVIEWER: process.env.MODEL_REVIEWER || "qwen2.5-coder:7b",
    MODEL_FIXER: process.env.MODEL_FIXER || "qwen2.5-coder:7b",

    REMOTE_NAME: process.env.REMOTE_NAME || "origin",
    AUTO_PUSH: String(process.env.AUTO_PUSH || "true").toLowerCase() === "true",
    AUTO_BRANCH: String(process.env.AUTO_BRANCH || "true").toLowerCase() === "true",
    BRANCH_PREFIX: process.env.BRANCH_PREFIX || "agent/autonomous",

    MAX_ITERATIONS: Number(process.env.MAX_ITERATIONS || 999999),
    LOOP_DELAY_MS: Number(process.env.LOOP_DELAY_MS || 5000),

    MAX_FILES_PER_TASK: Number(process.env.MAX_FILES_PER_TASK || 6),
    MAX_CONTEXT_FILES: Number(process.env.MAX_CONTEXT_FILES || 24),
    MAX_FILE_CHARS: Number(process.env.MAX_FILE_CHARS || 15000),
    MAX_BLUEPRINT_CHARS: Number(process.env.MAX_BLUEPRINT_CHARS || 35000),
    MAX_BACKLOG_ITEMS: Number(process.env.MAX_BACKLOG_ITEMS || 20),
    MAX_HISTORY_ITEMS: Number(process.env.MAX_HISTORY_ITEMS || 300),

    MAX_REPEAT_FAILURES_PER_TASK: Number(process.env.MAX_REPEAT_FAILURES_PER_TASK || 2),
    MAX_SELF_HEAL_ATTEMPTS: Number(process.env.MAX_SELF_HEAL_ATTEMPTS || 2),

    ALLOW_NEW_FILES: String(process.env.ALLOW_NEW_FILES || "true").toLowerCase() === "true",
    ALLOW_DELETE_FILES: String(process.env.ALLOW_DELETE_FILES || "false").toLowerCase() === "true",
    STRICT_CLEAN_START: String(process.env.STRICT_CLEAN_START || "true").toLowerCase() === "true",
    IGNORE_UNTRACKED_PROTECTED_FILES_ONLY: String(process.env.IGNORE_UNTRACKED_PROTECTED_FILES_ONLY || "true").toLowerCase() === "true",
    DEBUG: String(process.env.DEBUG || "false").toLowerCase() === "true",

    IGNORE_DIRS: [
        ".git",
        "node_modules",
        "dist",
        "build",
        ".next",
        "coverage",
        ".turbo",
        ".cache",
        ".idea",
        ".vscode",
        "vendor",
        "storage",
        "tmp",
        "temp"
    ],

    IGNORE_FILES: [
        ".agent-lock",
        ".agent-memory.json",
        ".agent-snapshot.json",
        "tmp.patch",
        "agent3.cjs",
        "agent4.cjs",
        "agent5.cjs"
    ],

    PROTECTED_FILES: [
        ".agent-lock",
        ".agent-memory.json",
        ".agent-snapshot.json",
        "tmp.patch",
        "agent3.cjs",
        "agent4.cjs",
        "agent5.cjs",
        "BLUEPRINT.md"
    ],

    ALLOWED_EXTENSIONS: [
        ".js",
        ".cjs",
        ".mjs",
        ".ts",
        ".tsx",
        ".jsx",
        ".json",
        ".md",
        ".yml",
        ".yaml",
        ".sql",
        ".css",
        ".scss",
        ".prisma",
        ".env.example",
        ".html"
    ],

    FORBIDDEN_TECH_KEYWORDS: [
        "firebase",
        "firebase admin sdk",
        "mongo",
        "mongodb",
        "mongoose",
        "fastify",
        "koa",
        "hapi",
        "django",
        "flask",
        "rails",
        "laravel",
        "supabase",
        "graphql"
    ]
};

/* ========================= BASIC UTILS ========================= */

function log(...args) {
    console.log(new Date().toISOString(), "-", ...args);
}

function debug(...args) {
    if (CONFIG.DEBUG) {
        console.log(new Date().toISOString(), "-", "[DEBUG]", ...args);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function exists(p) {
    try {
        return fs.existsSync(p);
    } catch {
        return false;
    }
}

function ensureDir(dir) {
    if (!exists(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeRead(p, fallback = "") {
    try {
        return fs.readFileSync(p, "utf8");
    } catch {
        return fallback;
    }
}

function safeWrite(p, content) {
    ensureDir(path.dirname(p));
    fs.writeFileSync(p, content, "utf8");
}

function normalizeSlashes(p) {
    return String(p).replace(/\\/g, "/");
}

function rel(absPath) {
    return normalizeSlashes(path.relative(CONFIG.REPO_PATH, absPath));
}

function abs(relPath) {
    if (path.isAbsolute(relPath)) return relPath;
    return path.join(CONFIG.REPO_PATH, relPath);
}

function sha1(value) {
    return crypto.createHash("sha1").update(String(value)).digest("hex");
}

function truncate(text, max) {
    const limit = Number(max || CONFIG.MAX_FILE_CHARS);
    if (!text) return "";
    if (text.length <= limit) return text;
    return `${text.slice(0, limit)}\n/* ...TRUNCATED... */`;
}

function unique(arr) {
    return [...new Set(arr)];
}

function stripCodeFence(text) {
    if (!text) return "";
    return text
        .replace(/^```(?:json|javascript|js|txt)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function isIgnoredDir(name) {
    return CONFIG.IGNORE_DIRS.includes(name);
}

function isIgnoredFile(name) {
    return CONFIG.IGNORE_FILES.includes(name);
}

function hasAllowedExtension(file) {
    const lower = String(file).toLowerCase();
    return CONFIG.ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function fileLooksText(p) {
    try {
        const buf = fs.readFileSync(p);
        const len = Math.min(buf.length, 512);
        for (let i = 0; i < len; i++) {
            if (buf[i] === 0) return false;
        }
        return true;
    } catch {
        return false;
    }
}

function isProtectedFile(filePath) {
    const normalized = normalizeSlashes(filePath).toLowerCase();
    return CONFIG.PROTECTED_FILES.some((p) => normalized.endsWith(p.toLowerCase()));
}

function nowDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function stableTaskSignature(task) {
    const payload = {
        title: String(task?.title || ""),
        category: String(task?.category || ""),
        goal: String(task?.goal || ""),
        files: Array.isArray(task?.files) ? [...task.files].sort() : []
    };

    return sha1(JSON.stringify(payload));
}

function stableTextSignature(text) {
    return sha1(String(text || "").trim().toLowerCase());
}

/* ========================= JSON PARSER ========================= */

function sanitizeModelOutput(raw) {
    if (!raw) return "";
    let cleaned = stripCodeFence(raw).trim();

    // remove BOM
    cleaned = cleaned.replace(/^\uFEFF/, "");

    // normalize smart quotes
    cleaned = cleaned
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'");

    return cleaned;
}

function parseJsonLoose(raw) {
    if (!raw) return null;

    const cleaned = sanitizeModelOutput(raw);

    // try exact parse
    try {
        return JSON.parse(cleaned);
    } catch { }

    // try extracting first JSON object
    const firstObj = cleaned.indexOf("{");
    const lastObj = cleaned.lastIndexOf("}");
    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
        const candidate = cleaned.slice(firstObj, lastObj + 1);
        try {
            return JSON.parse(candidate);
        } catch { }
    }

    // aggressive fallback:
    // convert template-string wrapped content values into JSON strings
    let repaired = cleaned;

    // replace : `...` with : "..."
    repaired = repaired.replace(/:\s*`([\s\S]*?)`(?=\s*[,}])/g, (_, content) => {
        return `: ${JSON.stringify(content)}`;
    });

    // replace multiline raw content fields missing JSON escaping
    try {
        return JSON.parse(repaired);
    } catch { }

    const first = repaired.indexOf("{");
    const last = repaired.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
        const candidate = repaired.slice(first, last + 1);
        try {
            return JSON.parse(candidate);
        } catch { }
    }

    return null;
}

/* ========================= LOCK ========================= */

function lockFile() {
    return path.join(CONFIG.REPO_PATH, ".agent-lock");
}

function acquireLock() {
    if (exists(lockFile())) {
        throw new Error("Já existe outro agente em execução (.agent-lock).");
    }
    safeWrite(lockFile(), String(process.pid));
}

function releaseLock() {
    try {
        if (exists(lockFile())) fs.unlinkSync(lockFile());
    } catch { }
}

/* ========================= MEMORY ========================= */

function memoryFile() {
    return path.join(CONFIG.REPO_PATH, ".agent-memory.json");
}

function createMemory() {
    return {
        repoHash: "",
        blueprintHash: "",
        backlog: [],
        accepted: [],
        failed: [],
        skipped: [],
        history: [],
        learned: {
            successfulTaskSignatures: [],
            failedTaskSignatures: [],
            successfulCommitMessages: [],
            forbiddenKeywordsObserved: [],
            lintPatterns: [],
            buildPatterns: [],
            testPatterns: []
        },
        metrics: {
            iterations: 0,
            plannerRuns: 0,
            tasksExecuted: 0,
            approvals: 0,
            rejections: 0,
            applied: 0,
            commits: 0,
            pushes: 0,
            verifyPass: 0,
            verifyFail: 0,
            testPass: 0,
            testFail: 0,
            selfHealSuccess: 0,
            selfHealFail: 0,
            lastSuccessAt: null,
            lastErrorAt: null
        }
    };
}

function sanitizeMemory(raw) {
    const base = createMemory();
    const m = raw && typeof raw === "object" ? raw : {};

    return {
        ...base,
        ...m,
        backlog: Array.isArray(m.backlog) ? m.backlog : [],
        accepted: Array.isArray(m.accepted) ? m.accepted : [],
        failed: Array.isArray(m.failed) ? m.failed : [],
        skipped: Array.isArray(m.skipped) ? m.skipped : [],
        history: Array.isArray(m.history) ? m.history : [],
        learned: {
            ...base.learned,
            ...(m.learned || {}),
            successfulTaskSignatures: Array.isArray(m?.learned?.successfulTaskSignatures) ? m.learned.successfulTaskSignatures : [],
            failedTaskSignatures: Array.isArray(m?.learned?.failedTaskSignatures) ? m.learned.failedTaskSignatures : [],
            successfulCommitMessages: Array.isArray(m?.learned?.successfulCommitMessages) ? m.learned.successfulCommitMessages : [],
            forbiddenKeywordsObserved: Array.isArray(m?.learned?.forbiddenKeywordsObserved) ? m.learned.forbiddenKeywordsObserved : [],
            lintPatterns: Array.isArray(m?.learned?.lintPatterns) ? m.learned.lintPatterns : [],
            buildPatterns: Array.isArray(m?.learned?.buildPatterns) ? m.learned.buildPatterns : [],
            testPatterns: Array.isArray(m?.learned?.testPatterns) ? m.learned.testPatterns : []
        },
        metrics: {
            ...base.metrics,
            ...(m.metrics || {}),
            iterations: Number(m?.metrics?.iterations || 0),
            plannerRuns: Number(m?.metrics?.plannerRuns || 0),
            tasksExecuted: Number(m?.metrics?.tasksExecuted || 0),
            approvals: Number(m?.metrics?.approvals || 0),
            rejections: Number(m?.metrics?.rejections || 0),
            applied: Number(m?.metrics?.applied || 0),
            commits: Number(m?.metrics?.commits || 0),
            pushes: Number(m?.metrics?.pushes || 0),
            verifyPass: Number(m?.metrics?.verifyPass || 0),
            verifyFail: Number(m?.metrics?.verifyFail || 0),
            testPass: Number(m?.metrics?.testPass || 0),
            testFail: Number(m?.metrics?.testFail || 0),
            selfHealSuccess: Number(m?.metrics?.selfHealSuccess || 0),
            selfHealFail: Number(m?.metrics?.selfHealFail || 0)
        }
    };
}

function loadMemory() {
    if (!exists(memoryFile())) return createMemory();

    try {
        const raw = JSON.parse(safeRead(memoryFile(), "{}"));
        return sanitizeMemory(raw);
    } catch {
        return createMemory();
    }
}

function saveMemory(memory) {
    safeWrite(memoryFile(), JSON.stringify(sanitizeMemory(memory), null, 2));
}

function pushHistory(memory, item) {
    memory.history.unshift({
        at: new Date().toISOString(),
        ...item
    });

    if (memory.history.length > CONFIG.MAX_HISTORY_ITEMS) {
        memory.history = memory.history.slice(0, CONFIG.MAX_HISTORY_ITEMS);
    }
}

function rememberSuccess(memory, task, commitMessage) {
    const signature = stableTaskSignature(task);
    if (!memory.learned.successfulTaskSignatures.includes(signature)) {
        memory.learned.successfulTaskSignatures.unshift(signature);
    }
    memory.learned.successfulTaskSignatures = memory.learned.successfulTaskSignatures.slice(0, 200);

    if (commitMessage && !memory.learned.successfulCommitMessages.includes(commitMessage)) {
        memory.learned.successfulCommitMessages.unshift(commitMessage);
    }
    memory.learned.successfulCommitMessages = memory.learned.successfulCommitMessages.slice(0, 100);
}

function rememberFailure(memory, task, reason) {
    const signature = stableTaskSignature(task);
    if (!memory.learned.failedTaskSignatures.includes(signature)) {
        memory.learned.failedTaskSignatures.unshift(signature);
    }
    memory.learned.failedTaskSignatures = memory.learned.failedTaskSignatures.slice(0, 200);

    if (reason) {
        const low = String(reason).toLowerCase();
        if (low.includes("lint")) {
            memory.learned.lintPatterns.unshift(reason);
            memory.learned.lintPatterns = memory.learned.lintPatterns.slice(0, 50);
        } else if (low.includes("build") || low.includes("typecheck")) {
            memory.learned.buildPatterns.unshift(reason);
            memory.learned.buildPatterns = memory.learned.buildPatterns.slice(0, 50);
        } else if (low.includes("test")) {
            memory.learned.testPatterns.unshift(reason);
            memory.learned.testPatterns = memory.learned.testPatterns.slice(0, 50);
        }
    }
}

/* ========================= SHELL / GIT ========================= */

function run(command, options = {}) {
    const result = spawnSync(command, {
        cwd: options.cwd || CONFIG.REPO_PATH,
        shell: true,
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 40
    });

    return {
        ok: result.status === 0,
        code: result.status,
        stdout: result.stdout || "",
        stderr: result.stderr || ""
    };
}

function git(cmd, allowFail = false) {
    const res = run(`git ${cmd}`, { cwd: CONFIG.REPO_PATH });
    if (!allowFail && !res.ok) {
        throw new Error(`git ${cmd} falhou:\n${res.stderr || res.stdout}`);
    }
    return (res.stdout || "").trim();
}

function hasGitRepo() {
    const res = run("git rev-parse --is-inside-work-tree");
    return res.ok && String(res.stdout).trim() === "true";
}

function currentBranch() {
    return git("rev-parse --abbrev-ref HEAD", true) || "unknown";
}

function stageAll() {
    git("add .");
}

function commitAll(message) {
    stageAll();
    const res = run(`git commit -m ${JSON.stringify(message)}`);
    const output = `${res.stdout}\n${res.stderr}`.trim();

    if (!res.ok) {
        if (/nothing to commit/i.test(output)) return false;
        throw new Error(`Commit falhou:\n${output}`);
    }

    return true;
}

function pushBranch() {
    const branch = currentBranch();
    const res = run(`git push -u ${CONFIG.REMOTE_NAME} ${branch}`);
    if (!res.ok) {
        throw new Error(`Push falhou:\n${res.stderr || res.stdout}`);
    }
}

function rollbackHard() {
    git("reset --hard", true);
    git("clean -fd", true);
}

function diffWorkingTree() {
    return git("diff -- .", true);
}

function ensureBranch() {
    if (!CONFIG.AUTO_BRANCH) return currentBranch();

    const target = `${CONFIG.BRANCH_PREFIX}/${nowDate()}`;
    const current = currentBranch();
    if (current === target) return current;

    const existsBranch = run(`git rev-parse --verify ${target}`).ok;
    if (existsBranch) {
        git(`checkout ${target}`);
        return target;
    }

    git(`checkout -b ${target}`);
    return target;
}

function getUntrackedFiles() {
    const out = git("ls-files --others --exclude-standard", true);
    return out ? out.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : [];
}

function getStatusPorcelain() {
    const out = git("status --porcelain", true);
    return out ? out.split(/\r?\n/).filter(Boolean) : [];
}

function workingTreeDirty() {
    const lines = getStatusPorcelain();
    if (!lines.length) return false;

    if (!CONFIG.IGNORE_UNTRACKED_PROTECTED_FILES_ONLY) return true;

    for (const line of lines) {
        const candidate = line.slice(3).trim();
        const isUntracked = line.startsWith("??");
        if (isUntracked && isProtectedFile(candidate)) {
            continue;
        }
        return true;
    }

    return false;
}

/* ========================= REPO SCAN ========================= */

function walkFiles(dir, list = []) {
    let entries = [];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return list;
    }

    for (const entry of entries) {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (isIgnoredDir(entry.name)) continue;
            walkFiles(full, list);
            continue;
        }

        if (isIgnoredFile(entry.name)) continue;
        if (!hasAllowedExtension(entry.name)) continue;
        if (!fileLooksText(full)) continue;

        list.push(full);
    }

    return list;
}

function buildRepoIndex() {
    const files = walkFiles(CONFIG.REPO_PATH);
    const rels = files.map(rel).filter((p) => !isProtectedFile(p)).sort();

    const importantNames = [
        "package.json",
        "README.md",
        "tsconfig.json",
        "jsconfig.json",
        "next.config.js",
        "next.config.mjs",
        "nest-cli.json",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".env.example",
        "prisma/schema.prisma"
    ];

    const importantFiles = [];

    for (const name of importantNames) {
        const found = files.find((f) => rel(f).toLowerCase() === name.toLowerCase());
        if (found && !isProtectedFile(rel(found))) importantFiles.push(found);
    }

    const codeFiles = files.filter((f) => {
        const r = rel(f);
        if (isProtectedFile(r)) return false;
        return /src\/|app\/|server\/|routes\/|controllers\/|services\/|components\/|pages\/|lib\/|utils\//i.test(r);
    });

    const merged = unique([...importantFiles, ...codeFiles.slice(0, CONFIG.MAX_CONTEXT_FILES)]);

    return {
        files,
        rels,
        importantFiles: merged.slice(0, CONFIG.MAX_CONTEXT_FILES),
        repoHash: sha1(rels.join("\n"))
    };
}

function readFileContext(filePath, maxChars = CONFIG.MAX_FILE_CHARS) {
    const content = safeRead(filePath, "");
    return `FILE: ${rel(filePath)}\n-----\n${truncate(content, maxChars)}\n`;
}

function loadBlueprint() {
    const blueprintPath = path.join(CONFIG.REPO_PATH, CONFIG.BLUEPRINT_FILE);

    if (!exists(blueprintPath)) {
        throw new Error(`BLUEPRINT obrigatório não encontrado: ${CONFIG.BLUEPRINT_FILE}`);
    }

    const blueprint = safeRead(blueprintPath, "").trim();
    if (!blueprint || blueprint.length < 30) {
        throw new Error(`BLUEPRINT inválido ou vazio: ${CONFIG.BLUEPRINT_FILE}`);
    }

    return {
        path: blueprintPath,
        content: truncate(blueprint, CONFIG.MAX_BLUEPRINT_CHARS),
        hash: sha1(blueprint)
    };
}

function buildRepoSnapshot(index) {
    const packageJsonPath = path.join(CONFIG.REPO_PATH, "package.json");
    let packageSummary = "package.json não encontrado";
    let dependencySummary = [];

    if (exists(packageJsonPath)) {
        try {
            const pkg = JSON.parse(safeRead(packageJsonPath, "{}"));
            dependencySummary = [
                ...Object.keys(pkg.dependencies || {}),
                ...Object.keys(pkg.devDependencies || {})
            ];

            packageSummary = JSON.stringify({
                name: pkg.name || null,
                version: pkg.version || null,
                type: pkg.type || null,
                scripts: pkg.scripts || {},
                dependencies: Object.keys(pkg.dependencies || {}).slice(0, 80),
                devDependencies: Object.keys(pkg.devDependencies || {}).slice(0, 80)
            }, null, 2);
        } catch {
            packageSummary = truncate(safeRead(packageJsonPath, ""));
        }
    }

    const fileContexts = index.importantFiles.map((f) => readFileContext(f)).join("\n\n");

    return {
        packageSummary,
        dependencySummary,
        fileList: index.rels.slice(0, 1200).join("\n"),
        fileContexts
    };
}

/* ========================= PROJECT COMMANDS ========================= */

function detectProjectCommands() {
    const pkgPath = path.join(CONFIG.REPO_PATH, "package.json");
    const result = {
        verify: [],
        test: []
    };

    if (!exists(pkgPath)) return result;

    try {
        const pkg = JSON.parse(safeRead(pkgPath, "{}"));
        const scripts = pkg.scripts || {};

        if (scripts.lint) result.verify.push("npm run lint");
        if (scripts.typecheck) result.verify.push("npm run typecheck");
        if (scripts.build) result.verify.push("npm run build");

        if (scripts.test) result.test.push("npm test");
        if (scripts["test:unit"]) result.test.push("npm run test:unit");
        if (scripts["test:integration"]) result.test.push("npm run test:integration");

        return result;
    } catch {
        return result;
    }
}

function runCommands(commands, label) {
    const outputs = [];

    for (const cmd of commands) {
        log(`🧪 ${label}: ${cmd}`);
        const res = run(cmd, { cwd: CONFIG.REPO_PATH });

        outputs.push({
            command: cmd,
            ok: res.ok,
            code: res.code,
            stdout: truncate(res.stdout, 30000),
            stderr: truncate(res.stderr, 30000)
        });

        if (!res.ok) break;
    }

    return outputs;
}

function summarizeCommandFailures(results) {
    const failed = results.find((r) => !r.ok);
    if (!failed) return "";
    return [
        `COMMAND: ${failed.command}`,
        `STDOUT:`,
        failed.stdout || "(empty)",
        `STDERR:`,
        failed.stderr || "(empty)"
    ].join("\n");
}

/* ========================= AI ========================= */

async function askModel(model, prompt) {
    const response = await axios.post(
        CONFIG.OLLAMA_URL,
        {
            model,
            prompt,
            stream: false
        },
        {
            timeout: 1000 * 60 * 10
        }
    );

    return response.data.response || "";
}

function buildBacklogPlannerPrompt({ blueprint, snapshot, memory, branch }) {
    return `
You are an autonomous principal software engineer evolving a real production system.

SOURCE OF TRUTH:
The blueprint below defines the product, architecture, goals, and constraints.
You must obey it strictly.

BLUEPRINT:
${blueprint.content}

CURRENT BRANCH:
${branch}

PACKAGE SUMMARY:
${snapshot.packageSummary}

KNOWN FILES:
${snapshot.fileList}

IMPORTANT FILE EXCERPTS:
${snapshot.fileContexts}

KNOWN DEPENDENCIES:
${JSON.stringify(snapshot.dependencySummary.slice(0, 120), null, 2)}

LEARNED SUCCESSES:
${JSON.stringify(memory.accepted.slice(0, 10), null, 2)}

LEARNED FAILURES:
${JSON.stringify(memory.failed.slice(0, 10), null, 2)}

PREVIOUS SUCCESSFUL TASK SIGNATURES:
${JSON.stringify(memory.learned.successfulTaskSignatures.slice(0, 20), null, 2)}

PREVIOUS FAILED TASK SIGNATURES:
${JSON.stringify(memory.learned.failedTaskSignatures.slice(0, 20), null, 2)}

CRITICAL RULES:
- Use BLUEPRINT as source of truth
- Propose ONLY improvements aligned with the existing system
- DO NOT introduce new frameworks or platforms unless already present in dependencies or files
- DO NOT introduce: ${CONFIG.FORBIDDEN_TECH_KEYWORDS.join(", ")}
- NEVER suggest protected/internal files
- Prefer improving existing modules, bugfixes, tests, validation, security hardening, performance, DX
- Do not suggest generic auth rewrites unless clearly supported by existing codebase
- If a technology is not clearly present, do not propose it
- Only propose small, shippable, low-risk tasks
- Max ${CONFIG.MAX_FILES_PER_TASK} files per task

Return ONLY valid JSON in this exact shape:
{
  "summary": "short summary of repo direction",
  "tasks": [
    {
      "id": "task-short-id",
      "title": "short title",
      "category": "security|performance|product|bugfix|refactor|dx|tests",
      "priority": "high|medium|low",
      "goal": "what should be improved",
      "why": "why this matters",
      "files": ["real/path1", "real/path2"],
      "new_files_allowed": true,
      "commit_message": "feat/fix/chore/test/refactor: concise message"
    }
  ]
}
`.trim();
}

function buildExecutorPrompt({ blueprint, task, fileContexts, commands, memory }) {
    return `
You are implementing one task in a production codebase.

SOURCE OF TRUTH:
${blueprint.content}

TASK:
${JSON.stringify(task, null, 2)}

PROJECT COMMANDS:
${JSON.stringify(commands, null, 2)}

CURRENT FILES:
${fileContexts}

LEARNED FAILURES:
${JSON.stringify(memory.failed.slice(0, 8), null, 2)}

CRITICAL IMPLEMENTATION RULES:
- Implement ONLY this task
- Respect the blueprint and current stack
- Keep scope small and safe
- Do not modify unrelated files
- Use exact relative repo paths
- Existing files must be fully rewritten in output
- New files only if task justifies it
- Output MUST be valid JSON
- Do not use markdown fences
- Do not use JavaScript template strings around file content
- File content must be a normal JSON string
- NEVER modify or access these files:
  - agent3.cjs
  - agent4.cjs
  - agent5.cjs
  - .agent-memory.json
  - .agent-lock
  - BLUEPRINT.md
- Never introduce these technologies unless already present in the codebase:
  - ${CONFIG.FORBIDDEN_TECH_KEYWORDS.join("\n  - ")}

Return ONLY valid JSON in this exact shape:
{
  "summary": "what changed",
  "files": [
    {
      "path": "relative/path.ext",
      "action": "update|create",
      "content": "full file content"
    }
  ],
  "delete_files": [],
  "notes": ["important note 1", "important note 2"]
}
`.trim();
}

function buildReviewerPrompt({ blueprint, task, implementation, diff }) {
    return `
You are a strict senior reviewer.

SOURCE OF TRUTH:
${blueprint.content}

TASK:
${JSON.stringify(task, null, 2)}

IMPLEMENTATION:
${JSON.stringify(implementation, null, 2)}

DIFF:
${truncate(diff, 45000)}

Approve only if:
- it matches the blueprint
- it matches the task
- files are relevant
- risk is low
- code is coherent
- no obvious breakage
- no secrets or destructive operations
- no unrelated changes
- no protected files are touched
- no new frameworks outside current stack

Return ONLY valid JSON:
{
  "verdict": "APPROVED|REJECTED",
  "reason": "short reason",
  "warnings": ["warning 1"],
  "suggested_commit_message": "optional improved commit message"
}
`.trim();
}

function buildSelfHealPrompt({ blueprint, task, implementation, failedSummary, currentFiles }) {
    return `
You are a senior engineer fixing a failed implementation after lint/build/test failure.

SOURCE OF TRUTH:
${blueprint.content}

TASK:
${JSON.stringify(task, null, 2)}

FAILED IMPLEMENTATION SUMMARY:
${JSON.stringify(implementation, null, 2)}

FAILURE OUTPUT:
${failedSummary}

CURRENT FILES:
${currentFiles}

RULES:
- Fix only the failure
- Keep same task scope
- Preserve the original intent
- Do not touch unrelated files
- Output valid JSON only
- Do not use template strings around content
- Do not touch protected files

Return ONLY:
{
  "summary": "what was fixed",
  "files": [
    {
      "path": "relative/path.ext",
      "action": "update|create",
      "content": "full file content"
    }
  ],
  "delete_files": [],
  "notes": ["..."]
}
`.trim();
}

/* ========================= TASK / PLAN VALIDATION ========================= */

function detectForbiddenKeywordsInTask(task) {
    const serialized = JSON.stringify(task).toLowerCase();
    return CONFIG.FORBIDDEN_TECH_KEYWORDS.filter((kw) => serialized.includes(kw));
}

function validateBacklog(backlog, repoIndex, memory) {
    if (!backlog || typeof backlog !== "object") {
        throw new Error("Backlog inválido.");
    }

    if (!Array.isArray(backlog.tasks)) {
        throw new Error("Backlog sem tasks.");
    }

    const realFiles = new Set(repoIndex.rels);
    const cleaned = [];

    for (const task of backlog.tasks.slice(0, CONFIG.MAX_BACKLOG_ITEMS)) {
        if (!task || typeof task !== "object") continue;
        if (!task.id || !task.title || !task.category || !task.goal) continue;

        const forbidden = detectForbiddenKeywordsInTask(task);
        if (forbidden.length) {
            memory.learned.forbiddenKeywordsObserved.push(...forbidden);
            memory.learned.forbiddenKeywordsObserved = unique(memory.learned.forbiddenKeywordsObserved).slice(0, 100);
            continue;
        }

        const files = Array.isArray(task.files) ? task.files.filter(Boolean) : [];
        const validFiles = files
            .map(normalizeSlashes)
            .filter((f) => !isProtectedFile(f))
            .filter((f) => realFiles.has(f));

        const normalizedTask = {
            id: String(task.id),
            title: String(task.title),
            category: String(task.category),
            priority: String(task.priority || "medium"),
            goal: String(task.goal),
            why: String(task.why || ""),
            files: validFiles.slice(0, CONFIG.MAX_FILES_PER_TASK),
            new_files_allowed: Boolean(task.new_files_allowed),
            commit_message: String(task.commit_message || `chore: ${task.title}`)
        };

        if (!normalizedTask.files.length && !normalizedTask.new_files_allowed) {
            continue;
        }

        cleaned.push(normalizedTask);
    }

    backlog.tasks = cleaned;
    return backlog;
}

function validateImplementation(impl, task) {
    if (!impl || typeof impl !== "object") {
        throw new Error("Implementação inválida.");
    }

    if (!Array.isArray(impl.files)) {
        throw new Error("Implementação sem files.");
    }

    if (!Array.isArray(impl.delete_files)) {
        impl.delete_files = [];
    }

    if (impl.files.length === 0 && impl.delete_files.length === 0) {
        throw new Error("Implementação vazia.");
    }

    if (impl.files.length > CONFIG.MAX_FILES_PER_TASK + 3) {
        throw new Error("Implementação alterou arquivos demais.");
    }

    for (const f of impl.files) {
        if (!f.path || typeof f.path !== "string") {
            throw new Error("Arquivo sem path.");
        }

        if (!["update", "create"].includes(f.action)) {
            throw new Error(`Ação inválida em ${f.path}`);
        }

        if (typeof f.content !== "string") {
            throw new Error(`Conteúdo inválido em ${f.path}`);
        }

        if (!hasAllowedExtension(f.path)) {
            throw new Error(`Extensão não permitida: ${f.path}`);
        }

        if (isProtectedFile(f.path)) {
            throw new Error(`Tentativa de alterar arquivo protegido: ${f.path}`);
        }

        if (f.action === "create" && !CONFIG.ALLOW_NEW_FILES && !task.new_files_allowed) {
            throw new Error(`Criação de arquivo não permitida: ${f.path}`);
        }
    }

    for (const d of impl.delete_files || []) {
        if (isProtectedFile(d)) {
            throw new Error(`Tentativa de deletar arquivo protegido: ${d}`);
        }
    }

    if (impl.delete_files.length > 0 && !CONFIG.ALLOW_DELETE_FILES) {
        throw new Error("Delete de arquivos bloqueado pela configuração.");
    }

    return impl;
}

function scoreTask(task) {
    const categoryScore = {
        security: 100,
        bugfix: 95,
        performance: 85,
        tests: 75,
        product: 65,
        refactor: 55,
        dx: 50
    };

    const priorityScore = {
        high: 30,
        medium: 20,
        low: 10
    };

    return (categoryScore[task.category] || 0) + (priorityScore[task.priority] || 0);
}

function countTaskFailures(memory, task) {
    const signature = stableTaskSignature(task);
    return memory.failed.filter((f) => f?.signature === signature).length;
}

function wasTaskSuccessful(memory, task) {
    const signature = stableTaskSignature(task);
    return memory.learned.successfulTaskSignatures.includes(signature);
}

function wasTaskFailedTooMuch(memory, task) {
    return countTaskFailures(memory, task) >= CONFIG.MAX_REPEAT_FAILURES_PER_TASK;
}

function pickNextTask(memory) {
    const backlog = Array.isArray(memory.backlog) ? memory.backlog : [];
    if (!backlog.length) return null;

    const candidates = backlog
        .filter((task) => !wasTaskSuccessful(memory, task))
        .filter((task) => !wasTaskFailedTooMuch(memory, task))
        .sort((a, b) => scoreTask(b) - scoreTask(a));

    return candidates[0] || null;
}

function removeTaskFromBacklog(memory, taskId) {
    memory.backlog = (memory.backlog || []).filter((t) => t.id !== taskId);
}

/* ========================= FILE APPLICATION ========================= */

function backupFiles(paths) {
    const map = new Map();

    for (const p of paths) {
        const full = abs(p);
        map.set(p, exists(full) ? safeRead(full, "") : null);
    }

    return map;
}

function restoreBackup(backupMap) {
    for (const [filePath, content] of backupMap.entries()) {
        const full = abs(filePath);

        if (content === null) {
            if (exists(full)) fs.unlinkSync(full);
        } else {
            safeWrite(full, content);
        }
    }
}

function applyImplementation(impl) {
    const touched = [];

    for (const file of impl.files) {
        const full = abs(file.path);

        if (isProtectedFile(file.path)) {
            throw new Error(`Arquivo protegido bloqueado: ${file.path}`);
        }

        safeWrite(full, file.content);
        touched.push(normalizeSlashes(file.path));
    }

    for (const delPath of impl.delete_files || []) {
        if (isProtectedFile(delPath)) {
            throw new Error(`Arquivo protegido bloqueado para delete: ${delPath}`);
        }

        const full = abs(delPath);
        if (exists(full)) {
            fs.unlinkSync(full);
            touched.push(normalizeSlashes(delPath));
        }
    }

    return unique(touched);
}

function collectContextsForTask(task) {
    const paths = unique(task.files || []).slice(0, CONFIG.MAX_FILES_PER_TASK);
    return paths.map((p) => {
        const full = abs(p);
        const content = exists(full) ? safeRead(full, "") : "";
        return `FILE: ${p}\n-----\n${truncate(content, CONFIG.MAX_FILE_CHARS)}\n`;
    }).join("\n\n");
}

/* ========================= SAFETY ========================= */

function containsDangerousContent(value) {
    const text = JSON.stringify(value);

    const patterns = [
        /rm\s+-rf/gi,
        /DROP\s+TABLE/gi,
        /TRUNCATE\s+TABLE/gi,
        /-----BEGIN (?:RSA|OPENSSH|PRIVATE KEY)-----/g,
        /process\.env\.[A-Z0-9_]+\s*=\s*["'`]/g
    ];

    return patterns.some((p) => p.test(text));
}

function ensureSafeStart() {
    if (!hasGitRepo()) {
        throw new Error("Este diretório não é um repositório git.");
    }

    if (CONFIG.STRICT_CLEAN_START && workingTreeDirty()) {
        throw new Error("Há alterações não commitadas. Limpe o repo antes de iniciar o agente.");
    }
}

/* ========================= CORE AI STEPS ========================= */

async function generateBacklog(memory, blueprint, repoIndex) {
    const snapshot = buildRepoSnapshot(repoIndex);
    const prompt = buildBacklogPlannerPrompt({
        blueprint,
        snapshot,
        memory,
        branch: currentBranch()
    });

    const raw = await askModel(CONFIG.MODEL_PLANNER, prompt);
    const parsed = parseJsonLoose(raw);

    if (!parsed) {
        throw new Error(`Falha ao parsear backlog do planner.\nRAW:\n${raw}`);
    }

    return validateBacklog(parsed, repoIndex, memory);
}

async function generateImplementation(task, blueprint, memory) {
    const fileContexts = collectContextsForTask(task);
    const commands = detectProjectCommands();

    const prompt = buildExecutorPrompt({
        blueprint,
        task,
        fileContexts,
        commands,
        memory
    });

    const raw = await askModel(CONFIG.MODEL_EXECUTOR, prompt);
    const impl = parseJsonLoose(raw);

    if (!impl) {
        throw new Error(`Falha ao parsear implementação.\nRAW:\n${raw}`);
    }

    validateImplementation(impl, task);

    if (containsDangerousContent(impl)) {
        throw new Error("Mudança bloqueada por conteúdo potencialmente perigoso.");
    }

    return impl;
}

async function reviewImplementation(task, blueprint, implementation) {
    const prompt = buildReviewerPrompt({
        blueprint,
        task,
        implementation,
        diff: diffWorkingTree()
    });

    const raw = await askModel(CONFIG.MODEL_REVIEWER, prompt);
    const review = parseJsonLoose(raw);

    if (!review) {
        throw new Error(`Falha ao parsear review.\nRAW:\n${raw}`);
    }

    return review;
}

function runVerification(memory) {
    const commands = detectProjectCommands();

    const verifyResults = runCommands(commands.verify, "verify");
    const verifyOk = verifyResults.every((x) => x.ok);

    if (verifyOk) memory.metrics.verifyPass++;
    else memory.metrics.verifyFail++;

    const testResults = runCommands(commands.test, "test");
    const testOk = testResults.every((x) => x.ok);

    if (testOk) memory.metrics.testPass++;
    else memory.metrics.testFail++;

    const ok = verifyOk && testOk;

    return {
        ok,
        verifyResults,
        testResults
    };
}

async function trySelfHeal({ blueprint, task, implementation, checks, memory }) {
    const failedSummary = [
        summarizeCommandFailures(checks.verifyResults),
        summarizeCommandFailures(checks.testResults)
    ].filter(Boolean).join("\n\n");

    let currentImpl = implementation;

    for (let attempt = 1; attempt <= CONFIG.MAX_SELF_HEAL_ATTEMPTS; attempt++) {
        log(`🩹 self-heal attempt ${attempt}/${CONFIG.MAX_SELF_HEAL_ATTEMPTS}`);

        const currentFiles = collectContextsForTask(task);
        const prompt = buildSelfHealPrompt({
            blueprint,
            task,
            implementation: currentImpl,
            failedSummary,
            currentFiles
        });

        const raw = await askModel(CONFIG.MODEL_FIXER, prompt);
        const fixedImpl = parseJsonLoose(raw);

        if (!fixedImpl) {
            continue;
        }

        validateImplementation(fixedImpl, task);

        if (containsDangerousContent(fixedImpl)) {
            continue;
        }

        const touchedPaths = unique([
            ...fixedImpl.files.map((f) => normalizeSlashes(f.path)),
            ...(fixedImpl.delete_files || []).map((p) => normalizeSlashes(p))
        ]);

        const backups = backupFiles(touchedPaths);

        try {
            applyImplementation(fixedImpl);
            const newChecks = runVerification(memory);

            if (newChecks.ok) {
                memory.metrics.selfHealSuccess++;
                return { ok: true, implementation: fixedImpl };
            }

            restoreBackup(backups);
            rollbackHard();
        } catch {
            restoreBackup(backups);
            rollbackHard();
        }
    }

    memory.metrics.selfHealFail++;
    return { ok: false };
}

/* ========================= MAIN LOOP ========================= */

async function main() {
    acquireLock();

    try {
        ensureSafeStart();

        let memory = loadMemory();
        const blueprint = loadBlueprint();
        const repoIndex = buildRepoIndex();

        memory.repoHash = repoIndex.repoHash;
        memory.blueprintHash = blueprint.hash;
        saveMemory(memory);

        const branch = ensureBranch();

        log("🚀 AUTONOMOUS AGENT LEVEL 5 STARTED");
        log("📁 repo:", CONFIG.REPO_PATH);
        log("📘 blueprint:", CONFIG.BLUEPRINT_FILE);
        log("🌿 branch:", branch);

        for (let i = 0; i < CONFIG.MAX_ITERATIONS; i++) {
            memory = loadMemory();
            memory.metrics.iterations++;
            saveMemory(memory);

            log("🧠 iteration", memory.metrics.iterations);

            try {
                if (!Array.isArray(memory.backlog) || memory.backlog.length === 0) {
                    log("🗺️ generating backlog from blueprint...");
                    const freshBacklog = await generateBacklog(memory, blueprint, buildRepoIndex());
                    memory.metrics.plannerRuns++;
                    memory.backlog = freshBacklog.tasks || [];
                    pushHistory(memory, {
                        type: "backlog_generated",
                        total: memory.backlog.length,
                        summary: freshBacklog.summary || ""
                    });
                    saveMemory(memory);
                }

                const task = pickNextTask(memory);

                if (!task) {
                    log("⏸️ no valid task available, regenerating backlog on next loop");
                    memory.backlog = [];
                    saveMemory(memory);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                if (wasTaskSuccessful(memory, task)) {
                    log("⚠️ skipping already successful task:", task.title);
                    memory.skipped.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        reason: "already completed",
                        signature: stableTaskSignature(task)
                    });
                    removeTaskFromBacklog(memory, task.id);
                    saveMemory(memory);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                if (wasTaskFailedTooMuch(memory, task)) {
                    log("⚠️ skipping repeated failure:", task.title);
                    memory.skipped.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        reason: "repeated failure limit reached",
                        signature: stableTaskSignature(task)
                    });
                    removeTaskFromBacklog(memory, task.id);
                    saveMemory(memory);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                log(`🎯 task: [${task.category}/${task.priority}] ${task.title}`);
                log("📌 goal:", task.goal);

                memory.metrics.tasksExecuted++;
                saveMemory(memory);

                const implementation = await generateImplementation(task, blueprint, memory);

                const touchedPaths = unique([
                    ...implementation.files.map((f) => normalizeSlashes(f.path)),
                    ...(implementation.delete_files || []).map((p) => normalizeSlashes(p))
                ]);

                const backups = backupFiles(touchedPaths);

                try {
                    applyImplementation(implementation);
                    memory.metrics.applied++;
                    saveMemory(memory);
                } catch (applyErr) {
                    restoreBackup(backups);
                    rollbackHard();
                    throw applyErr;
                }

                const review = await reviewImplementation(task, blueprint, implementation);

                if (String(review.verdict || "").toUpperCase() !== "APPROVED") {
                    memory.metrics.rejections++;
                    restoreBackup(backups);
                    rollbackHard();

                    const reason = review.reason || "review rejected";
                    memory.failed.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        goal: task.goal,
                        reason,
                        signature: stableTaskSignature(task)
                    });

                    rememberFailure(memory, task, reason);

                    removeTaskFromBacklog(memory, task.id);
                    pushHistory(memory, {
                        type: "task_rejected",
                        id: task.id,
                        title: task.title,
                        reason
                    });

                    saveMemory(memory);
                    log("❌ rejected:", reason);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                memory.metrics.approvals++;
                saveMemory(memory);

                let checks = runVerification(memory);

                if (!checks.ok) {
                    const healed = await trySelfHeal({
                        blueprint,
                        task,
                        implementation,
                        checks,
                        memory
                    });

                    if (healed.ok) {
                        log("🩹 self-heal fixed verify/test failure");
                        checks = { ok: true, verifyResults: [], testResults: [] };
                    }
                }

                if (!checks.ok) {
                    restoreBackup(backups);
                    rollbackHard();

                    const failureReason = `verify/test failed\n${summarizeCommandFailures(checks.verifyResults)}\n${summarizeCommandFailures(checks.testResults)}`.trim();

                    memory.failed.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        goal: task.goal,
                        reason: failureReason,
                        signature: stableTaskSignature(task)
                    });

                    rememberFailure(memory, task, failureReason);

                    removeTaskFromBacklog(memory, task.id);
                    pushHistory(memory, {
                        type: "checks_failed",
                        id: task.id,
                        title: task.title
                    });

                    saveMemory(memory);
                    log("❌ verify/test failed");
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                const commitMessage =
                    (review.suggested_commit_message && String(review.suggested_commit_message).trim()) ||
                    task.commit_message ||
                    `chore: ${task.title}`;

                const committed = commitAll(commitMessage);

                if (committed) {
                    memory.metrics.commits++;
                    log("✅ committed:", commitMessage);

                    if (CONFIG.AUTO_PUSH) {
                        pushBranch();
                        memory.metrics.pushes++;
                        log("🚀 pushed");
                    }
                } else {
                    log("ℹ️ nothing to commit");
                }

                memory.accepted.unshift({
                    at: new Date().toISOString(),
                    id: task.id,
                    title: task.title,
                    category: task.category,
                    priority: task.priority,
                    goal: task.goal,
                    commit_message: commitMessage,
                    signature: stableTaskSignature(task)
                });

                rememberSuccess(memory, task, commitMessage);

                removeTaskFromBacklog(memory, task.id);
                memory.metrics.lastSuccessAt = new Date().toISOString();

                pushHistory(memory, {
                    type: "task_completed",
                    id: task.id,
                    title: task.title,
                    commit: commitMessage
                });

                saveMemory(memory);

            } catch (err) {
                memory = loadMemory();
                memory.metrics.lastErrorAt = new Date().toISOString();

                memory.failed.unshift({
                    at: new Date().toISOString(),
                    reason: err.message || String(err),
                    signature: stableTextSignature(err.message || String(err))
                });

                pushHistory(memory, {
                    type: "fatal_iteration_error",
                    reason: err.message || String(err)
                });

                saveMemory(memory);
                log("💥 iteration fatal:", err.message || String(err));

                try {
                    rollbackHard();
                } catch { }
            }

            await sleep(CONFIG.LOOP_DELAY_MS);
        }

    } finally {
        releaseLock();
    }
}

main().catch((err) => {
    log("FATAL:", err.message || String(err));
    try {
        releaseLock();
    } catch { }
    process.exit(1);
});