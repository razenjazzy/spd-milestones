import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { GraphQLError } from 'graphql';
import { ENV_CONFIG } from './environment';
import { log } from './environment';

// HTTP link for GraphQL requests
const httpLink = createHttpLink({
  uri: ENV_CONFIG.GRAPHQL_URI,
  credentials: 'same-origin',
});

// Error handling link
const errorLink = onError((errorResponse: any) => {
  const { graphQLErrors, networkError } = errorResponse;
  
  if (graphQLErrors) {
    graphQLErrors.forEach((error: GraphQLError) => {
      const { message, locations, path } = error;
      log('error', `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`);
    });
  }

  if (networkError) {
    log('error', `[Network error]: ${networkError.message}`);
  }
});

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projects: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          milestones: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Project: {
        fields: {
          milestones: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
