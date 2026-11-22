import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

// Regression coverage for the rerun-artifact-lookup bug surfaced by
// production workflow run #45004239836: attempt 2 failed with
// "Artifact not found for name: api-release-<sha>-2" because re-running
// only the failed jobs incremented GITHUB_RUN_ATTEMPT without re-running
// build-artifact (the job that uploaded under "-1"). These files are
// workflow YAML, not JS, so this checks the raw text for the exact
// `github.run_attempt` / `github.run_id` tokens rather than parsing YAML -
// good enough to pin the fix without adding a YAML dependency.

const root = fileURLToPath(new URL("../../", import.meta.url));

function read(relativePath) {
  return readFileSync(new URL(relativePath, `file://${root}`), "utf8");
}

const WORKFLOWS = [
  {
    file: ".github/workflows/deploy-api-vps.yml",
    artifactPrefix: "api-release",
  },
  {
    file: ".github/workflows/deploy-frontend-vps.yml",
    artifactPrefix: "frontend-release",
  },
];

for (const { file, artifactPrefix } of WORKFLOWS) {
  test(`${file}: artifact name survives a partial rerun (keyed by run_id, not run_attempt)`, () => {
    const text = read(file);
    const nameLines = [...text.matchAll(/^\s*name:\s*(.+release-.+)$/gm)].map(
      (match) => match[1].trim(),
    );
    const artifactNameLines = nameLines.filter((line) =>
      line.startsWith(artifactPrefix),
    );
    // build job upload + every download job(s) for this release kind.
    assert.ok(
      artifactNameLines.length >= 2,
      `expected at least an upload and a download name line for ${artifactPrefix} in ${file}, found ${artifactNameLines.length}`,
    );

    for (const line of artifactNameLines) {
      assert.ok(
        line.includes("${{ inputs.commit_sha }}"),
        `artifact name must stay bound to the exact released commit SHA, got: ${line}`,
      );
      assert.ok(
        line.includes("${{ github.run_id }}"),
        `artifact name must be keyed by github.run_id (stable across reruns of the same run) so a later attempt can still find it, got: ${line}`,
      );
      assert.ok(
        !line.includes("${{ github.run_attempt }}"),
        `artifact name must not depend on github.run_attempt - it increments on a partial rerun even when the job that uploads this artifact is not re-executed, got: ${line}`,
      );
    }

    // Every upload/download pair for one release kind must use the exact
    // same literal name expression, or a rerun's download will miss an
    // earlier attempt's upload even with run_id used consistently.
    assert.equal(
      new Set(artifactNameLines).size,
      1,
      `all ${artifactPrefix} upload/download name lines in ${file} must be identical, got: ${JSON.stringify(artifactNameLines)}`,
    );
  });
}

test("deploy-api-vps.yml: build-artifact upload can overwrite its own rerun", () => {
  const text = read(".github/workflows/deploy-api-vps.yml");
  const uploadBlock = text.slice(
    text.indexOf("uses: actions/upload-artifact"),
    text.indexOf("uses: actions/upload-artifact") + 400,
  );
  assert.match(
    uploadBlock,
    /overwrite:\s*true/,
    "build-artifact's own upload-artifact step should allow overwrite so a rerun that re-executes THIS job (e.g. because it itself failed) does not error on a duplicate artifact name",
  );
});

test("deploy-frontend-vps.yml: build-images upload can overwrite its own rerun", () => {
  const text = read(".github/workflows/deploy-frontend-vps.yml");
  const uploadBlock = text.slice(
    text.indexOf("uses: actions/upload-artifact"),
    text.indexOf("uses: actions/upload-artifact") + 400,
  );
  assert.match(uploadBlock, /overwrite:\s*true/);
});

for (const { file } of WORKFLOWS) {
  test(`${file}: a missing release artifact still fails the job loudly`, () => {
    const text = read(file);
    const uploadBlock = text.slice(
      text.indexOf("uses: actions/upload-artifact"),
      text.indexOf("uses: actions/upload-artifact") + 500,
    );
    assert.match(
      uploadBlock,
      /if-no-files-found:\s*error/,
      "a build job that produced no artifact files must fail the upload step, not silently continue to a release/migrate job that will then fail to find the artifact",
    );
  });
}
