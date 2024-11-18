declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    OPENAI_ORG_ID?: string;
    // ... other env vars
  }
}
