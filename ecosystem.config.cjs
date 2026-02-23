module.exports = {
  apps: [
    {
      name: "classboard",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      cwd: "/home/ubuntu/classboard",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
