'use strict';
(function () {
  window["oj_whenReady"] = true;

  requirejs.config(
    {
      baseUrl: 'js',
      paths:
      {
        'ojs': 'libs/oj/19.0.0/debug',
        'ojL10n': 'libs/oj/19.0.0/ojL10n',
        'ojtranslations': 'libs/oj/19.0.0/resources',
        'knockout': 'libs/knockout/knockout-3.5.1.debug',
        'jquery': 'libs/jquery/jquery-3.7.1',
        'jqueryui-amd': 'libs/jquery/jqueryui-amd-1.14.1',
        'text': 'libs/require/text',
        'hammerjs': 'libs/hammer/hammer-2.0.8',
        'signals': 'libs/js-signals/signals',
        'ojdnd': 'libs/dnd-polyfill/dnd-polyfill-1.0.2',
        'css': 'libs/require-css/css.min',
        'css-builder': 'libs/require-css/css-builder',
        'normalize': 'libs/require-css/normalize',
        '@oracle/oraclejet-preact': 'libs/oraclejet-preact/amd',
        'preact': 'libs/preact/dist/preact.umd',
        'preact/hooks': 'libs/preact/hooks/dist/hooks.umd',
        'preact/compat': 'libs/preact/compat/dist/compat.umd',
        'preact/jsx-runtime': 'libs/preact/jsx-runtime/dist/jsxRuntime.umd',
        'proj4': 'libs/proj4js/dist/proj4-src',
        'touchr': 'libs/touchr/touchr'
        ,
        'chai': 'libs/chai/chai-4.5.0',
      }
    }
  );
}());

require(['./root',
  'jet-composites/nav-bar/loader',
  'jet-composites/help-card/loader'
]);
