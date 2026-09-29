const { readFileSync } = require("node:fs");
const postcss = require("postcss");

/**
 * Prepends the @custom-media breakpoints from tokens.css to every stylesheet,
 * so postcss-custom-media can resolve them. Only the at-rules are copied:
 * CSS Modules reject the :root rules in the same file.
 * Turbopack runs a copy of this file from .next, so the tokens path comes from the config.
 */
module.exports = ({ tokens }) => ({
  postcssPlugin: "rad-breakpoints",
  Once(root, { result }) {
    const definitions = postcss
      .parse(readFileSync(tokens, "utf8"))
      .nodes.filter(
        (node) => node.type === "atrule" && node.name === "custom-media",
      );
    root.prepend(definitions.map((node) => node.clone()));
    result.messages.push({
      type: "dependency",
      plugin: "rad-breakpoints",
      file: tokens,
      parent: result.opts.from,
    });
  },
});
module.exports.postcss = true;
