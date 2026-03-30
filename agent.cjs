#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { spawnSync } = require("child_process");

const CONFIG = {
    REPO_PATH: process.env.REPO_PATH || process.cwd(),
    BLUEPRINT_FILE: process.env.BLUEPRINT_FILE || "BLUEPRINT.md",
    MAIN_EVOLUTION_DOC:
        process.env.MAIN_EVOLUTION_DOC || process.env.BLUEPRINT_FILE || "BLUEPRINT.md",
    EVOLUTION_SECTION_TITLE:
        process.env.EVOLUTION_SECTION_TITLE || "## Auto Evolution Log",
    MAX_EVOLUTION_ENTRIES: Number(process.env.MAX_EVOLUTION_ENTRIES || 200),

    OLLAMA_URL: process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
    MODEL_PLANNER: process.env.MODEL_PLANNER || "qwen2.5-coder:7b",
    MODEL_EXECUTOR: process.env.MODEL_EXECUTOR || "qwen2.5-coder:7b",
    MODEL_REVIEWER: process.env.MODEL_REVIEWER || "qwen2.5-coder:7b",
    MODEL_FIXER: process.env.MODEL_FIXER || "qwen2.5-coder:7b",
    MODEL_JSON_REPAIR:
        process.env.MODEL_JSON_REPAIR || process.env.MODEL_FIXER || "qwen2.5-coder:7b",

    REMOTE_NAME: process.env.REMOTE_NAME || "origin",
    AUTO_PUSH: String(process.env.AUTO_PUSH || "true").toLowerCase() === "true",
    AUTO_BRANCH: String(process.env.AUTO_BRANCH || "true").toLowerCase() === "true",
    BRANCH_PREFIX: process.env.BRANCH_PREFIX || "agent/autonomous/test",

    MAX_ITERATIONS: Number(process.env.MAX_ITERATIONS || 999999999),
    LOOP_DELAY_MS: Number(process.env.LOOP_DELAY_MS || 5000),

    MAX_FILES_PER_TASK: Number(process.env.MAX_FILES_PER_TASK || 12),
    MAX_CONTEXT_FILES: Number(process.env.MAX_CONTEXT_FILES || 40),
    MAX_FILE_CHARS: Number(process.env.MAX_FILE_CHARS || 20000),
    MAX_BLUEPRINT_CHARS: Number(process.env.MAX_BLUEPRINT_CHARS || 45000),
    MAX_BACKLOG_ITEMS: Number(process.env.MAX_BACKLOG_ITEMS || 20),
    MAX_HISTORY_ITEMS: Number(process.env.MAX_HISTORY_ITEMS || 500),

    MAX_REPEAT_FAILURES_PER_TASK: Number(process.env.MAX_REPEAT_FAILURES_PER_TASK || 4),
    MAX_REPLAN_PER_TASK: Number(process.env.MAX_REPLAN_PER_TASK || 2),
    MAX_HOT_FILES: Number(process.env.MAX_HOT_FILES || 20),
    HOT_FILE_FAILURE_THRESHOLD: Number(process.env.HOT_FILE_FAILURE_THRESHOLD || 3),
    EVOLUTION_DOC_CONTEXT_CHARS: Number(process.env.EVOLUTION_DOC_CONTEXT_CHARS || 18000),
    MAX_SELF_HEAL_ATTEMPTS: Number(process.env.MAX_SELF_HEAL_ATTEMPTS || 6),
    MAX_PARSE_RETRIES: Number(process.env.MAX_PARSE_RETRIES || 4),
    MAX_JSON_REPAIR_ATTEMPTS: Number(process.env.MAX_JSON_REPAIR_ATTEMPTS || 2),
    MAX_IDENTICAL_ERROR_RETRIES: Number(process.env.MAX_IDENTICAL_ERROR_RETRIES || 2),

    ALLOW_NEW_FILES: String(process.env.ALLOW_NEW_FILES || "true").toLowerCase() === "true",
    ALLOW_DELETE_FILES: String(process.env.ALLOW_DELETE_FILES || "false").toLowerCase() === "true",
    STRICT_CLEAN_START: String(process.env.STRICT_CLEAN_START || "true").toLowerCase() === "true",
    IGNORE_UNTRACKED_PROTECTED_FILES_ONLY:
        String(process.env.IGNORE_UNTRACKED_PROTECTED_FILES_ONLY || "true").toLowerCase() ===
        "true",
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
        "temp",
    ],

    IGNORE_FILES: [
        ".agent-lock",
        ".agent-memory.json",
        ".agent-snapshot.json",
        "tmp.patch",
        "agent3.cjs",
        "agent4.cjs",
        "agent5.cjs",
        "agent6.cjs",
        "agent7.cjs",
        "agent7-stable.cjs",
    ],

    PROTECTED_FILES: [
        ".agent-lock",
        ".agent-memory.json",
        ".agent-snapshot.json",
        "tmp.patch",
        "agent3.cjs",
        "agent4.cjs",
        "agent5.cjs",
        "agent6.cjs",
        "agent7.cjs",
        "agent7-stable.cjs",
        "BLUEPRINT.md",
    ],

    BLOCKED_FILE_NAMES: [
        ".env",
        ".env.example",
        ".env.local",
        ".env.development",
        ".env.test",
        ".env.production",
        ".npmrc",
        ".yarnrc",
        ".pnpmrc",
    ],

    SPECIAL_ALLOWED_FILES: [
        ".gitignore",
        ".eslintrc",
        ".eslintrc.js",
        ".eslintrc.cjs",
        ".prettierrc",
        ".prettierrc.js",
        ".prettierrc.cjs",
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
        ".html",
    ],

    FORBIDDEN_TECH_KEYWORDS: [
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
        "graphql",
    ],
};

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
    return String(p || "").replace(/\\/g, "/");
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
    return [...new Set(arr.filter(Boolean))];
}

