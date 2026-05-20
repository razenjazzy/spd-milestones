"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGraphQL = setupGraphQL;
const server_1 = require("@apollo/server");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const typeDefs_1 = require("./typeDefs");
const resolvers_1 = require("./resolvers");
const env_1 = require("../config/env");
async function setupGraphQL(app, httpServer) {
    const server = new server_1.ApolloServer({
        typeDefs: typeDefs_1.typeDefs,
        resolvers: resolvers_1.resolvers,
        plugins: [
            (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
        ],
        introspection: env_1.config.graphqlIntrospection,
    });
    await server.start();
    // Apply CORS and body-parser for GraphQL endpoint
    app.use(env_1.config.graphqlPath, (0, cors_1.default)(), (0, body_parser_1.json)(), async (req, res) => {
        const httpGraphQLResponse = await server.executeHTTPGraphQLRequest({
            httpGraphQLRequest: {
                body: req.body,
                headers: new Map(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || ''])),
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
        }
        else {
            for await (const chunk of httpGraphQLResponse.body.asyncIterator) {
                res.write(chunk);
            }
            res.end();
        }
    });
    console.log(`🚀 GraphQL server ready at ${env_1.config.graphqlPath}`);
    return server;
}
//# sourceMappingURL=server.js.map