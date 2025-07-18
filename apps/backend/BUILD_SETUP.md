# Backend Build Setup

## Overview

This backend application is part of a monorepo structure and uses NestJS with TypeScript. The build configuration has been carefully set up to handle the monorepo structure properly.

## Key Files and Configuration

### Build Output Structure

Due to the monorepo setup, the TypeScript compiler outputs files to a nested directory structure:

- Built files are located in: `dist/apps/backend/src/`
- Main entry point: `dist/apps/backend/src/main.js`

### Important Configuration Files

#### `package.json`

- `"main"`: Points to the actual built main file location
- `"scripts"`: Contains all the npm scripts for development, build, and production

#### `tsconfig.json`

- Configured for monorepo structure with path mappings
- `outDir`: Set to `./dist` but actual output is nested due to monorepo structure

#### `nest-cli.json`

- Standard NestJS CLI configuration
- Works with the monorepo TypeScript configuration

## Available Scripts

### Development

```bash
npm run dev
```

- Uses `dev-start.js` script to run TypeScript source directly with `ts-node`
- Includes proper path resolution for monorepo structure
- Avoids build output path issues

### Build

```bash
npm run build
```

- Builds the application using NestJS CLI
- Outputs to `dist/apps/backend/src/`

### Production

```bash
npm run start
```

- Runs the built application from `dist/apps/backend/src/main.js`
- Requires running `npm run build` first

### Other Scripts

- `npm run start:dev`: NestJS watch mode (alternative to `npm run dev`)
- `npm run start:debug`: Debug mode with watch
- `npm run start:prod`: Production mode (same as `npm run start`)

## Development Workflow

1. **Start Development Server**:

   ```bash
   npm run dev
   ```

2. **Run Tests**:

   ```bash
   npm run test
   ```

3. **Build for Production**:

   ```bash
   npm run build
   ```

4. **Start Production Server**:
   ```bash
   npm run start
   ```

## Troubleshooting

### "Cannot find module" Errors

If you encounter "Cannot find module" errors:

1. **Check the file paths** in package.json scripts match the actual build output
2. **Verify the build completed successfully** with `npm run build`
3. **Use the dev script** for development instead of trying to run built files directly

### Build Output Location

The build output is intentionally nested (`dist/apps/backend/src/`) due to the monorepo structure. This is normal and expected behavior.

### Path Resolution Issues

The `dev-start.js` script handles path resolution for development mode. Do not modify this script without understanding the monorepo structure implications.

## Important Notes

⚠️ **Do not modify the build output paths** without understanding the full monorepo structure
⚠️ **Always use the provided npm scripts** instead of running node commands directly
⚠️ **The nested build output structure is intentional** and required for the monorepo setup

## Future Considerations

If you need to change the build output structure:

1. Update `package.json` script paths
2. Update any deployment scripts or Docker configurations
3. Test all scripts (dev, build, start) to ensure they work correctly
4. Update this documentation

This setup ensures consistent behavior across development, testing, and production environments while properly handling the monorepo structure.
