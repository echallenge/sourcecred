// @flow
// Implementation of `sourcecred output`.

import path from "path";
import fs from "fs-extra";
import dedent from "../util/dedent";
import type {Command} from "./command";
import * as Common from "./common";
import stringify from "json-stable-stringify";
import {directoryForProjectId} from "../core/project_io";

function usage(print: (string) => void): void {
  print(
    dedent`\
    usage: sourcecred output PROJECT_ID [--help]

    Print the SourceCred data output for a given PROJECT_ID.
    Data must already be loaded for the given PROJECT_ID, using
    'sourcecred load PROJECT_ID'

    PROJECT_ID refers to a project, as loaded by the \`load\` command.
    Run \`sourcecred load --help\` for details.

    Arguments:
        PROJECT_ID
            Already-loaded project for which to load data.

        --help
            Show this help message and exit, as 'sourcecred help output'.

    Environment Variables:
        SOURCECRED_DIRECTORY
            Directory owned by SourceCred, in which data, caches,
            registries, etc. are stored. Optional: defaults to a
            directory 'sourcecred' under your OS's temporary directory;
            namely:
                ${Common.defaultSourcecredDirectory()}
    `.trimRight()
  );
}

function die(std, message) {
  std.err("fatal: " + message);
  std.err("fatal: run 'sourcecred help output' for help");
  return 1;
}

export const output: Command = async (args, std) => {
  let projectId: string | null = null;
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--help": {
        usage(std.out);
        return 0;
      }
      default: {
        if (projectId != null) return die(std, "multiple project IDs provided");
        projectId = args[i];
        break;
      }
    }
  }

  if (projectId == null) {
    return die(std, "no project ID provided");
  }

  const projectDirectory = directoryForProjectId(
    projectId,
    Common.sourcecredDirectory()
  );
  const outputFile = path.join(projectDirectory, "output.json");
  if (!fs.existsSync(outputFile)) {
    std.err(`fatal: project ${projectId} not loaded`);
    std.err(`Try running \`sourcecred load ${projectId}\` first.`);
    return 1;
  }

  const outputBlob = await fs.readFile(outputFile);
  const output = JSON.parse(outputBlob);
  std.out(stringify(output, {space: 2}));
  return 0;
};

export default output;

export const help: Command = async (args, std) => {
  if (args.length === 0) {
    usage(std.out);
    return 0;
  } else {
    usage(std.err);
    return 1;
  }
};