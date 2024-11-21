import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import { Neo4jGraphQL } from '@neo4j/graphql';
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables (ensure to configure your environment variables properly)
dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
const PORT = process.env.PORT || 8080;

// Replace `typeDefs` with your GraphQL type definitions
const typeDefs = `#graphql
type User {
  name: String!
  operatesVehicle: Vehicle @relationship(type: "OPERATES", direction: OUT)
  currentlyAtLocation: Location @relationship(type: "CURRENTLY_AT", direction: OUT)
  madeRequest: Request @relationship(type: "MADE", direction: OUT)
}

type Vehicle {
  type: String!
  name: String!
  image_url: String!
  userOperates: User @relationship(type: "OPERATES", direction: IN)
  currentlyAtLocation: Location @relationship(type: "CURRENTLY_AT", direction: OUT)
  acceptedRequest: Request @relationship(type: "ACCEPTED", direction: OUT)
  rejectedRequest: Request @relationship(type: "REJECTED", direction: OUT)
}

type Location {
  lat: Float!
  lon: Float!
  userCurrentlyAt: User @relationship(type: "CURRENTLY_AT", direction: IN)
  vehicleCurrentlyAt: Vehicle @relationship(type: "CURRENTLY_AT", direction: IN)
  requestPickup: Request @relationship(type: "PICKUP", direction: IN)
  requestDropOff: Request @relationship(type: "DROP_OFF", direction: IN)
}

type Request {
  at: DateTime!
  userMade: User @relationship(type: "MADE", direction: IN)
  vehicleAccepted: Vehicle @relationship(type: "ACCEPTED", direction: IN)
  vehicleRejected: Vehicle @relationship(type: "REJECTED", direction: IN)
  pickupLocation: Location @relationship(type: "PICKUP", direction: OUT)
  dropOffLocation: Location @relationship(type: "DROP_OFF", direction: OUT)
}
`;

const main = async () => {
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
  );
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
  const app = express();

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