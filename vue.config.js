const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack');
path = require('path'),
fileSystem = require('fs-extra'),

module.exports = defineConfig({
  pages: {
    popup: {
      template: 'public/browser-extension.html',
      entry: './src/popup/main.ts',
      title: 'Popup'
    },
    inpage: './src/inpage_browserify.js'
  },
  
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve("buffer"),
        fs: require.resolve("brfs"),
        os: require.resolve("os-browserify"),
        assert: require.resolve("assert-browserify")
      },
    },
    plugins: [
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser',
        }),
      ]

  },
  pluginOptions: {
    browserExtension: {
      
      componentOptions: {
        background: {
          entry: 'src/background.js'
        },
        contentScripts: {
          entries: {contentScript :'src/contentScript.js'}
        },
      }
    }
  }
})
