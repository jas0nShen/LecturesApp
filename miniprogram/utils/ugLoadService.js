function normalizeUniversityCode(code) {
  return String(code || '').trim().toUpperCase();
}

function createUniversityLoader({ getPackageNames, loadSubPackage, activatePackage = () => Promise.resolve() }) {
  const states = Object.create(null);
  const promises = Object.create(null);
  const attempts = Object.create(null);

  function getUniversityLoadState(code) {
    const key = normalizeUniversityCode(code);
    return states[key] || 'idle';
  }

  function ensureUniversityLoaded(code, options = {}) {
    const key = normalizeUniversityCode(code);
    const packageNames = getPackageNames(key) || [];
    if (!packageNames.length) {
      states[key] = 'not_required';
      return Promise.resolve({ code: key, state: 'not_required', packageNames: [] });
    }

    if (states[key] === 'ready') {
      return Promise.resolve({ code: key, state: 'ready', packageNames });
    }
    if (states[key] === 'loading' && promises[key]) return promises[key];
    if (states[key] === 'error' && !options.retry) {
      return Promise.reject(new Error(`${key} undergraduate course package failed to load`));
    }

    const attempt = (attempts[key] || 0) + 1;
    attempts[key] = attempt;
    states[key] = 'loading';
    // A package activates its own data from an internal loader page.  Keep
    // activation sequential: only one temporary loader page may be on the
    // navigation stack at a time, while the university remains atomic.
    const [firstPackage, ...remainingPackages] = packageNames;
    const loadAndActivate = (name) => Promise.resolve(loadSubPackage(name))
      .then(() => activatePackage(name));
    const promise = remainingPackages.reduce(
      (chain, name) => chain.then(() => loadAndActivate(name)),
      loadAndActivate(firstPackage)
    )
      .then(() => {
        if (attempts[key] === attempt) states[key] = 'ready';
        return { code: key, state: 'ready', packageNames };
      })
      .catch((error) => {
        if (attempts[key] === attempt) {
          states[key] = 'error';
          delete promises[key];
        }
        throw error;
      });
    promises[key] = promise;
    return promise;
  }

  return {
    ensureUniversityLoaded,
    getUniversityLoadState,
    retryUniversityLoad(code) {
      return ensureUniversityLoaded(code, { retry: true });
    }
  };
}

module.exports = {
  createUniversityLoader,
  normalizeUniversityCode
};
