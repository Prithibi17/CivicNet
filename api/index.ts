import { setupApp } from '../server.js';

export default async function handler(req: any, res: any) {
  const app = await setupApp();
  return app(req, res);
}
