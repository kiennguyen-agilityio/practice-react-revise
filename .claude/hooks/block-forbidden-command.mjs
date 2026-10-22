#!/usr/bin/env node
// PreToolUse hook (Bash): block dangerous recursive deletion.
//
// Contract: JSON on stdin ({tool_name, tool_input.command, cwd, ...}).
// Exit 0 with no output = no objection (normal permission flow continues).
// Exit 2 + one-line stderr = block; Claude sees the stderr text as the reason.
// Never exits 1 (non-blocking in Claude Code). Anything unparseable, dynamic,
// or unexpected fails closed with exit 2.
//
// The command is tokenized with shell-like quote removal, split on operators
// (; & | && || newline, parens), and each simple command is checked. Nested
// code ($(), backticks, <(), sh -c, eval, heredocs) is analyzed recursively.
//
// Blocked: rm with a recursive flag unless every operand is exactly one of
// ALLOWED_TARGETS (optional trailing slash); find -delete; find -exec <rm>;
// xargs rm; git clean (except dry runs); rsync --delete*; shred; shells
// reading stdin; eval/sh -c with dynamic text; inline node/python/perl/ruby/
// php code that touches delete or process APIs.
//
// Known gaps (a guardrail, not a security boundary): scripts and package.json
// scripts that delete (bash x.sh, npm run clean), aliases, functions defined in
// earlier tool calls, `source file`, ssh/docker exec to other machines, git
// aliases, mv/dd/truncate overwrite tricks, non-Bash tools (PowerShell), and
// anything the shell can build at run time that this parser cannot see.
//
// Tests: node --test .claude/hooks/tests/*.test.mjs

import { readFileSync, realpathSync, writeSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED_TARGETS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.vite',
]);

// Private-use markers standing in for text that is only known at run time.
const DYN = ''; // $var, ${..}, $(..), `..`, $'..', ~, <(..)
const GLOB = ''; // * ? [ and brace expansion
const MAX_DEPTH = 8;

const STRIP = new Set(['if', 'then', 'elif', 'else', 'while', 'until', 'do']);
STRIP.add('{').add('}').add('!');
const ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*\+?=/;

// Commands whose later words may themselves be a command (scan every suffix).
const WRAPPERS = new Set([
  'sudo',
  'doas',
  'env',
  'command',
  'builtin',
  'exec',
  'nohup',
  'time',
  'nice',
  'ionice',
  'timeout',
  'stdbuf',
  'setsid',
  'xargs',
  'watch',
  'parallel',
  'flock',
  'su',
  'busybox',
  'unbuffer',
  'taskset',
  'chroot',
]);
// Compound-command keywords: the body may follow on the same line ("function
// f { rm -rf x; }"), so scan suffixes, but their words are data, not strings.
const KEYWORDS = new Set(['for', 'case', 'select', 'function', 'coproc']);
const SHELLS = new Set([
  'sh',
  'bash',
  'zsh',
  'dash',
  'ksh',
  'ash',
  'csh',
  'tcsh',
  'fish',
]);
const INTERPRETERS =
  /^(node|nodejs|deno|bun|python[\d.]*|pypy[\d.]*|perl|ruby|php)$/;
const INLINE_FLAG = /^(--eval|--print|-[A-Za-z]*[epcE][A-Za-z]*)$/;
const DELETE_API =
  /rmSync|rmdirSync|unlinkSync|\brmdir\b|rmtree|remove_tree|\brimraf\b|\bshutil\b|FileUtils|File\.delete|Dir\.(rmdir|delete)|\bunlink\b|child_process|execSync|spawnSync|execFile|\bspawn\b|\bsystem\b|\bsubprocess\b|\bpopen\b|\bexec\b|os\.remove|fs\.rm|rm\s+-/;

class Deny extends Error {}
const deny = (reason) => {
  throw new Deny(reason);
};
const hasDyn = (s) => s.includes(DYN) || s.includes(GLOB);
const show = (s) => s.replaceAll(DYN, '<dynamic>').replaceAll(GLOB, '<glob>');