function stripCodeFence(text) {
    return String(text || "")
        .replace(/^```(?:json|javascript|js|txt)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function sanitizeOneLine(text, max = 220) {
    return String(text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

function listToBullets(items, fallback = "- none") {
    const cleaned = unique((items || []).map((item) => sanitizeOneLine(item, 260)).filter(Boolean));
    if (!cleaned.length) return fallback;
    return cleaned.map((item) => `- ${item}`).join("\n");
}

function isIgnoredDir(name) {
    return CONFIG.IGNORE_DIRS.includes(name);
}

function isIgnoredFile(name) {
    return CONFIG.IGNORE_FILES.includes(name);
}

function basenameNormalized(filePath) {
    return path.basename(normalizeSlashes(filePath)).toLowerCase();
}

function isBlockedFileName(filePath) {
    const base = basenameNormalized(filePath);
    return CONFIG.BLOCKED_FILE_NAMES.includes(base);
}

function isSpecialAllowedFile(filePath) {
    const base = basenameNormalized(filePath);
    return CONFIG.SPECIAL_ALLOWED_FILES.includes(base);
}

function hasAllowedExtension(filePath) {
    const lower = normalizeSlashes(filePath).toLowerCase();
    if (isSpecialAllowedFile(lower)) return true;
    return CONFIG.ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function classifyFileEligibility(filePath) {
    const normalized = normalizeSlashes(filePath);
    const base = basenameNormalized(normalized);

    if (!normalized) {
        return { allowed: false, reason: "empty_path", fatal: false };
    }

    if (isProtectedFile(normalized)) {
        return { allowed: false, reason: `protected:${base}`, fatal: true };
    }

    if (isBlockedFileName(normalized)) {
        return { allowed: false, reason: `blocked_name:${base}`, fatal: false };
    }

    if (!hasAllowedExtension(normalized)) {
        return { allowed: false, reason: `blocked_extension:${base}`, fatal: false };
    }

    return { allowed: true, reason: "allowed", fatal: false };
}

function fileLooksText(p) {
    try {
        const buf = fs.readFileSync(p);
        const len = Math.min(buf.length, 512);
        for (let i = 0; i < len; i += 1) {
            if (buf[i] === 0) return false;
        }
        return true;
    } catch {
        return false;
    }
}

function isProtectedFile(filePath) {
    const normalized = normalizeSlashes(filePath).toLowerCase();
    return CONFIG.PROTECTED_FILES.some((p) => normalized.endsWith(String(p).toLowerCase()));
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
        files: Array.isArray(task?.files) ? [...task.files].sort() : [],
    };
    return sha1(JSON.stringify(payload));
}

function stableTextSignature(text) {
    return sha1(String(text || "").trim().toLowerCase());
}

function sanitizeModelOutput(raw) {
    if (!raw) return "";
    let cleaned = stripCodeFence(raw).trim();
    cleaned = cleaned.replace(/^\uFEFF/, "");
    cleaned = cleaned.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    return cleaned;
}

function parseJsonSafe(raw) {
    if (!raw) return null;

    try {
        let cleaned = sanitizeModelOutput(raw)
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        try {
            return JSON.parse(cleaned);
        } catch { }

        const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!match) return null;

        let candidate = match[0];
        candidate = candidate.replace(/,\s*([}\]])/g, "$1");
        candidate = candidate.replace(/:\s*`([\s\S]*?)`(?=\s*[,}])/g, (_, c) => {
            return ": " + JSON.stringify(c);
        });

        try {
            return JSON.parse(candidate);
        } catch {
            return null;
        }
    } catch {
        return null;
    }
}

async function askModel(model, prompt) {
    const response = await axios.post(
        CONFIG.OLLAMA_URL,
        { model, prompt, stream: false },
        { timeout: 1000 * 60 * 10 }
    );
    return response.data.response || "";
}

async function repairJsonWithModel(model, raw, label) {
    const prompt = `You are a JSON repair engine.\n\nTASK:\nRepair the following broken JSON so it becomes directly parsable by JSON.parse.\n\nRULES:\n- Return ONLY valid JSON\n- No markdown\n- No explanation\n- Keep the original structure and intent\n- Escape all strings correctly\n- Preserve file contents exactly as much as possible\n\nBROKEN INPUT:\n${truncate(raw, 40000)}`;

    const repairedRaw = await askModel(model, prompt);
    const parsed = parseJsonSafe(repairedRaw);

    if (parsed) {
        log(`🧩 JSON repaired for ${label}`);
        return parsed;
    }

    return null;
}

function isValidBacklog(backlog) {
    return Boolean(backlog && typeof backlog === "object" && Array.isArray(backlog.tasks));
}

function isValidImplementation(impl) {
    return Boolean(
        impl &&
        typeof impl === "object" &&
        Array.isArray(impl.files) &&
        impl.files.every((f) => f && typeof f.path === "string" && typeof f.content === "string")
    );
}

function isValidReview(review) {
    return Boolean(review && typeof review === "object" && typeof review.verdict === "string");
}

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
        identicalFailureBursts: {},
        learned: {
            successfulTaskSignatures: [],
            failedTaskSignatures: [],
            successfulCommitMessages: [],
            forbiddenKeywordsObserved: [],
            lintPatterns: [],
            buildPatterns: [],
            testPatterns: [],
            fileFailureStats: {},
            taskReplanStats: {},
            nextOpportunityPatterns: [],
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
            replans: 0,
            blueprintUpdates: 0,
            lastSuccessAt: null,
            lastErrorAt: null,
        },
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
        identicalFailureBursts:
            m.identicalFailureBursts && typeof m.identicalFailureBursts === "object"
                ? m.identicalFailureBursts
                : {},
        learned: {
            ...base.learned,
            ...(m.learned || {}),
            successfulTaskSignatures: Array.isArray(m?.learned?.successfulTaskSignatures)
                ? m.learned.successfulTaskSignatures
                : [],
            failedTaskSignatures: Array.isArray(m?.learned?.failedTaskSignatures)
                ? m.learned.failedTaskSignatures
                : [],
            successfulCommitMessages: Array.isArray(m?.learned?.successfulCommitMessages)
                ? m.learned.successfulCommitMessages
                : [],
            forbiddenKeywordsObserved: Array.isArray(m?.learned?.forbiddenKeywordsObserved)
                ? m.learned.forbiddenKeywordsObserved
                : [],
            lintPatterns: Array.isArray(m?.learned?.lintPatterns) ? m.learned.lintPatterns : [],
            buildPatterns: Array.isArray(m?.learned?.buildPatterns) ? m.learned.buildPatterns : [],
            testPatterns: Array.isArray(m?.learned?.testPatterns) ? m.learned.testPatterns : [],
            fileFailureStats:
                m?.learned?.fileFailureStats && typeof m.learned.fileFailureStats === "object"
                    ? m.learned.fileFailureStats
                    : {},
            taskReplanStats:
                m?.learned?.taskReplanStats && typeof m.learned.taskReplanStats === "object"
                    ? m.learned.taskReplanStats
                    : {},
            nextOpportunityPatterns: Array.isArray(m?.learned?.nextOpportunityPatterns)
                ? m.learned.nextOpportunityPatterns
                : [],
        },
        metrics: {
            ...base.metrics,
            ...(m.metrics || {}),
        },
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
    memory.history.unshift({ at: new Date().toISOString(), ...item });
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

    delete memory.identicalFailureBursts[signature];
}

function rememberFailure(memory, task, reason) {
    const signature = stableTaskSignature(task);
    if (!memory.learned.failedTaskSignatures.includes(signature)) {
        memory.learned.failedTaskSignatures.unshift(signature);
    }
    memory.learned.failedTaskSignatures = memory.learned.failedTaskSignatures.slice(0, 200);

    const low = String(reason || "").toLowerCase();
    if (low.includes("lint")) {
        memory.learned.lintPatterns.unshift(reason);
        memory.learned.lintPatterns = memory.learned.lintPatterns.slice(0, 50);
    } else if (low.includes("build") || low.includes("typecheck") || low.includes("typescript")) {
        memory.learned.buildPatterns.unshift(reason);
        memory.learned.buildPatterns = memory.learned.buildPatterns.slice(0, 50);
    } else if (low.includes("test")) {
        memory.learned.testPatterns.unshift(reason);
        memory.learned.testPatterns = memory.learned.testPatterns.slice(0, 50);
    }
}

function rememberNextOpportunities(memory, opportunities) {
    const next = unique((opportunities || []).map((item) => sanitizeOneLine(item, 220)).filter(Boolean));
    memory.learned.nextOpportunityPatterns = unique([
        ...next,
        ...(memory.learned.nextOpportunityPatterns || []),
    ]).slice(0, 100);
}

function incrementTaskReplan(memory, task) {
    const signature = stableTaskSignature(task);
    const current = Number(memory.learned.taskReplanStats?.[signature] || 0);
    memory.learned.taskReplanStats[signature] = current + 1;
    return memory.learned.taskReplanStats[signature];
}

function getTaskReplanCount(memory, task) {
    const signature = stableTaskSignature(task);
    return Number(memory.learned.taskReplanStats?.[signature] || 0);
}

function rememberFileFailures(memory, files, reason) {
    const stats = memory.learned.fileFailureStats || {};
    const cleanFiles = unique((files || []).map(normalizeSlashes).filter(Boolean).filter((file) => !isProtectedFile(file)));

    for (const file of cleanFiles) {
        const current = stats[file] && typeof stats[file] === "object"
            ? stats[file]
            : { count: 0, lastReason: "", lastAt: null };

        stats[file] = {
            count: Number(current.count || 0) + 1,
            lastReason: sanitizeOneLine(reason || "", 220),
            lastAt: new Date().toISOString(),
        };
    }

    const sortedEntries = Object.entries(stats)
        .sort((a, b) => Number(b[1]?.count || 0) - Number(a[1]?.count || 0))
        .slice(0, CONFIG.MAX_HOT_FILES);

    memory.learned.fileFailureStats = Object.fromEntries(sortedEntries);
}

function getHotFiles(memory) {
    return Object.entries(memory.learned.fileFailureStats || {})
        .filter(([, meta]) => Number(meta?.count || 0) >= CONFIG.HOT_FILE_FAILURE_THRESHOLD)
        .sort((a, b) => Number(b[1]?.count || 0) - Number(a[1]?.count || 0))
        .map(([file]) => file)
        .slice(0, CONFIG.MAX_HOT_FILES);
}

function collectFailureFiles(task, reason, implementation) {
    return unique([
        ...((task && Array.isArray(task.files)) ? task.files : []),
        ...extractRelevantFilesFromErrors(reason || ""),
        ...((implementation && Array.isArray(implementation.files)) ? implementation.files.map((item) => item.path) : []),
    ]).filter(Boolean);
}

function run(command, options = {}) {
    const result = spawnSync(command, {
        cwd: options.cwd || CONFIG.REPO_PATH,
        shell: true,
        encoding: "utf8",
        stdio: "pipe",
        maxBuffer: 1024 * 1024 * 100,
    });

    return {
        ok: result.status === 0,
        code: result.status,
        stdout: result.stdout || "",
        stderr: result.stderr || "",
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
    const backup = new Map();
    for (const p of CONFIG.PROTECTED_FILES) {
        const full = abs(p);
        if (exists(full)) backup.set(full, safeRead(full, ""));
    }

    const mainDoc = abs(CONFIG.MAIN_EVOLUTION_DOC);
    if (exists(mainDoc)) backup.set(mainDoc, safeRead(mainDoc, ""));

    git("reset --hard", true);
    git("clean -fd", true);

    for (const [full, content] of backup.entries()) {
        try {
            safeWrite(full, content);
        } catch (e) {
            log("⚠️ falha ao restaurar backup:", full, e.message);
        }
    }
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
        if (isUntracked && isProtectedFile(candidate)) continue;
        return true;
    }

    return false;
}

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
        if (isBlockedFileName(entry.name)) continue;
        if (!hasAllowedExtension(entry.name) && !isSpecialAllowedFile(entry.name)) continue;
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
        "vite.config.ts",
        "vite.config.js",
        "next.config.js",
        "next.config.mjs",
        "nest-cli.json",
        "docker-compose.yml",
        "docker-compose.yaml",
        "prisma/schema.prisma",
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
        repoHash: sha1(rels.join("\n")),
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
        hash: sha1(blueprint),
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
                ...Object.keys(pkg.devDependencies || {}),
            ];

            packageSummary = JSON.stringify(
                {
                    name: pkg.name || null,
                    version: pkg.version || null,
                    type: pkg.type || null,
                    scripts: pkg.scripts || {},
                    dependencies: Object.keys(pkg.dependencies || {}).slice(0, 100),
                    devDependencies: Object.keys(pkg.devDependencies || {}).slice(0, 100),
                },
                null,
                2
            );
        } catch {
            packageSummary = truncate(safeRead(packageJsonPath, ""));
        }
    }

    const fileContexts = index.importantFiles.map((f) => readFileContext(f)).join("\n\n");
    const evolutionDocPath = abs(CONFIG.MAIN_EVOLUTION_DOC);
    const evolutionDocSummary = exists(evolutionDocPath)
        ? truncate(safeRead(evolutionDocPath, ""), CONFIG.EVOLUTION_DOC_CONTEXT_CHARS)
        : "";

    return {
        packageSummary,
        dependencySummary,
        fileList: index.rels.slice(0, 1500).join("\n"),
        fileContexts,
        evolutionDocSummary,
    };
}

function collectFileContents(paths) {
    return unique(paths || [])
        .slice(0, CONFIG.MAX_CONTEXT_FILES)
        .map((p) => {
            const full = abs(p);
            const content = exists(full) ? safeRead(full, "") : "";
            return `FILE: ${p}\n-----\n${truncate(content, CONFIG.MAX_FILE_CHARS)}\n`;
        })
        .join("\n\n");
}

function detectProjectCommands() {
    const pkgPath = path.join(CONFIG.REPO_PATH, "package.json");
    const result = { verify: [], test: [] };
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
            stderr: truncate(res.stderr, 30000),
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
        "STDOUT:",
        failed.stdout || "(empty)",
        "STDERR:",
        failed.stderr || "(empty)",
    ].join("\n");
}

function extractRelevantFilesFromErrors(text) {
    if (!text) return [];
    const matches =
        String(text).match(/[A-Za-z0-9_./\\-]+\.(tsx|ts|jsx|js|json|css|scss|md|yml|yaml)/g) || [];
    const normalized = matches.map(normalizeSlashes).filter((p) => !isProtectedFile(p));
    return unique(normalized);
}

function summarizeVerificationResults(verifyResults, testResults) {
    return [summarizeCommandFailures(verifyResults), summarizeCommandFailures(testResults)]
        .filter(Boolean)
        .join("\n\n");
}

function mergeImplementations(baseImpl, nextImpl) {
    const baseFiles = Array.isArray(baseImpl?.files) ? baseImpl.files : [];
    const nextFiles = Array.isArray(nextImpl?.files) ? nextImpl.files : [];
    const fileMap = new Map();

    for (const file of [...baseFiles, ...nextFiles]) {
        if (!file || !file.path) continue;
        fileMap.set(normalizeSlashes(file.path), {
            path: normalizeSlashes(file.path),
            action: file.action || (exists(abs(file.path)) ? "update" : "create"),
            content: String(file.content || ""),
        });
    }

    return {
        summary: sanitizeOneLine(nextImpl?.summary || baseImpl?.summary || "implementation updated", 320),
        files: [...fileMap.values()],
        delete_files: unique([
            ...(Array.isArray(baseImpl?.delete_files) ? baseImpl.delete_files : []),
            ...(Array.isArray(nextImpl?.delete_files) ? nextImpl.delete_files : []),
        ].map(normalizeSlashes)),
        notes: unique([
            ...(Array.isArray(baseImpl?.notes) ? baseImpl.notes : []),
            ...(Array.isArray(nextImpl?.notes) ? nextImpl.notes : []),
        ]),
    };
}

function deriveNextOpportunities({ task, implementation, review }) {
    const touchedFiles = unique((implementation?.files || []).map((item) => normalizeSlashes(item.path))).slice(0, 6);
    const opportunities = [];

    if (task?.category !== "tests" && touchedFiles.length) {
        opportunities.push(`Add or expand automated tests for: ${touchedFiles.join(", ")}`);
    }

    if (task?.category !== "dx" && touchedFiles.length) {
        opportunities.push(`Improve developer experience around changed modules: ${touchedFiles.join(", ")}`);
    }

    if ((review?.warnings || []).length) {
        opportunities.push(`Resolve remaining reviewer warnings related to ${sanitizeOneLine(task?.title || "this task", 120)}`);
    }

    opportunities.push(`Monitor regressions after ${sanitizeOneLine(task?.title || "recent delivery", 120)} and harden validation where needed`);
    return unique(opportunities).slice(0, 4);
}

function buildEvolutionEntry({ task, implementation, review, commitMessage, nextOpportunities }) {
    const touchedFiles = implementation?.files?.map((file) => file.path) || [];
    const deletedFiles = implementation?.delete_files || [];
    const notes = implementation?.notes || [];
    const warnings = review?.warnings || [];

    return [
        `### ${new Date().toISOString()} | ${sanitizeOneLine(task.title, 160)}`,
        `- category: ${sanitizeOneLine(task.category, 40)}`,
        `- priority: ${sanitizeOneLine(task.priority, 20)}`,
        `- goal: ${sanitizeOneLine(task.goal, 300)}`,
        `- commit: ${sanitizeOneLine(commitMessage || task.commit_message || "", 220)}`,
        `- files changed: ${touchedFiles.length ? touchedFiles.join(", ") : "none"}`,
        deletedFiles.length ? `- files deleted: ${deletedFiles.join(", ")}` : "- files deleted: none",
        `- implementation summary: ${sanitizeOneLine(implementation?.summary || "completed successfully", 320)}`,
        `- review reason: ${sanitizeOneLine(review?.reason || "approved", 220)}`,
        `- notes:\n${listToBullets(notes)}`,
        `- warnings:\n${listToBullets(warnings)}`,
        `- next opportunities:\n${listToBullets(nextOpportunities)}`,
    ].join("\n");
}

