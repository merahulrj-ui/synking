const { execSync } = require('child_process');

try {
  const diff = execSync('git diff --name-status v1.0.73-golden-core-locked', { encoding: 'utf-8' });
  const lines = diff.split('\n').filter(Boolean);
  const violations = lines.filter(line => {
    const parts = line.trim().split(/\s+/);
    const status = parts[0];
    const file = parts[1];
    if (['M', 'D'].includes(status) && !file.startsWith('src/extensions/') && file !== 'AGENTS.md' && file !== 'GEMINI.md') {
      return true;
    }
    return false;
  });

  if (violations.length > 0) {
    console.error('🚨 [SECURITY VIOLATION] The following locked core files have been modified or deleted:');
    violations.forEach(v => console.error('  - ' + v));
    console.error('\nCore codebase is strictly LOCKED. All new additions must be in separate files (e.g. src/extensions/).');
    process.exit(1);
  } else {
    console.log('✅ [CODE LOCK VERIFIED] All core files remain 100% untouched and immutable.');
  }
} catch (err) {
  console.error('Error verifying code lock:', err.message);
  process.exit(1);
}
