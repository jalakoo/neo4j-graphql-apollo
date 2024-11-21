# Generic Neo4j GraphQL Endpoint

Simple GraphQL server for automatic schema generation and querying from a Neo4j database. See the official Neo4j [GraphQL Toolkit](https://neo4j.com/docs/graphql/current/getting-started/toolbox/) for more info.

## Try it out

[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run?target=_blank)

## Requirements

Environment variables need to be made available. One option is to rename the .env.example file to .env and add the required values.

Values used:

```
# Neo4j (Required)
NEO4J_URI=
NEO4J_PASSWORD=
NEO4J_USERNAME=neo4j
```

## Local Running

```
npm install
node index.js
```

## Alternate Examples in the following branches:

- `auto` : Database introspection replaces need for manual type defs. Requires the source Neo4j database to be populated with data.
- `advanced` : ENV flag configured version for defining manual/auto type defs, basic-auth, read/write mode, etc.
