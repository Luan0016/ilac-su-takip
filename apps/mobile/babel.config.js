module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Inlines drizzle's .sql migrations as strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
