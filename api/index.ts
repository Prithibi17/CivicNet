import pkg from '../dist/server.cjs';

export default async function handler(req: any, res: any) {
  const app = await pkg.setupApp();
  return app(req, res);
}
