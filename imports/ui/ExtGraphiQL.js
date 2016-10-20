import ReactDOM, { render } from 'react-dom';
import React from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';

function graphQLFetcher(graphQLParams) {
  return fetch(window.location.origin + "/graphql", {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graphQLParams),
  }).then(response => response.json());
}

function ExtGraphiQL({ children, params, location }) {
  return (
    <GraphiQL fetcher={graphQLFetcher} />
  )
}

export default ExtGraphiQL;