// ---------------------------------------------------------------- tokenizer

// Index of the ")" matching the "(" at src[open]; quote and nesting aware.
function findClose(src, open) {
  let depth = 0;
  for (let j = open; j < src.length; ) {
    const ch = src[j];
    if (ch === '\\') j += 2;
    else if (ch === "'") {
      const e = src.indexOf("'", j + 1);
      if (e < 0) deny('could not parse: unterminated single quote');
      j = e + 1;
    } else if (ch === '"') j = skipDouble(src, j);
    else if (ch === '`') j = skipBacktick(src, j) + 1;
    else {
      if (ch === '(') depth++;
      else if (ch === ')' && --depth === 0) return j;
      j++;
    }
  }
  return deny('could not parse: unterminated "$("');
}

// Index just past the closing quote of the double-quoted string at src[j].
function skipDouble(src, j) {
  for (j++; j < src.length; ) {
    const ch = src[j];
    if (ch === '\\') j += 2;
    else if (ch === '$' && src[j + 1] === '(') j = findClose(src, j + 1) + 1;
    else if (ch === '`') j = skipBacktick(src, j) + 1;
    else if (ch === '"') return j + 1;
    else j++;
  }
  return deny('could not parse: unterminated double quote');
}

// Index of the backtick closing the one at src[j].
function skipBacktick(src, j) {
  for (let k = j + 1; k < src.length; k++) {
    if (src[k] === '\\') k++;
    else if (src[k] === '`') return k;
  }
  return deny('could not parse: unterminated backtick');
}

