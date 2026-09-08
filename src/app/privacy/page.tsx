export const metadata = {
  title: "Privacy Policy — Joe's Life",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-neutral-800 dark:text-neutral-200">
      <h1 className="text-2xl font-semibold mb-6">Privacy policy</h1>
      <p className="mb-4">
        This site (joeward.me) is a personal, single-user application built and
        used only by its owner. It is not a public product or service, and it
        is not intended for use by anyone other than its owner.
      </p>
      <p className="mb-4">
        Any data accessed through connected services (such as Google account
        integrations) is used solely to operate this personal application for
        its owner and is never shared with, sold to, or accessed by any third
        party.
      </p>
      <p className="mb-4">
        Questions can be directed to jjward25@gmail.com.
      </p>
      <p className="text-sm text-neutral-500 mt-8">Last updated: September 2026.</p>
    </main>
  );
}
