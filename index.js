import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { Neo4jGraphQL } from '@neo4j/graphql';
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';
import basicAuth from 'express-basic-auth';

// Load environment variables (for local development)
dotenv.config();

// Load environment variables from Cloud Run or dotenv
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const PORT = process.env.PORT || 8080; // Google Cloud Run dynamically assigns the port
const READ_ONLY = process.env.READ_ONLY || true; // We don't want to expose mutations in this case
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const HTTPS_REDIRECT = process.env.HTTPS_REDIRECT || false;

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

const sessionFactory = () => {
	if (READ_ONLY === true) {
		return driver.session({ defaultAccessMode: neo4j.session.READ });
	} else {
		return driver.session({ defaultAccessMode: neo4j.session.WRITE });
	}
}
const main = async () => {
  const typeDefs = await toGraphQLTypeDefs(sessionFactory);
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  const app = express();

  // Require basic auth if variables are present
  if (BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD) {
    app.use(basicAuth({
      users: { [BASIC_AUTH_USERNAME]: BASIC_AUTH_PASSWORD },
      challenge: true,
    }));
  }

  // Ensure the connection is via https
  if (HTTPS_REDIRECT === true) {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
  }

  // Create Apollo Server instance
  const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
	introspection: true
  });

  // Start the server with Express middleware
  await server.start();
  app.use(express.json());
  app.use('/graphql', expressMiddleware(server));

  // Start the Express server on the provided port
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

// Start the Apollo server
main().catch(err => {
  console.error('Failed to start server', err);
});
