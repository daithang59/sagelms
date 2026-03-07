module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // để thoải mái hơn, chỉ enforce những thứ cốt lõi
    'type-enum': [2, 'always', [
      'feat','fix','chore','docs','refactor','test','ci','build','perf','style','revert'
    ]],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    // không bắt buộc scope
    'scope-empty': [0],
    // không bắt buộc subject-case (đỡ khó chịu)
    'subject-case': [0],
  }
};
