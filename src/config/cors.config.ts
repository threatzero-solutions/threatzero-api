import * as dotenv from 'dotenv';
dotenv.config();

// NOTE: Not meant to be inject into config service since Helmet
// must be instantiated early on in the bootstrap process.

const corsOptions = {
  origin: [
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || []),
    'http://localhost:3000',
  ],
};

export default corsOptions;
