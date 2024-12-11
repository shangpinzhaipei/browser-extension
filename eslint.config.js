import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'ts/no-empty-object-type': 'off',
    "no-console": "off",
    "ts/ban-ts-comment": "off",
    "no-unused-vars": "off",
    "unused-imports/no-unused-vars": "off",
  },
})
