import { GraphQLServer, PubSub } from "graphql-yoga";
import Query from "./resolvers/Query";
import Mutation from "./resolvers/Mutation";
import Subscription from "./resolvers/Subscription";

const pubSub = new PubSub();

const server = new GraphQLServer({
  typeDefs: "./schema.graphql",
  resolvers: {
    Query,
    // Mutation,
    // Subscription,
  },
  context: {
    pubSub,
  },
});

server.start({ port: process.env.PORT || 3000 }, () => {
  console.log("Server is up and running!");
});
