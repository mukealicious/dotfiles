import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const standalone = join(process.env.MU_STACK_DIR || join(process.env.HOME, 'Code/mu-stack'), 'scripts/install.mjs');
// Test the real standalone link behavior, not a mock installer. This is a copy;
// the source repository and live HOME are never modified or updated.
const installerSource = readFileSync(standalone, 'utf8');

function fixture(t) {
  const temp = realpathSync(mkdtempSync(join(tmpdir(), 'mu-stack-update-')));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const home = join(temp, 'home');
  const repo = join(temp, 'dotfiles');
  const source = join(temp, 'publisher');
  const remote = join(temp, 'remote.git');
  const checkout = join(home, 'Code/mu-stack');
  const events = join(temp, 'events');
  const shim = join(temp, 'bin');
  const env = { ...process.env, HOME: home, MU_STACK_REMOTE: remote, EVENT_LOG: events,
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
    GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.invalid',
    PATH: `${shim}:${process.env.PATH}` };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_CONFIG_COUNT']) delete env[key];
  for (const path of [home, repo, source, shim]) mkdirSync(path, { recursive: true });
  function write(path, content, executable = false) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    if (executable) chmodSync(path, 0o755);
  }
  function run(command, args, expected = 0) {
    const result = spawnSync(command, args, { env, cwd: repo, encoding: 'utf8' });
    if (expected === 0) assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    else assert.notEqual(result.status, 0, `Unexpected success: ${command} ${args.join(' ')}`);
    return `${result.stdout || ''}${result.stderr || ''}`;
  }
  const git = (directory, ...args) => run('git', ['-C', directory, ...args]).trim();
  const dot = (args = ['skills'], expected = 0) => run(join(repo, 'bin/dot'), args, expected);
  const log = () => existsSync(events) ? readFileSync(events, 'utf8').trim().split('\n') : [];
  const clear = () => write(events, '');
  for (const path of ['bin/dot', 'script/install', 'lib/log.sh', 'mu-stack/install.sh', 'mu-stack/config.sh']) {
    write(join(repo, path), readFileSync(join(root, path)), true);
  }
  // Never run mise, package managers, or actual machine/topic setup in tests.
  write(join(shim, 'mise'), '#!/bin/sh\nexit 1\n', true);
  write(join(shim, 'brew'), '#!/bin/sh\necho "brew $*" >> "$EVENT_LOG"\n', true);
  git(source, 'init', '-b', 'main');
  write(join(source, 'skills/portable/SKILL.md'), '---\nname: portable\ndescription: Fixture\n---\nv1\n');
  write(join(source, 'scripts/install.mjs'), "import { appendFileSync } from 'node:fs';\nappendFileSync(process.env.EVENT_LOG, 'mu-install ' + process.argv.slice(2).join(' ') + '\\n');\n" + installerSource);
  git(source, 'add', '.');
  git(source, 'commit', '-m', 'fixture');
  run('git', ['clone', '--bare', source, remote]);
  git(source, 'remote', 'add', 'origin', remote);
  function publish(name = 'portable', value = 'v2') {
    write(join(source, `skills/${name}/SKILL.md`), `---\nname: ${name}\ndescription: Fixture\n---\n${value}\n`);
    git(source, 'add', '.');
    git(source, 'commit', '-m', `publish ${name} ${value}`);
    git(source, 'push', 'origin', 'main');
  }
  function fullStubs() {
    for (const path of ['script/symlink', 'macos/set-defaults.sh', 'homebrew/install.sh', 'macos/install.sh', 'pnpm/install.sh', 'mise/install.sh', 'python/install.sh', 'fish/install.sh', 'ai/install.sh', 'claude/install.sh', 'opencode/install.sh', 'pi/install.sh', 'zzz/install.sh']) {
      write(join(repo, path), `#!/bin/sh\necho '${path}' >> "$EVENT_LOG"\n`, true);
    }
    git(repo, 'init', '-b', 'main');
    write(join(repo, 'mise.lock'), 'fixture\n');
    git(repo, 'add', 'mise.lock');
    git(repo, 'commit', '-m', 'fixture');
  }
  return { home, repo, source, remote, checkout, events, env, write, run, git, dot, log, clear, publish, fullStubs };
}

function snapshot(f) {
  return {
    head: f.git(f.checkout, 'rev-parse', 'HEAD'),
    status: f.git(f.checkout, 'status', '--porcelain', '--untracked-files=all'),
    skill: readFileSync(join(f.checkout, 'skills/portable/SKILL.md'), 'utf8'),
    link: readlinkSync(join(f.home, '.claude/skills/portable')),
  };
}

