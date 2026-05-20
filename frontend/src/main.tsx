import React from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";  
import App from "./App";
import apolloClient from "./config/apolloClient";
import "./styles/styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
