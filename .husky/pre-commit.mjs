import { exec } from "node:child_process";

const run = (cmd) => new Promise((resolve, reject) => exec(
  cmd,
  (error, stdout) => {
    if (error) reject(error);
    else resolve(stdout);
  }
));

const changeset = await run('git diff --cached --name-only --diff-filter=ACMR');
const modifiedFiles = changeset.split('\n').filter(Boolean);

// check if there are any model files staged
const modifledPartials = modifiedFiles.filter((file) => file.match(/(^|\/)_.*.json/));
if (modifledPartials.length > 0) {
  const output = await run('npm run build:json --silent');
  console.log(output);
  await run('git add component-models.json component-definition.json component-filters.json');
}

// lint staged JS/CSS files
const stagedJs = modifiedFiles.filter((f) => f.match(/\.(js|mjs|json)$/));
const stagedCss = modifiedFiles.filter((f) => f.match(/\.css$/));

if (stagedJs.length > 0) {
  console.log('Running ESLint on staged files...');
  const jsOutput = await run(`npx eslint ${stagedJs.join(' ')}`).catch((e) => { throw e; });
  if (jsOutput) console.log(jsOutput);
}

if (stagedCss.length > 0) {
  console.log('Running Stylelint on staged files...');
  const cssOutput = await run(`npx stylelint ${stagedCss.join(' ')}`).catch((e) => { throw e; });
  if (cssOutput) console.log(cssOutput);
}
