import dotenv from 'dotenv';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Load environment variables from .env file for local development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: './dev.env' });
}

const accessSecretVersion = async (name, projectId, versionId = 'latest') => {
    if (!projectId) {
        throw new Error(`Cannot fetch secret "${name}" because PROJECT_ID is not set.`);
    }
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
        name: `projects/${projectId}/secrets/${name}/versions/${versionId}`,
    });
    return version.payload.data.toString();
};

const initializeConfig = async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const projectId = process.env.MY_PROJECT_ID;

    const config = {
        mongo_uri: isProduction
            ? await accessSecretVersion('mongo-uri', projectId)
            : process.env.MONGO_URI || `mongodb://localhost:27017/${process.env.DB_NAME}`,
        dbName: isProduction
            ? await accessSecretVersion('db-name', projectId)
            : process.env.DB_NAME || 'teamcaptain',
        jwt_secret: isProduction
            ? await accessSecretVersion('jwt-secret', projectId)
            : process.env.JWT_SECRET,
        smtp_host: isProduction
            ? await accessSecretVersion('smtp-host', projectId)
            : process.env.EMAIL_HOST,
        smtp_port: isProduction ? 587 : parseInt(process.env.EMAIL_PORT, 10),
        smtp_user: isProduction
            ? await accessSecretVersion('smtp-user', projectId)
            : process.env.EMAIL_USER,
        smtp_pass: isProduction
            ? await accessSecretVersion('smtp-pass', projectId)
            : process.env.EMAIL_PASS,
        smtp_from_email: process.env.EMAIL_FROM,
        smtp_from_name: process.env.EMAIL_FROM_NAME || 'My Tennis Team',
    };
    return config;
};

export const config = await initializeConfig();