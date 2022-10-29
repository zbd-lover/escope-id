import type {Config} from 'jest';

const config: Config = {
  preset: 'ts-jest',
  modulePaths: [
    "."
  ],
  rootDir: "src",
  moduleDirectories: [
    "node_modules",
    "estree-walker"
  ],
};

export default config