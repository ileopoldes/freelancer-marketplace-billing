#!/usr/bin/env node
/* eslint-disable no-console */
import { spawn } from "child_process";
// Script to start the development server with proper path handling
// This ensures we don't run into the module not found issues

const runDev = () => {
  console.log("Starting development server...");

  // Use ts-node to run the TypeScript source directly
  const child = spawn(
    "npx",
    ["ts-node", "-r", "tsconfig-paths/register", "src/main.ts"],
    {
      stdio: "inherit",
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: "development",
      },
    },
  );

  child.on("close", (code) => {
    console.log(`Development server exited with code ${code}`);
  });

  child.on("error", (error) => {
    console.error("Failed to start development server:", error);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\nShutting down development server...");
    child.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down development server...");
    child.kill("SIGTERM");
  });
};

runDev();
