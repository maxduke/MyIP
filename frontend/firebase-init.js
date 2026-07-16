// Firebase Auth bootstrap — env-gated AND lazy: the SDK chunk only loads on
// the first loadFirebaseAuth() call (signed-in boot, sign-in click, or the
// background auth probe), never on the visitor-critical path.
const env = import.meta.env ?? {};
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
};

const isFireBaseSet = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId;

let authModulePromise = null;

// Resolves to the firebase/auth namespace plus the initialized `auth`
// instance (memoized), or null when the env isn't configured.
const loadFirebaseAuth = () => {
    if (!isFireBaseSet) return Promise.resolve(null);
    authModulePromise ??= Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
    ]).then(([{ initializeApp }, authModule]) => ({
        ...authModule,
        auth: authModule.getAuth(initializeApp(firebaseConfig)),
    }));
    return authModulePromise;
};

export { loadFirebaseAuth };
