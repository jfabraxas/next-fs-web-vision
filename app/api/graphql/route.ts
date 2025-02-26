import { apolloHandler } from '@/lib/apollo/server';
import { NextRequest } from 'next/server';

// Handle GET requests for GraphQL Playground in development
export async function GET(request: NextRequest) {
  return apolloHandler(request);
}

// Handle POST requests for GraphQL operations
export async function POST(request: NextRequest) {
  return apolloHandler(request);
}