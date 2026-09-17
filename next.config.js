/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
let repo = '';
if (isGithubActions) {
  const repoFullName = process.env.GITHUB_REPOSITORY || '';
  repo = repoFullName ? `/${repoFullName.split('/')[1]}` : '';
}

const isExport = process.env.NEXT_EXPORT === 'true' || isGithubActions;

const nextConfig = {
  output: isExport ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: repo,
  assetPrefix: repo ? `${repo}/` : undefined,
  trailingSlash: true,
  reactStrictMode: true,
};

module.exports = nextConfig;
