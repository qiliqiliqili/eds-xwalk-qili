import { exec } from "node:child_process";

/**
 * Run a shell command and return { stdout, stderr, code }.
 * Never rejects — caller decides what to do with non-zero exit codes.
 */
const run = (cmd) => new Promise((resolve) => exec(
  cmd,
  (error, stdout, stderr) => resolve({
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    code: error ? (error.code ?? 1) : 0,
  }),
));

const changeset = await run('git diff --cached --name-only --diff-filter=ACMR');
const modifiedFiles = changeset.stdout.split('\n').filter(Boolean);

// ── Model JSON rebuild ────────────────────────────────────────────
const modifiedPartials = modifiedFiles.filter((f) => f.match(/(^|\/)_.*.json/));
if (modifiedPartials.length > 0) {
  const { stdout, code } = await run('npm run build:json --silent');
  if (stdout) console.log(stdout);
  if (code !== 0) process.exit(code);
  await run('git add component-models.json component-definition.json component-filters.json');
}

// ── Lint helpers ──────────────────────────────────────────────────
const stagedJs = modifiedFiles.filter((f) => /\.(js|mjs|json)$/.test(f));
const stagedCss = modifiedFiles.filter((f) => /\.css$/.test(f));

/**
 * Run linter with --fix, re-stage fixed files, then verify no errors remain.
 * @param {string} linter   e.g. 'npx eslint --fix' or 'npx stylelint --fix'
 * @param {string[]} files
 * @param {string} label    displayed in log output
 */
async function lintAndFix(linter, files, label) {
  if (files.length === 0) return;
  const fileList = files.join(' ');

  // 1. Auto-fix what can be fixed
  console.log(`${label}: fixing…`);
  await run(`${linter} ${fileList}`);

  // 2. Re-stage any files the linter modified
  await run(`git add ${fileList}`);

  // 3. Re-run without --fix to surface any remaining errors
  const checkCmd = linter.replace(' --fix', '');
  console.log(`${label}: checking…`);
  const { stdout, stderr, code } = await run(`${checkCmd} ${fileList}`);

  if (code !== 0) {
    console.error(`\n${label} errors — fix these before committing:\n`);
    if (stdout) console.error(stdout);
    if (stderr) console.error(stderr);
    process.exit(code);
  }
}

await lintAndFix('npx eslint --fix', stagedJs, 'ESLint');
await lintAndFix('npx stylelint --fix', stagedCss, 'Stylelint');
