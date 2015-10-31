var testRunnerConfig = {
  describe: 'Stem stylus bem',
  stylus: {
    use: function plugin(stylus) {
      stylus.include(__dirname + '../');
    },
    import: [
      '../bower_components/stem-stylus-extensions',
      '../bower_components/stem-stylus-utils',
      '../index'
      ]
  }
}

require('stylus-test-runner')(testRunnerConfig)