function rejected(f, message, args = ['skills']) {
  const before = snapshot(f);
  f.clear();
  assert.match(f.dot(args, 1), message);
  assert.deepEqual(snapshot(f), before);
  assert.ok(!f.log().some(line => line.startsWith('mu-install') || /^(claude|opencode|pi|zzz)\//.test(line)), f.log().join('\n'));
}

test('dot skills bootstraps, updates installed content and new links, and repeats harmlessly', t => {
  const f = fixture(t);
  f.dot();
  assert.deepEqual(f.log(), ['mu-install all']);
  for (const target of ['.claude', '.agents']) {
    assert.equal(readlinkSync(join(f.home, target, 'skills/portable')), join(f.checkout, 'skills/portable'));
  }
  f.publish();
  f.publish('added', 'new');
  f.clear();
  f.dot();
  assert.deepEqual(f.log(), ['mu-install all']);
  for (const target of ['.claude', '.agents']) {
    assert.match(readFileSync(join(f.home, target, 'skills/portable/SKILL.md'), 'utf8'), /v2/);
    assert.match(readFileSync(join(f.home, target, 'skills/added/SKILL.md'), 'utf8'), /new/);
  }
  const before = snapshot(f);
  f.dot(['skills', '--force']);
  assert.deepEqual(snapshot(f), before);
  assert.equal(f.git(f.checkout, 'status', '--porcelain'), '');
});

for (const kind of ['tracked dirty', 'staged dirty', 'untracked dirty', 'divergent', 'ahead', 'missing-upstream', 'detached', 'foreign-remote', 'fetch-failure', 'deleted-upstream']) {
  test(`${kind} blocks installation and preserves checkout`, t => {
    const f = fixture(t);
    f.dot();
    let message;
    switch (kind) {
      case 'tracked dirty':
      case 'staged dirty':
        f.write(join(f.checkout, 'skills/portable/SKILL.md'), 'local work\n');
        if (kind === 'staged dirty') f.git(f.checkout, 'add', '.');
        message = /Dirty checkout/;
        break;
      case 'untracked dirty':
        f.write(join(f.checkout, 'untracked'), 'local work\n');
        message = /Dirty checkout/;
        break;
      case 'divergent':
      case 'ahead':
        f.write(join(f.checkout, 'local'), 'local commit\n');
        f.git(f.checkout, 'add', '.');
        f.git(f.checkout, 'commit', '-m', 'local');
        if (kind === 'divergent') f.publish();
        message = /not a fast-forward/;
        break;
      case 'missing-upstream':
        f.git(f.checkout, 'branch', '--unset-upstream');
        message = /Missing remote upstream/;
        break;
      case 'detached':
        f.git(f.checkout, 'checkout', '--detach');
        message = /Detached HEAD/;
        break;
      case 'foreign-remote':
        f.git(f.checkout, 'remote', 'set-url', 'origin', `${f.remote}-foreign`);
        message = /Foreign upstream remote/;
        break;
      case 'fetch-failure':
        rmSync(f.remote, { recursive: true });
        message = /Fetch failed/;
        break;
      case 'deleted-upstream':
        f.git(f.remote, 'update-ref', '-d', 'refs/heads/main');
        message = /Fetch failed/;
        break;
    }
    rejected(f, message);
    if (kind === 'untracked dirty') assert.equal(readFileSync(join(f.checkout, 'untracked'), 'utf8'), 'local work\n');
  });
}

for (const kind of ['file', 'empty-directory', 'non-repository', 'nested-repository', 'symlink', 'broken-symlink', 'code-symlink']) {
  test(`foreign path ${kind} is preserved`, t => {
    const f = fixture(t);
    mkdirSync(dirname(f.checkout), { recursive: true });
    switch (kind) {
      case 'file': f.write(f.checkout, 'preserve\n'); break;
      case 'empty-directory': mkdirSync(f.checkout); break;
      case 'non-repository': f.write(join(f.checkout, 'user'), 'preserve\n'); break;
      case 'nested-repository':
        f.git(dirname(f.checkout), 'init');
        f.write(join(f.checkout, 'user'), 'preserve\n');
        break;
      case 'symlink': symlinkSync(f.source, f.checkout); break;
      case 'broken-symlink': symlinkSync(`${f.source}-missing`, f.checkout); break;
      case 'code-symlink':
        rmSync(dirname(f.checkout), { recursive: true });
        symlinkSync(f.source, dirname(f.checkout));
        break;
    }
    const path = kind === 'code-symlink' ? dirname(f.checkout) : f.checkout;
    const before = lstatSync(path);
    assert.match(f.dot(['skills', '--force'], 1), /Unsafe checkout path|Not a standalone Git checkout/);
    assert.equal(lstatSync(path).ino, before.ino);
    assert.deepEqual(f.log(), []);
    assert.equal(f.git(f.source, 'status', '--porcelain'), '');
    if (kind === 'file') assert.equal(readFileSync(path, 'utf8'), 'preserve\n');
    if (['non-repository', 'nested-repository'].includes(kind)) assert.equal(readFileSync(join(path, 'user'), 'utf8'), 'preserve\n');
  });
}

test('clone failure cannot run installer', t => {
  const f = fixture(t);
  f.env.MU_STACK_REMOTE = `${f.remote}-missing`;
  assert.match(f.dot(['skills'], 1), /Clone failed/);
  assert.deepEqual(f.log(), []);
  assert.equal(existsSync(join(f.home, '.claude/skills')), false);
});

for (const kind of ['file', 'directory', 'foreign-link', 'broken-link', 'parent-link']) {
  test(`installed skill collision ${kind} is preserved, including --force`, t => {
    const f = fixture(t);
    const destination = join(f.home, '.agents/skills/portable');
    mkdirSync(dirname(destination), { recursive: true });
    switch (kind) {
      case 'file': f.write(destination, 'preserve\n'); break;
      case 'directory': f.write(join(destination, 'user'), 'preserve\n'); break;
      case 'foreign-link': symlinkSync(f.source, destination); break;
      case 'broken-link': symlinkSync(`${f.source}-missing`, destination); break;
      case 'parent-link':
        rmSync(join(f.home, '.agents'), { recursive: true });
        symlinkSync(f.source, join(f.home, '.agents'));
        break;
    }
    const path = kind === 'parent-link' ? join(f.home, '.agents') : destination;
    const before = lstatSync(path);
    assert.match(f.dot(['skills', '--force'], 1), /Skill installation failed/);
    assert.equal(lstatSync(path).ino, before.ino);
    assert.equal(existsSync(join(f.home, '.claude/skills/portable')), false, 'standalone preflight must prevent partial links');
    assert.equal(f.git(f.checkout, 'status', '--porcelain'), '');
    assert.equal(f.git(f.source, 'status', '--porcelain'), '');
  });
}

test('branch mergeOptions=--squash cannot fake a successful fast-forward', t => {
  const f = fixture(t);
  f.dot();
  f.git(f.checkout, 'config', 'branch.main.mergeOptions', '--squash');
  f.git(f.checkout, 'config', 'merge.autoStash', 'true');
  f.publish();
  f.clear();
  f.dot();
  assert.equal(f.git(f.checkout, 'rev-parse', 'HEAD'), f.git(f.source, 'rev-parse', 'HEAD'));
  assert.equal(f.git(f.checkout, 'status', '--porcelain'), '');
  assert.equal(f.git(f.checkout, 'config', 'branch.main.mergeOptions'), '--squash', 'override is command-scoped');
  assert.deepEqual(f.log(), ['mu-install all']);
  assert.match(readFileSync(join(f.home, '.agents/skills/portable/SKILL.md'), 'utf8'), /v2/);
});

test('ignored local content blocks a colliding fast-forward without changing HEAD or running installation', t => {
  const f = fixture(t);
  f.fullStubs();
  f.dot();
  f.write(join(f.checkout, '.git/info/exclude'), 'local-cache\n');
  f.write(join(f.checkout, 'local-cache'), 'precious ignored content\n');
  assert.equal(f.git(f.checkout, 'status', '--porcelain'), '');
  f.write(join(f.source, 'local-cache'), 'new upstream content\n');
  f.git(f.source, 'add', '.');
  f.git(f.source, 'commit', '-m', 'track ignored path');
  f.git(f.source, 'push', 'origin', 'main');
  rejected(f, /Fast-forward failed/, []);
  assert.equal(readFileSync(join(f.checkout, 'local-cache'), 'utf8'), 'precious ignored content\n');
});

test('actual full dot uses the same topic exactly once before dependent setup', t => {
  const f = fixture(t);
  f.fullStubs();
  f.dot([]);
  const log = f.log();
  assert.equal(log.filter(line => line === 'mu-install all').length, 1);
  const mu = log.indexOf('mu-install all');
  assert.ok(log.indexOf('mise/install.sh') < mu);
  assert.ok(log.indexOf('ai/install.sh') < mu);
  for (const topic of ['claude', 'opencode', 'pi', 'zzz']) assert.ok(log.indexOf(`${topic}/install.sh`) > mu, log.join('\n'));
  f.publish();
  f.clear();
  f.dot([]);
  assert.match(readFileSync(join(f.home, '.agents/skills/portable/SKILL.md'), 'utf8'), /v2/);
  assert.equal(f.log().filter(line => line === 'mu-install all').length, 1);
  f.write(join(f.checkout, 'untracked'), 'preserve\n');
  rejected(f, /Dirty checkout/, []);
});

test('full dot stops all dependent setup on fetch or standalone installation failure', t => {
  const f = fixture(t);
  f.fullStubs();
  f.dot();
  f.git(f.checkout, 'branch', '--unset-upstream');
  rejected(f, /Missing remote upstream/, []);
  f.git(f.checkout, 'branch', '--set-upstream-to=origin/main');
  f.publish('collision', 'new');
  f.write(join(f.home, '.agents/skills/collision'), 'user content\n');
  f.clear();
  assert.match(f.dot([], 1), /Skill installation failed/);
  assert.deepEqual(f.log().filter(line => /^(claude|opencode|pi|zzz)\//.test(line)), []);
  assert.equal(readFileSync(join(f.home, '.agents/skills/collision'), 'utf8'), 'user content\n');
  assert.equal(existsSync(join(f.home, '.claude/skills/collision')), false);
  rmSync(f.remote, { recursive: true });
  rejected(f, /Fetch failed/, []);
});
