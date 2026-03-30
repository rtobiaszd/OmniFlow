module.exports = async function findFiles({ patterns, globInputPaths, cwd, configs, errorOnUnmatchedPattern }) {

  const results = [];
  const missingPatterns = [];
  let globbyPatterns = [];
  let rawPatterns = [];
  const searches = new Map([[cwd, { patterns: globbyPatterns, rawPatterns: [] }]]);

  // check to see if we have explicit files and directories
  const filePaths = patterns.map(filePath => path.resolve(cwd, filePath));
  const stats = await Promise.all(
    filePaths.map(
      filePath => fsp.stat(filePath).catch(() => { })
    )
  );

  stats.forEach((stat, index) => {

    const filePath = filePaths[index];
    const pattern = normalizeToPosix(patterns[index]);

    if (stat) {

      // files are added directly to the list
      if (stat.isFile()) {
        results.push({
          filePath,
          ignored: configs.isFileIgnored(filePath)
        });
      }

      // directories need extensions attached
      if (stat.isDirectory()) {

        // group everything in cwd together and split out others
        if (isPathInside(filePath, cwd)) {
          ({ patterns: globbyPatterns, rawPatterns } = searches.get(cwd));
        } else {
          if (!searches.has(filePath)) {
            searches.set(filePath, { patterns: [], rawPatterns: [] });
          }
          ({ patterns: globbyPatterns, rawPatterns } = searches.get(filePath));
        }

        globbyPatterns.push(`${normalizeToPosix(filePath)}/**`);
        rawPatterns.push(pattern);
      }

      return;
    }

    // save patterns for later use based on whether globs are enabled
    if (globInputPaths && isGlobPattern(pattern)) {

      const basePath = path.resolve(cwd, globParent(pattern));

      // group in cwd if possible and split out others
      if (isPathInside(basePath, cwd)) {
        ({ patterns: globbyPatterns, rawPatterns } = searches.get(cwd));
      } else {
        if (!searches.has(basePath)) {
          searches.set(basePath, { patterns: [], rawPatterns: [] });
        }
        ({ patterns: globbyPatterns, rawPatterns } = searches.get(basePath));
      }

      globbyPatterns.push(filePath);
      rawPatterns.push(pattern);
    } else {
      missingPatterns.push(pattern);
    }
  });

  // there were patterns that didn't match anything, tell the user
  if (errorOnUnmatchedPattern && missingPatterns.length) {
    throw new NoFilesFoundError(missingPatterns[0], globInputPaths);
  }

  // now we are safe to do the search
  const globbyResults = await globMultiSearch({
    searches,
    configs,
    errorOnUnmatchedPattern
  });

  return [
    ...results,
    ...globbyResults.map(filePath => ({
      filePath: path.resolve(filePath),
      ignored: false
    }))
  ];
};