# Ranga One Wealth Admin Panel

## Environment Variables

This project uses environment variables for configuration. Create a `.env.local` file in the root directory with the following variables:

\`\`\`
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://stocks-backend-cmjxc.ondigitalocean.app
\`\`\`

## Development

To run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

When deploying to production, make sure to set the environment variables in your hosting platform.

### Vercel

If deploying to Vercel, you can set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

### Other Platforms

For other platforms, refer to their documentation on how to set environment variables.
