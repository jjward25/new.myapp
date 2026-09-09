// Single source of truth for the app's Mongo database name.
// The webapp now shares Hermes's "PersonalAgent" DB. LoginAttempts is the
// one exception — it stays in "Personal" (webapp-internal security state,
// nothing else reads it) and sets its own name locally.
export const APP_DB = 'PersonalAgent';
