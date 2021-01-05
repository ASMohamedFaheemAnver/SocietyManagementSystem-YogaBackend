import "@babel/polyfill/noConflict";
import { GraphQLServer, PubSub } from "graphql-yoga";
import Query from "./resolvers/Query";
import Mutation from "./resolvers/Mutation";
import Subscription from "./resolvers/Subscription";
import mongoose from "mongoose";
import Developer from "./model/developer";

const path = require("path");
const fs = require("fs");

const pubSub = new PubSub();

const server = new GraphQLServer({
  typeDefs: "./src/schema.graphql",
  resolvers: {
    Query,
    Mutation,
    Subscription,
  },
  context(request) {
    (function sleep(ms = 600) {
      var unixtime_ms = new Date().getTime();
      while (new Date().getTime() < unixtime_ms + ms) {}
    })();

    return { pubSub, request };
  },
});

mongoose
  .connect(process.env.mongodb_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((_) => {
    const dir = path.join(__dirname, "images");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    Developer.find().then((isSuper) => {
      if (isSuper == 0) {
        const developer = new Developer({
          email: "jstrfaheem065@gmail.com",
          password: "$2b$12$4ffLoL5xlDNxz.WhmI6cbeld4415PhxwFaNzRY1SLYlkay/Tipy7u",
        });
        developer.save().catch((err) => {
          console.log(err.message);
        });
      }
    });

    server.start({ port: process.env.PORT || 3000 }, () => {
      console.log("Server is up and running!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