function trimEvolutionEntries(entries) {
    return entries.slice(0, CONFIG.MAX_EVOLUTION_ENTRIES);
}

function upsertEvolutionSection(originalContent, entry) {
    const marker = CONFIG.EVOLUTION_SECTION_TITLE;
    const text = String(originalContent || "").trimEnd();

    if (!text.includes(marker)) {
        return `${text}\n\n${marker}\n\n${entry}\n`;
    }

    const idx = text.indexOf(marker);
    const before = text.slice(0, idx + marker.length).trimEnd();
    const after = text.slice(idx + marker.length).trim();
    const blocks = after ? after.split(/\n(?=###\s)/g).map((chunk) => chunk.trim()).filter(Boolean) : [];
    const updated = trimEvolutionEntries([entry, ...blocks]).join("\n\n");
    return `${before}\n\n${updated}\n`;
}

function updateMainEvolutionDoc({ task, implementation, review, commitMessage, memory }) {
    const target = abs(CONFIG.MAIN_EVOLUTION_DOC);
    const previous = safeRead(target, "");
    const nextOpportunities = deriveNextOpportunities({ task, implementation, review });
    const entry = buildEvolutionEntry({ task, implementation, review, commitMessage, nextOpportunities });
    const next = upsertEvolutionSection(previous, entry);
    safeWrite(target, next);

    if (memory) {
        rememberNextOpportunities(memory, nextOpportunities);
        memory.metrics.blueprintUpdates = Number(memory.metrics.blueprintUpdates || 0) + 1;
    }

    return { path: rel(target), nextOpportunities };
}

function buildBacklogPlannerPrompt({ blueprint, snapshot, memory, branch }) {
    return `You are an autonomous principal software engineer evolving a real production system.\n\nSOURCE OF TRUTH:\nThe blueprint below defines the product, architecture, goals, and constraints.\nYou must obey it strictly.\n\nBLUEPRINT:\n${blueprint.content}\n\nCURRENT BRANCH:\n${branch}\n\nPACKAGE SUMMARY:\n${snapshot.packageSummary}\n\nKNOWN FILES:\n${snapshot.fileList}\n\nIMPORTANT FILE EXCERPTS:\n${snapshot.fileContexts}\n\nMAIN EVOLUTION DOCUMENT EXCERPT:\n${snapshot.evolutionDocSummary || "(empty)"}\n\nKNOWN DEPENDENCIES:\n${JSON.stringify(snapshot.dependencySummary.slice(0, 120), null, 2)}\n\nLEARNED SUCCESSES:\n${JSON.stringify(memory.accepted.slice(0, 10), null, 2)}\n\nLEARNED FAILURES:\n${JSON.stringify(memory.failed.slice(0, 10), null, 2)}\n\nPREVIOUS SUCCESSFUL TASK SIGNATURES:\n${JSON.stringify(memory.learned.successfulTaskSignatures.slice(0, 20), null, 2)}\n\nPREVIOUS FAILED TASK SIGNATURES:\n${JSON.stringify(memory.learned.failedTaskSignatures.slice(0, 20), null, 2)}\n\nHOT FILES WITH RECENT FAILURES:\n${JSON.stringify(getHotFiles(memory), null, 2)}\n\nLEARNED NEXT OPPORTUNITIES:\n${JSON.stringify((memory.learned.nextOpportunityPatterns || []).slice(0, 20), null, 2)}\n\nCRITICAL RULES:\n- Read the blueprint and continuously create useful tasks forever\n- Generate tasks in these categories whenever relevant: product, performance, security, optimization, bugfix, tests, refactor, dx\n- Prefer features that move the product forward, then hardening/performance/security\n- Propose ONLY improvements aligned with the existing system\n- DO NOT introduce new frameworks or platforms unless already present in dependencies or files\n- DO NOT introduce: ${CONFIG.FORBIDDEN_TECH_KEYWORDS.join(", ")}\n- NEVER suggest protected/internal files\n- NEVER suggest blocked env/config secret files such as .env or .env.example\n- Prefer improving existing modules, bugfixes, tests, validation, security hardening, performance, DX\n- Only propose small or medium shippable tasks\n- Max ${CONFIG.MAX_FILES_PER_TASK} files per task\n- Always include real file paths when possible\n- Consider previously completed tasks and the auto evolution log so the project keeps evolving instead of repeating itself\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "summary": "short summary of repo direction",\n  "tasks": [\n    {\n      "id": "task-short-id",\n      "title": "short title",\n      "category": "security|performance|product|optimization|bugfix|refactor|dx|tests",\n      "priority": "high|medium|low",\n      "goal": "what should be improved",\n      "why": "why this matters",\n      "files": ["real/path1", "real/path2"],\n      "new_files_allowed": true,\n      "commit_message": "feat/fix/chore/test/refactor/perf: concise message"\n    }\n  ]\n}`;
}

function buildExecutorPrompt({ blueprint, task, fileContexts, commands, memory }) {
    return `You are implementing one task in a production codebase.\n\nSOURCE OF TRUTH:\n${blueprint.content}\n\nTASK:\n${JSON.stringify(task, null, 2)}\n\nPROJECT COMMANDS:\n${JSON.stringify(commands, null, 2)}\n\nCURRENT FILES:\n${fileContexts}\n\nLEARNED FAILURES:\n${JSON.stringify(memory.failed.slice(0, 8), null, 2)}\n\nCRITICAL IMPLEMENTATION RULES:\n- Implement ONLY this task\n- Respect the blueprint and current stack\n- Keep scope safe but COMPLETE\n- Do not modify unrelated files\n- Do not modify .env, .env.example or protected files\n- Use exact relative repo paths\n- Existing files must be fully rewritten in output\n- New files only if task justifies it\n- Focus on delivering working code that passes lint, typecheck, build and tests\n- NEVER modify or access protected files\n- Never introduce forbidden technologies\n\nReturn ONLY valid JSON in this exact shape:\n{\n  "summary": "what changed",\n  "files": [\n    {\n      "path": "relative/path.ext",\n      "action": "update|create",\n      "content": "full file content"\n    }\n  ],\n  "delete_files": [],\n  "notes": ["important note 1", "important note 2"]\n}`;
}

function buildReviewerPrompt({ blueprint, task, implementation, diff }) {
    return `You are a strict senior reviewer.\n\nSOURCE OF TRUTH:\n${blueprint.content}\n\nTASK:\n${JSON.stringify(task, null, 2)}\n\nIMPLEMENTATION:\n${JSON.stringify(implementation, null, 2)}\n\nDIFF:\n${truncate(diff, 45000)}\n\nApprove only if:\n- it matches the blueprint\n- it matches the task\n- files are relevant\n- risk is acceptable\n- code is coherent\n- no obvious breakage\n- no secrets or destructive operations\n- no unrelated changes\n- no protected files are touched\n- no blocked config files like .env.example are touched\n- no new frameworks outside current stack\n\nReturn ONLY valid JSON:\n{\n  "verdict": "APPROVED|REJECTED",\n  "reason": "short reason",\n  "warnings": ["warning 1"],\n  "suggested_commit_message": "optional improved commit message"\n}`;
}

function buildSelfHealPrompt({ blueprint, task, implementation, failedSummary, currentFiles, commands }) {
    return `You are a senior engineer fixing a broken codebase.\n\nSOURCE OF TRUTH:\n${blueprint.content}\n\nTASK:\n${JSON.stringify(task, null, 2)}\n\nPREVIOUS IMPLEMENTATION:\n${JSON.stringify(implementation, null, 2)}\n\nPROJECT COMMANDS:\n${JSON.stringify(commands, null, 2)}\n\nFAILURE OUTPUT (VERY IMPORTANT):\n${failedSummary}\n\nCURRENT FILES AND ERROR CONTEXT:\n${currentFiles}\n\nCRITICAL RULES:\n- You MUST fix ALL errors until the project passes\n- Fix lint, type errors, build errors, import errors, path alias issues, runtime issues and tests\n- You can modify any file directly related to the failure\n- Keep changes minimal but COMPLETE\n- Do not introduce new frameworks\n- Do not touch protected files\n- Do not touch .env, .env.example or secret files\n- Prioritize actual delivery over partial changes\n\nRETURN ONLY VALID JSON:\n{\n  "summary": "what was fixed",\n  "files": [\n    {\n      "path": "relative/path.ext",\n      "action": "update|create",\n      "content": "full file content"\n    }\n  ],\n  "delete_files": [],\n  "notes": ["..."]\n}`;
}

function detectForbiddenKeywordsInTask(task) {
    const serialized = JSON.stringify(task).toLowerCase();
    return CONFIG.FORBIDDEN_TECH_KEYWORDS.filter((kw) => serialized.includes(kw));
}

function validateBacklog(backlog, repoIndex, memory) {
    if (!backlog || typeof backlog !== "object") throw new Error("Backlog inválido.");
    if (!Array.isArray(backlog.tasks)) throw new Error("Backlog sem tasks.");

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
            .filter((f) => !isBlockedFileName(f))
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
            commit_message: String(task.commit_message || `chore: ${task.title}`),
        };

        if (!normalizedTask.files.length && !normalizedTask.new_files_allowed) continue;
        cleaned.push(normalizedTask);
    }

    backlog.tasks = cleaned;
    return backlog;
}