function backtick(src, i, ctx, depth) {
  const end = skipBacktick(src, i);
  const inner = src.slice(i + 1, end).replace(/\\([`$\\])/g, '$1');
  analyzeString(inner, ctx, depth + 1);
  return end + 1;
}

// Analyze command substitutions inside text that is expanded but not split
// (heredoc bodies, ${...} contents).
function expansionsIn(text, ctx, depth) {
  for (let i = 0; i < text.length; ) {
    if (text[i] === '\\') i += 2;
    else if (text[i] === '$' && text[i + 1] === '(') {
      const end = findClose(text, i + 1);
      analyzeString(text.slice(i + 2, end), ctx, depth + 1);
      i = end + 1;
    } else if (text[i] === '`') i = backtick(text, i, ctx, depth);
    else i++;
  }
}

// Handle "$..." at src[i]. Returns [literal-or-marker text, next index].
function readDollar(src, i, ctx, depth, inDouble) {
  const next = src[i + 1];
  if (next === '(') {
    const end = findClose(src, i + 1);
    analyzeString(src.slice(i + 2, end), ctx, depth + 1);
    return [DYN, end + 1];
  }
  if (next === '{') {
    let level = 1;
    let j = i + 2;
    while (j < src.length && level > 0) {
      if (src[j] === '\\') j++;
      else if (src[j] === '{') level++;
      else if (src[j] === '}') level--;
      j++;
    }
    if (level > 0) deny('could not parse: unterminated "${"');
    expansionsIn(src.slice(i + 2, j - 1), ctx, depth);
    return [DYN, j];
  }
  if (next === "'" && !inDouble) {
    let j = i + 2;
    while (j < src.length && src[j] !== "'") j += src[j] === '\\' ? 2 : 1;
    if (j >= src.length) deny("could not parse: unterminated $'...'");
    return [DYN, j + 1];
  }
  const m = /^([A-Za-z_][A-Za-z0-9_]*|[0-9]|[@*#?$!-])/.exec(src.slice(i + 1));
  return m ? [DYN, i + 1 + m[0].length] : ['$', i + 1];
}

function readDouble(src, i, ctx, depth) {
  let out = '';
  for (i++; ; ) {
    if (i >= src.length) deny('could not parse: unterminated double quote');
    const ch = src[i];
    if (ch === '"') return [out, i + 1];
    if (ch === '\\') {
      const nx = src[i + 1];
      if (nx !== undefined && '$`"\\\n'.includes(nx)) {
        if (nx !== '\n') out += nx;
        i += 2;
      } else {
        out += ch;
        i++;
      }
    } else if (ch === '$') {
      const [text, next] = readDollar(src, i, ctx, depth, true);
      out += text;
      i = next;
    } else if (ch === '`') {
      out += DYN;
      i = backtick(src, i, ctx, depth);
    } else {
      out += ch;
      i++;
    }
  }
}

function skipHeredoc(src, i, h, ctx, depth) {
  let body = '';
  while (i < src.length) {
    const eol = src.indexOf('\n', i);
    const line = src.slice(i, eol < 0 ? src.length : eol);
    i = eol < 0 ? src.length : eol + 1;
    if ((h.strip ? line.replace(/^\t+/, '') : line) === h.delim) break;
    body += line + '\n';
  }
  if (!h.quoted) expansionsIn(body, ctx, depth);
  return i;
}

// Split src into simple commands (arrays of words, quotes removed, run-time
// text replaced by DYN/GLOB). Nested code is analyzed as it is found.
function tokenize(src, ctx, depth) {
  const commands = [];
  const heredocs = [];
  let words = [];
  let word = '';
  let inWord = false;
  let skipNext = false; // next word is a redirection target

  const endWord = () => {
    if (!inWord) return;
    if (skipNext) skipNext = false;
    else words.push(word);
    word = '';
    inWord = false;
  };
  const endCommand = () => {
    endWord();
    skipNext = false;
    if (words.length) commands.push(words);
    words = [];
  };
  const add = (text) => {
    word += text;
    inWord = true;
  };

  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const nx = src[i + 1];
    if (c === ' ' || c === '\t') {
      endWord();
      i++;
    } else if (c === '\n') {
      endCommand();
      i++;
      for (const h of heredocs.splice(0)) {
        i = skipHeredoc(src, i, h, ctx, depth);
      }
    } else if (c === '\\') {
      if (nx === '\n') i += 2;
      else {
        if (nx !== undefined) add(nx);
        i += 2;
      }
    } else if (c === "'") {
      const e = src.indexOf("'", i + 1);
      if (e < 0) deny('could not parse: unterminated single quote');
      add(src.slice(i + 1, e));
      i = e + 1;
    } else if (c === '"') {
      const [text, next] = readDouble(src, i, ctx, depth);
      add(text);
      i = next;
    } else if (c === '$') {
      if (nx === '"') i++;
      else {
        const [text, next] = readDollar(src, i, ctx, depth, false);
        add(text);
        i = next;
      }
    } else if (c === '`') {
      add(DYN);
      i = backtick(src, i, ctx, depth);
    } else if (c === '<' || c === '>') {
      if (nx === '(') {
        const end = findClose(src, i + 1);
        analyzeString(src.slice(i + 2, end), ctx, depth + 1);
        add(DYN);
        i = end + 1;
        continue;
      }
      if (inWord && /^[0-9]+$/.test(word)) {
        word = '';
        inWord = false;
      } else endWord();
      let j = i;
      while (j < src.length && '<>&|'.includes(src[j])) j++;
      const op = src.slice(i, j);
      if (op.startsWith('<<') && !op.startsWith('<<<')) {
        const strip = src[j] === '-';
        let k = strip ? j + 1 : j;
        while (src[k] === ' ' || src[k] === '\t') k++;
        let delim = '';
        let quoted = false;
        while (k < src.length && !/[\s;&|<>()]/.test(src[k])) {
          if (src[k] === "'" || src[k] === '"') {
            const e = src.indexOf(src[k], k + 1);
            if (e < 0) deny('could not parse: unterminated heredoc delimiter');
            delim += src.slice(k + 1, e);
            quoted = true;
            k = e + 1;
          } else if (src[k] === '\\') {
            delim += src[k + 1] ?? '';
            quoted = true;
            k += 2;
          } else delim += src[k++];
        }
        heredocs.push({ delim, strip, quoted });
        i = k;
      } else {
        skipNext = true;
        i = j;
      }
    } else if (c === '&') {
      if (nx === '>') {
        endWord();
        i += src[i + 2] === '>' ? 3 : 2;
        skipNext = true;
      } else {
        endCommand();
        i += nx === '&' ? 2 : 1;
      }
    } else if (c === '|') {
      endCommand();
      i += nx === '|' || nx === '&' ? 2 : 1;
    } else if (c === ';') {
      endCommand();
      i += nx === ';' || nx === '&' ? 2 : 1;
    } else if (c === '(' || c === ')') {
      endCommand();
      i++;
    } else if (c === '#' && !inWord) {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (c === '*' || c === '?') {
      add(GLOB);
      i++;
    } else if (c === '[') {
      const blank = (ch) => ch === undefined || /\s/.test(ch);
      if (!inWord && src.startsWith('[[', i) && blank(src[i + 2])) {
        add('[[');
        i += 2;
      } else if (!inWord && blank(nx)) {
        add('[');
        i++;
      } else {
        add(GLOB);
        i++;
      }
    } else if (c === '{') {
      // Literal only as a standalone "{" or the "{}" of find; else brace
      // expansion may build a different word.
      if ((!inWord && (nx === undefined || /\s/.test(nx))) || nx === '}')
        add(c);
      else add(GLOB);
      i++;
    } else if (c === '~' && !inWord) {
      add(DYN);
      i++;
    } else {
      add(c);
      i++;
    }
  }
  endCommand();
  return commands;
}

// ----------------------------------------------------------------- analysis

function analyzeString(str, ctx, depth) {
  if (depth > MAX_DEPTH) deny('command nesting is too deep to analyze');
  for (const words of tokenize(str, ctx, depth)) {
    analyzeSimple(words, ctx, depth, false);
  }
}

function checkRm(args, ctx) {
  let recursive = false;
  let afterDashes = false;
  const operands = [];
  for (const a of args) {
    if (afterDashes) operands.push(a);
    else if (a === '--') afterDashes = true;
    else if (a.startsWith(DYN) || a.startsWith(GLOB)) {
      deny(`rm argument "${show(a)}" could hide -r (use "rm -- <file>")`);
    } else if (a.startsWith('--')) {
      const opt = a.slice(2).split('=')[0];
      if (hasDyn(opt)) deny('rm option built from dynamic text');
      if (opt && 'recursive'.startsWith(opt)) recursive = true;
    } else if (a.startsWith('-') && a.length > 1) {
      if (hasDyn(a)) deny('rm option built from dynamic text');
      if (/[rR]/.test(a)) recursive = true;
    } else operands.push(a);
  }
  if (!recursive) return;
  if (operands.length === 0) {
    deny('recursive rm without literal targets (targets may come from stdin)');
  }
  if (ctx.cwdUntrusted) {
    deny('recursive rm where the working directory is outside the project');
  }
  for (const target of operands) {
    const name = target.replace(/\/+$/, '');
    if (hasDyn(target) || !ALLOWED_TARGETS.has(name)) {
      deny(
        `recursive delete of "${show(target)}" is not allowed ` +
          `(only ${[...ALLOWED_TARGETS].join(', ')} as plain relative names)`,
      );
    }
  }
}

function checkShell(args, ctx, depth) {
  const info = ['--version', '--help', '-v'];
  if (args.length && args.every((a) => info.includes(a))) return;
  const cluster = (letter) =>
    args.some((a) => new RegExp(`^-[A-Za-z]*${letter}[A-Za-z]*$`).test(a));
  if (cluster('c')) {
    for (const a of args) {
      if (a.startsWith('-')) continue;
      if (hasDyn(a)) deny('shell -c string built from dynamic text');
      analyzeString(a, ctx, depth + 1);
    }
    return;
  }
  const operands = args.filter((a) => !a.startsWith('-'));
  if (operands.length === 0 || cluster('s')) {
    deny('shell reading commands from stdin cannot be inspected');
  }
}

function checkGit(args) {
  const at = args.indexOf('clean');
  if (at < 0) return;
  const rest = args.slice(at + 1);
  const dryRun = rest.some((a) => a === '--dry-run' || /^-[A-Za-z]*n/.test(a));
  if (!dryRun) deny('git clean deletes untracked files (use -n to preview)');
}

function checkInterpreter(base, args) {
  const inline = args.some(
    (a) => INLINE_FLAG.test(a) || (base === 'deno' && a === 'eval'),
  );
  if (!inline) return;
  const code = args.join(' ');
  if (hasDyn(code)) deny(`${base} inline code built from dynamic text`);
  if (DELETE_API.test(code)) {
    deny(`${base} inline code uses file-deletion or process APIs`);
  }
}

function analyzeSimple(words, ctx, depth, inScan) {
  let w = words;
  while (w.length && (STRIP.has(w[0]) || ASSIGN.test(w[0]))) w = w.slice(1);
  if (!w.length) return;

  const name = w[0];
  const base = name.slice(name.lastIndexOf('/') + 1);
  if (hasDyn(base)) deny(`dynamic command name "${show(name)}"`);
  const args = w.slice(1);

  if (WRAPPERS.has(base) || KEYWORDS.has(base)) {
    if (inScan) return; // the outermost scan already visits every suffix
    for (let j = 1; j < w.length; j++) {
      analyzeSimple(w.slice(j), ctx, depth, true);
      if (WRAPPERS.has(base) && /\s/.test(w[j])) {
        analyzeString(w[j], ctx, depth + 1);
      }
    }
  } else if (base === 'cd' || base === 'pushd' || base === 'popd') {
    ctx.cwdUntrusted = true;
  } else if (base === 'rm' || base === 'grm') {
    checkRm(args, ctx);
  } else if (base === 'find' || base === 'gfind') {
    for (let k = 0; k < args.length; k++) {
      if (args[k] === '-delete') deny('find -delete');
      if (/^-(exec|execdir|ok|okdir)$/.test(args[k])) {
        let end = k + 1;
        while (end < args.length && args[end] !== ';' && args[end] !== '+') {
          end++;
        }
        analyzeSimple(args.slice(k + 1, end), ctx, depth, false);
        k = end;
      }
    }
  } else if (base === 'git') {
    checkGit(args);
  } else if (base === 'rsync') {
    if (args.some((a) => /^--(del|remove-source-files)/.test(a))) {
      deny('rsync --delete / --remove-source-files');
    }
  } else if (base === 'shred') {
    deny('shred');
  } else if (SHELLS.has(base)) {
    checkShell(args, ctx, depth);
  } else if (base === 'eval') {
    if (args.some(hasDyn)) deny('eval of dynamic text');
    analyzeString(args.join(' '), ctx, depth + 1);
  } else if (INTERPRETERS.test(base)) {
    checkInterpreter(base.replace(/[\d.]+$/, ''), args);
  }
}

// ------------------------------------------------------------------- main

function insideProject(cwd) {
  const root = realpathSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../..'),
  );
  try {
    const real = realpathSync(typeof cwd === 'string' ? cwd : process.cwd());
    return real === root || real.startsWith(root + sep);
  } catch {
    return false;
  }
}

function block(reason) {
  writeSync(2, `block-forbidden-command: ${reason}\n`);
  process.exit(2);
}

try {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    block('could not read hook input as JSON');
  }
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    block('hook input is not a JSON object');
  }
  if (input.tool_name !== 'Bash') process.exit(0);

  const command = input.tool_input?.command;
  if (typeof command !== 'string') block('Bash tool input has no command');
  if (command.includes(DYN) || command.includes(GLOB)) {
    block('command contains reserved characters');
  }
  analyzeString(command, { cwdUntrusted: !insideProject(input.cwd) }, 0);
  process.exit(0);
} catch (err) {
  block(
    err instanceof Deny
      ? err.message
      : `internal error, failing closed: ${err?.message ?? err}`,
  );
}
