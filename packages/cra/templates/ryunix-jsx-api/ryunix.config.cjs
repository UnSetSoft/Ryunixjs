module.exports = {
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
};
