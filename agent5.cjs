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

    REMOTE_NAME: process.env.REMOTE_NAME || "origin",
    AUTO_PUSH: String(process.env.AUTO_PUSH || "true").toLowerCase() === "true",
    AUTO_BRANCH: String(process.env.AUTO_BRANCH || "true").toLowerCase() === "true",
    BRANCH_PREFIX: process.env.BRANCH_PREFIX || "agent/autonomous",

    MAX_ITERATIONS: Number(process.env.MAX_ITERATIONS || 999999),
    LOOP_DELAY_MS: Number(process.env.LOOP_DELAY_MS || 5000),
    MAX_FILES_PER_TASK: Number(process.env.MAX_FILES_PER_TASK || 6),
    MAX_CONTEXT_FILES: Number(process.env.MAX_CONTEXT_FILES || 20),
    MAX_FILE_CHARS: Number(process.env.MAX_FILE_CHARS || 14000),
    MAX_BLUEPRINT_CHARS: Number(process.env.MAX_BLUEPRINT_CHARS || 30000),
    MAX_BACKLOG_ITEMS: Number(process.env.MAX_BACKLOG_ITEMS || 20),
    MAX_HISTORY_ITEMS: Number(process.env.MAX_HISTORY_ITEMS || 200),

    ALLOW_NEW_FILES: String(process.env.ALLOW_NEW_FILES || "true").toLowerCase() === "true",
    ALLOW_DELETE_FILES: String(process.env.ALLOW_DELETE_FILES || "false").toLowerCase() === "true",
    STRICT_CLEAN_START: String(process.env.STRICT_CLEAN_START || "true").toLowerCase() === "true",
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
        'agent5.cjs'
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

function rel(abs) {
    return normalizeSlashes(path.relative(CONFIG.REPO_PATH, abs));
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

function parseJsonLoose(raw) {
    if (!raw) return null;

    let cleaned = stripCodeFence(raw);

    // 🔥 remove backticks perigosos
    cleaned = cleaned.replace(/`/g, '"');

    try {
        return JSON.parse(cleaned);
    } catch { }

    // fallback agressivo
    try {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0].replace(/`/g, '"'));
        }
    } catch { }

    return null;
}

function nowDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
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

/* ========================= SHELL / GIT ========================= */