function sanitizeImplementation(impl, task) {
    if (!impl || typeof impl !== "object") throw new Error("Implementação inválida.");
    if (!Array.isArray(impl.files)) impl.files = [];
    if (!Array.isArray(impl.delete_files)) impl.delete_files = [];
    if (!Array.isArray(impl.notes)) impl.notes = [];

    const skipped = [];
    const cleanedFiles = [];

    for (const f of impl.files) {
        if (!f || typeof f.path !== "string") {
            skipped.push({ path: "(unknown)", reason: "invalid_path", fatal: false });
            continue;
        }

        const eligibility = classifyFileEligibility(f.path);
        if (!eligibility.allowed) {
            skipped.push({ path: normalizeSlashes(f.path), reason: eligibility.reason, fatal: eligibility.fatal });
            if (eligibility.fatal) {
                const err = new Error(`Tentativa de alterar arquivo protegido: ${f.path}`);
                err.code = "FATAL_PROTECTED_FILE";
                throw err;
            }
            continue;
        }

        if (!["update", "create"].includes(f.action)) {
            skipped.push({ path: normalizeSlashes(f.path), reason: `invalid_action:${f.action}`, fatal: false });
            continue;
        }

        if (typeof f.content !== "string") {
            skipped.push({ path: normalizeSlashes(f.path), reason: "invalid_content", fatal: false });
            continue;
        }

        if (f.action === "create" && !CONFIG.ALLOW_NEW_FILES && !task.new_files_allowed) {
            skipped.push({ path: normalizeSlashes(f.path), reason: "create_not_allowed", fatal: false });
            continue;
        }

        cleanedFiles.push({
            path: normalizeSlashes(f.path),
            action: f.action,
            content: String(f.content),
        });
    }

    const cleanedDeletes = [];
    for (const delPath of impl.delete_files) {
        const eligibility = classifyFileEligibility(delPath);
        if (!eligibility.allowed || eligibility.fatal) {
            skipped.push({ path: normalizeSlashes(delPath), reason: `delete_${eligibility.reason}`, fatal: Boolean(eligibility.fatal) });
            continue;
        }
        cleanedDeletes.push(normalizeSlashes(delPath));
    }

    if (cleanedDeletes.length > 0 && !CONFIG.ALLOW_DELETE_FILES) {
        throw new Error("Delete de arquivos bloqueado pela configuração.");
    }

    impl.files = cleanedFiles;
    impl.delete_files = cleanedDeletes;

    if (skipped.length) {
        impl.notes.unshift(
            `Skipped files: ${skipped.map((item) => `${item.path} [${item.reason}]`).join(", ")}`
        );
    }

    if (impl.files.length === 0 && impl.delete_files.length === 0) {
        const err = new Error(
            `Implementação sanitizada ficou vazia. Ignorados: ${skipped.map((item) => `${item.path} [${item.reason}]`).join(", ")}`
        );
        err.code = skipped.some((item) => String(item.reason).startsWith("blocked_"))
            ? "NON_FATAL_INVALID_FILE_SELECTION"
            : "EMPTY_IMPLEMENTATION";
        throw err;
    }

    if (impl.files.length > CONFIG.MAX_FILES_PER_TASK + 8) {
        throw new Error("Implementação alterou arquivos demais.");
    }

    return { impl, skipped };
}

