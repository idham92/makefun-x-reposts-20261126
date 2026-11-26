// makefun-x-reposts-02 entry program.
//
// Copies POSTS.json from the repository root into the grader's output
// directory. That is the whole job: the entry itself is the list of my
// public X posts (each quoting or replying to a different @makefunai post),
// and the house reads their reposts, quotes and likes from X itself, so
// nothing written here about the posts counts toward the score.
//
// Environment (same names the make.fun kit uses):
//   MAKEFUN_BOT_DIR    - repository root (defaults to the current directory)
//   MAKEFUN_OUTPUT_DIR - output directory (defaults to "out")
import { copyFile, mkdir, chmod, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const botDir = resolve(process.env.MAKEFUN_BOT_DIR ?? ".");
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "out");

const source = join(botDir, "POSTS.json");
const target = join(outputDir, "POSTS.json");

// Fail loudly (instead of copying a broken file) when POSTS.json is not
// a JSON object with a posts array in it.
const parsed = JSON.parse(await readFile(source, "utf8"));
if (
  typeof parsed !== "object" ||
  parsed === null ||
  !Array.isArray(parsed.posts) ||
  parsed.posts.some((p) => typeof p !== "string")
) {
  throw new Error('POSTS.json must be a JSON object with a string array "posts"');
}

// The competition reads 1 to 15 posts, all from one X account, each an
// X status URL. Fail loudly here (instead of handing the grader a list
// it will refuse) when the list breaks any of those rules.
if (parsed.posts.length < 1 || parsed.posts.length > 15) {
  throw new Error(`POSTS.json must list 1 to 15 posts, found ${parsed.posts.length}`);
}
const handles = new Set();
for (const url of parsed.posts) {
  const match = /^https:\/\/x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)$/.exec(url);
  if (!match) {
    throw new Error(`not an X status URL: ${url}`);
  }
  handles.add(match[1]);
}
if (handles.size !== 1) {
  throw new Error(`all posts must come from one X account, found ${[...handles].join(", ")}`);
}

await mkdir(outputDir, { recursive: true });
await copyFile(source, target);
// The grader collects outputs as another user: leave the file readable.
await chmod(target, 0o644);
console.log(`copied ${parsed.posts.length} posts from @${[...handles][0]} to ${target}`);
