#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const { spawnSync } = require("child_process");

/* ================= CONFIG ================= */

const CONFIG = {
    REPO_PATH: process.cwd(),
    BLUEPRINT_FILE: "BLUEPRINT.md",

    OLLAMA_URL: "http://localhost:11434/api/generate",
    MODEL: "qwen2.5-coder:7b",

    MAX_ITERATIONS: 999999,
    LOOP_DELAY_MS: 5000,

    MAX_FILES_PER_TASK: 12,
    MAX_SELF_HEAL_ATTEMPTS: 6,

    DEBUG: false
};

/* ================= UTILS ================= */

const log = (...a) => console.log(new Date().toISOString(), "-", ...a);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const run = (cmd) => {
    const r = spawnSync(cmd, {
        shell: true,
        encoding: "utf8"
    });
    return {
        ok: r.status === 0,
        stdout: r.stdout || "",
        stderr: r.stderr || ""
    };
};

const sha1 = (v) => crypto.createHash("sha1").update(String(v)).digest("hex");

/* ================= MEMORY ================= */

const MEMORY_FILE = ".agent-memory.json";

function loadMemory() {
    try {
        return JSON.parse(fs.readFileSync(MEMORY_FILE));
    } catch {
        return {
            backlog: [],
            accepted: [],
            failed: [],
            metrics: { iterations: 0 }
        };
    }
}

function saveMemory(m) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(m, null, 2));
}

/* ================= AI ================= */

async function ask(prompt) {
    const res = await axios.post(CONFIG.OLLAMA_URL, {
        model: CONFIG.MODEL,
        prompt,
        stream: false
    });
    return res.data.response;
}

function parseJSON(text) {
    try {
        return JSON.parse(text);
    } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        return JSON.parse(text.slice(start, end + 1));
    }
}

/* ================= CORE ================= */

async function generateTask() {
    const raw = await ask(`
Generate 1 task JSON:
{
 "id": "...",
 "title": "...",
 "files": []
}
`);
    return parseJSON(raw);
}

async function implement(task) {
    const raw = await ask(`
Implement task:
${JSON.stringify(task)}
`);
    return parseJSON(raw);
}

function apply(impl) {
    for (const f of impl.files) {
        fs.mkdirSync(path.dirname(f.path), { recursive: true });
        fs.writeFileSync(f.path, f.content);
    }
}

function verify() {
    const lint = run("npm run lint");
    if (!lint.ok) return { ok: false, error: lint.stderr };

    const build = run("npm run build");
    if (!build.ok) return { ok: false, error: build.stderr };

    return { ok: true };
}

/* ================= SELF HEAL ================= */

async function selfHeal(task, implementation, checks) {
    let currentImplementation = implementation;

    let failedSummary = checks.error;

    for (let i = 0; i < CONFIG.MAX_SELF_HEAL_ATTEMPTS; i++) {
        log("🩹 healing", i + 1);

        const raw = await ask(`
Fix errors:

TASK:
${JSON.stringify(task)}

ERROR:
${failedSummary}

CODE:
${JSON.stringify(currentImplementation)}
`);

        let fixed;
        try {
            fixed = parseJSON(raw);
        } catch {
            continue;
        }

        apply(fixed);

        const newChecks = verify();

        if (newChecks.ok) {
            return { ok: true, implementation: fixed };
        }

        failedSummary = newChecks.error;
        currentImplementation = fixed;
    }

    return { ok: false };
}

/* ================= MAIN LOOP ================= */

async function main() {
    log("🚀 AGENT STARTED");

    for (let i = 0; i < CONFIG.MAX_ITERATIONS; i++) {
        let memory = loadMemory();
        memory.metrics.iterations++;
        saveMemory(memory);

        log("🧠 iteration", memory.metrics.iterations);

        let task = memory.backlog[0];

        if (!task) {
            log("🗺️ generating task...");
            task = await generateTask();
            memory.backlog.push(task);
            saveMemory(memory);
        }

        log("🎯", task.title);

        try {
            const implementation = await implement(task);

            apply(implementation);

            let checks = verify();

            let currentImplementation = implementation;

            let attempts = 0;

            while (!checks.ok && attempts < CONFIG.MAX_SELF_HEAL_ATTEMPTS) {
                attempts++;

                const healed = await selfHeal(task, currentImplementation, checks);

                if (!healed.ok) break;

                currentImplementation = healed.implementation;
                checks = verify();

                if (checks.ok) break;
            }

            if (!checks.ok) {
                log("❌ failed, will retry later");

                memory.failed.push({
                    task,
                    error: checks.error
                });

                saveMemory(memory);
                await sleep(CONFIG.LOOP_DELAY_MS);
                continue;
            }

            run(`git add .`);
            run(`git commit -m "auto: ${task.title}"`);
            run(`git push`);

            memory.accepted.push(task);

            // REMOVE SÓ NO SUCESSO
            memory.backlog.shift();

            saveMemory(memory);

            log("✅ success");

        } catch (err) {
            log("💥 error", err.message);

            memory.failed.push({
                task,
                error: err.message
            });

            saveMemory(memory);
        }

        await sleep(CONFIG.LOOP_DELAY_MS);
    }
}

main();