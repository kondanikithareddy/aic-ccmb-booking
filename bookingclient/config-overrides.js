// client/config-overrides.js

module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function(config, env) {
    // ...add your webpack config
    return config;
  },
  // The Jest config to use when running your jest tests - optional
  jest: function(config) {
    // ...add your jest config
    return config;
  },
  // The function to use to create a webpack dev server configuration when running the development
  // server with 'npm run start' or 'yarn start'.
  // Example: set the dev server to use a specific certificate in https.
  devServer: function(configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that create-react-app
    // uses to generate the webpack dev server config - useful to use as a starting point.
    return function(proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);

      // --- THIS IS THE FIX ---
      // Manually set the allowed host.
      config.allowedHosts = ['localhost', '.localhost'];
      
      return config;
    };
  },
  // The paths config to use when compiling your react app for development or production.
  paths: function(paths, env) {
    // ...add your paths config
    return paths;
  },
}