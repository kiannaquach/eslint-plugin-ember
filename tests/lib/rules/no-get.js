const path = require('path');
const rule = require('../../../lib/rules/no-get');
const RuleTester = require('eslint').RuleTester;

const { ERROR_MESSAGE_GET, ERROR_MESSAGE_GET_PROPERTIES } = rule;

const ruleTester = new RuleTester({
  parser: require.resolve('babel-eslint'),
  parserOptions: {
    ecmaVersion: 2015,
    sourceType: 'module',
  },
});

ruleTester.run('no-get', rule, {
  valid: [
    // **************************
    // get
    // **************************

    // Nested property path.
    { code: "this.get('foo.bar');", options: [{ ignoreNestedPaths: true }] },
    {
      code: "import { get } from '@ember/object'; get(this, 'foo.bar');",
      options: [{ ignoreNestedPaths: true }],
    },

    // Template literals.
    {
      code: 'this.get(`foo`);',
      parserOptions: { ecmaVersion: 6 },
    },
    {
      code: "import { get } from '@ember/object'; get(this, `foo`);",
      parserOptions: { ecmaVersion: 6 },
    },

    // Not `this`.
    "foo.get('bar');",
    "import { get } from '@ember/object'; get(foo, 'bar');",

    // Not `get`.
    "this.foo('bar');",
    "foo(this, 'bar');",

    // Unknown extra argument.
    "this.get('foo', 'bar');",
    "import { get } from '@ember/object'; get(this, 'foo', 'bar');",

    // Non-string parameter.
    'this.get(5);',
    'this.get(MY_PROP);',
    "import { get } from '@ember/object'; get(this, 5);",
    "import { get } from '@ember/object'; get(this, MY_PROP);",

    // Unknown sub-function call:
    "this.get.foo('bar');",
    "import { get } from '@ember/object'; get.foo(this, 'bar');",

    // In mirage directory
    {
      code: 'this.get("/resources")',
      filename: path.join('app', 'mirage', 'config.js'),
    },

    // Missing import:
    "get(this, 'foo');",

    // **************************
    // getProperties
    // **************************

    // Nested property path.
    { code: "this.getProperties('foo', 'bar.baz');", options: [{ ignoreNestedPaths: true }] },
    { code: "this.getProperties(['foo', 'bar.baz']);", options: [{ ignoreNestedPaths: true }] }, // With parameters in array.
    {
      code: "import { getProperties } from '@ember/object'; getProperties(this, 'foo', 'bar.baz');",
      options: [{ ignoreNestedPaths: true }],
    },
    {
      code:
        "import { getProperties } from '@ember/object'; getProperties(this, ['foo', 'bar.baz']);",
      options: [{ ignoreNestedPaths: true }],
    }, // With parameters in array.

    // Template literals.
    'this.getProperties(`prop1`, `prop2`);',
    "import { getProperties } from '@ember/object'; getProperties(this, `prop1`, `prop2`);",

    // Not `this`.
    "myObject.getProperties('prop1', 'prop2');",

    // Not `getProperties`.
    "this.foo('prop1', 'prop2');",

    // Non-string parameter.
    'this.getProperties(MY_PROP);',
    'this.getProperties(...MY_PROPS);',
    'this.getProperties([MY_PROP]);',
    "import { getProperties } from '@ember/object'; getProperties(this, MY_PROP);",
    "import { getProperties } from '@ember/object'; getProperties(this, ...MY_PROPS);",
    "import { getProperties } from '@ember/object'; getProperties(this, [MY_PROP]);",

    // Unknown sub-function call:
    "this.getProperties.foo('prop1', 'prop2');",

    // Missing import:
    "getProperties(this, 'prop1', 'prop2');",

    // With ignoreGetProperties: true
    {
      code: "this.getProperties('prop1', 'prop2');",
      options: [{ ignoreGetProperties: true }],
    },
    {
      code: "this.getProperties(['prop1', 'prop2']);", // With parameters in array.
      options: [{ ignoreGetProperties: true }],
    },
    {
      code: "import { getProperties } from '@ember/object'; getProperties(this, 'prop1', 'prop2');",
      options: [{ ignoreGetProperties: true }],
    },
    {
      code:
        "import { getProperties } from '@ember/object'; getProperties(this, ['prop1', 'prop2']);", // With parameters in array.
      options: [{ ignoreGetProperties: true }],
    },

    // Ignores `get()` inside proxy objects (which still require using `get()`):
    `
    import ObjectProxy from '@ember/object/proxy';
    export default ObjectProxy.extend({
      someFunction() {
        test();
        console.log(this.get('propertyInsideProxyObject'));
      }
    });
    `,
    `
    import ArrayProxy from '@ember/array/proxy';
    export default ArrayProxy.extend({
      someFunction() {
        test();
        console.log(this.get('propertyInsideProxyObject'));
      }
    });
    `,
    `
    import ArrayProxy from '@ember/array/proxy';
    class MyProxy extends ArrayProxy {
      someFunction() {
        test();
        console.log(this.get('propertyInsideProxyObject'));
      }
    }
    `,

    // Ignores `get()` inside classes with `unknownProperty`:
    `
    import EmberObject from '@ember/object';
    export default EmberObject.extend({
      unknownProperty() {},
      someFunction() {
        console.log(this.get('propertyInsideClassWithUnknownProperty'));
      }
    });
    `,
    `
    import EmberObject from '@ember/object';
    class MyClass extends EmberObject {
      unknownProperty() {}
      someFunction() {
        console.log(this.get('propertyInsideClassWithUnknownProperty'));
      }
    }
    `,

    // Optional chaining:
    'this.foo?.bar',
    'this.foo?.[0]?.bar',
  ],
  invalid: [
    // **************************
    // get
    // **************************

    {
      code: "this.get('foo');",
      output: 'this.foo;',
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },
    {
      code: `
      import { get } from '@ember/object';
      import { somethingElse } from '@ember/object';
      import { random } from 'random';
      get(this, 'foo');
      `,
      output: `
      import { get } from '@ember/object';
      import { somethingElse } from '@ember/object';
      import { random } from 'random';
      this.foo;
      `,
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },
    {
      // With renamed import:
      code: "import { get as g } from '@ember/object'; g(this, 'foo');",
      output: "import { get as g } from '@ember/object'; this.foo;",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "this.get('foo').someFunction();",
      output: 'this.foo.someFunction();',
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // With invalid JS variable name:
      code: "this.get('foo-bar');",
      output: null,
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // With invalid JS variable name:
      code: "import { get } from '@ember/object'; get(this, 'foo-bar');",
      output: null,
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },

    // **************************
    // getProperties
    // **************************

    {
      code: "this.getProperties('prop1', 'prop2');",
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },
    {
      code: "this.getProperties(['prop1', 'prop2']);", // With parameters in array.
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },
    {
      code: `
      import { getProperties } from '@ember/object';
      import { somethingElse } from '@ember/object';
      import { random } from 'random';
      getProperties(this, 'prop1', 'prop2');
      `,
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },
    {
      // With renamed import:
      code: "import { getProperties as gp } from '@ember/object'; gp(this, 'prop1', 'prop2');",
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },
    {
      code:
        "import { getProperties } from '@ember/object'; getProperties(this, ['prop1', 'prop2']);", // With parameters in array.
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },

    // Nested paths:
    {
      code: "this.get('foo.bar');",
      output: null,
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "import { get } from '@ember/object'; get(this, 'foo.bar');",
      output: null,
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "this.getProperties('foo.bar');",
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },
    {
      code: "import { getProperties } from '@ember/object'; getProperties(this, 'foo.bar');",
      output: null,
      errors: [{ message: ERROR_MESSAGE_GET_PROPERTIES, type: 'CallExpression' }],
    },

    // Nested paths with optional chaining:
    {
      code: "this.get('foo.bar');",
      options: [{ useOptionalChaining: true }],
      output: 'this.foo?.bar;',
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "this.get('very.long.path');",
      options: [{ useOptionalChaining: true }],
      output: 'this.very?.long?.path;',
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "import { get } from '@ember/object'; get(this, 'foo.bar');",
      options: [{ useOptionalChaining: true }],
      output: "import { get } from '@ember/object'; this.foo?.bar;",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "import { get } from '@ember/object'; get(this, 'very.long.path');",
      options: [{ useOptionalChaining: true }],
      output: "import { get } from '@ember/object'; this.very?.long?.path;",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      code: "this.get('foo');", // No nested path.
      options: [{ useOptionalChaining: true }],
      output: 'this.foo;',
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // Optional chaining is not valid in the left side of an assignment,
      // and we can safely autofix nested paths without it anyway.
      code: "this.get('foo.bar')[123] = 'hello world';",
      options: [{ useOptionalChaining: true }],
      output: "this.foo.bar[123] = 'hello world';",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // Handle array element access with optional chaining.
      code: "this.get('foo1.0.bar1bar.1')",
      options: [{ useOptionalChaining: true }],
      output: 'this.foo1?.[0]?.bar1bar?.[1]',
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // Handle array element access (left side of an assignment).
      code: "this.get('foo.0.bar')[123] = 'hello world';",
      output: "this.foo[0].bar[123] = 'hello world';",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },
    {
      // We can safely autofix nested paths in the left side of an assignment,
      // even when the `useOptionalChaining` option is off.
      code: "this.get('foo.bar')[123] = 'hello world';",
      options: [{ useOptionalChaining: false }],
      output: "this.foo.bar[123] = 'hello world';",
      errors: [
        {
          message: ERROR_MESSAGE_GET,
          type: 'CallExpression',
        },
      ],
    },

    {
      // Reports violation after (classic) proxy class.
      code: `
      import ArrayProxy from '@ember/array/proxy';
      export default ArrayProxy.extend({
        someFunction() {
          test();
          console.log(this.get('propertyInsideProxyObject'));
        }
      });
      this.get('propertyOutsideClass');
      `,
      output: `
      import ArrayProxy from '@ember/array/proxy';
      export default ArrayProxy.extend({
        someFunction() {
          test();
          console.log(this.get('propertyInsideProxyObject'));
        }
      });
      this.propertyOutsideClass;
      `,
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },
    {
      // Reports violation after (native) proxy class.
      code: `
      import ArrayProxy from '@ember/array/proxy';
      class MyProxy extends ArrayProxy {
        someFunction() {
          test();
          console.log(this.get('propertyInsideProxyObject'));
        }
      }
      this.get('propertyOutsideClass');
      `,
      output: `
      import ArrayProxy from '@ember/array/proxy';
      class MyProxy extends ArrayProxy {
        someFunction() {
          test();
          console.log(this.get('propertyInsideProxyObject'));
        }
      }
      this.propertyOutsideClass;
      `,
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },

    {
      // Reports violation after (classic) class with `unknownProperty()`.
      code: `
      import EmberObject from '@ember/object';
      export default EmberObject.extend({
        unknownProperty() {},
        someFunction() {
          console.log(this.get('propertyInsideClassWithUnknownProperty'));
        }
      });
      this.get('propertyOutsideClass');
      `,
      output: `
      import EmberObject from '@ember/object';
      export default EmberObject.extend({
        unknownProperty() {},
        someFunction() {
          console.log(this.get('propertyInsideClassWithUnknownProperty'));
        }
      });
      this.propertyOutsideClass;
      `,
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },
    {
      // Reports violation after (native) class with `unknownProperty()`.
      code: `
      import EmberObject from '@ember/object';
      class MyClass extends EmberObject {
        unknownProperty() {}
        someFunction() {
          console.log(this.get('propertyInsideClassWithUnknownProperty'));
        }
      }
      this.get('propertyOutsideClass');
      `,
      output: `
      import EmberObject from '@ember/object';
      class MyClass extends EmberObject {
        unknownProperty() {}
        someFunction() {
          console.log(this.get('propertyInsideClassWithUnknownProperty'));
        }
      }
      this.propertyOutsideClass;
      `,
      errors: [{ message: ERROR_MESSAGE_GET, type: 'CallExpression' }],
    },
  ],
});
