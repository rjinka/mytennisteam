# AI Agent Architecture for Automated Bug Fixes

This diagram illustrates the end-to-end workflow for an AI agent that monitors an application, diagnoses errors, and proposes code fixes via a pull request.

```mermaid
graph TD
    subgraph GCP
        A[App Engine App] -->|Logs & Crashes| B(Cloud Logging / Error Reporting);
        B -->|"Log Sink (filter for errors)"| C(Pub/Sub Topic);
        C -->|Triggers| D{"AI Agent (Cloud Run/Function)"};
    end

    subgraph "Analysis & Action"
        D -->|1. Gets more context| B;
        D -->|2. Reads code| E[Git Repository];
        D -->|3. Analyzes & Generates Fix| F[Generative AI Model];
        F -->|Code Patch| D;
        D -->|4. Creates PR| E;
    end

    subgraph "Developer Workflow"
        E -->|PR for Review| G[Developer];
        G -->|Approve & Merge| E;
    end
```
