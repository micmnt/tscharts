declare module "*.css";

// Niente @types/node solo per questo: dichiaro l'ambiente minimo che serve a
// process.env.NODE_ENV, sostituito a build-time dal bundler del consumer
// (stesso pattern usato da molte librerie di componenti).
declare const process: { env: { NODE_ENV?: string } };