function run(command, options = {}) {
    const result = spawnSync(command, {
        cwd: options.cwd || CONFIG.REPO_PATH,
        shell: true,
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 25
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

function workingTreeDirty() {
    return Boolean(git("status --porcelain", true).trim());
}

function currentBranch() {
    return git("rev-parse --abbrev-ref HEAD", true) || "unknown";
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
    const rels = files.map(rel).sort();

    const importantNames = [
        "package.json",
        "README.md",
        CONFIG.BLUEPRINT_FILE,
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
        if (found) importantFiles.push(found);
    }

    const codeFiles = files.filter((f) => {
        const r = rel(f);
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

    if (exists(packageJsonPath)) {
        try {
            const pkg = JSON.parse(safeRead(packageJsonPath, "{}"));
            packageSummary = JSON.stringify({
                name: pkg.name || null,
                version: pkg.version || null,
                type: pkg.type || null,
                scripts: pkg.scripts || {},
                dependencies: pkg.dependencies ? Object.keys(pkg.dependencies).slice(0, 60) : [],
                devDependencies: pkg.devDependencies ? Object.keys(pkg.devDependencies).slice(0, 60) : []
            }, null, 2);
        } catch {
            packageSummary = truncate(safeRead(packageJsonPath, ""));
        }
    }

    const fileContexts = index.importantFiles.map((f) => readFileContext(f)).join("\n\n");

    return {
        packageSummary,
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
            stdout: truncate(res.stdout, 20000),
            stderr: truncate(res.stderr, 20000)
        });

        if (!res.ok) break;
    }

    return outputs;
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
The blueprint below defines the product, architecture, business goals, and expected evolution.
You must obey it.

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

RECENT ACCEPTED TASKS:
${JSON.stringify(memory.accepted.slice(0, 10), null, 2)}

RECENT FAILED TASKS:
${JSON.stringify(memory.failed.slice(0, 10), null, 2)}

Your job:
1. Understand the blueprint
2. Generate a prioritized backlog of safe and realistic improvements
3. Focus on categories:
   - security
   - performance
   - product
   - bugfix
   - refactor
   - dx
   - tests
4. NEVER invent files that do not exist unless a new file is clearly justified
5. Only propose small, incremental, shippable tasks
6. Max ${CONFIG.MAX_FILES_PER_TASK} files per task

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

function buildExecutorPrompt({ blueprint, task, fileContexts, commands }) {
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

Instructions:
- Implement ONLY this task
- Keep scope small and safe
- Respect the blueprint
- Do not modify unrelated files
- Use exact relative repo paths
- Existing files must be fully rewritten in output
- New files are allowed only if justified by the task
- Prefer robust production-ready code
- If useful, include tests
- Never include markdown fences

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
${truncate(diff, 40000)}

Approve only if:
- it matches the blueprint
- it matches the task
- files are relevant
- risk is low
- code is coherent
- no obvious breakage
- no secrets or destructive operations
- no unrelated changes

Return ONLY valid JSON:
{
  "verdict": "APPROVED|REJECTED",
  "reason": "short reason",
  "warnings": ["warning 1"],
  "suggested_commit_message": "optional improved commit message"
}
`.trim();
}

/* ========================= TASK / PLAN VALIDATION ========================= */

function validateBacklog(backlog, repoIndex) {
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

        const files = Array.isArray(task.files) ? task.files.filter(Boolean) : [];
        const validFiles = files.filter((f) => realFiles.has(normalizeSlashes(f)));

        if (files.length > 0 && validFiles.length === 0 && !task.new_files_allowed) {
            continue;
        }

        cleaned.push({
            id: String(task.id),
            title: String(task.title),
            category: String(task.category),
            priority: String(task.priority || "medium"),
            goal: String(task.goal),
            why: String(task.why || ""),
            files: validFiles.slice(0, CONFIG.MAX_FILES_PER_TASK),
            new_files_allowed: Boolean(task.new_files_allowed),
            commit_message: String(task.commit_message || `chore: ${task.title}`)
        });
    }

    backlog.tasks = cleaned;
    return backlog;
}

function scoreTask(task) {
    const categoryScore = {
        security: 100,
        bugfix: 90,
        performance: 80,
        tests: 70,
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

function pickNextTask(memory) {
    const backlog = Array.isArray(memory.backlog) ? memory.backlog : [];
    if (backlog.length === 0) return null;

    const failedGoals = new Set(
        memory.failed.slice(0, 20).map((item) => String(item?.goal || item?.title || ""))
    );

    const sorted = [...backlog]
        .filter((task) => !failedGoals.has(task.goal))
        .sort((a, b) => scoreTask(b) - scoreTask(a));

    return sorted[0] || backlog[0] || null;
}

function removeTaskFromBacklog(memory, taskId) {
    memory.backlog = (memory.backlog || []).filter((t) => t.id !== taskId);
}

/* ========================= FILE APPLICATION ========================= */

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

        if (f.action === "create" && !CONFIG.ALLOW_NEW_FILES && !task.new_files_allowed) {
            throw new Error(`Criação de arquivo não permitida: ${f.path}`);
        }
    }

    if (impl.delete_files.length > 0 && !CONFIG.ALLOW_DELETE_FILES) {
        throw new Error("Delete de arquivos bloqueado pela configuração.");
    }

    return impl;
}

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

        if (file.action === "create") {
            if (!CONFIG.ALLOW_NEW_FILES && !exists(full)) {
                throw new Error(`Criação de arquivo bloqueada: ${file.path}`);
            }
        }

        safeWrite(full, file.content);
        touched.push(normalizeSlashes(file.path));
    }

    for (const delPath of impl.delete_files || []) {
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

    return validateBacklog(parsed, repoIndex);
}

async function generateImplementation(task, blueprint) {
    const fileContexts = collectContextsForTask(task);
    const commands = detectProjectCommands();

    const prompt = buildExecutorPrompt({
        blueprint,
        task,
        fileContexts,
        commands
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
                    log("⏸️ no task available, regenerating backlog on next loop");
                    memory.backlog = [];
                    saveMemory(memory);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                log(`🎯 task: [${task.category}/${task.priority}] ${task.title}`);
                log("📌 goal:", task.goal);

                memory.metrics.tasksExecuted++;
                saveMemory(memory);

                const implementation = await generateImplementation(task, blueprint);

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

                    memory.failed.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        goal: task.goal,
                        reason: review.reason || "review rejected"
                    });

                    removeTaskFromBacklog(memory, task.id);
                    pushHistory(memory, {
                        type: "task_rejected",
                        id: task.id,
                        title: task.title,
                        reason: review.reason || "review rejected"
                    });

                    saveMemory(memory);
                    log("❌ rejected:", review.reason || "sem motivo");
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                memory.metrics.approvals++;
                saveMemory(memory);

                const checks = runVerification(memory);

                if (!checks.ok) {
                    restoreBackup(backups);
                    rollbackHard();

                    memory.failed.unshift({
                        at: new Date().toISOString(),
                        id: task.id,
                        title: task.title,
                        goal: task.goal,
                        reason: "verify/test failed",
                        verifyResults: checks.verifyResults,
                        testResults: checks.testResults
                    });

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
                    commit_message: commitMessage
                });

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
                    reason: err.message || String(err)
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