function scoreTask(task) {
    const categoryScore = {
        security: 100,
        bugfix: 95,
        performance: 90,
        optimization: 85,
        product: 80,
        tests: 75,
        refactor: 60,
        dx: 50,
    };

    const priorityScore = { high: 30, medium: 20, low: 10 };
    return (categoryScore[task.category] || 0) + (priorityScore[task.priority] || 0);
}

function countTaskFailures(memory, task) {
    const signature = stableTaskSignature(task);
    return memory.failed.filter((f) => f?.signature === signature).length;
}

function countIdenticalFailures(memory, task, errorSignature) {
    const signature = stableTaskSignature(task);
    const key = `${signature}:${errorSignature}`;
    return Number(memory.identicalFailureBursts[key] || 0);
}

function registerIdenticalFailure(memory, task, reason) {
    const signature = stableTaskSignature(task);
    const errorSignature = stableTextSignature(reason);
    const key = `${signature}:${errorSignature}`;
    const current = Number(memory.identicalFailureBursts[key] || 0) + 1;
    memory.identicalFailureBursts[key] = current;
    return { key, count: current, errorSignature };
}

function clearTaskFailureBursts(memory, task) {
    const signature = stableTaskSignature(task);
    for (const key of Object.keys(memory.identicalFailureBursts || {})) {
        if (key.startsWith(`${signature}:`)) delete memory.identicalFailureBursts[key];
    }
}

