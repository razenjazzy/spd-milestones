import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { Application, Request, Response } from 'express';
import { Server } from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { config } from '../config/env';

interface ContextValue {
  req: Request;
  res: Response;
}

export async function setupGraphQL(app: Application, httpServer: Server) {
  const server = new ApolloServer<ContextValue>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    introspection: config.graphqlIntrospection,
  });

  await server.start();

  // Apply CORS and body-parser for GraphQL endpoint
  app.use(
    config.graphqlPath,
    cors<cors.CorsRequest>(),
    json(),
    async (req: Request, res: Response) => {
      const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: {
          body: req.body,
          headers: new Map(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || ''])) as any,
          method: req.method || 'POST',
          search: req.url?.split('?')[1] || '',
        },
        context: async () => ({ req, res }),
      });

      for (const [key, value] of httpGraphQLResponse.headers) {
        res.setHeader(key, value);
      }

      res.status(httpGraphQLResponse.status || 200);
      
      if (httpGraphQLResponse.body.kind === 'complete') {
        res.send(httpGraphQLResponse.body.string);
      } else {
        for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
          res.write(chunk);
        }
        res.end();
      }
    }
  );

  console.log(`🚀 GraphQL server ready at ${config.graphqlPath}`);
  
  return server;
}