function wasTaskSuccessful(memory, task) {
    const signature = stableTaskSignature(task);
    return memory.learned.successfulTaskSignatures.includes(signature);
}

function pickNextTask(memory) {
    const backlog = Array.isArray(memory.backlog) ? memory.backlog : [];
    if (!backlog.length) return null;

    const hotFiles = new Set(getHotFiles(memory));
    const candidates = backlog
        .filter((task) => !wasTaskSuccessful(memory, task))
        .filter((task) => countTaskFailures(memory, task) < CONFIG.MAX_REPEAT_FAILURES_PER_TASK)
        .sort((a, b) => {
            const failDiff = countTaskFailures(memory, a) - countTaskFailures(memory, b);
            if (failDiff !== 0) return failDiff;

            const aHot = (a.files || []).filter((file) => hotFiles.has(file)).length;
            const bHot = (b.files || []).filter((file) => hotFiles.has(file)).length;
            if (aHot !== bHot) return aHot - bHot;

            return scoreTask(b) - scoreTask(a);
        });

    return candidates[0] || null;
}

function removeTaskFromBacklog(memory, taskId) {
    memory.backlog = (memory.backlog || []).filter((t) => t.id !== taskId);
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
        if (isProtectedFile(file.path)) {
            throw new Error(`Arquivo protegido bloqueado: ${file.path}`);
        }
        safeWrite(abs(file.path), file.content);
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
    return collectFileContents(paths);
}

function containsDangerousContent(value) {
    const text = JSON.stringify(value);
    const patterns = [
        /rm\s+-rf/gi,
        /DROP\s+TABLE/gi,
        /TRUNCATE\s+TABLE/gi,
        /-----BEGIN (?:RSA|OPENSSH|PRIVATE KEY)-----/g,
        /process\.env\.[A-Z0-9_]+\s*=\s*["'`]/g,
    ];
    return patterns.some((p) => p.test(text));
}

function ensureSafeStart() {
    if (!hasGitRepo()) throw new Error("Este diretório não é um repositório git.");
    if (CONFIG.STRICT_CLEAN_START && workingTreeDirty()) {
        throw new Error("Há alterações não commitadas. Limpe o repo antes de iniciar o agente.");
    }
}

async function askAndParseJson(model, prompt, label, validator = null) {
    let lastRaw = "";

    for (let i = 1; i <= CONFIG.MAX_PARSE_RETRIES; i += 1) {
        lastRaw = await askModel(model, prompt);
        let parsed = parseJsonSafe(lastRaw);

        if (!parsed) {
            for (let j = 1; j <= CONFIG.MAX_JSON_REPAIR_ATTEMPTS; j += 1) {
                parsed = await repairJsonWithModel(CONFIG.MODEL_JSON_REPAIR, lastRaw, label);
                if (parsed) break;
            }
        }

        if (parsed && (!validator || validator(parsed))) {
            return parsed;
        }

        log(`⚠️ falha ao parsear ${label}, tentativa ${i}/${CONFIG.MAX_PARSE_RETRIES}`);
        prompt += `\n\nIMPORTANT:\nReturn ONLY valid JSON.\nDo not use markdown.\nDo not include explanations.\nEnsure all strings are properly escaped.\nThe response must be directly parsable by JSON.parse.`;
    }

    throw new Error(`Falha ao parsear ${label}.\nRAW:\n${truncate(lastRaw, 8000)}`);
}

async function generateBacklog(memory, blueprint, repoIndex) {
    const snapshot = buildRepoSnapshot(repoIndex);
    const prompt = buildBacklogPlannerPrompt({ blueprint, snapshot, memory, branch: currentBranch() });
    const parsed = await askAndParseJson(CONFIG.MODEL_PLANNER, prompt, "backlog do planner", isValidBacklog);
    return validateBacklog(parsed, repoIndex, memory);
}

async function generateImplementation(task, blueprint, memory) {
    const fileContexts = collectContextsForTask(task);
    const commands = detectProjectCommands();
    const prompt = buildExecutorPrompt({ blueprint, task, fileContexts, commands, memory });
    const impl = await askAndParseJson(CONFIG.MODEL_EXECUTOR, prompt, "implementação", isValidImplementation);

    if (!isValidImplementation(impl)) {
        throw new Error("INVALID_IMPLEMENTATION_STRUCTURE");
    }

    const sanitized = sanitizeImplementation(impl, task);
    if (containsDangerousContent(sanitized.impl)) {
        throw new Error("Mudança bloqueada por conteúdo potencialmente perigoso.");
    }
    return sanitized;
}

async function reviewImplementation(task, blueprint, implementation) {
    const prompt = buildReviewerPrompt({ blueprint, task, implementation, diff: diffWorkingTree() });
    return askAndParseJson(CONFIG.MODEL_REVIEWER, prompt, "review", isValidReview);
}

function runVerification(memory) {
    const commands = detectProjectCommands();
    const verifyResults = runCommands(commands.verify, "verify");
    const verifyOk = verifyResults.every((x) => x.ok);
    if (verifyOk) memory.metrics.verifyPass += 1;
    else memory.metrics.verifyFail += 1;

    const testResults = runCommands(commands.test, "test");
    const testOk = testResults.every((x) => x.ok);
    if (testOk) memory.metrics.testPass += 1;
    else memory.metrics.testFail += 1;

    return { ok: verifyOk && testOk, verifyResults, testResults };
}

async function trySelfHeal({ blueprint, task, implementation, checks, memory }) {
    let failedSummary = summarizeVerificationResults(checks.verifyResults, checks.testResults);
    let currentImpl = implementation;
    const commands = detectProjectCommands();

    for (let attempt = 1; attempt <= CONFIG.MAX_SELF_HEAL_ATTEMPTS; attempt += 1) {
        log(`🩹 self-heal attempt ${attempt}/${CONFIG.MAX_SELF_HEAL_ATTEMPTS}`);

        const errorFiles = extractRelevantFilesFromErrors(failedSummary);
        const currentFiles = collectFileContents(unique([...(task.files || []), ...errorFiles]).slice(0, CONFIG.MAX_CONTEXT_FILES));

        const prompt = buildSelfHealPrompt({
            blueprint,
            task,
            implementation: currentImpl,
            failedSummary,
            currentFiles,
            commands,
        });

        let fixedImpl;
        try {
            fixedImpl = await askAndParseJson(CONFIG.MODEL_FIXER, prompt, "self-heal", isValidImplementation);
        } catch (err) {
            debug("self-heal parse error:", err.message);
            continue;
        }

        try {
            const sanitized = sanitizeImplementation(fixedImpl, task);
            fixedImpl = sanitized.impl;
        } catch (err) {
            debug("self-heal sanitize error:", err.message);
            continue;
        }

        if (containsDangerousContent(fixedImpl)) continue;

        const touchedPaths = unique([
            ...fixedImpl.files.map((f) => normalizeSlashes(f.path)),
            ...(fixedImpl.delete_files || []).map((p) => normalizeSlashes(p)),
        ]);

        const backups = backupFiles(touchedPaths);

        try {
            applyImplementation(fixedImpl);
            const newChecks = runVerification(memory);

            if (newChecks.ok) {
                memory.metrics.selfHealSuccess += 1;
                return {
                    ok: true,
                    implementation: mergeImplementations(currentImpl, fixedImpl),
                    checks: newChecks,
                };
            }

            failedSummary = summarizeVerificationResults(newChecks.verifyResults, newChecks.testResults) || failedSummary;
            currentImpl = mergeImplementations(currentImpl, fixedImpl);
            log("⚠️ self-heal applied but ainda há erros; continuando a correção");
        } catch (err) {
            debug("self-heal apply error:", err.message);
            restoreBackup(backups);
            rollbackHard();
        }
    }

    memory.metrics.selfHealFail += 1;
    return { ok: false };
}

function shouldDropTaskAfterFailure(memory, task, errorMessage) {
    const low = String(errorMessage || "").toLowerCase();
    const identical = registerIdenticalFailure(memory, task, errorMessage);

    const structuralPatterns = [
        "non_fatal_invalid_file_selection",
        "implementação sanitizada ficou vazia",
        "extensão não permitida",
        "blocked_extension",
        "blocked_name:.env.example",
        "arquivo protegido",
    ];

    const isStructural = structuralPatterns.some((pattern) => low.includes(pattern));
    if (isStructural && identical.count >= CONFIG.MAX_IDENTICAL_ERROR_RETRIES) {
        return true;
    }

    if (countTaskFailures(memory, task) + 1 >= CONFIG.MAX_REPEAT_FAILURES_PER_TASK) {
        return true;
    }

    return false;
}

function registerFailureAndDecide(memory, task, reason, implementation) {
    const failureEntry = {
        at: new Date().toISOString(),
        title: task.title,
        category: task.category,
        reason: sanitizeOneLine(reason, 400),
        signature: stableTaskSignature(task),
        error_signature: stableTextSignature(reason),
    };

    memory.failed.unshift(failureEntry);
    memory.failed = memory.failed.slice(0, 300);
    memory.metrics.lastErrorAt = new Date().toISOString();

    rememberFailure(memory, task, reason);
    rememberFileFailures(memory, collectFailureFiles(task, reason, implementation), reason);

    const shouldDrop = shouldDropTaskAfterFailure(memory, task, reason);
    if (shouldDrop) {
        log("⛔ dropping task after repeated structural/identical failure");
        removeTaskFromBacklog(memory, task.id);
        clearTaskFailureBursts(memory, task);
    } else {
        log("🔁 keeping task for retry");
    }

    saveMemory(memory);
}

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

        log("🚀 AUTONOMOUS AGENT LEVEL 7 STABLE STARTED");
        log("📁 repo:", CONFIG.REPO_PATH);
        log("📘 blueprint:", CONFIG.BLUEPRINT_FILE);
        log("📝 main evolution doc:", CONFIG.MAIN_EVOLUTION_DOC);
        log("🌿 branch:", branch);

        for (let i = 0; i < CONFIG.MAX_ITERATIONS; i += 1) {
            memory = loadMemory();
            memory.metrics.iterations += 1;
            saveMemory(memory);

            log("🧠 iteration", memory.metrics.iterations);
            let task = null;

            try {
                if (!Array.isArray(memory.backlog) || memory.backlog.length === 0) {
                    log("🗺️ generating backlog from blueprint...");
                    const freshBacklog = await generateBacklog(memory, blueprint, buildRepoIndex());
                    memory.metrics.plannerRuns += 1;
                    memory.backlog = freshBacklog.tasks || [];
                    pushHistory(memory, {
                        type: "backlog_generated",
                        total: memory.backlog.length,
                        summary: freshBacklog.summary || "",
                    });
                    saveMemory(memory);
                }

                task = pickNextTask(memory);
                if (!task) {
                    log("⏸️ no valid task available, regenerating backlog on next loop");
                    memory.backlog = [];
                    saveMemory(memory);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                log(`🎯 task: [${task.category}/${task.priority}] ${task.title}`);
                log("📌 goal:", task.goal);

                memory.metrics.tasksExecuted += 1;
                saveMemory(memory);

                const generated = await generateImplementation(task, blueprint, memory);
                const implementation = generated.impl;

                if (generated.skipped.length) {
                    log(
                        `🧹 sanitized implementation, skipped ${generated.skipped.length} file(s):`,
                        generated.skipped.map((item) => `${item.path}[${item.reason}]`).join(", ")
                    );
                }

                const touchedPaths = unique([
                    ...implementation.files.map((f) => normalizeSlashes(f.path)),
                    ...(implementation.delete_files || []).map((p) => normalizeSlashes(p)),
                ]);

                const backups = backupFiles(touchedPaths);

                try {
                    applyImplementation(implementation);
                } catch (err) {
                    restoreBackup(backups);
                    throw err;
                }

                const review = await reviewImplementation(task, blueprint, implementation);
                if (String(review.verdict || "").toUpperCase() !== "APPROVED") {
                    memory.metrics.rejections += 1;
                    rollbackHard();
                    registerFailureAndDecide(memory, task, `review rejected: ${review.reason || "no reason"}`, implementation);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                memory.metrics.approvals += 1;
                const checks = runVerification(memory);

                let finalImplementation = implementation;
                let finalChecks = checks;

                if (!checks.ok) {
                    log(`🩹 healing loop 1/${CONFIG.MAX_SELF_HEAL_ATTEMPTS}`);
                    const healed = await trySelfHeal({ blueprint, task, implementation, checks, memory });
                    if (!healed.ok) {
                        rollbackHard();
                        registerFailureAndDecide(
                            memory,
                            task,
                            summarizeVerificationResults(checks.verifyResults, checks.testResults) || "verification failed",
                            implementation
                        );
                        await sleep(CONFIG.LOOP_DELAY_MS);
                        continue;
                    }

                    finalImplementation = healed.implementation;
                    finalChecks = healed.checks;
                }

                if (!finalChecks.ok) {
                    rollbackHard();
                    registerFailureAndDecide(memory, task, "verification failed after self-heal", finalImplementation);
                    await sleep(CONFIG.LOOP_DELAY_MS);
                    continue;
                }

                log("✅ fully healed and verified");

                const commitMessage = sanitizeOneLine(
                    review.suggested_commit_message || task.commit_message || `chore: ${task.title}`,
                    180
                );

                const evolution = updateMainEvolutionDoc({
                    task,
                    implementation: finalImplementation,
                    review,
                    commitMessage,
                    memory,
                });
                log(`📝 main document updated: ${evolution.path}`);

                const committed = commitAll(commitMessage);
                if (committed) {
                    memory.metrics.commits += 1;
                    log(`✅ committed: ${commitMessage}`);
                } else {
                    log("ℹ️ nothing to commit after verification");
                }

                if (CONFIG.AUTO_PUSH && committed) {
                    pushBranch();
                    memory.metrics.pushes += 1;
                    log("🚀 pushed");
                }

                memory.accepted.unshift({
                    at: new Date().toISOString(),
                    title: task.title,
                    category: task.category,
                    commit_message: commitMessage,
                });
                memory.accepted = memory.accepted.slice(0, 300);
                memory.metrics.applied += 1;
                memory.metrics.lastSuccessAt = new Date().toISOString();

                rememberSuccess(memory, task, commitMessage);
                clearTaskFailureBursts(memory, task);
                removeTaskFromBacklog(memory, task.id);
                pushHistory(memory, {
                    type: "task_completed",
                    title: task.title,
                    category: task.category,
                    commit_message: commitMessage,
                });
                saveMemory(memory);
            } catch (err) {
                const message = err && err.message ? err.message : String(err);
                log("💥 iteration fatal:", message);

                rollbackHard();

                if (task) {
                    const replans = incrementTaskReplan(memory, task);
                    memory.metrics.replans += 1;

                    if (replans >= CONFIG.MAX_REPLAN_PER_TASK) {
                        log("⛔ dropping task after max replans");
                        removeTaskFromBacklog(memory, task.id);
                        clearTaskFailureBursts(memory, task);
                    } else {
                        registerFailureAndDecide(memory, task, message, null);
                    }
                } else {
                    memory.metrics.lastErrorAt = new Date().toISOString();
                    saveMemory(memory);
                }
            }

            await sleep(CONFIG.LOOP_DELAY_MS);
        }
    } finally {
        releaseLock();
    }
}

main().catch((err) => {
    console.error("FATAL:", err && err.message ? err.message : String(err));
    process.exit(1);
});
